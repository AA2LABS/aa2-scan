/**
 * ─── supabase/functions/oauth-broker/index.ts ───────────────────────────────
 * THE TOKEN BROKER — one door for every instrument that speaks OAuth2.
 *
 * FOUNDER ORDERS 2026-08-21: "CLOSE THE GAP NOW!" · "MAKE A FUCKING PIPE!" ·
 * "i told you dont stop until finished."
 *
 * WHY A SERVER EXISTS AT ALL: all three of these providers require a
 * client_secret at the token endpoint. A phone cannot hold a secret — anything
 * shipped in a bundle is readable. The secrets live HERE, in the founder's own
 * Supabase project, and nowhere else.
 *
 * WHAT THIS FUNCTION NEVER DOES:
 *   · store a token — tokens are returned to the device and kept there
 *   · read, hold or forward one byte of health data
 *   · log a token, a code, or a secret (see redact())
 *
 * EVERY ENDPOINT BELOW CARRIES ITS SOURCE. Nothing is inferred.
 *   OURA    https://cloud.ouraring.com/docs/authentication
 *   WHOOP   https://developer.whoop.com/docs/developing/oauth/
 *   STRAVA  https://developers.strava.com/docs/authentication/
 *
 * DEPLOY:
 *   supabase secrets set OURA_CLIENT_ID=...   OURA_CLIENT_SECRET=...
 *   supabase secrets set WHOOP_CLIENT_ID=...  WHOOP_CLIENT_SECRET=...
 *   supabase secrets set STRAVA_CLIENT_ID=... STRAVA_CLIENT_SECRET=...
 *   supabase functions deploy oauth-broker --no-verify-jwt
 * A provider whose secrets are absent simply says so. The others keep working.
 * ────────────────────────────────────────────────────────────────────────────
 */

type Provider = {
  tokenUrl: string;
  /** Revoke/deauthorize. `mode` differs because the vendors differ. */
  revokeUrl: string | null;
  revokeMode: 'query' | 'form' | null;
  revokeParam: string;
  idEnv: string;
  secretEnv: string;
  /** Extra body params the vendor requires on the refresh grant. */
  refreshExtra: Record<string, string>;
};

const PROVIDERS: Record<string, Provider> = {
  // OURA — "Required if not using Basic Authorization" (client_secret), and
  // "The refresh token is single-use, meaning it is invalidated after being
  // used." Revoke is a query parameter on POST /oauth/revoke.
  oura: {
    tokenUrl:   'https://api.ouraring.com/oauth/token',
    revokeUrl:  'https://api.ouraring.com/oauth/revoke',
    revokeMode: 'query',
    revokeParam: 'access_token',
    idEnv: 'OURA_CLIENT_ID', secretEnv: 'OURA_CLIENT_SECRET',
    refreshExtra: {},
  },
  // WHOOP — "WHOOP provides your app with a refresh token after completing the
  // OAuth 2.0 flow IF the `offline` scope is included in the authorization
  // request", and WHOOP's own refresh payload carries scope: "offline" again.
  // That is not a copy-paste artefact; it is in their documented body.
  whoop: {
    tokenUrl:   'https://api.prod.whoop.com/oauth/oauth2/token',
    revokeUrl:  null,          // no documented revoke endpoint — see below
    revokeMode: null,
    revokeParam: '',
    idEnv: 'WHOOP_CLIENT_ID', secretEnv: 'WHOOP_CLIENT_SECRET',
    refreshExtra: { scope: 'offline' },
  },
  // STRAVA — token exchange and refresh both take client_id, client_secret,
  // grant_type. Revoke moved: "Legacy: /oauth/deauthorize · Current (as of
  // June 1, 2026): /oauth/revoke". AA2 uses the current one.
  strava: {
    tokenUrl:   'https://www.strava.com/oauth/token',
    revokeUrl:  'https://www.strava.com/oauth/revoke',
    revokeMode: 'form',
    revokeParam: 'access_token',
    idEnv: 'STRAVA_CLIENT_ID', secretEnv: 'STRAVA_CLIENT_SECRET',
    refreshExtra: {},
  },
};

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
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

type TokenSet = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  /** Strava returns an absolute epoch-seconds expiry instead of a duration. */
  expires_at?: number;
  token_type?: string;
  scope?: string;
};

