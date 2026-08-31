// ─── lib/device-catalog.ts ───────────────────────────────────────────────────
// APPROVED DEVICES · 2026 — BYOH doctrine as data.
// Law: AA2 is hardware agnostic. Bring it if it gives you data that works
// with the AA2 membrane. Downloadable data required, even if limited.
// Stack determines depth, not access. The junk drawer is the onramp.
// In device selection the intelligence speaks each device's ADDS line —
// what THIS device contributes to the member's AA2 experience.
// Anti-duplicate rule (Helio precedent): never sell a member an organ their
// body already has.
//
// APPROVED-ONLY LAW (founder, 2026-08-18): onboarding device selection lists
// ONLY what is in this catalog. If it is not up here, it does not work.
// ONBOARDING_DEVICE_OPTIONS is generated FROM this catalog — one source of
// truth, so the screen can never drift from the doctrine.
//
// THE DOUBLE TIMESTAMP (founder law, 2026-08-18): every device in a member's
// stack carries TWO dates — `acquired`, the day the canon recorded it entering
// the stack, and `firstData`, the first day its downloadable record begins.
// One is the receipt of the instrument. The other is the receipt of the
// measurement. No competitor holds either, because no competitor was written
// down when the device showed up. Provenance is a baseline's chain of custody.
//
// LIVE DEVICES (`live: true`): the device streams a real-time signal the
// membrane can hear second-by-second, with no cloud between. This is the
// nerve, not the ledger.
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceTier =
  | 'PORT'            // the always-on carrier — every other signal lands through it
  | 'FULL API'        // cloud API — deepest membrane feed, automatic
  | 'FILE EXPORT'     // BYOB — bring the archive, the membrane eats it
  | 'AGGREGATOR'      // Apple Health / Health Connect — the phone is the port
  | 'LIVE BLE'        // real-time nerve, no cloud between
  | 'CONDITION'       // passive gear — adds no signal, adds a measurable condition
  | 'ENVIRONMENT +'   // reads THE ROOM, not the body — and delivers to an organ
  | 'LEGACY'          // the junk drawer — discontinued, still exportable
  | 'SPECIES';        // extended sensory reach — Spokes 27-29

/**
 * THE ORGAN AXIS — founder ruling 2026-08-19:
 *   "they are not sensors, they are ears — manta eyes/ears."
 *
 * The Body Doctrine classifies by ORGAN, not by data path. Scanner = Eyes.
 * Anything that puts sound into your head is an EAR whether or not it emits a
 * single byte. A mask that takes light away is an EYE. This axis is orthogonal
 * to `tier`: TIER says how data reaches the membrane, ORGAN says which part of
 * the body the device extends. Some devices are organs carrying no data at all
 * — they still belong on the map, because the body is the map.
 */
export type DeviceOrgan =
  | 'BRAIN' | 'EYES' | 'EARS' | 'EYES · EARS' | 'HEART'
  | 'SKIN' | 'BLOOD' | 'BODY' | 'THE PORT' | 'THE ROOM' | 'SPECIES';

export interface ApprovedDevice {
  key: string;          // normalized id stored in device_connections.hardware
  name: string;
  tier: DeviceTier;
  dataPath: string;     // how the data reaches the membrane
  adds: string;         // the intelligence's line in device selection
  flagship?: boolean;
  organ?: DeviceOrgan;   // which organ this device extends — Body Doctrine
  live?: boolean;       // streams a real-time signal the membrane can hear
  founderStack?: boolean;
  acquired?: string;    // canon receipt — the day it entered the stack
  firstData?: string;   // first day of downloadable record
  note?: string;        // honest limitation, spoken plainly, never hidden
}

