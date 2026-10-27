/**
 * ─── lib/heka.ts ────────────────────────────────────────────────────────────
 * THE CONCIERGE, SPEAKING FOR HEKA TRANCE-formations.
 *
 * FOUNDER ORDER 2026-09-30: "plug HEKA into AA2."
 * THE CONCIERGE is the only AA2 intelligence that speaks about HEKA. Every
 * other intelligence hands a HEKA question here and says nothing further.
 *
 * The phone sends the question and nothing else. The HEKA rules and the
 * sections the question needs are read inside the claude-broker from
 * public.heka_knowledge, which no member session can read. The pack never
 * ships in the app bundle.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { claudeCall, MODEL, type BrokerReply } from './claude';

/** Words that mean a member is asking about HEKA, for handoff from any screen. */
export const HEKA_TRIGGERS = /\b(heka|hypno|hypnosis|hypnotiz|trance|practitioner|maa kheru|drift moment|sleep temple|pressure proof|brain train|standing retainer|private intensive)/i;

export function isHekaQuestion(text: string): boolean {
  return HEKA_TRIGGERS.test(text);
}

/** Ask THE CONCIERGE about HEKA. One question in, one answer out. */
export async function askHekaConcierge(question: string, opts?: { maxTokens?: number; model?: string }): Promise<BrokerReply> {
  const q = question.trim();
  if (!q) return { ok: false, text: '', error: 'Nothing to ask.' };
  return claudeCall({
    lane: 'heka',
    user: q,
    model: opts?.model ?? MODEL,
    maxTokens: opts?.maxTokens ?? 900,
  });
}

/**
 * THE HANDOFF LINE. Any other intelligence that hears a HEKA question says this
 * and routes the member to THE CONCIERGE. It never answers about HEKA itself.
 */
export const HEKA_HANDOFF = 'That one belongs to THE CONCIERGE. Let me hand you over.';
