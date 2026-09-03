/**
 * ─── lib/claude.ts ─────────────────────────────────────────────────────────
 * THE ONE DOOR TO THE CONCIERGE. Every AA2 call to Claude leaves through here.
 *
 * FOUNDER ORDER 2026-09-02 — Ship Blocker #1 closed.
 * Before: the Anthropic key was read in eight files and shipped in
 * plaintext inside every APK and IPA. Anyone with a zip tool had the key.
 * Now: the key lives only in the founder's Supabase project, and the device
 * carries nothing worth stealing.
 *
 * This file also holds the shared address and the shared credential, so the
 * streaming path, the vision path and the doctrine path all dial the same
 * door. There is one door. That is the point.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase';

/** Speed doctrine 2026-07-29: scan verdicts on the fast tier. */
export const MODEL = 'claude-haiku-4-5';
/** Voices and long-form ride Sonnet. Both are on the broker allowlist. */
export const MODEL_DEEP = 'claude-sonnet-4-6';

/**
 * The broker's address. Same construction as lib/oauth.ts brokerUrl() — the
 * project URL with the function path appended, trailing slashes removed.
 */
export function brokerUrl(): string {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/functions/v1/claude-broker`;
}

/**
 * THE MEMBER'S OWN CREDENTIAL.
 *
 * The broker refuses the anon key on purpose — the anon key ships in the
 * bundle, so accepting it would move the open door rather than close it. What
 * it accepts is a real member session, which AA2 already creates at onboarding
 * via signInAnonymously and persists through lib/supabase.ts.
 *
 * If the session is missing — a fresh install that has not finished
 * onboarding, or a wiped vault — one is created here rather than failing the
 * member's scan. Anonymous, but real.
 */
export async function brokerAuth(): Promise<Record<string, string>> {
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  let token = (await supabase.auth.getSession()).data.session?.access_token ?? '';
  if (!token) {
    try {
      const { data } = await supabase.auth.signInAnonymously();
      token = data.session?.access_token ?? '';
    } catch (err) {
      console.error('[claude] could not establish a member session:', err);
    }
  }

  return {
    'Content-Type': 'application/json',
    apikey: anon,
    Authorization: `Bearer ${token}`,
  };
}

/** What every non-streaming AA2 caller gets back. One shape, every time. */
export type BrokerReply = { ok: boolean; text: string; error?: string };

/**
 * The raw call. Returns the broker's own envelope so a caller that wants to
 * know WHY something was empty can find out instead of guessing.
 */
export async function claudeCall(opts: {
  system?: string;
  user?: string;
  content?: unknown;
  maxTokens?: number;
  model?: string;
}): Promise<BrokerReply> {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
  if (!base) {
    return { ok: false, text: '', error: 'No EXPO_PUBLIC_SUPABASE_URL — the Concierge broker has no address.' };
  }

  try {
    const res = await fetch(brokerUrl(), {
      method: 'POST',
      headers: await brokerAuth(),
      body: JSON.stringify({
        model: opts.model ?? MODEL,
        max_tokens: opts.maxTokens ?? 1800,
        ...(opts.system ? { system: opts.system } : {}),
        ...(opts.content !== undefined ? { content: opts.content } : { user: opts.user ?? '' }),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      const error = String(data?.error ?? `Concierge broker ${res.status}`);
      console.error('[claude] broker refused:', error);
      return { ok: false, text: '', error };
    }

    return { ok: true, text: String(data.text ?? '') };
  } catch (err: any) {
    console.error('[claude] broker threw:', err);
    return { ok: false, text: '', error: err?.message || 'Unknown error' };
  }
}

/**
 * The shared helper the app has always called. Signature unchanged, so no
 * caller had to learn anything new — only the wire underneath moved.
 */
export async function claudeMessage(opts: {
  system?: string;
  user: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const reply = await claudeCall(opts);
  return reply.text;
}

/**
 * THE DROP-IN. map.tsx and apothecary.tsx were built against the Anthropic
 * SDK's `anthropic.messages.create({...})` shape across eight call sites.
 *
 * Rewriting eight screen call sites would mean touching two screens, and the
 * screens are law: REWIRE ONLY. So the shape is honoured instead — this object
 * answers to the same call and returns the same `{ content: [{ text }] }`
 * envelope those screens already read, while the request itself goes through
 * the broker. Every call site above it stays exactly as the founder wrote it.
 *
 * It throws on failure, as the SDK did, so the existing catch blocks and their
 * Alerts keep working unchanged.
 */
export const brokerAnthropic = {
  messages: {
    async create(opts: {
      model?: string;
      max_tokens: number;
      system?: string;
      messages: { role: string; content: any }[];
    }): Promise<{ content: { type: string; text: string }[] }> {
      const first = opts.messages?.[0];
      const reply = await claudeCall({
        model: opts.model,
        system: opts.system,
        content: first?.content,
        maxTokens: opts.max_tokens,
      });
      if (!reply.ok) throw new Error(reply.error ?? 'Concierge unavailable');
      return { content: [{ type: 'text', text: reply.text }] };
    },
  },
};