export const DEVICE_CATALOG: ApprovedDevice[] = [
  // ── THE PORT ──────────────────────────────────────────────────────────────
  { key: 'z_fold', name: 'Samsung Z Fold · THE PORT', tier: 'PORT',
    founderStack: true, live: true,
    dataPath: 'Health Connect — the single port. Every device and app in the stack writes here; the membrane reads one pipe.',
    organ: 'THE PORT',
    adds: 'The carrier. Always on, always present — the one organ that never comes off. Health Connect structurally refuses vendor verdicts: it holds raw signal only, so no company\'s score can ride in through the pipe.' },

  // ── FLAGSHIP ──────────────────────────────────────────────────────────────
  { key: 'whoop_5_0', name: 'WHOOP 5.0', tier: 'FULL API', flagship: true,
    dataPath: 'WHOOP developer API + webhooks — recovery, sleep, strain pushed to the membrane automatically',
    adds: 'The recovery engine. Your daily readiness verdict, pushed to the membrane the moment it lands — no phone ritual. Screenless: AA2 gets you out of your phone, and so does this.' },
  { key: 'whoop_mg', name: 'WHOOP MG', tier: 'FULL API', flagship: true,
    founderStack: true, live: true, acquired: '2026-08-07',
    dataPath: 'WHOOP developer API + webhooks; open Bluetooth heart-rate broadcast verified',
    organ: 'HEART',
    adds: 'Everything WHOOP 5.0 adds, plus FDA-cleared ECG and blood-pressure insights — medical-grade signals in a screenless strap. Broadcasts a live heartbeat the membrane hears directly.' },

  // ── FULL API ──────────────────────────────────────────────────────────────
  { key: 'oura_ring_4', name: 'Oura Ring 4', tier: 'FULL API',
    founderStack: true, firstData: '2026-01',
    dataPath: 'Oura cloud API v2 — personal token, nightly automatic pull (wired in-app)',
    organ: 'HEART',
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
  { key: 'withings', name: 'Withings ScanWatch 3 / Body / BPM', tier: 'FULL API',
    dataPath: 'Withings public API — watch, scale, cuff, sleep mat',
    adds: 'Vitals no wrist carries: blood pressure, body composition, bed-sensed sleep. The membrane\'s clinical corner.' },
  { key: 'ultrahuman_ring', name: 'Ultrahuman Ring Air', tier: 'FULL API',
    dataPath: 'Ultrahuman partner API + export',
    adds: 'A metabolic-focused ring — sleep, HRV, and stimulant-timing windows for members chasing metabolic precision.' },
  { key: 'strava', name: 'Strava', tier: 'FULL API',
    founderStack: true, acquired: '2015',
    dataPath: 'Strava API + activities.csv export (wired in-app)',
    adds: 'The activity river. Whatever device records the workout, Strava funnels it into one stream the membrane can read — and it carries your whole archive, however many years deep it runs.' },

  // ── FILE EXPORT ───────────────────────────────────────────────────────────
  { key: 'garmin_tactix_8', name: 'Garmin Tactix 8', tier: 'FILE EXPORT',
    founderStack: true, live: true, firstData: '2026-01', acquired: '2025-12-29',
    dataPath: 'Garmin Connect export JSON/FIT (wired in-app) + open BLE heart-rate broadcast',
    organ: 'HEART',
    adds: 'Field-grade everything — sleep, stress, HRV, Body Battery, on-demand ECG with AFib detection, pulse ox in three modes — plus an open live pulse the membrane hears directly. The tactical wrist.',
    note: 'Elevate Gen 5 platform. ECG confirmed on-device — never pitch a member ECG hardware when this is already on the wrist. THE THIRD THERMOMETER, RECEIPTED 2026-08-24: the on-watch temperature widget reads the WATCH CASE, not the body and not the room — a hybrid smeared between radiating wrist and ambient air (founder read 78°F on-wrist and asked the right question). Its engineering purpose is BAROMETER CALIBRATION — pressure drifts with temperature, so the case sensor keeps altitude and pressure honest (accurate as a thermometer only submerged, or off-wrist ~20 min). PROVENANCE LAW: this channel must never enter the membrane as body temp or room temp. Ozlo case = ROOM. WHOOP = SKIN. GW1 = CASE (blend). Three thermometers, three different truths — and the blend is a cross-check: it should land between the other two; when it does not, suspect a loose strap or off-wrist. Receipt: Garmin support FAQ + forums, DC Rainmaker 2023-12. BONUS RECEIPT: the sensor exists because the Tactix carries a BAROMETER — from 2026-08-24 the stack holds TWO pressure instruments (GW1 + Ozlo case), and pressure can be cross-checked instrument-against-instrument.' },
  { key: 'garmin', name: 'Garmin (Fenix 8 · Venu 4 · Forerunner · Instinct 3)', tier: 'FILE EXPORT',
    live: true,
    dataPath: 'Garmin Connect export JSON/FIT (wired in-app) + open BLE heart-rate broadcast',
    adds: 'The Garmin engine at every price point — deep daily wellness data by export, live heart rate by broadcast.' },
  { key: 'garmin_index_bpm', name: 'Garmin Index BPM', tier: 'FILE EXPORT',
    founderStack: true, acquired: '2026-08-04',
    dataPath: 'Garmin Connect — FDA-cleared oscillometric cuff, Wi-Fi standalone, exportable PDF for a physician',
    organ: 'BLOOD',
    adds: 'True blood pressure — the one vital no wrist on earth measures. Every optical estimate in your stack gets judged against this at a matched timestamp, which is the only honest way to answer the sensor-accuracy question on your own skin.' },
  { key: 'suunto', name: 'Suunto Race 2', tier: 'FILE EXPORT',
    dataPath: 'Suunto export + partner API',
    adds: 'Endurance depth for the long-route members — training load the membrane folds into recovery.' },
  { key: 'coros', name: 'COROS Pace Pro / Apex 2', tier: 'FILE EXPORT',
    dataPath: 'FIT export + Training Hub CSV',
    adds: 'The runner\'s engine — efficient, long-battery training data by export.' },
  { key: 'amazfit', name: 'Amazfit (Helio Ring · Helio Strap · T-Rex 3)', tier: 'FILE EXPORT',
    live: true,
    dataPath: 'Zepp GDPR export only — no public API; open live BLE broadcast on strap',
    adds: 'A budget onramp with an open live pulse. Bring what you have.',
    note: 'Depth is limited — its computed scores stay locked inside Zepp. Accepted per doctrine, stated plainly up front.' },
  { key: 'eight_sleep', name: 'Eight Sleep Pod 5', tier: 'FILE EXPORT',
    dataPath: 'In-app metrics, limited export',
    adds: 'Sleep temperature and bed-sensed HRV with nothing worn at all — the bedroom becomes a sensor.' },

  // ── AGGREGATOR ────────────────────────────────────────────────────────────
  { key: 'apple_watch', name: 'Apple Watch Series 12 / Ultra 3', tier: 'AGGREGATOR',
    dataPath: 'Apple Health export.xml (BYOB, supported) + HealthKit',
    adds: 'Full vitals, ECG, sleep-apnea detection — the largest health dataset most members already own.' },
  { key: 'airpods_pro_3', name: 'AirPods Pro 3', tier: 'AGGREGATOR',
    dataPath: 'In-ear heart rate during workouts → Apple Health',
    organ: 'EARS',
    adds: 'Heart rate from the earbuds you already wear — zero new hardware, one more signal.' },
  { key: 'beats_pro_2', name: 'Beats Pro 2', tier: 'AGGREGATOR',
    founderStack: true,
    dataPath: 'In-ear heart rate → Apple Health / Health Connect',
    organ: 'EARS',
    adds: 'Workout heart rate from the ears — and the ASRT audio channel: training the body and the subconscious on the same device.' },
  { key: 'oakley_meta', name: 'Meta Oakley HSTN · THE EYES', tier: 'AGGREGATOR',
    founderStack: true,
    dataPath: 'Meta AI app → Health Connect; on-board camera, microphone, open-ear audio',
    organ: 'EYES',
    adds: 'The eyes. Hands-free scanning, live camera for the safety path, and the Equalizer looking at what you are looking at — the one device that sees the world instead of the wrist.' },

  { key: 'samsung', name: 'Samsung Galaxy Watch 8 / Galaxy Ring 2', tier: 'AGGREGATOR',
    dataPath: 'Samsung Health export + Health Connect',
    adds: 'Android-side full vitals with watch-and-ring fusion — day on the wrist, night on the finger.' },
  { key: 'pixel_watch', name: 'Google Pixel Watch 4', tier: 'AGGREGATOR',
    dataPath: 'Fitbit API path',
    adds: 'Android-native with a real API behind it — Fitbit\'s engine on Google\'s wrist.' },

  // ── LIVE BLE — the nerve ──────────────────────────────────────────────────
  { key: 'muse_s_athena', name: 'Muse S Athena · THE CROWN', tier: 'LIVE BLE',
    founderStack: true, live: true, flagship: true, acquired: '2026-08-10',
    dataPath: 'Muse SDK — LIVE stream: up to eight EEG channels, fNIRS optodes, PPG, six-axis motion. Mindfulness + sleep to Health Connect.',
    organ: 'BRAIN',
    adds: 'The crown. The only instrument in the stack that MEASURES instead of infers — delta, theta, alpha, beta, gamma read directly off the skull, plus prefrontal blood flow read directly. Every other device estimates your state from your pulse. This one reads the organ that produces it.',
    note: 'LIVE DEVICE. Streams second-by-second while worn — the Live Clarifier reads the brain at the moment a thing happens instead of asking about it later. Its own app consumes a fraction of what the band broadcasts; the membrane catches the rest.' },
  { key: 'polar_h10', name: 'Polar H10 Strap', tier: 'LIVE BLE', live: true,
    dataPath: 'Open Bluetooth heart-rate broadcast + Polar API',
    adds: 'The reference heartbeat. Chest-strap HRV accuracy every other device is judged against — and a live wire straight into the membrane.' },
  { key: 'polar_verity', name: 'Polar Verity Sense', tier: 'LIVE BLE', live: true,
    dataPath: 'Open Bluetooth heart-rate broadcast',
    adds: 'An armband live pulse — optical accuracy at the upper arm, where the signal is cleanest.' },
  { key: 'wahoo_tickr', name: 'Wahoo TICKR', tier: 'LIVE BLE', live: true,
    dataPath: 'Open Bluetooth heart-rate broadcast',
    adds: 'A simple live heartbeat for the membrane — budget chest-strap truth.' },

  // ── CONDITION — passive gear, no signal, a measurable variable ─────────────
  { key: 'manta_sound', name: 'Manta Sound Sleep Mask', tier: 'CONDITION',
    founderStack: true,
    dataPath: 'No data of its own — the member\'s existing devices record the outcome',
    organ: 'EYES · EARS',
    adds: 'Adds no signal. Adds a CONDITION. Your ring and strap already measure every night; the mask splits your own history into mask nights and bare nights and the membrane shows you the difference with receipts. Its head strap also seats a crown that was never given a replacement band.' },

  // ── ENVIRONMENT + — the first thing in the catalog that measures the ROOM ──
  // Founder class, named 2026-08-19. Everything else in this catalog reads the
  // body. Nothing read the space the body is lying in. The "+" is the founder's:
  // the buds are also a SECOND DELIVERY SURFACE — sound sealed in the canal
  // instead of played off a mask — which makes the same track testable two ways
  // against one brain. That comparison needs the Crown, the buds and the mask
  // on one head, and nobody else has that table.
  { key: 'ozlo_sleepbuds', name: 'Ozlo Sleepbuds + Mask · ENVIRONMENT +', tier: 'ENVIRONMENT +',
    organ: 'EYES · EARS',
    dataPath: 'MANUFACTURER RECEIPT — Ozlo Sleepbuds 2 User Guide, filed to AA2 DOCS/MANUALS 2026-08-21. Smart Case carries a TEMPERATURE, LIGHT AND NOISE SENSOR — the guide names three room channels and no others. Bluetooth to the phone, Bluetooth Low Energy to the buds: the case is the radio. Case button plays and pauses a Sleep Sound and snoozes the alarm with the phone untouched. Four sizes of SILICONE tip. A case reset "deletes all sleep and usage data," so the case does hold sleep data, and the status light shows a distinct FIRMWARE & DATA TRANSFER state — but no export path or public API is documented.',
    adds: 'Ears you can lie down on, and a second pair of eyes. The Crown reads your brain and has no speakers of its own — these are the only audio in the stack you can sleep or meditate in while a headband is already on your head. The bundled mask makes it a COMPLETE SECOND BLACKOUT SYSTEM, lighter than the Manta, for sessions where the Manta is too much hardware to stack. And the case adds the room itself: noise, light and temperature — the one exposure layer nothing else in your stack can see.',
    note: 'TWO BLACKOUT SYSTEMS, NOT ONE. Manta is the deep blackout for sleep sessions. Ozlo mask + buds is the lighter rig that coexists with the Crown — Manta plus a headband is two things wrapped around the head, which is the whole reason this exists. ENVIRONMENT + is measured, not ingested: no export path found, so it stands as a CONDITION device under the sleep-aid law until one exists. The case listens to the ROOM, so on Manta nights it will hear the Manta and log your own sleep aid as ambient noise — bud nights are the clean arm. TWO CORRECTIONS, BOTH LOGGED, NEITHER ERASED. 2026-08-21: this entry\'s barometric pressure claim was struck because the user guide names only temperature, light and noise. 2026-08-22: THAT CORRECTION WAS ITSELF WRONG — the vendor\'s own product page states the case tracks sound, light, temperature AND BAROMETRIC PRESSURE, and reviewers chart the app\'s pressure graph on camera. The guide also omits the light sensor everyone can watch working, which is proof of an incomplete document, not absent hardware. ONE DOCUMENT IS NOT THE RECEIPT. ENVIRONMENT + stands on FOUR measured channels — sound, light, temperature, pressure — and pressure is the one channel no body-worn instrument reads: weather fronts crossing a night. Final receipt lands 2026-08-24 with the founder\'s own case. LID-CLOSED LAW, RECEIPTED 2026-08-24 from vendor support copy: the case\'s environmental sensors — room temperature, light, noise — FUNCTION NORMALLY WITH THE LID COMPLETELY CLOSED on the nightstand, and closed is the RECOMMENDED posture: buds stay docked and charging, indicator lights stay sealed away from the sleeper. The Room is measured all night by an instrument that emits nothing into the room it measures.' },

  // ── LEGACY — the junk drawer is the onramp ────────────────────────────────
  // Discontinued or older-generation hardware. The device does not have to be
  // worn again. The RECORD is the asset: an account nobody has opened in four
  // years still holds a baseline the member already paid for and never read.
  { key: 'fitbit_legacy', name: 'Fitbit (older: Charge 2–5 · Versa · Ionic · Alta · Blaze)', tier: 'LEGACY',
    dataPath: 'Fitbit account export (full archive, works regardless of whether the device still powers on)',
    adds: 'Years of resting heart rate, steps, and sleep sitting in an account you stopped opening. The band can be dead in a drawer — the record still starts your baseline years before today.' },
  { key: 'garmin_legacy', name: 'Garmin (older: Vívosmart · Vívoactive 3/4 · Forerunner 235/245 · Fenix 5/6)', tier: 'LEGACY',
    dataPath: 'Garmin Connect full account export (JSON/FIT)',
    adds: 'Garmin never deletes your history. Whatever you wore in 2019 is still exportable — bring it and the membrane wakes up already knowing your old normal.' },
  { key: 'apple_watch_legacy', name: 'Apple Watch (older: Series 3–9 · SE)', tier: 'LEGACY',
    dataPath: 'Apple Health export.xml — the whole archive, all devices you ever paired',
    adds: 'One export file carries every watch you have ever owned. The membrane reads them as one continuous life, not four separate gadgets.' },
  { key: 'samsung_legacy', name: 'Samsung (older: Gear · Galaxy Watch 3–6 · Galaxy Fit)', tier: 'LEGACY',
    dataPath: 'Samsung Health export + Health Connect',
    adds: 'The Android drawer. Old Gear and Galaxy history exports the same as the new ones — the years count even if the watch does not turn on.' },
  { key: 'oura_legacy', name: 'Oura Ring Gen 2 / Gen 3', tier: 'LEGACY',
    dataPath: 'Oura API v2 + account export — same account, same history',
    adds: 'Gen 2 and Gen 3 nights live in the same account as Gen 4. Upgrading never cost you your baseline — most members do not know that.' },
  { key: 'polar_legacy', name: 'Polar (older: M400 · V800 · Vantage V/M · H7 strap)', tier: 'LEGACY',
    dataPath: 'Polar Flow GDPR export',
    adds: 'Polar Flow holds a decade for some members. Old training files still carry real HRV — some of the cleanest data in any drawer.' },
  { key: 'withings_legacy', name: 'Withings / Nokia (older: Steel HR · Go · Body scales)', tier: 'LEGACY',
    dataPath: 'Withings account export — survives the Nokia era rename',
    adds: 'Weight and body-composition history going back further than most people remember signing up for. Trend is the whole point, and you already have it.' },
  { key: 'misc_legacy', name: 'Other older tracker (Jawbone · Misfit · Amazfit · Huawei · Xiaomi)', tier: 'LEGACY',
    dataPath: 'Whatever export the vendor still offers — CSV, JSON, GDPR archive',
    adds: 'If it still exports, it still counts. Bring the file and the membrane will tell you honestly what it can and cannot read out of it.',
    note: 'Some dead-vendor accounts no longer export. If the file will not come out, the answer is a straight no — never a maybe.' },

  // ── SPECIES — extended sensory reach ──────────────────────────────────────
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

// ─── LOOKUPS ─────────────────────────────────────────────────────────────────

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function findDevice(nameOrKey: string): ApprovedDevice | null {
  const n = normKey(nameOrKey);
  const lower = nameOrKey.trim().toLowerCase();
  return (
    DEVICE_CATALOG.find(d => d.key === n || d.name.toLowerCase() === lower) ?? null
  );
}

export function deviceAdds(nameOrKey: string): string | null {
  return findDevice(nameOrKey)?.adds ?? null;
}

/** APPROVED-ONLY LAW: anything not in this catalog is not selectable. */
export function isApproved(nameOrKey: string): boolean {
  return findDevice(nameOrKey) !== null;
}

// ─── CANON STORAGE LAW (2026-08-31) ──────────────────────────────────────────
// device_connections.hardware stores KEYS. Never display names. A name and a
// key never compare equal, so a name-stored device rendered TWICE on the stack
// — once as its own row, once as an unrecognised "extra" — and its readings
// resolved to no device at all, which is what put AWAITING SIGNAL on a live
// wire. The name is the label. The key is the record. One of them is stored.

/**
 * The canonical stored id for one device. Display names, alternate spellings
 * and keys all resolve to the same key. Anything outside the catalog has no
 * key to resolve to and is stored as typed, so a member's own write-in still
 * reads back as itself on the stack.
 */
export function deviceKey(nameOrKey: string): string {
  return findDevice(nameOrKey)?.key ?? String(nameOrKey).trim();
}

/** A whole hardware array canonicalized — legacy name rows collapse onto the
 *  key they were always meant to be, duplicates included. */
export function canonHardware(list: string[]): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const k = deviceKey(raw);
    if (k && !out.includes(k)) out.push(k);
  }
  return out;
}

