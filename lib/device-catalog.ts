// ─── lib/device-catalog.ts ───────────────────────────────────────────────────
// APPROVED DEVICES · 2026 — BYOH doctrine as data.
// Law: AA2 is hardware agnostic. Bring it if it gives you data that works
// with the AA2 membrane. Downloadable data required, even if limited.
// Stack determines depth, not access. The junk drawer is the onramp.
// In device selection the intelligence speaks each device's ADDS line —
// what THIS device contributes to the member's AA2 experience.
// Anti-duplicate rule (Helio precedent): never sell a member an organ their
// body already has.
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceTier =
  | 'FULL API'        // cloud API — deepest membrane feed, automatic
  | 'FILE EXPORT'     // BYOB — bring the archive, the membrane eats it
  | 'AGGREGATOR'      // Apple Health / Health Connect — the phone is the port
  | 'LIVE BLE'        // real-time nerve, no cloud between
  | 'SPECIES';        // extended sensory reach — Spokes 27-29

export interface ApprovedDevice {
  key: string;          // normalized id stored in device_connections.hardware
  name: string;
  tier: DeviceTier;
  dataPath: string;     // how the data reaches the membrane
  adds: string;         // the intelligence's line in device selection
  flagship?: boolean;
}

export const DEVICE_CATALOG: ApprovedDevice[] = [
  // ── FLAGSHIP ──
  { key: 'whoop_5_0', name: 'WHOOP 5.0', tier: 'FULL API', flagship: true,
    dataPath: 'WHOOP developer API + webhooks — recovery, sleep, strain pushed to the membrane automatically',
    adds: 'The recovery engine. Your daily readiness verdict, pushed to the membrane the moment it lands — no phone ritual. Screenless: AA2 gets you out of your phone, and so does this.' },
  { key: 'whoop_mg', name: 'WHOOP MG', tier: 'FULL API', flagship: true,
    dataPath: 'WHOOP developer API + webhooks',
    adds: 'Everything WHOOP 5.0 adds, plus FDA-cleared ECG and blood-pressure insights — medical-grade signals in a screenless strap.' },

  // ── FULL API ──
  { key: 'oura_ring_4', name: 'Oura Ring 4', tier: 'FULL API',
    dataPath: 'Oura cloud API v2 — personal token, nightly automatic pull (wired in-app)',
    adds: 'The night ledger. The deepest sleep and 5-minute HRV baselines in consumer hardware — your 30/60/90 baseline gets its backbone here.' },
  { key: 'dexcom_stelo', name: 'Dexcom Stelo (CGM)', tier: 'FULL API',
    dataPath: 'Dexcom developer API — over-the-counter continuous glucose',
    adds: 'Live glucose — the Chemical Doctrine\'s judge. Watch what a scanned food actually does to YOUR blood sugar, not a population average.' },
  { key: 'abbott_lingo', name: 'Abbott Lingo (CGM)', tier: 'FULL API',
    dataPath: 'Lingo app + LibreView export',
    adds: 'The same glucose truth, Abbott flavor — every scan verdict gains a metabolic receipt.' },
  { key: 'fitbit', name: 'Fitbit Charge 6 / Sense 3', tier: 'FULL API',
    dataPath: 'Google Fitbit Web API (OAuth) + full account export',
    adds: 'Sleep, heart rate, HRV, and stress on the widest budget onramp — a full membrane feed without a premium price.' },
  { key: 'polar', name: 'Polar Vantage V4 / Loop', tier: 'FULL API',
    dataPath: 'Polar AccessLink API + GDPR export',
    adds: 'Lab-grade training load and recovery — and pair the H10 chest strap for the gold-standard HRV signal on earth.' },
  { key: 'polar_h10', name: 'Polar H10 Strap', tier: 'LIVE BLE',
    dataPath: 'Open Bluetooth heart-rate broadcast + Polar API',
    adds: 'The reference heartbeat. Chest-strap HRV accuracy every other device is judged against — and a live wire straight into the membrane.' },
  { key: 'withings', name: 'Withings ScanWatch 3 / Body / BPM', tier: 'FULL API',
    dataPath: 'Withings public API — watch, scale, cuff, sleep mat',
    adds: 'Vitals no wrist carries: blood pressure, body composition, bed-sensed sleep. The membrane\'s clinical corner.' },
  { key: 'ultrahuman_ring', name: 'Ultrahuman Ring Air', tier: 'FULL API',
    dataPath: 'Ultrahuman partner API + export',
    adds: 'A metabolic-focused ring — sleep, HRV, and stimulant-timing windows for members chasing metabolic precision.' },
  { key: 'strava', name: 'Strava', tier: 'FULL API',
    dataPath: 'Strava API + activities.csv export (wired in-app)',
    adds: 'The activity river. Whatever device records the workout, Strava funnels it into one stream the membrane can read.' },

  // ── FILE EXPORT ──
  { key: 'garmin_tactix_8', name: 'Garmin Tactix 8', tier: 'FILE EXPORT',
    dataPath: 'Garmin Connect export JSON/FIT (wired in-app) + live BLE broadcast',
    adds: 'Field-grade everything — sleep, stress, HRV, Body Battery — plus an open live pulse the membrane hears directly. The tactical wrist.' },
  { key: 'garmin', name: 'Garmin (Fenix 8 · Venu 4 · Forerunner · Instinct 3)', tier: 'FILE EXPORT',
    dataPath: 'Garmin Connect export JSON/FIT (wired in-app) + live BLE broadcast',
    adds: 'The Garmin engine at every price point — deep daily wellness data by export, live heart rate by broadcast.' },
  { key: 'suunto', name: 'Suunto Race 2', tier: 'FILE EXPORT',
    dataPath: 'Suunto export + partner API',
    adds: 'Endurance depth for the long-route members — training load the membrane folds into recovery.' },
  { key: 'coros', name: 'COROS Pace Pro / Apex 2', tier: 'FILE EXPORT',
    dataPath: 'FIT export + Training Hub CSV',
    adds: 'The runner\'s engine — efficient, long-battery training data by export.' },
  { key: 'amazfit', name: 'Amazfit (Helio Ring · Helio Strap · T-Rex 3)', tier: 'FILE EXPORT',
    dataPath: 'Zepp GDPR export only — no public API; open live BLE broadcast on strap',
    adds: 'A budget onramp with an open live pulse. Depth is limited — its computed scores stay locked in Zepp. Accepted per doctrine: bring what you have.' },
  { key: 'eight_sleep', name: 'Eight Sleep Pod 5', tier: 'FILE EXPORT',
    dataPath: 'In-app metrics, limited export',
    adds: 'Sleep temperature and bed-sensed HRV with nothing worn at all — the bedroom becomes a sensor.' },

  // ── AGGREGATOR ──
  { key: 'apple_watch', name: 'Apple Watch Series 12 / Ultra 3', tier: 'AGGREGATOR',
    dataPath: 'Apple Health export.xml (BYOB, supported) + HealthKit',
    adds: 'Full vitals, ECG, sleep-apnea detection — the largest health dataset most members already own.' },
  { key: 'airpods_pro_3', name: 'AirPods Pro 3', tier: 'AGGREGATOR',
    dataPath: 'In-ear heart rate during workouts → Apple Health',
    adds: 'Heart rate from the earbuds you already wear — zero new hardware, one more signal.' },
  { key: 'beats_pro_2', name: 'Beats Pro 2', tier: 'AGGREGATOR',
    dataPath: 'In-ear heart rate → Apple Health',
    adds: 'Workout heart rate from the ears — and the ASRT audio channel: training the body and the subconscious on the same device.' },
  { key: 'samsung', name: 'Samsung Galaxy Watch 8 / Galaxy Ring 2', tier: 'AGGREGATOR',
    dataPath: 'Samsung Health export + Health Connect',
    adds: 'Android-side full vitals with watch-and-ring fusion — day on the wrist, night on the finger.' },
  { key: 'pixel_watch', name: 'Google Pixel Watch 4', tier: 'AGGREGATOR',
    dataPath: 'Fitbit API path',
    adds: 'Android-native with a real API behind it — Fitbit\'s engine on Google\'s wrist.' },

  // ── LIVE BLE ──
  { key: 'muse_s_athena', name: 'Muse S Athena', tier: 'LIVE BLE',
    dataPath: 'Muse SDK — EEG, meditation, sleep onset',
    adds: 'The only brain signal in the stack — EEG for focus, meditation depth, and sleep onset. The crown.' },
  { key: 'wahoo_tickr', name: 'Wahoo TICKR', tier: 'LIVE BLE',
    dataPath: 'Open Bluetooth heart-rate broadcast',
    adds: 'A simple live heartbeat for the membrane — budget chest-strap truth.' },

  // ── SPECIES — extended sensory reach ──
  { key: 'garmin_alpha', name: 'Garmin Alpha 300 / T 20 Collar', tier: 'SPECIES',
    dataPath: 'Garmin export — GPS + activity',
    adds: 'Working-K9 location and load inside the same membrane as the handler — Spoke 27 in the field.' },
  { key: 'fitbark', name: 'FitBark 2 / GPS', tier: 'SPECIES',
    dataPath: 'FitBark public API',
    adds: 'Civilian dog activity, sleep, and health index — dual-baseline with the owner, the way the doctrine wrote it.' },
  { key: 'petpace', name: 'PetPace 2', tier: 'SPECIES',
    dataPath: 'Vet-grade API — K9/feline vitals',
    adds: 'Clinical-grade animal vitals — the collar your vet can actually read through the Spoke 32 handoff.' },
  { key: 'whistle', name: 'Whistle Health', tier: 'SPECIES',
    dataPath: 'App export',
    adds: 'The budget pet health entry — activity and licking/scratching pattern alerts.' },
  { key: 'equimetre', name: 'Equimetre (Arioneo)', tier: 'SPECIES',
    dataPath: 'Professional equine API',
    adds: 'Competition-grade horse telemetry — Spoke 28 at FEI level.' },
];

