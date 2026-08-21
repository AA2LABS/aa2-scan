/**
 * ─── lib/oauth.ts ───────────────────────────────────────────────────────────
 * THE PIPE ENGINE — one OAuth2 lane, three instruments.
 *
 * FOUNDER ORDERS 2026-08-21: "MAKE A FUCKING PIPE!" · "dont stop until
 * finished."
 *
 * The member taps CONNECT, the vendor's OWN sign-in opens, the member approves
 * the scopes, and the instrument feeds AA2 until the member — not AA2 —
 * decides otherwise. No token is ever typed. No token is stored in a database
 * column. AA2 is never the only door out.
 *
 * EVERY URL, SCOPE AND PARAMETER BELOW CARRIES ITS SOURCE. Nothing inferred.
 *   OURA    https://cloud.ouraring.com/docs/authentication
 *   WHOOP   https://developer.whoop.com/docs/developing/oauth/  +  /api/
 *   STRAVA  https://developers.strava.com/docs/authentication/
 *
 * The client_secret lives ONLY in supabase/functions/oauth-broker. This file
 * never sees one.
 * ────────────────────────────────────────────────────────────────────────────
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { vaultReadJson, vaultWipe, vaultWriteJson } from './tokenVault';

export type ProviderKey = 'oura' | 'whoop' | 'strava';

type ProviderSpec = {
  label: string;
  authorizeUrl: string;
  /** Exactly the scopes AA2 consumes. Never more. */
  scopes: string[];
  scopeSeparator: string;
  /** Extra authorize-query parameters this vendor requires. */
  extraAuthParams: Record<string, string>;
  clientIdEnv: string;
  vaultKey: string;
  /** The redirect path — one per provider so callbacks cannot cross wires. */
  callbackPath: string;
  /** Some vendors cap or shape the state string. */
  stateLength?: number;
  /** What the member must whitelist at the vendor, said in plain language. */
  redirectNote: string;
};

export const PROVIDERS: Record<ProviderKey, ProviderSpec> = {
  /**
   * OURA. `email` is deliberately NOT requested — AA2 does not need an email
   * address to rank a night.
   */
  oura: {
    label: 'Oura',
    authorizeUrl: 'https://cloud.ouraring.com/oauth/authorize',
    scopes: ['personal', 'daily', 'heartrate', 'spo2', 'workout', 'session', 'tag'],
    scopeSeparator: ' ',
    extraAuthParams: {},
    clientIdEnv: 'EXPO_PUBLIC_OURA_CLIENT_ID',
    vaultKey: 'oura_oauth_v1',
    callbackPath: 'oura-callback',
    redirectNote: 'Oura My Applications → Redirect URIs. "The redirect URIs listed for your application act as a whitelist of allowed values, meaning this parameter must match one of the URIs exactly."',
  },

  /**
   * WHOOP. `offline` is not optional here and it is not cosmetic: "WHOOP
   * provides your app with a refresh token after completing the OAuth 2.0 flow
   * IF the `offline` scope is included in the authorization request." Without
   * it the link dies at the first expiry and the member has to reconnect.
   *
   * read:profile is NOT requested — it grants name and email, which AA2 does
   * not need to read a night.
   *
   * WHOOP's own words on state: "The state parameter must be eight characters
   * long if you need to generate it yourself." AA2 generates exactly eight.
   */
  whoop: {
    label: 'WHOOP',
    authorizeUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    scopes: ['read:recovery', 'read:cycles', 'read:sleep', 'read:workout', 'read:body_measurement', 'offline'],
    scopeSeparator: ' ',
    extraAuthParams: {},
    clientIdEnv: 'EXPO_PUBLIC_WHOOP_CLIENT_ID',
    vaultKey: 'whoop_oauth_v1',
    callbackPath: 'whoop-callback',
    stateLength: 8,
    redirectNote: 'WHOOP Developer Dashboard → your app → Redirect URIs.',
  },

  /**
   * STRAVA. activity:read_all rather than activity:read, because a private
   * activity is still the member's own life and AA2 is N-of-1.
   * approval_prompt=auto so a returning member is not re-prompted needlessly.
   *
   * HONEST LIMIT: Strava says the redirect "must be within the callback domain
   * specified by the application." Their docs do not state whether a custom
   * app scheme qualifies. Register the callback domain as `aa2scan`; if Strava
   * refuses it, this is the one provider that will need an https callback.
   */
  strava: {
    label: 'Strava',
    authorizeUrl: 'https://www.strava.com/oauth/mobile/authorize',
    scopes: ['read', 'activity:read_all', 'profile:read_all'],
    scopeSeparator: ',',
    extraAuthParams: { approval_prompt: 'auto' },
    clientIdEnv: 'EXPO_PUBLIC_STRAVA_CLIENT_ID',
    vaultKey: 'strava_oauth_v1',
    callbackPath: 'strava-callback',
    redirectNote: 'Strava API Settings → Authorization Callback Domain. Set it to aa2scan.',
  },
};