/** LIVE devices stream a real-time signal the membrane can hear second-by-second. */
export function isLive(nameOrKey: string): boolean {
  return findDevice(nameOrKey)?.live === true;
}

export const LIVE_DEVICES: ApprovedDevice[] = DEVICE_CATALOG.filter(d => d.live);

export const DEVICES_BY_TIER: Record<DeviceTier, ApprovedDevice[]> = {
  'PORT':        DEVICE_CATALOG.filter(d => d.tier === 'PORT'),
  'FULL API':    DEVICE_CATALOG.filter(d => d.tier === 'FULL API'),
  'FILE EXPORT': DEVICE_CATALOG.filter(d => d.tier === 'FILE EXPORT'),
  'AGGREGATOR':  DEVICE_CATALOG.filter(d => d.tier === 'AGGREGATOR'),
  'LIVE BLE':    DEVICE_CATALOG.filter(d => d.tier === 'LIVE BLE'),
  'CONDITION':   DEVICE_CATALOG.filter(d => d.tier === 'CONDITION'),
  'ENVIRONMENT +': DEVICE_CATALOG.filter(d => d.tier === 'ENVIRONMENT +'),
  'LEGACY':      DEVICE_CATALOG.filter(d => d.tier === 'LEGACY'),
  'SPECIES':     DEVICE_CATALOG.filter(d => d.tier === 'SPECIES'),
};

