// ─── lib/claude-stream.ts ──────────────────────────────────────────────────────
// React Native safe streaming Claude call.
// RN's fetch cannot read a response body incrementally, so we use XMLHttpRequest
// and watch xhr.responseText grow, parsing SSE frames as they arrive.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5'; // speed doctrine 2026-07-29: scan verdicts on the fast tier — one-line revert to 'claude-sonnet-4-6'

export interface StreamClaudeInput {
  system: string;
  content: any;
  max_tokens: number;
  model?: string;               // per-call override — voices ride Sonnet, scans ride Haiku
  onPartial?: (accumulated: string) => void;
}

export function streamClaude(input: StreamClaudeInput): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      reject(new Error('API key not found in build environment'));
      return;
    }

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
    xhr.open('POST', ANTHROPIC_API_URL);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('x-api-key', apiKey);
    xhr.setRequestHeader('anthropic-version', '2023-06-01');

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
        reject(new Error('API ' + xhr.status + ': ' + String(xhr.responseText || '').slice(0, 200)));
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
        messages: [{ role: 'user', content: input.content }],
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