export type TokenSet = {
  access_token: string;
  refresh_token: string | null;
  /** ISO instant, computed on the BROKER's clock, never the phone's. */
  expires_at: string | null;
  scope: string | null;
  connected_at: string;
};

export type Connection = {
  provider: ProviderKey;
  label: string;
  connected: boolean;
  expiresAt: string | null;
  stale: boolean;
  canRefresh: boolean;
};

export type ConnectResult = { ok: boolean; message: string };

/* ── configuration ────────────────────────────────────────────────────────── */

function clientId(p: ProviderKey): string {
  // process.env must be read with a literal key for the Expo inliner to
  // substitute it at build time. A computed lookup silently yields undefined.
  const map: Record<ProviderKey, string | undefined> = {
    oura:   process.env.EXPO_PUBLIC_OURA_CLIENT_ID,
    whoop:  process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID,
    strava: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID,
  };
  return (map[p] ?? '').trim();
}

function brokerUrl(): string {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/functions/v1/oauth-broker`;
}

export function redirectUri(p: ProviderKey): string {
  return Linking.createURL(PROVIDERS[p].callbackPath);
}

export function configProblem(p: ProviderKey): string | null {
  const spec = PROVIDERS[p];
  if (!clientId(p)) {
    return `No ${spec.clientIdEnv}. Register AA2 with ${spec.label}, whitelist ${redirectUri(p)} (${spec.redirectNote}), put the client id in .env.local, and set the secret with: supabase secrets set ${p.toUpperCase()}_CLIENT_ID=... ${p.toUpperCase()}_CLIENT_SECRET=...`;
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    return 'No EXPO_PUBLIC_SUPABASE_URL — the token broker has no address.';
  }
  return null;
}

/* ── state: CSRF protection, per each vendor's own instruction ────────────── */

function randomState(length?: number): string {
  let s = '';
  try {
    const g: any = globalThis as any;
    if (g?.crypto?.getRandomValues) {
      const a = new Uint8Array(16);
      g.crypto.getRandomValues(a);
      s = Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  // Fallback when the runtime has no CSRF-grade randomness. Stated, not hidden.
  if (!s) s = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return length ? s.slice(0, length).padEnd(length, '0') : s;
}

/* ── the broker ───────────────────────────────────────────────────────────── */

async function callBroker(body: Record<string, string>): Promise<any> {
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  try {
    const r = await fetch(brokerUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    try { return JSON.parse(text); } catch {
      return { ok: false, error: `Broker returned non-JSON (${r.status}).` };
    }
  } catch (e) {
    return { ok: false, error: `Broker unreachable: ${String((e as Error)?.message ?? e)}` };
  }
}

/* ── connect ──────────────────────────────────────────────────────────────── */

export async function connectProvider(p: ProviderKey): Promise<ConnectResult> {
  const spec = PROVIDERS[p];
  const problem = configProblem(p);
  if (problem) return { ok: false, message: problem };

  const redirect = redirectUri(p);
  const state = randomState(spec.stateLength);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId(p),
    redirect_uri: redirect,
    scope: spec.scopes.join(spec.scopeSeparator),
    state,
    ...spec.extraAuthParams,
  });

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(`${spec.authorizeUrl}?${params.toString()}`, redirect);
  } catch (e) {
    return { ok: false, message: `Could not open ${spec.label}'s sign-in: ${String((e as Error)?.message ?? e)}` };
  }

  if (result.type !== 'success' || !result.url) {
    return { ok: false, message: `Sign-in closed before ${spec.label} answered. Nothing changed.` };
  }

  const qp = (Linking.parse(result.url).queryParams ?? {}) as Record<string, string | string[] | undefined>;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

  const err = one(qp.error);
  if (err) return { ok: false, message: `${spec.label} declined: ${err}` };

  // A code that came back under a state AA2 did not issue is discarded.
  if (one(qp.state) !== state) {
    return { ok: false, message: 'State mismatch — that response did not come from the request AA2 made. Discarded.' };
  }

  const code = one(qp.code);
  if (!code) return { ok: false, message: `${spec.label} returned no authorization code.` };

  const res = await callBroker({ provider: p, action: 'exchange', code, redirect_uri: redirect });
  if (!res?.ok || !res?.access_token) {
    return { ok: false, message: `Token exchange failed: ${String(res?.error ?? 'unknown')}` };
  }

  const set: TokenSet = {
    access_token: res.access_token,
    refresh_token: res.refresh_token ?? null,
    expires_at: res.expires_at ?? null,
    scope: res.scope ?? null,
    connected_at: new Date().toISOString(),
  };
  if (!(await vaultWriteJson(spec.vaultKey, set))) {
    return { ok: false, message: `Connected, but the ${spec.label} credential could not be written to this device.` };
  }

  return {
    ok: true,
    message: set.refresh_token
      ? `${spec.label} connected. It feeds AA2 and renews itself.`
      : `${spec.label} connected, but no refresh token was issued — this link expires and will need reconnecting.`,
  };
}

