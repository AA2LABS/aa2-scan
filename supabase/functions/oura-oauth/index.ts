/**
 * ─── supabase/functions/oura-oauth/index.ts ─────────────────────────────────
 * THE TOKEN BROKER — AA2's OAuth2 lane for Oura.
 *
 * FOUNDER ORDER 2026-08-21: "NO ONE SHOULD BE AHEAD OF ME... CLOSE THE GAP NOW!"
 *
 * WHY A SERVER EXISTS AT ALL, STATED PLAINLY:
 * Oura's own authentication page requires `client_secret` at the token
 * endpoint — "Required if not using Basic Authorization" — and says the
 * refresh grant is server-side flow only. A phone app cannot hold a client
 * secret; anything shipped in a bundle is readable. So the secret lives HERE,
 * in the member's own Supabase project, and nowhere else.
 * Source: https://cloud.ouraring.com/docs/authentication
 *
 * WHAT THIS FUNCTION TOUCHES:
 *   · the authorization code the app hands it       — in memory, one request
 *   · the refresh token the app hands it            — in memory, one request
 *   · OURA_CLIENT_ID / OURA_CLIENT_SECRET           — Supabase secrets
 *
 * WHAT THIS FUNCTION NEVER DOES:
 *   · store a token. Tokens are returned to the device and kept there.
 *   · read, hold, or forward one byte of health data. It speaks only to
 *     https://api.ouraring.com/oauth/token and /oauth/revoke.
 *   · log a token, a code, or a secret. See `redact()`.
 *
 * REPRESENTATIVE DOCTRINE: this is not "100% local" and AA2 will not claim it
 * is. Two connections leave the member's phone in this lane — Oura's API,
 * which is where the data lives, and this broker, which is the member's own
 * Supabase project. Neither carries health data through this file.
 *
 * DEPLOY:
 *   supabase secrets set OURA_CLIENT_ID=... OURA_CLIENT_SECRET=...
 *   supabase functions deploy oura-oauth --no-verify-jwt
 * ────────────────────────────────────────────────────────────────────────────
 */

// Oura's endpoints, verbatim from the authentication page. Nothing inferred.
const TOKEN_URL  = 'https://api.ouraring.com/oauth/token';
const REVOKE_URL = 'https://api.ouraring.com/oauth/revoke';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Never let a credential reach a log line. */
function redact(s: string): string {
  return s.replace(/[A-Za-z0-9_\-]{20,}/g, '[redacted]');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

type TokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

/**
 * POST /oauth/token — "application/x-www-form-urlencoded format and UTF-8
 * encoding", per Oura's authentication page. client_id and client_secret go in
 * the body; that page lists them as required body parameters for both grants.
 */
async function tokenRequest(form: Record<string, string>): Promise<Response> {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: 'application/json',
    },
    body: new URLSearchParams(form).toString(),
  });

  const text = await r.text();
  if (!r.ok) {
    console.log('[oura-oauth] token endpoint', r.status, redact(text).slice(0, 200));
    return json({ ok: false, status: r.status, error: redact(text).slice(0, 300) }, 502);
  }

  let t: TokenSet;
  try { t = JSON.parse(text); } catch {
    return json({ ok: false, error: 'Oura returned a token response that is not JSON.' }, 502);
  }
  if (!t.access_token) {
    return json({ ok: false, error: 'Oura returned no access_token.' }, 502);
  }

  // expires_in is seconds. The absolute moment is computed HERE, on a clock
  // that is not the member's phone, so a wrong device clock cannot make a live
  // token look expired or an expired one look live.
  const expires_at = t.expires_in
    ? new Date(Date.now() + t.expires_in * 1000).toISOString()
    : null;

  return json({
    ok: true,
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? null,
    expires_at,
    expires_in: t.expires_in ?? null,
    token_type: t.token_type ?? 'Bearer',
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return json({ ok: false, error: 'POST only.' }, 405);

  const client_id     = Deno.env.get('OURA_CLIENT_ID')     ?? '';
  const client_secret = Deno.env.get('OURA_CLIENT_SECRET') ?? '';
  if (!client_id || !client_secret) {
    // Named plainly so the founder is never left guessing which half is missing.
    return json({
      ok: false,
      error: 'Broker not configured. Run: supabase secrets set OURA_CLIENT_ID=... OURA_CLIENT_SECRET=...',
    }, 500);
  }

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Body must be JSON.' }, 400); }

  const action = String(body.action ?? '');

  // ── EXCHANGE — authorization code to tokens ──────────────────────────────
  if (action === 'exchange') {
    const code = String(body.code ?? '');
    if (!code) return json({ ok: false, error: 'Missing code.' }, 400);
    const form: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      client_id,
      client_secret,
    };
    // "The exact same redirect URI that was included in the authorization
    // request" — Oura's own wording. Sent only when the app sent one.
    if (body.redirect_uri) form.redirect_uri = String(body.redirect_uri);
    return await tokenRequest(form);
  }

  // ── REFRESH — single-use, per Oura: "The refresh token is single-use,
  //    meaning it is invalidated after being used." The new one comes back in
  //    this response and the device MUST replace the old one atomically.
  if (action === 'refresh') {
    const refresh_token = String(body.refresh_token ?? '');
    if (!refresh_token) return json({ ok: false, error: 'Missing refresh_token.' }, 400);
    return await tokenRequest({
      grant_type: 'refresh_token',
      refresh_token,
      client_id,
      client_secret,
    });
  }

  // ── REVOKE — the member's off switch. Oura also exposes this on their own
  //    connected-applications page; AA2 must never be the only door out.
  if (action === 'revoke') {
    const access_token = String(body.access_token ?? '');
    if (!access_token) return json({ ok: false, error: 'Missing access_token.' }, 400);
    try {
      const r = await fetch(`${REVOKE_URL}?access_token=${encodeURIComponent(access_token)}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      return json({ ok: r.ok, status: r.status });
    } catch (e) {
      return json({ ok: false, error: redact(String(e)).slice(0, 200) }, 502);
    }
  }

  return json({ ok: false, error: `Unknown action "${redact(action)}".` }, 400);
});