export function deviceAdds(nameOrKey: string): string | null {
  const n = nameOrKey.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const hit = DEVICE_CATALOG.find(d => d.key === n || d.name.toLowerCase() === nameOrKey.trim().toLowerCase());
  return hit ? hit.adds : null;
}

// ─── SLEEP AIDS · PASSIVE GEAR (founder law 2026-08-01) ──────────────────────
// A passive aid adds no signal — it adds a CONDITION the membrane can measure.
// The member's devices record the outcome; the aid is the experiment. Founder
// stack: Manta Sound 2 — "it has changed my life." No medical claims, ever:
// only the verified wellness claim that blocking light during sleep supports
// deeper, more restorative sleep.
export const SLEEP_AID_OPTIONS: string[] = [
  'Manta Sound 2',
  'Manta PRO',
  'Manta Weighted',
  'Nodpod Weighted',
  'Ostrichpillow Eye Mask',
  'Drowsy Silk',
  'Mavogel Cotton',
  'Slip Silk',
  'Other mask',
  'None',
];

export const SLEEP_AID_ADDS =
  'Adds no signal — adds a CONDITION. Your ring and strap already measure every night; the mask splits your own history into mask nights and bare nights, and the membrane shows you the difference with receipts. Blocking light during sleep is a verified support for deeper, more restorative sleep.';

export const ONBOARDING_DEVICE_OPTIONS: string[] = [
  'WHOOP 5.0', 'WHOOP MG', 'Oura Ring 4', 'Garmin Tactix 8', 'Garmin (other)',
  'Apple Watch', 'AirPods Pro 3', 'Beats Pro 2', 'Fitbit', 'Polar', 'Polar H10 Strap',
  'Samsung Watch / Ring', 'Pixel Watch 4', 'Withings', 'Ultrahuman Ring',
  'Dexcom Stelo (CGM)', 'Abbott Lingo (CGM)', 'Suunto', 'COROS', 'Amazfit / Helio',
  'Eight Sleep Pod', 'Muse S Athena', 'Strava', 'Dog Collar (Garmin/FitBark/PetPace)',
  'Equine (Equimetre)', 'None yet',
];
