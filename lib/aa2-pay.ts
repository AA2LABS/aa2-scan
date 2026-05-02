// ─── lib/aa2-pay.ts ───────────────────────────────────────────────────────────
// AA2 Pay · Aware Dollars engine + country-agnostic config
// v50 · Mockup-locked against panel #5 (Card Face) and panel #6 (Transaction Feed)
//
// Architectural locks:
//   1. Country-agnostic. NO PANAMA_INSTANCE default. Country instance is
//      runtime config injected by the calling context (member.country_code).
//   2. Aware Dollars (NOT Act Right Dollars). Echoes AWARE·ADAPT·ADVANCE.
//      Earn rates: 2% aligned base, 2× farmer market bonus, 1.5% travel,
//      0.5% neutral, 0% watch (fast food / alcohol).
//   3. The Postgres trigger trg_log_transaction_exposure (Migration 2) is
//      the source of truth for fast_food/convenience auto-logging into
//      exposure_events. This lib only writes the transaction row.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

// ─── COUNTRY INSTANCE TYPE (no defaults — runtime config) ─────────────────────
// Each member's country_code resolves to a CountryInstance at runtime.
// New countries are added by extending this map, NOT by changing defaults.

export type CountryCode = 'PA' | 'US' | 'CR' | 'MX' | 'CO';

export interface CountryInstance {
  code: CountryCode;
  brandLine: string;             // "AA2 PANAMA", "AA2 USA", etc.
  currency: string;              // "USD" (Panama uses USD), "MXN", "CRC", etc.
  fxToUsd: number;               // 1.0 for USD jurisdictions
  emergencyNumber: string;       // "911", "066", etc.
}

const COUNTRY_REGISTRY: Record<CountryCode, CountryInstance> = {
  PA: {
    code: 'PA',
    brandLine: 'AA2 PANAMA',
    currency: 'USD',
    fxToUsd: 1.0,
    emergencyNumber: '911',
  },
  US: {
    code: 'US',
    brandLine: 'AA2 USA',
    currency: 'USD',
    fxToUsd: 1.0,
    emergencyNumber: '911',
  },
  CR: {
    code: 'CR',
    brandLine: 'AA2 COSTA RICA',
    currency: 'CRC',
    fxToUsd: 0.0019,
    emergencyNumber: '911',
  },
  MX: {
    code: 'MX',
    brandLine: 'AA2 MEXICO',
    currency: 'MXN',
    fxToUsd: 0.058,
    emergencyNumber: '911',
  },
  CO: {
    code: 'CO',
    brandLine: 'AA2 COLOMBIA',
    currency: 'COP',
    fxToUsd: 0.00025,
    emergencyNumber: '123',
  },
};

export function resolveCountryInstance(code: string): CountryInstance | null {
  const upper = code.toUpperCase();
  if (upper in COUNTRY_REGISTRY) {
    return COUNTRY_REGISTRY[upper as CountryCode];
  }
  return null;
}

// ─── SPEND CATEGORY + DOCTRINE FLAG ───────────────────────────────────────────
// Maps MCC (merchant category code) to spend_category and doctrine_flag.
// Doctrine flag is what drives Aware Dollars earn rate.

export type SpendCategory =
  | 'grocery'
  | 'farmer_market'
  | 'restaurant'
  | 'fast_food'
  | 'convenience'
  | 'pharmacy'
  | 'travel_lodging'
  | 'travel_transport'
  | 'fitness'
  | 'fuel'
  | 'utilities'
  | 'entertainment'
  | 'alcohol'
  | 'other';

export type DoctrineFlag = 'aligned' | 'aligned_bonus' | 'travel' | 'neutral' | 'watch';

interface MccRule {
  mccRanges: Array<[number, number]>;
  category: SpendCategory;
  doctrineFlag: DoctrineFlag;
}

