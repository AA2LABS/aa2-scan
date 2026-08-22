/**
 * ─── lib/lastRoute.ts ───────────────────────────────────────────────────────
 * WHERE YOU LEFT OFF.
 *
 * FOUNDER, 2026-08-22: "it's not remembering where I left off, or even if I go
 * back it will take me to all the doors in one place and that's not where I
 * came from last."
 *
 * He is describing two different breaks and both are real:
 *
 *   1. EVERY LAUNCH LANDED ON /concierge. app/_layout.tsx routed a sealed
 *      member to the hub, unconditionally, forever. "All the doors in one
 *      place" IS the Concierge. It was never where he came from — it was just
 *      the only address the boot sequence knew.
 *
 *   2. FIXED LAW, standing canon: "back returns to origin." A door that
 *      forgets its origin cannot obey that law.
 *
 * This remembers the last door the member actually stood in, and the boot
 * sequence opens THAT instead of the hub.
 *
 * WHAT IS DELIBERATELY NEVER REMEMBERED: the arrival cover, onboarding, and
 * the seal test. Those are gates, not rooms. Restoring a member into a gate he
 * already passed would be a worse bug than the one this fixes.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { vaultRead, vaultWrite } from './tokenVault';

const KEY = 'aa2_last_route_v1';

/** Gates, not rooms. Never restored into. */
const NEVER_RESTORE = /^\/(arrival|onboarding|seal-test|_sitemap|\+not-found)?$/;

export function isRestorable(path: string | null | undefined): boolean {
  if (!path) return false;
  const p = path.split('?')[0];
  if (NEVER_RESTORE.test(p)) return false;
  if (p.includes('onboarding') || p.includes('arrival') || p.includes('seal-test')) return false;
  return p.startsWith('/');
}

/** Called on every route change. Cheap, fire and forget, never blocks a screen. */
export async function rememberRoute(path: string | null | undefined): Promise<void> {
  if (!isRestorable(path)) return;
  try { await vaultWrite(KEY, String(path)); } catch {}
}

/** The door to open at boot, or null to fall back to the hub. */
export async function lastRoute(): Promise<string | null> {
  try {
    const p = await vaultRead(KEY);
    return isRestorable(p) ? p : null;
  } catch { return null; }
}

export async function forgetRoute(): Promise<void> {
  try { await vaultWrite(KEY, ''); } catch {}
}
