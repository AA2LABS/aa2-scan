// ─── lib/claude-stream.ts ─────────────────────────────────────────────────────
// React Native safe streaming Concierge call.
// RN's fetch cannot read a response body incrementally, so we use XMLHttpRequest
// and watch xhr.responseText grow, parsing SSE frames as they arrive.
//
// REWIRED 2026-09-02 — Ship Blocker #1. The Anthropic key no longer exists on
// this device. The XHR now dials the AA2 Concierge broker, which forwards the
// stream back frame for frame, so every line of the parser below is untouched:
// the shape on the wire is still Anthropic's SSE. Only the address and the
// credential changed.

import { brokerAuth, brokerUrl, MODEL } from './claude';

export interface StreamClaudeInput {
  system: string;
  content: any;
  max_tokens: number;
  model?: string;               // per-call override — voices ride Sonnet, scans ride Haiku
  onPartial?: (accumulated: string) => void;
}

export async function streamClaude(input: StreamClaudeInput): Promise<string> {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
  if (!base) {
    throw new Error('No EXPO_PUBLIC_SUPABASE_URL — the Concierge broker has no address.');
  }

  // The member credential has to be in hand before the socket opens, and
  // XMLHttpRequest headers are set synchronously — so it is awaited here,
  // outside the executor, rather than inside it.
  const headers = await brokerAuth();
  const url = brokerUrl();

  return new Promise<string>((resolve, reject) => {
    let accumulated = '';
    let seen = 0;

    // Speed telemetry — shows exactly where slow queries spend their time:
    // request → first token (network + prompt read) vs first token → done
    // (generation). Read it in the Metro/device console as [stream].
    const t0 = Date.now();
    let tFirst = 0;

    // Process every complete SSE line available in `text` beyond the `seen` offset.
    // Returns the new `seen` offset (up to the last newline consumed).
    const drain = (text: string): void => {
      const chunk = text.slice(seen);
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline < 0) return;
      const ready = chunk.slice(0, lastNewline + 1);
      seen += lastNewline + 1;
      const lines = ready.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (
            evt.type === 'content_block_delta' &&
            evt.delta &&
            evt.delta.type === 'text_delta' &&
            typeof evt.delta.text === 'string'
          ) {
            if (!tFirst) {
              tFirst = Date.now();
              console.log(`[stream] first token in ${tFirst - t0}ms`);
            }
            accumulated += evt.delta.text;
            input.onPartial?.(accumulated);
          }
        } catch {
          // Partial SSE lines are normal — ignore and wait for more data.
        }
      }
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }

    xhr.onprogress = () => {
      drain(xhr.responseText);
    };

    xhr.onload = () => {
      // Drain once more in case the final frames arrived with onload.
      drain(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        const tDone = Date.now();
        console.log(
          `[stream] done · first token ${tFirst ? tFirst - t0 : -1}ms · generation ${tFirst ? tDone - tFirst : -1}ms · total ${tDone - t0}ms · chars ${accumulated.length}`,
        );
        resolve(accumulated);
      } else {
        // The broker answers a refusal in JSON, not SSE — surface its reason
        // rather than a bare status, so a missing secret says so out loud.
        reject(new Error('Concierge ' + xhr.status + ': ' + String(xhr.responseText || '').slice(0, 200)));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during streaming request'));
    xhr.ontimeout = () => reject(new Error('Streaming request timed out'));

    xhr.send(
      JSON.stringify({
        model: input.model ?? MODEL,
        max_tokens: input.max_tokens,
        system: input.system,
        stream: true,
        content: input.content,
      }),
    );
  });
}

export interface EarlyVerdict {
  verdict?: string;
  verdictReason?: string;
}

// Pull verdict / verdictReason out of a partial (possibly truncated) JSON string
// so the UI can render the decision before the full response has generated.
export function extractVerdict(partial: string): EarlyVerdict {
  const cleaned = String(partial || '').replace(/```json|```/g, '');
  const out: EarlyVerdict = {};

  const vMatch = cleaned.match(/"verdict"\s*:\s*"([^"]*)"/);
  if (vMatch) out.verdict = vMatch[1];

  const rMatch = cleaned.match(/"verdictReason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (rMatch) {
    out.verdictReason = rMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  return out;
}