/** What each tier means, spoken in the member's language on the selection screen. */
export const TIER_BLURB: Record<DeviceTier, string> = {
  'PORT':        'Always on. Everything else lands through it.',
  'FULL API':    'Connects once and feeds itself. Nothing to remember.',
  'FILE EXPORT': 'You bring the file. The membrane eats the whole archive.',
  'AGGREGATOR':  'Already on your phone. One export carries all of it.',
  'LIVE BLE':    'A live wire. The membrane hears this one second by second.',
  'CONDITION':   'Adds no signal — adds a condition your devices can measure.',
  'ENVIRONMENT +': 'Reads the room you are lying in — and gives you ears you can lie down on.',
  'LEGACY':      'The junk drawer. It does not have to still work. The record counts.',
  'SPECIES':     'Past the skin — the dog, the horse, the herd.',
};

// ─── THE DOUBLE TIMESTAMP ────────────────────────────────────────────────────
// Founder law 2026-08-18. Every device carries two receipts: the day the canon
// recorded it entering the stack, and the day its downloadable record begins.
// When the two disagree, the EARLIER one is the true start of the baseline —
// data can predate the doctrine, and usually does.

export interface DeviceProvenance {
  key: string;
  acquired: string | null;   // canon receipt
  firstData: string | null;  // first exportable record
  baselineStart: string | null;
  spread: boolean;           // true when the two dates disagree
}