/* ── refresh: rotation, guarded against concurrent callers ────────────────── */

const rotating: Partial<Record<ProviderKey, Promise<TokenSet | null>>> = {};

async function rotate(p: ProviderKey, set: TokenSet): Promise<TokenSet | null> {
  if (!set.refresh_token) return null;
  const res = await callBroker({ provider: p, action: 'refresh', refresh_token: set.refresh_token });
  if (!res?.ok || !res?.access_token) return null;

  // Oura invalidates a refresh token the moment it is used, and every vendor
  // here may rotate it. The replacement is WRITTEN BEFORE IT IS RETURNED, so a
  // crash between the two cannot strand the member holding a dead token.
  const next: TokenSet = {
    access_token: res.access_token,
    refresh_token: res.refresh_token ?? set.refresh_token,
    expires_at: res.expires_at ?? null,
    scope: res.scope ?? set.scope,
    connected_at: set.connected_at,
  };
  await vaultWriteJson(PROVIDERS[p].vaultKey, next);
  return next;
}

const SKEW_MS = 120_000; // renew two minutes early rather than fail a sync

/** The one call every reader uses. Valid token, or null if not connected. */
export async function getValidToken(p: ProviderKey): Promise<string | null> {
  const set = await vaultReadJson<TokenSet>(PROVIDERS[p].vaultKey);
  if (!set?.access_token) return null;

  const expired = !!set.expires_at && new Date(set.expires_at).getTime() - Date.now() < SKEW_MS;
  if (!expired) return set.access_token;

  if (!rotating[p]) {
    rotating[p] = rotate(p, set).finally(() => { setTimeout(() => { delete rotating[p]; }, 0); });
  }
  return (await rotating[p]!)?.access_token ?? null;
}

/* ── state, for the screen ────────────────────────────────────────────────── */

export async function connectionFor(p: ProviderKey): Promise<Connection> {
  const spec = PROVIDERS[p];
  const set = await vaultReadJson<TokenSet>(spec.vaultKey);
  if (!set?.access_token) {
    return { provider: p, label: spec.label, connected: false, expiresAt: null, stale: false, canRefresh: false };
  }
  return {
    provider: p,
    label: spec.label,
    connected: true,
    expiresAt: set.expires_at,
    stale: !!set.expires_at && new Date(set.expires_at).getTime() - Date.now() < SKEW_MS,
    canRefresh: !!set.refresh_token,
  };
}

/* ── disconnect ───────────────────────────────────────────────────────────── */

export async function disconnectProvider(p: ProviderKey): Promise<ConnectResult> {
  const spec = PROVIDERS[p];
  const set = await vaultReadJson<TokenSet>(spec.vaultKey);

  // The credential leaves this device whether or not the vendor answers. A
  // member who taps DISCONNECT is disconnected.
  await vaultWipe(spec.vaultKey);

  let note = '';
  if (set?.access_token) {
    const res = await callBroker({ provider: p, action: 'revoke', access_token: set.access_token });
    if (res?.note) note = ` ${res.note}`;
  }
  return {
    ok: true,
    message: `${spec.label} disconnected and the credential wiped from this device.${note || ` You can also revoke AA2 from ${spec.label}'s own connected-applications page.`}`,
  };
}
