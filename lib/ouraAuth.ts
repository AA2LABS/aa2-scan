/**
 * ─── lib/ouraAuth.ts ────────────────────────────────────────────────────────
 * THE OURA PIPE — OAuth2, the member's own door, no pasted token.
 *
 * FOUNDER ORDER 2026-08-21: "NO ONE SHOULD BE AHEAD OF ME... CLOSE THE GAP
 * NOW!" and "MAKE A FUCKING PIPE! USE OURA'S PIPE."
 *
 * WHAT THIS REPLACES: a Personal Access Token, typed by hand into a text
 * field, stored in a database column, that Oura no longer issues and that
 * cannot be revoked from anywhere except a web page the member has to go find.
 *
 * WHAT THIS IS: the member taps CONNECT, Oura's own sign-in opens, the member
 * approves the scopes, and the ring feeds AA2 until the member — not AA2 —
 * decides otherwise. Access is revocable from Oura's connected-applications
 * page without touching AA2 at all. AA2 must never be the only door out.
 *
 * EVERY ENDPOINT AND PARAMETER BELOW IS FROM OURA'S OWN AUTHENTICATION PAGE.
 * Nothing here is inferred. https://cloud.ouraring.com/docs/authentication
 *   · authorize:  https://cloud.ouraring.com/oauth/authorize
 *   · token:      https://api.ouraring.com/oauth/token
 *   · revoke:     https://api.ouraring.com/oauth/revoke?access_token={token}
 *   · scopes:     email, personal, daily, heartrate, workout, tag, session, spo2
 *   · state:      "should also contain a random string to protect against
 *                  cross-site request forgery attacks"
 *   · refresh:    "The refresh token is single-use, meaning it is invalidated
 *                  after being used."  <- see rotate-on-use below
 *
 * WHY THE BROKER EXISTS: Oura requires client_secret at the token endpoint and
 * says the refresh grant is server-side only. A phone cannot hold a secret.
 * The secret lives in the member's own Supabase project, in the edge function
 * supabase/functions/oura-oauth. This file never sees it.
 * ────────────────────────────────────────────────────────────────────────────
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { vaultReadJson, vaultWipe, vaultWriteJson } from './tokenVault';

const AUTHORIZE = 'https://cloud.ouraring.com/oauth/authorize';

/**
 * The scopes AA2 actually consumes, and no more. `email` is NOT requested —
 * AA2 does not need the member's email to rank their own night.
 *   personal  — gender, age, height, weight (the Body Map's own fields)
 *   daily     — sleep, activity, readiness summaries
 *   heartrate — the time series, not just the nightly average
 *   spo2      — daily SpO2 average recorded during sleep
 *   workout   — auto-detected and member-entered workouts
 *   session   — guided and unguided sessions
 *   tag       — member-entered tags
 */
export const OURA_SCOPES = ['personal', 'daily', 'heartrate', 'spo2', 'workout', 'session', 'tag'];

const VAULT_KEY = 'oura_oauth_v1';

export type OuraTokenSet = {
  access_token: string;
  refresh_token: string | null;
  /** ISO instant, computed on the BROKER's clock, never the phone's. */
  expires_at: string | null;
  connected_at: string;
};

export type OuraConnection = {
  connected: boolean;
  expiresAt: string | null;
  /** true when the stored access token is past, or nearly past, its life. */
  stale: boolean;
  canRefresh: boolean;
};

/* ── configuration, and a clear answer when it is missing ─────────────────── */

function clientId(): string {
  return (process.env.EXPO_PUBLIC_OURA_CLIENT_ID ?? '').trim();
}

function brokerUrl(): string {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/functions/v1/oura-oauth`;
}

/** The exact redirect that must be whitelisted in Oura's My Applications. */
export function ouraRedirectUri(): string {
  // aa2scan://oura-callback — the app's own scheme, from app.json.
  return Linking.createURL('oura-callback');
}

export function ouraConfigProblem(): string | null {
  if (!clientId()) {
    return `No EXPO_PUBLIC_OURA_CLIENT_ID. Register AA2 at Oura's My Applications, whitelist ${ouraRedirectUri()} as a redirect URI, then put the client id in .env.local and the secret in Supabase with: supabase secrets set OURA_CLIENT_ID=... OURA_CLIENT_SECRET=...`;
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    return 'No EXPO_PUBLIC_SUPABASE_URL — the token broker has no address.';
  }
  return null;
}

/* ── state: CSRF protection, per Oura's own instruction ───────────────────── */

