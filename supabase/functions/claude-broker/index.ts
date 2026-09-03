/**
 * ─── supabase/functions/claude-broker/index.ts ──────────────────────────────
 * THE CONCIERGE BROKER — one door for every AA2 call that speaks to Claude.
 *
 * FOUNDER ORDER 2026-09-02: "now that we are going to wire right damn now"
 * and "i need the code to be so ambiguous they cant help but copy the wrong."
 * The answer to the second one is not obfuscation. It is this file.
 *
 * WHY A SERVER EXISTS AT ALL: the Anthropic key shipped in
 * plaintext inside every APK and IPA, readable by anyone with a zip tool,
 * across eight files and ten call sites. A phone cannot hold a secret. The
 * key lives HERE, in the founder's own Supabase project, and nowhere else.
 * Ship Blocker #1, closed at the network boundary instead of hidden in a
 * bundle.
 *
 * WHAT THIS FUNCTION NEVER DOES:
 *   · store a prompt, a response, or one byte of member health data
 *   · log a key, a prompt body, or a verdict (see redact())
 *   · accept a caller who is not a signed-in AA2 member
 *
 * RAW IN, VERDICT OUT — enforced at the wire, not in a file.
 *
 * DEPLOY:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy claude-broker
 * Note: NO --no-verify-jwt here. Unlike oauth-broker, this door costs money
 * every time it opens, so the platform checks the signature and the code
 * below checks that the caller is an authenticated member and not the anon
 * key that also ships in the bundle.
 * ────────────────────────────────────────────────────────────────────────────
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * THE ALLOWLIST. A broker that forwards any model a caller names is a broker
 * that can be asked for the most expensive one. AA2 ships two tiers and the
 * speed doctrine of 2026-07-29 governs which is which.
 */
const ALLOWED_MODELS = new Set<string>([
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
]);
const DEFAULT_MODEL = 'claude-haiku-4-5';

/** Hard ceiling. A client cannot ask this broker to write a novel. */
const MAX_TOKENS_CEILING = 4000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Never let a credential reach a log line. Same rule as the token broker. */
function redact(s: string): string {
  return s.replace(/[A-Za-z0-9_\-]{20,}/g, '[redacted]');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/**
 * THE MEMBER CHECK.
 *
 * The platform verifies the JWT signature before this code runs. What it does
 * NOT do is tell anon from authenticated — the anon key is itself a validly
 * signed JWT, and it ships in the bundle right next to where the Anthropic key
 * used to. So the payload is read here and the role is required to be
 * `authenticated`. AA2 signs every member in at onboarding, anonymously but
 * really, so every genuine caller already carries one.
 *
 * No network call, no service-role key, no new dependency — the signature is
 * already trusted by the time we are reading it.
 */
function callerIsMember(req: Request): { ok: true; sub: string } | { ok: false; why: string } {
  const raw = req.headers.get('Authorization') ?? '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false, why: 'No Authorization bearer token.' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, why: 'Malformed token.' };

  try {
    // base64url → base64, then decode. Deno's atob does not accept base64url.
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(pad));
    const role = String(payload?.role ?? '');
    const sub = String(payload?.sub ?? '');
    if (role !== 'authenticated' || !sub) {
      return { ok: false, why: 'This door is for signed-in members only.' };
    }
    return { ok: true, sub };
  } catch {
    return { ok: false, why: 'Token payload unreadable.' };
  }
}

type BrokerBody = {
  system?: string;
  /** Either a plain string prompt, or Anthropic content blocks (vision). */
  user?: string;
  content?: unknown;
  max_tokens?: number;
  model?: string;
  stream?: boolean;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only.' }, 405);

  const who = callerIsMember(req);
  if (!who.ok) return json({ ok: false, error: who.why }, 401);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
  if (!apiKey) {
    // Named plainly so the founder is never left guessing which half is missing.
    return json({
      ok: false,
      error: 'Concierge broker not configured. Run: supabase secrets set ANTHROPIC_API_KEY=...',
    }, 500);
  }

  let body: BrokerBody;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Body must be JSON.' }, 400); }

  const model = String(body.model ?? DEFAULT_MODEL);
  if (!ALLOWED_MODELS.has(model)) {
    return json({
      ok: false,
      error: `Model "${redact(model)}" is not on the AA2 allowlist.`,
    }, 400);
  }

  const requested = Number(body.max_tokens ?? 1800);
  const max_tokens = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1800, MAX_TOKENS_CEILING));

  // The caller sends either `content` (blocks — vision carries an image) or
  // `user` (a plain string). Both become one user message, unchanged.
  const messageContent = body.content ?? String(body.user ?? '');
  if (!body.content && !String(body.user ?? '').trim()) {
    return json({ ok: false, error: 'Nothing to send — provide user or content.' }, 400);
  }

  const wantsStream = body.stream === true;

  const upstreamBody = JSON.stringify({
    model,
    max_tokens,
    ...(body.system ? { system: body.system } : {}),
    ...(wantsStream ? { stream: true } : {}),
    messages: [{ role: 'user', content: messageContent }],
  });

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: upstreamBody,
    });
  } catch (e) {
    console.log('[claude-broker] network', redact(String(e)).slice(0, 200));
    return json({ ok: false, error: 'Upstream unreachable.' }, 502);
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    console.log('[claude-broker]', upstream.status, redact(text).slice(0, 200));
    return json({ ok: false, status: upstream.status, error: redact(text).slice(0, 300) }, 502);
  }

  // STREAMING: the body is passed straight back, frame for frame. The device
  // parser in lib/claude-stream.ts already reads Anthropic's SSE shape, so
  // nothing about it changes — only the address it dials.
  if (wantsStream) {
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // NON-STREAMING: the text blocks are joined here so every caller in AA2
  // receives the same shape and no screen has to know Anthropic's envelope.
  let data: { content?: { type?: string; text?: string }[] };
  try { data = await upstream.json(); } catch {
    return json({ ok: false, error: 'Upstream response was not JSON.' }, 502);
  }

  const text = (data.content ?? [])
    .filter((b) => b?.type === 'text')
    .map((b) => String(b?.text ?? ''))
    .join('\n')
    .trim();

  return json({ ok: true, text });
});
