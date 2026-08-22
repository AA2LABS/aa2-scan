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
import { vaultRead, vaultWrite } from './tokenVault';

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
 * ─── THE THIRTY-THREE STRANGERS ────────────────────────────────────────────
 * FOUNDER, 2026-08-22: "Here's what's happening. You created it, so the mess
 * is yours. Just fix it."
 *
 * He was right and the database proved it. Because the session never
 * persisted, signInAnonymously() minted a BRAND NEW member on every single
 * launch. Thirty-three of them. His profile landed under one, his device
 * connections under a second, and all 180 of his readings under a third —
 * created 2026-08-02 at 03:17 and never seen again.
 *
 * He did not do onboarding ten times. AA2 MET A DIFFERENT STRANGER TEN TIMES.
 * Every chip he ever tapped saved perfectly, to a person who never came back.
 * That is why the Chef said it did not know him: the Chef read the profile of
 * whoever was signed in right then — a member born four seconds earlier.
 *
 * lib/supabase.ts stops the bleeding: the session now persists, so no new
 * member is ever minted again. This reunites what the bleeding scattered.
 *
 * claim_legacy_records() is a one-time SECURITY DEFINER function in the
 * member's own project. It re-points every row owned by a listed stranger onto
 * the member who is signed in now, across every table that carries a member_id
 * or user_id, then empties the list so it can never take anything again.
 * Nothing is deleted. Nothing is merged away. The rows change hands and stop
 * being orphans.
 * ───────────────────────────────────────────────────────────────────────────*/

const CLAIM_FLAG = 'aa2_legacy_claimed_v1';

export type ClaimResult = { ran: boolean; rows: number; detail?: unknown; error?: string };

async function claimLegacy(): Promise<ClaimResult> {
  try {
    // Idempotent server-side too — the flag only saves a round trip.
    if (await vaultRead(CLAIM_FLAG)) return { ran: false, rows: 0 };
    const { data, error } = await supabase.rpc('claim_legacy_records');
    if (error) return { ran: false, rows: 0, error: error.message };
    const rows = Number((data as any)?.rows ?? 0);
    // Only close the door once the server says it is done.
    if ((data as any)?.ok) await vaultWrite(CLAIM_FLAG, new Date().toISOString());
    if (rows > 0) {
      console.log(`[session] reunited ${rows} orphaned row(s) onto this member.`);
    }
    return { ran: true, rows, detail: data };
  } catch (e) {
    return { ran: false, rows: 0, error: String((e as Error)?.message ?? e) };
  }
}

/**
 * Safe to call from anywhere, as often as you like. Concurrent callers share
 * one attempt, so a screen that mounts three readers cannot create three
 * members.
 */
export async function ensureSession(): Promise<SessionState> {
  if (!inFlight) {
    inFlight = open()
      .then(async s => {
        // The reunion runs only once there IS someone to reunite onto, and it
        // never blocks the app opening — a failed claim is a retry next launch,
        // not a locked door.
        if (s.ok) { try { await claimLegacy(); } catch {} }
        return s;
      })
      .finally(() => { setTimeout(() => { inFlight = null; }, 0); });
  }
  return inFlight;
}

/** For a screen that wants to show what was reunited. */
export async function claimLegacyNow(): Promise<ClaimResult> {
  await vaultWrite(CLAIM_FLAG, '');   // allow a deliberate re-run
  return claimLegacy();
}

/** The member id every reader and writer hangs its rows on. */
export async function currentMemberId(): Promise<string | null> {
  const s = await ensureSession();
  return s.userId;
}
