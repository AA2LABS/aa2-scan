// ─── lib/affiliate-links.ts ──────────────────────────────────────────────────
// THE AFFILIATE RAIL — Device Stack Unity Benefits doctrine (locked 2026-08-01).
// Every product the intelligences honestly recommend carries a link; commissions
// attach ONLY to what the member's own data already earned. THE VERDICT IS
// NEVER FOR SALE — no commission ever biases a verdict, alternative, or ranking.
// Disclosure line wherever a link earns: "AA2 may earn a commission — the
// recommendation came from your data, not the commission."
//
// ONE PLACE FOR IDS: when a program approves, drop the tag below. Every surface
// (scanner WHERE TO BUY, device catalog ADDS lines, Suggest-the-Gap readings)
// inherits it instantly. Empty tag = clean brand link, still functional.
// ─────────────────────────────────────────────────────────────────────────────

export const AFFILIATE_TAGS: Record<string, string> = {
  amazon:  '',   // Amazon Associates tag, e.g. 'aa2labs-20'
  garmin:  '',   // Garmin affiliate id (apply: garmin.com/en-US/ambassadors-and-affiliates/affiliates)
  oura:    '',   // Oura affiliate id (Impact network)
  whoop:   '',   // WHOOP affiliate id (Impact network)
  manta:   '',   // Manta Sleep affiliate id (FlexOffers / Skimlinks / shopper.com)
  muse:    '',   // Muse affiliate id (choosemuse.com/pages/affiliates)
};

export interface AffiliateProgram {
  brand: string;
  founderStack: boolean;
  program: 'DIRECT' | 'AMAZON-FLOOR' | 'NONE';
  signupUrl: string;
  note: string;
}

// The founder's own stack, checked 2026-08-01 — every device already owned
// that has a live program. Applications are founder-side (accounts are yours).
export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  { brand: 'Garmin', founderStack: true, program: 'DIRECT',
    signupUrl: 'https://www.garmin.com/en-US/ambassadors-and-affiliates/affiliates/',
    note: 'Official Garmin affiliate program — covers Tactix 8 and the whole watch line.' },
  { brand: 'Oura', founderStack: true, program: 'DIRECT',
    signupUrl: 'https://ouraring.com/affiliates',
    note: 'Oura affiliate program (Impact network) — Oura Ring 4.' },
  { brand: 'WHOOP', founderStack: true, program: 'DIRECT',
    signupUrl: 'https://www.whoop.com/us/en/affiliates/',
    note: 'WHOOP affiliate program (Impact network) — memberships and hardware; flagship recommendation.' },
  { brand: 'Manta Sleep', founderStack: true, program: 'DIRECT',
    signupUrl: 'https://mantasleep.com/pages/affiliate',
    note: 'Manta Sleep affiliate program (FlexOffers / Skimlinks) — Manta Sound 2, PRO, Weighted.' },
  { brand: 'Muse', founderStack: true, program: 'DIRECT',
    signupUrl: 'https://choosemuse.com/pages/affiliates',
    note: 'Muse affiliate program — Muse S Athena; SDK partnership runs separately.' },
  { brand: 'Beats (Apple)', founderStack: true, program: 'AMAZON-FLOOR',
    signupUrl: 'https://affiliate-program.amazon.com',
    note: 'Beats Pro 2 earns through Amazon Associates — Apple’s own program does not cover hardware commissions meaningfully.' },
  { brand: 'Oakley Meta', founderStack: true, program: 'AMAZON-FLOOR',
    signupUrl: 'https://affiliate-program.amazon.com',
    note: 'Oakley Meta glasses earn through Amazon Associates.' },
  { brand: 'Strava', founderStack: true, program: 'NONE',
    signupUrl: '',
    note: 'Subscription service, no public affiliate program — stays in the stack for data, not commission.' },
];

// Brand store links per catalog device key. Empty-tag safe.
const BRAND_LINKS: Record<string, { url: string; tagKey?: keyof typeof AFFILIATE_TAGS; tagParam?: string }> = {
  garmin_tactix_8: { url: 'https://www.garmin.com/en-US/p/1471908', tagKey: 'garmin' },
  oura_ring_4:     { url: 'https://ouraring.com/product/rings/oura-ring-4', tagKey: 'oura' },
  whoop_5_0:       { url: 'https://www.whoop.com', tagKey: 'whoop' },
  whoop_mg:        { url: 'https://www.whoop.com', tagKey: 'whoop' },
  manta_sound_2:   { url: 'https://mantasleep.com/products/manta-sound-sleep-mask', tagKey: 'manta' },
  manta_pro:       { url: 'https://mantasleep.com/products/manta-pro-sleep-mask', tagKey: 'manta' },
  manta_weighted:  { url: 'https://mantasleep.com/products/manta-weighted-sleep-mask', tagKey: 'manta' },
  muse_s_athena:   { url: 'https://choosemuse.com/products/muse-s-athena', tagKey: 'muse' },
};

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Affiliate-aware buy link for a known device or sleep aid. Null = not a
 *  catalog device (caller falls back to its own behavior, e.g. maps search). */
export function deviceBuyLink(nameOrKey: string): string | null {
  const key = norm(nameOrKey);
  const hit = BRAND_LINKS[key];
  if (hit) {
    const tag = hit.tagKey ? AFFILIATE_TAGS[hit.tagKey] : '';
    if (tag) {
      const sep = hit.url.includes('?') ? '&' : '?';
      return `${hit.url}${sep}${hit.tagParam ?? 'irclickid'}=${encodeURIComponent(tag)}`;
    }
    return hit.url;
  }
  // Amazon floor for any other known catalog name (Beats, Oakley, Nodpod, …)
  const amazonable = ['beats', 'oakley', 'nodpod', 'ostrichpillow', 'drowsy', 'mavogel', 'slip_silk', 'polar', 'fitbit', 'withings', 'suunto', 'coros'];
  if (amazonable.some(a => key.includes(a))) {
    const q = encodeURIComponent(nameOrKey);
    const tag = AFFILIATE_TAGS.amazon ? `&tag=${AFFILIATE_TAGS.amazon}` : '';
    return `https://www.amazon.com/s?k=${q}${tag}`;
  }
  return null;
}

export const AFFILIATE_DISCLOSURE =
  'AA2 may earn a commission — the recommendation came from your data, not the commission.';