// MCC ranges based on standard ISO/Visa MCC tables.
// Aligned categories earn Aware Dollars; watch categories do not.
const MCC_RULES: MccRule[] = [
  // Farmer markets, organic produce — 2× ALIGNED BONUS
  { mccRanges: [[5499, 5499]], category: 'farmer_market', doctrineFlag: 'aligned_bonus' },
  // Grocery — aligned
  { mccRanges: [[5411, 5411], [5422, 5422], [5451, 5451]], category: 'grocery', doctrineFlag: 'aligned' },
  // Pharmacy — aligned
  { mccRanges: [[5912, 5912]], category: 'pharmacy', doctrineFlag: 'aligned' },
  // Fitness — aligned
  { mccRanges: [[7997, 7997], [7298, 7298]], category: 'fitness', doctrineFlag: 'aligned' },
  // Restaurants (sit-down) — neutral
  { mccRanges: [[5812, 5812]], category: 'restaurant', doctrineFlag: 'neutral' },
  // Fast food — WATCH (triggers exposure_events insert via Postgres trigger)
  { mccRanges: [[5814, 5814]], category: 'fast_food', doctrineFlag: 'watch' },
  // Convenience stores — WATCH (triggers exposure_events insert)
  { mccRanges: [[5499, 5499], [5411, 5411]], category: 'convenience', doctrineFlag: 'watch' },
  // Alcohol — WATCH
  { mccRanges: [[5921, 5921]], category: 'alcohol', doctrineFlag: 'watch' },
  // Travel lodging — travel
  { mccRanges: [[3500, 3999], [7011, 7011]], category: 'travel_lodging', doctrineFlag: 'travel' },
  // Travel transport (airlines, rideshare, transit)
  { mccRanges: [[3000, 3299], [4111, 4131], [4511, 4511], [4121, 4121]], category: 'travel_transport', doctrineFlag: 'travel' },
  // Fuel — neutral
  { mccRanges: [[5541, 5542]], category: 'fuel', doctrineFlag: 'neutral' },
  // Utilities — neutral
  { mccRanges: [[4900, 4900]], category: 'utilities', doctrineFlag: 'neutral' },
  // Entertainment — neutral
  { mccRanges: [[7832, 7832], [7922, 7922], [7929, 7929]], category: 'entertainment', doctrineFlag: 'neutral' },
];

export interface MccClassification {
  category: SpendCategory;
  doctrineFlag: DoctrineFlag;
}

export function classifyMcc(mcc: number | null | undefined): MccClassification {
  if (mcc === null || mcc === undefined) {
    return { category: 'other', doctrineFlag: 'neutral' };
  }
  for (const rule of MCC_RULES) {
    for (const [lo, hi] of rule.mccRanges) {
      if (mcc >= lo && mcc <= hi) {
        return { category: rule.category, doctrineFlag: rule.doctrineFlag };
      }
    }
  }
  return { category: 'other', doctrineFlag: 'neutral' };
}

// ─── AWARE DOLLARS EARN ENGINE ────────────────────────────────────────────────
// Locked rates per memory #29:
//   aligned        2.0%    (grocery, pharmacy, fitness)
//   aligned_bonus  4.0%    (farmer market — 2× the aligned base)
//   travel         1.5%    (lodging, transport)
//   neutral        0.5%    (restaurant, fuel, utilities, entertainment)
//   watch          0.0%    (fast food, alcohol, convenience)

const AWARE_DOLLAR_RATES: Record<DoctrineFlag, number> = {
  aligned: 0.02,
  aligned_bonus: 0.04,
  travel: 0.015,
  neutral: 0.005,
  watch: 0.0,
};

export function calcAwareDollars(
  amountUsd: number,
  doctrineFlag: DoctrineFlag,
): number {
  if (amountUsd <= 0) return 0;
  const rate = AWARE_DOLLAR_RATES[doctrineFlag];
  // Round to nearest cent
  return Math.round(amountUsd * rate * 100) / 100;
}

// ─── TRANSACTION SHAPE (matches Supabase Migration 2) ─────────────────────────

export interface AA2Transaction {
  id: string;
  card_id: string;
  user_id: string;
  member_id: string | null;
  merchant_name: string;
  merchant_city: string | null;
  merchant_country: string | null;
  mcc: number | null;
  spend_category: SpendCategory | null;
  doctrine_flag: DoctrineFlag | null;
  amount_usd: number;
  currency: string;
  local_amount: number | null;
  status: 'pending' | 'completed' | 'declined' | 'refunded';
  transacted_at: string;
  doctrine_note: string | null;
  scan_result: any | null;
  created_at: string;
}