function randomState(): string {
  try {
    const g: any = globalThis as any;
    if (g?.crypto?.getRandomValues) {
      const a = new Uint8Array(16);
      g.crypto.getRandomValues(a);
      return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  // Fallback when the runtime has no CSRF-grade randomness. Stated, not hidden.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

/* ── the broker ───────────────────────────────────────────────────────────── */

async function callBroker(body: Record<string, string>): Promise<any> {
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const r = await fetch(brokerUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch {
    return { ok: false, error: `Broker returned non-JSON (${r.status}).` };
  }
}

/* ── connect ──────────────────────────────────────────────────────────────── */

export type ConnectResult = { ok: boolean; message: string };

export async function connectOura(): Promise<ConnectResult> {
  const problem = ouraConfigProblem();
  if (problem) return { ok: false, message: problem };

  const redirect = ouraRedirectUri();
  const state = randomState();

  const url =
    `${AUTHORIZE}?response_type=code` +
    `&client_id=${encodeURIComponent(clientId())}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&scope=${encodeURIComponent(OURA_SCOPES.join(' '))}` +
    `&state=${encodeURIComponent(state)}`;

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(url, redirect);
  } catch (e) {
    return { ok: false, message: `Could not open Oura's sign-in: ${String((e as Error)?.message ?? e)}` };
  }

  if (result.type !== 'success' || !result.url) {
    return { ok: false, message: 'Sign-in closed before Oura answered. Nothing changed.' };
  }

  const parsed = Linking.parse(result.url);
  const qp = (parsed.queryParams ?? {}) as Record<string, string | string[] | undefined>;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

  const err = one(qp.error);
  if (err) return { ok: false, message: `Oura declined: ${err}` };

  // CSRF: a code that came back under a state AA2 did not issue is discarded.
  if (one(qp.state) !== state) {
    return { ok: false, message: 'State mismatch — that response did not come from the request AA2 made. Discarded.' };
  }

  const code = one(qp.code);
  if (!code) return { ok: false, message: 'Oura returned no authorization code.' };

  const res = await callBroker({ action: 'exchange', code, redirect_uri: redirect });
  if (!res?.ok || !res?.access_token) {
    return { ok: false, message: `Token exchange failed: ${String(res?.error ?? 'unknown')}` };
  }

  const set: OuraTokenSet = {
    access_token: res.access_token,
    refresh_token: res.refresh_token ?? null,
    expires_at: res.expires_at ?? null,
    connected_at: new Date().toISOString(),
  };
  const saved = await vaultWriteJson(VAULT_KEY, set);
  if (!saved) return { ok: false, message: 'Connected, but the credential could not be written to this device.' };

  return {
    ok: true,
    message: set.refresh_token
      ? 'Oura connected. The ring feeds AA2 and renews itself.'
      : 'Oura connected. No refresh token was issued, so this link expires and will need reconnecting.',
  };
}

/* ── refresh: single-use rotation, guarded against concurrent callers ─────── */

let refreshing: Promise<OuraTokenSet | null> | null = null;

async function rotate(set: OuraTokenSet): Promise<OuraTokenSet | null> {
  if (!set.refresh_token) return null;
  const res = await callBroker({ action: 'refresh', refresh_token: set.refresh_token });
  if (!res?.ok || !res?.access_token) return null;

  // Oura invalidates a refresh token the moment it is used. The replacement is
  // written BEFORE it is returned, so a crash between the two cannot strand the
  // member holding a token Oura has already killed.
  const next: OuraTokenSet = {
    access_token: res.access_token,
    refresh_token: res.refresh_token ?? null,
    expires_at: res.expires_at ?? null,
    connected_at: set.connected_at,
  };
  await vaultWriteJson(VAULT_KEY, next);
  return next;
}

const SKEW_MS = 120_000; // renew two minutes early rather than fail a sync

/**
 * The one call every reader should use. Returns a token that is valid right
 * now, refreshing it silently if it is not, or null if AA2 is not connected.
 */
export async function getValidOuraToken(): Promise<string | null> {
  const set = await vaultReadJson<OuraTokenSet>(VAULT_KEY);
  if (!set?.access_token) return null;

  const expired =
    !!set.expires_at && new Date(set.expires_at).getTime() - Date.now() < SKEW_MS;
  if (!expired) return set.access_token;

  if (!refreshing) {
    refreshing = rotate(set).finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  }
  const next = await refreshing;
  return next?.access_token ?? null;
}

/* ── state, for the screen ────────────────────────────────────────────────── */

export async function ouraConnection(): Promise<OuraConnection> {
  const set = await vaultReadJson<OuraTokenSet>(VAULT_KEY);
  if (!set?.access_token) {
    return { connected: false, expiresAt: null, stale: false, canRefresh: false };
  }
  const stale = !!set.expires_at && new Date(set.expires_at).getTime() - Date.now() < SKEW_MS;
  return {
    connected: true,
    expiresAt: set.expires_at,
    stale,
    canRefresh: !!set.refresh_token,
  };
}

/* ── disconnect ───────────────────────────────────────────────────────────── */

export async function disconnectOura(): Promise<ConnectResult> {
  const set = await vaultReadJson<OuraTokenSet>(VAULT_KEY);
  // The credential leaves this device whether or not Oura answers. A member
  // who taps DISCONNECT is disconnected.
  await vaultWipe(VAULT_KEY);
  if (set?.access_token) {
    try { await callBroker({ action: 'revoke', access_token: set.access_token }); } catch {}
  }
  return {
    ok: true,
    message: 'Oura disconnected and the credential wiped from this device. You can also revoke AA2 from Oura’s connected applications page.',
  };
}