async function tokenRequest(p: Provider, form: Record<string, string>, tag: string): Promise<Response> {
  const r = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: 'application/json',
    },
    body: new URLSearchParams(form).toString(),
  });

  const text = await r.text();
  if (!r.ok) {
    console.log('[oauth-broker]', tag, r.status, redact(text).slice(0, 200));
    return json({ ok: false, status: r.status, error: redact(text).slice(0, 300) }, 502);
  }

  let t: TokenSet;
  try { t = JSON.parse(text); } catch {
    return json({ ok: false, error: `${tag}: token response was not JSON.` }, 502);
  }
  if (!t.access_token) return json({ ok: false, error: `${tag}: no access_token returned.` }, 502);

  // THE CLOCK QUESTION. expires_in is a duration; Strava's expires_at is an
  // absolute epoch. Both are resolved to an ISO instant HERE, on a server
  // clock, so a wrong phone clock can never make a live token look dead or a
  // dead one look live.
  const expires_at =
    typeof t.expires_at === 'number' ? new Date(t.expires_at * 1000).toISOString()
    : typeof t.expires_in === 'number' ? new Date(Date.now() + t.expires_in * 1000).toISOString()
    : null;

  return json({
    ok: true,
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? null,
    expires_at,
    scope: t.scope ?? null,
    token_type: t.token_type ?? 'Bearer',
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')    return json({ ok: false, error: 'POST only.' }, 405);

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Body must be JSON.' }, 400); }

  const key = String(body.provider ?? '').toLowerCase();
  const p = PROVIDERS[key];
  if (!p) return json({ ok: false, error: `Unknown provider "${redact(key)}". Known: oura, whoop, strava.` }, 400);

  const client_id     = Deno.env.get(p.idEnv)     ?? '';
  const client_secret = Deno.env.get(p.secretEnv) ?? '';
  if (!client_id || !client_secret) {
    // Named plainly so the founder is never left guessing which half is missing.
    return json({
      ok: false,
      error: `${key} broker not configured. Run: supabase secrets set ${p.idEnv}=... ${p.secretEnv}=...`,
    }, 500);
  }

  const action = String(body.action ?? '');

  if (action === 'exchange') {
    const code = String(body.code ?? '');
    if (!code) return json({ ok: false, error: 'Missing code.' }, 400);
    const form: Record<string, string> = {
      grant_type: 'authorization_code', code, client_id, client_secret,
    };
    // Oura: "The exact same redirect URI that was included in the
    // authorization request." WHOOP requires it too. Strava does not list it,
    // and sending an unexpected parameter is how exchanges fail — so it goes
    // only where it is documented.
    if (body.redirect_uri && key !== 'strava') form.redirect_uri = String(body.redirect_uri);
    return await tokenRequest(p, form, `${key}:exchange`);
  }

  if (action === 'refresh') {
    const refresh_token = String(body.refresh_token ?? '');
    if (!refresh_token) return json({ ok: false, error: 'Missing refresh_token.' }, 400);
    return await tokenRequest(p, {
      grant_type: 'refresh_token', refresh_token, client_id, client_secret,
      ...p.refreshExtra,
    }, `${key}:refresh`);
  }

  if (action === 'revoke') {
    const access_token = String(body.access_token ?? '');
    if (!access_token) return json({ ok: false, error: 'Missing access_token.' }, 400);

    // WHOOP publishes no revoke endpoint. AA2 says so rather than pretending
    // it called one: the member revokes AA2 from their WHOOP account, and the
    // credential is wiped from the device either way.
    if (!p.revokeUrl) {
      return json({
        ok: true, revoked: false,
        note: 'This provider publishes no revoke endpoint. The credential was removed from the device; revoke AA2 in your account settings to close it at their end too.',
      });
    }

    try {
      const r = p.revokeMode === 'query'
        ? await fetch(`${p.revokeUrl}?${p.revokeParam}=${encodeURIComponent(access_token)}`,
            { method: 'POST', headers: { Accept: 'application/json' } })
        : await fetch(p.revokeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
            body: new URLSearchParams({ [p.revokeParam]: access_token }).toString(),
          });
      return json({ ok: r.ok, revoked: r.ok, status: r.status });
    } catch (e) {
      return json({ ok: false, error: redact(String(e)).slice(0, 200) }, 502);
    }
  }

  return json({ ok: false, error: `Unknown action "${redact(action)}".` }, 400);
});
