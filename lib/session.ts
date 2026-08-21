/**
 * ─── lib/session.ts ─────────────────────────────────────────────────────────
 * THE MEMBRANE OPENS BEFORE ANYTHING ASKS IT A QUESTION.
 *
 * FOUNDER ORDER 2026-08-21: "NO REASON IT ALL SHOULD NOT WORK!"
 *
 * Twenty-five functions across lib/ begin with `supabase.auth.getUser()` and
 * return null when there is no session. Exactly ONE place in the entire app
 * ever created one — onboarding.tsx line 420 — which means a member who had
 * already sealed, or who reinstalled, or who simply closed the app, came back
 * to a membrane that answered "nothing" to every question and looked broken.
 *
 * ensureSession() is the answer: called once at boot, before any screen asks
 * the membrane anything. If a session exists it is kept. If not, an anonymous
 * one is created — the same call onboarding already used, now guaranteed
 * rather than left to a screen the member may never see again.
 *
 * WHY ANONYMOUS: AA2 is N-of-1. The membrane needs a stable member_id to hang
 * a record on, not an email address. The identity can be linked to an email
 * later without losing a single night.
 *
 * ONE THING THE FOUNDER MUST DO ONCE, and AA2 says so instead of failing
 * quietly: anonymous sign-ins are a project setting. Supabase Dashboard →
 * Authentication → Sign In / Providers → "Allow anonymous sign-ins" → ON.
 * If it is off, this returns the reason in plain language rather than a null.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase';

export type SessionState = {
  ok: boolean;
  userId: string | null;
  anonymous: boolean;
  message: string;
};

let inFlight: Promise<SessionState> | null = null;

async function open(): Promise<SessionState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        ok: true,
        userId: session.user.id,
        anonymous: !session.user.email,
        message: 'Membrane open.',
      };
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data?.user) {
      const raw = String(error?.message ?? 'unknown');
      // Name the actual fix instead of shrugging.
      const hint = /anonymous/i.test(raw)
        ? 'Anonymous sign-ins are disabled on this Supabase project. Turn them on: Dashboard → Authentication → Sign In / Providers → Allow anonymous sign-ins.'
        : raw;
      return { ok: false, userId: null, anonymous: false, message: hint };
    }
    return {
      ok: true,
      userId: data.user.id,
      anonymous: true,
      message: 'Membrane opened — new member record.',
    };
  } catch (e) {
    return { ok: false, userId: null, anonymous: false, message: String((e as Error)?.message ?? e) };
  }
}

/**
 * Safe to call from anywhere, as often as you like. Concurrent callers share
 * one attempt, so a screen that mounts three readers cannot create three
 * members.
 */
export async function ensureSession(): Promise<SessionState> {
  if (!inFlight) {
    inFlight = open().finally(() => { setTimeout(() => { inFlight = null; }, 0); });
  }
  return inFlight;
}

/** The member id every reader and writer hangs its rows on. */
export async function currentMemberId(): Promise<string | null> {
  const s = await ensureSession();
  return s.userId;
}