export function provenance(nameOrKey: string): DeviceProvenance | null {
  const d = findDevice(nameOrKey);
  if (!d) return null;
  const acquired = d.acquired ?? null;
  const firstData = d.firstData ?? null;
  const both = [acquired, firstData].filter(Boolean) as string[];
  const baselineStart = both.length ? both.slice().sort()[0] : null;
  return {
    key: d.key,
    acquired,
    firstData,
    baselineStart,
    spread: Boolean(acquired && firstData && acquired !== firstData),
  };
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

// ─── ONBOARDING SELECTION ────────────────────────────────────────────────────
// APPROVED-ONLY LAW: generated FROM the catalog so the screen can never drift
// from the doctrine. If it is not in DEVICE_CATALOG, it is not on the screen.
export const ONBOARDING_DEVICE_OPTIONS: string[] = [
  ...DEVICE_CATALOG.filter(d => d.tier !== 'CONDITION').map(d => d.name),
  'None yet',
];

/** Grouped for the selection screen — tier header, then its devices. */
export const ONBOARDING_DEVICE_GROUPS: { tier: DeviceTier; blurb: string; devices: ApprovedDevice[] }[] =
  (['PORT', 'FULL API', 'LIVE BLE', 'FILE EXPORT', 'AGGREGATOR', 'ENVIRONMENT +', 'LEGACY', 'SPECIES'] as DeviceTier[])
    .map(t => ({ tier: t, blurb: TIER_BLURB[t], devices: DEVICES_BY_TIER[t] }))
    .filter(g => g.devices.length > 0);

/** The line shown under the whole list. */
export const APPROVED_ONLY_LINE =
  'These are the devices the membrane can actually read. If it is not on this list, it does not work here — and we would rather tell you now than sell you a maybe. Old and discontinued gear counts: it does not have to still turn on, the record is what matters.';
