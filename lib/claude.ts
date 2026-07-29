// lib/claude.ts — shared Claude fetch helper. Replaces @anthropic-ai/sdk (Canon 5.7).
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5'; // speed doctrine 2026-07-29: scan verdicts on the fast tier — one-line revert to 'claude-sonnet-4-6'

export async function claudeMessage(opts: {
  system?: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1800,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: opts.user }],
    }),
  });
  const data = await res.json();
  return (data?.content?.[0]?.text ?? '') as string;
}