// ─── LOG TRANSACTION ──────────────────────────────────────────────────────────
// Inserts a transaction row. The cross-system trigger
// trg_log_transaction_exposure handles fast_food/convenience auto-logging
// into exposure_events when status moves to 'completed'.

export interface LogTransactionInput {
  card_id: string;
  member_id?: string | null;
  merchant_name: string;
  merchant_city?: string | null;
  merchant_country?: string | null;
  mcc: number | null;
  amount_usd: number;
  currency?: string;
  local_amount?: number | null;
  status?: 'pending' | 'completed' | 'declined' | 'refunded';
  doctrine_note?: string | null;
}

export async function logTransaction(
  input: LogTransactionInput,
): Promise<AA2Transaction | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    console.error('[aa2-pay] no auth user for logTransaction', authError);
    return null;
  }

  const classification = classifyMcc(input.mcc);

  const { data, error } = await supabase
    .from('aa2_transactions')
    .insert({
      card_id: input.card_id,
      user_id: authData.user.id,
      member_id: input.member_id ?? null,
      merchant_name: input.merchant_name,
      merchant_city: input.merchant_city ?? null,
      merchant_country: input.merchant_country ?? null,
      mcc: input.mcc,
      spend_category: classification.category,
      doctrine_flag: classification.doctrineFlag,
      amount_usd: input.amount_usd,
      currency: input.currency ?? 'USD',
      local_amount: input.local_amount ?? null,
      status: input.status ?? 'pending',
      transacted_at: new Date().toISOString(),
      doctrine_note: input.doctrine_note ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[aa2-pay] logTransaction error:', error);
    return null;
  }
  return data as AA2Transaction;
}

// ─── AWARE DOLLARS BALANCE (computed from transaction history) ───────────────

export interface AwareDollarsBalance {
  totalEarned: number;
  thisMonth: number;
  lastMonth: number;
  monthOverMonthPct: number;
}

export async function getAwareDollarsBalance(): Promise<AwareDollarsBalance> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { totalEarned: 0, thisMonth: 0, lastMonth: 0, monthOverMonthPct: 0 };
  }

  const { data, error } = await supabase
    .from('aa2_transactions')
    .select('amount_usd, doctrine_flag, transacted_at, status')
    .eq('user_id', authData.user.id)
    .eq('status', 'completed');

  if (error || !data) {
    console.error('[aa2-pay] getAwareDollarsBalance error:', error);
    return { totalEarned: 0, thisMonth: 0, lastMonth: 0, monthOverMonthPct: 0 };
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let totalEarned = 0;
  let thisMonth = 0;
  let lastMonth = 0;

  for (const tx of data) {
    const earned = calcAwareDollars(
      Number(tx.amount_usd),
      (tx.doctrine_flag as DoctrineFlag) ?? 'neutral',
    );
    totalEarned += earned;

    const txDate = new Date(tx.transacted_at);
    if (txDate >= thisMonthStart) {
      thisMonth += earned;
    } else if (txDate >= lastMonthStart && txDate < thisMonthStart) {
      lastMonth += earned;
    }
  }

  const monthOverMonthPct =
    lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : 0;

  return {
    totalEarned: Math.round(totalEarned * 100) / 100,
    thisMonth: Math.round(thisMonth * 100) / 100,
    lastMonth: Math.round(lastMonth * 100) / 100,
    monthOverMonthPct,
  };
}

// ─── ALIGNED PERCENTAGE (panel #5 KPI) ────────────────────────────────────────
// "Aligned %" = aligned + aligned_bonus spend / total spend, last 7 days.

export async function getAlignedPercent(): Promise<number> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('aa2_transactions')
    .select('amount_usd, doctrine_flag')
    .eq('user_id', authData.user.id)
    .eq('status', 'completed')
    .gte('transacted_at', sevenDaysAgo);

  if (error || !data || data.length === 0) return 0;

  let aligned = 0;
  let total = 0;
  for (const tx of data) {
    const amt = Number(tx.amount_usd);
    total += amt;
    if (tx.doctrine_flag === 'aligned' || tx.doctrine_flag === 'aligned_bonus') {
      aligned += amt;
    }
  }

  if (total === 0) return 0;
  return Math.round((aligned / total) * 100);
}
