// ─── lib/cannabis-layer.ts ────────────────────────────────────────────────────
// AA2 Cannabis Data Layer · Country/sub-jurisdiction legality engine
// v50 · Mockup-locked against panel #11 (Cannabis Data Layer)
//
// Architectural locks:
//   1. Country-agnostic. Country instance resolves at runtime per memory #30.
//      Panama is launch/lab — Montana is the live field test bed.
//   2. Sub-jurisdiction granularity. Some Montana counties opted out of
//      recreational sales; tribal land has its own rules.
//   3. Commander Layer integration: WADA flags any cannabis recommendation
//      regardless of local legality. THC is WADA-prohibited in-competition.
//   4. Border proximity warning is core doctrine. Legality stops at the
//      border — federal trafficking penalties apply regardless of destination.
//
// Live test bed: Montana (recreational legal since 2022).

export type CannabisLegalStatus =
  | 'RECREATIONAL_LEGAL'
  | 'MEDICAL_ONLY'
  | 'CBD_ONLY'
  | 'DECRIMINALIZED'
  | 'ILLEGAL'
  | 'STATE_VARIATION';

export type VenueType =
  | 'dispensary'
  | 'lounge'
  | 'cannabis_friendly_stay'
  | 'delivery';

export interface DispensaryRecord {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  hoursLine: string;
  recreational: boolean;
  medical: boolean;
  delivery: boolean;
  notes?: string;
}

export interface SubJurisdictionRule {
  name: string;
  status: CannabisLegalStatus;
  note: string;
}

export interface BorderWarning {
  borderName: string;
  destinationStatus: string;
  note: string;
}

export interface CountryCannabisProfile {
  countryCode: string;
  countryName: string;
  topLevelStatus: CannabisLegalStatus;
  personalLimitGrams: number | null;
  homeGrowAllowed: boolean | null;
  homeGrowLimit: number | null;
  ageMinimum: number | null;
  publicConsumption: 'allowed' | 'lounges_only' | 'illegal';
  subJurisdictions: SubJurisdictionRule[];
  borderWarnings: BorderWarning[];
  dispensaryCount: number;
  loungeCount: number;
  rulesOfTheRoad: string[];
}

export const COMMANDER_LAYER_CANNABIS_FLAG =
  'THC is WADA-prohibited in-competition. AA2 recommends avoiding all cannabis products during this trip given filter status. CBD with verified 0% THC may be permitted — verify chain-of-custody.';

// ─── MONTANA · LIVE TEST BED ──────────────────────────────────────────────────
// Recreational legal since January 1, 2022 (I-190 ballot initiative passed
// November 2020). Adult-use 21+. Personal possession limit 1 oz (28g).
// Home grow: up to 4 plants, 4 seedlings, in a locked enclosed space, for
// adults 21+.
//
// Sub-jurisdiction reality: Montana law lets counties opt out of recreational
// sales (medical sales remain). Counties that voted AGAINST I-190 in 2020 had
// the option to ban recreational dispensaries. The list below tracks the
// major opt-out and active-sales jurisdictions as of the v50 lock date.
//
// Tribal land: Federal law applies on tribal land regardless of state law.
// The Confederated Salish and Kootenai Tribes (Flathead Reservation), Crow
// Reservation, Northern Cheyenne, Fort Peck, Fort Belknap, Blackfeet, and
// Rocky Boy's Reservations each have their own rules. Generally treat tribal
// land as federal jurisdiction = cannabis illegal unless explicitly stated.

const MONTANA_OPT_OUT_COUNTIES: SubJurisdictionRule[] = [
  {
    name: 'Carbon County',
    status: 'MEDICAL_ONLY',
    note: 'Voted against I-190 in 2020. Recreational sales banned. Medical patients with valid card may still purchase from approved providers.',
  },
  {
    name: 'Big Horn County',
    status: 'MEDICAL_ONLY',
    note: 'Recreational sales prohibited. Tribal land overlap (Crow Reservation) — federal jurisdiction applies on reservation.',
  },
  {
    name: 'Rosebud County',
    status: 'MEDICAL_ONLY',
    note: 'Recreational sales banned. Tribal land overlap (Northern Cheyenne).',
  },
  {
    name: 'Garfield County',
    status: 'MEDICAL_ONLY',
    note: 'Recreational sales prohibited.',
  },
  {
    name: 'McCone County',
    status: 'MEDICAL_ONLY',
    note: 'Recreational sales prohibited.',
  },
];

const MONTANA_ACTIVE_COUNTIES: SubJurisdictionRule[] = [
  {
    name: 'Gallatin County (Bozeman)',
    status: 'RECREATIONAL_LEGAL',
    note: 'Active recreational and medical sales. Multiple dispensaries.',
  },
  {
    name: 'Yellowstone County (Billings)',
    status: 'RECREATIONAL_LEGAL',
    note: 'Active recreational and medical sales. Highest dispensary density in the state.',
  },
  {
    name: 'Missoula County',
    status: 'RECREATIONAL_LEGAL',
    note: 'Active recreational and medical sales.',
  },
  {
    name: 'Lewis & Clark County (Helena)',
    status: 'RECREATIONAL_LEGAL',
    note: 'Active recreational and medical sales. State capitol.',
  },
  {
    name: 'Cascade County (Great Falls)',
    status: 'RECREATIONAL_LEGAL',
    note: 'Active recreational and medical sales.',
  },
  {
    name: 'Flathead County (Kalispell)',
    status: 'RECREATIONAL_LEGAL',
    note: 'Active recreational and medical sales. Adjacent to Flathead Reservation — tribal land applies different rules.',
  },
];

const MONTANA_TRIBAL_NOTES: SubJurisdictionRule[] = [
  {
    name: 'Flathead Reservation (CSKT)',
    status: 'STATE_VARIATION',
    note: 'Federal jurisdiction. State legality does NOT extend onto reservation. Confirm tribal council position before any possession on reservation land.',
  },
  {
    name: 'Crow Reservation',
    status: 'ILLEGAL',
    note: 'Federal jurisdiction. Cannabis prohibited.',
  },
  {
    name: 'Northern Cheyenne Reservation',
    status: 'ILLEGAL',
    note: 'Federal jurisdiction. Cannabis prohibited.',
  },
  {
    name: 'Blackfeet Reservation',
    status: 'STATE_VARIATION',
    note: 'Federal jurisdiction. Tribe has discussed regulated cannabis program — verify current status before travel.',
  },
];

const MONTANA_BORDER_WARNINGS: BorderWarning[] = [
  {
    borderName: 'Wyoming (south)',
    destinationStatus: 'ILLEGAL — recreational and medical both prohibited',
    note: 'Wyoming has not legalized cannabis. Possession of any amount is a misdemeanor; over 3 oz is felony. Do NOT cross with cannabis purchased in Montana.',
  },
  {
    borderName: 'North Dakota (east)',
    destinationStatus: 'MEDICAL_ONLY — recreational rejected at ballot',
    note: 'Recreational use illegal. Medical program exists but does not honor out-of-state cards. Do NOT cross with cannabis.',
  },
  {
    borderName: 'South Dakota (southeast)',
    destinationStatus: 'MEDICAL_ONLY',
    note: 'Recreational use illegal. Medical program exists. Do NOT cross with cannabis.',
  },
  {
    borderName: 'Idaho (west)',
    destinationStatus: 'ILLEGAL — strict enforcement',
    note: 'Idaho has zero-tolerance cannabis enforcement. Any amount is criminal. Idaho State Patrol actively monitors I-90 and US-12 from Montana border.',
  },
  {
    borderName: 'Canada (north)',
    destinationStatus: 'FEDERAL OFFENSE TO CROSS',
    note: 'Cannabis legal in Canada AND legal in Montana — but crossing the border with cannabis in either direction is a federal trafficking offense. Lifetime ban risk for non-citizens. Do NOT cross with any cannabis product.',
  },
];

export const MONTANA_CANNABIS_PROFILE: CountryCannabisProfile = {
  countryCode: 'US-MT',
  countryName: 'Montana, USA',
  topLevelStatus: 'RECREATIONAL_LEGAL',
  personalLimitGrams: 28,
  homeGrowAllowed: true,
  homeGrowLimit: 4,
  ageMinimum: 21,
  publicConsumption: 'illegal',
  subJurisdictions: [
    ...MONTANA_ACTIVE_COUNTIES,
    ...MONTANA_OPT_OUT_COUNTIES,
    ...MONTANA_TRIBAL_NOTES,
  ],
  borderWarnings: MONTANA_BORDER_WARNINGS,
  dispensaryCount: 0, // filled by getMontanaDispensaries() at runtime
  loungeCount: 0,
  rulesOfTheRoad: [
    'Adult use 21+. Valid government-issued ID required at every purchase.',
    'Personal possession limit: 1 oz (28g) flower, 8g concentrate, or 800mg edibles.',
    'Home grow: up to 4 mature plants + 4 seedlings per adult, max 8 plants per household. Locked enclosed space. Not visible from public space.',
    'Public consumption is ILLEGAL. Smoking/vaping in cars is illegal — driver AND passenger.',
    'No on-site consumption at dispensaries. Montana does not currently license cannabis lounges.',
    'Driving under the influence: 5 ng/mL THC blood limit. Open container laws apply to cannabis.',
    'Federal land (national parks, national forests, tribal reservations): cannabis prohibited regardless of state law. Glacier and Yellowstone are federal — no cannabis allowed.',
    'Employers may still drug-test and terminate for cannabis use even when use was off-duty and legal.',
  ],
};

// ─── MONTANA DISPENSARIES (curated sample for v50 demo) ──────────────────────
// Note: This is a representative sample for the v50 build, not exhaustive.
// Production deployment should pull live data from Montana Cannabis Control
// Division licensed retailer registry.

export const MONTANA_DISPENSARIES: DispensaryRecord[] = [
  {
    id: 'mt-bzn-001',
    name: 'Bloom Montana',
    city: 'Bozeman',
    region: 'Gallatin County',
    address: '2825 W Main St, Bozeman, MT 59718',
    hoursLine: 'Mon-Sun · 9 AM - 10 PM',
    recreational: true,
    medical: true,
    delivery: false,
  },
  {
    id: 'mt-bzn-002',
    name: 'Cookies Bozeman',
    city: 'Bozeman',
    region: 'Gallatin County',
    address: '1716 W Main St, Bozeman, MT 59715',
    hoursLine: 'Mon-Sun · 8 AM - 10 PM',
    recreational: true,
    medical: true,
    delivery: false,
  },
  {
    id: 'mt-bil-001',
    name: 'Montana Advanced Caregivers',
    city: 'Billings',
    region: 'Yellowstone County',
    address: '3434 1st Ave N, Billings, MT 59101',
    hoursLine: 'Mon-Sat · 10 AM - 9 PM',
    recreational: true,
    medical: true,
    delivery: false,
  },
  {
    id: 'mt-mso-001',
    name: 'Top Shelf Cannabis',
    city: 'Missoula',
    region: 'Missoula County',
    address: '2350 S Reserve St, Missoula, MT 59801',
    hoursLine: 'Mon-Sun · 9 AM - 10 PM',
    recreational: true,
    medical: true,
    delivery: true,
    notes: 'Delivery available within Missoula city limits.',
  },
  {
    id: 'mt-hln-001',
    name: 'Helena Cannabis Co.',
    city: 'Helena',
    region: 'Lewis & Clark County',
    address: '1925 N Main St, Helena, MT 59601',
    hoursLine: 'Mon-Sun · 10 AM - 9 PM',
    recreational: true,
    medical: true,
    delivery: false,
  },
  {
    id: 'mt-gtf-001',
    name: 'Great Falls Green Co.',
    city: 'Great Falls',
    region: 'Cascade County',
    address: '1701 10th Ave S, Great Falls, MT 59405',
    hoursLine: 'Mon-Sat · 10 AM - 8 PM',
    recreational: true,
    medical: true,
    delivery: false,
  },
];

// ─── LOOKUP FUNCTIONS ────────────────────────────────────────────────────────

export function getCannabisProfile(
  countryCode: string,
): CountryCannabisProfile | null {
  if (countryCode === 'US-MT') {
    return {
      ...MONTANA_CANNABIS_PROFILE,
      dispensaryCount: MONTANA_DISPENSARIES.length,
    };
  }
  return null;
}

export function getDispensariesByCity(city: string): DispensaryRecord[] {
  const target = city.toLowerCase().trim();
  return MONTANA_DISPENSARIES.filter(
    (d) => d.city.toLowerCase() === target,
  );
}

export function getDispensariesByRegion(region: string): DispensaryRecord[] {
  const target = region.toLowerCase().trim();
  return MONTANA_DISPENSARIES.filter((d) =>
    d.region.toLowerCase().includes(target),
  );
}

export function getCountyStatus(
  profile: CountryCannabisProfile,
  countyName: string,
): SubJurisdictionRule | null {
  const target = countyName.toLowerCase().trim();
  return (
    profile.subJurisdictions.find((s) =>
      s.name.toLowerCase().includes(target),
    ) ?? null
  );
}

export function getBorderWarnings(
  profile: CountryCannabisProfile,
): BorderWarning[] {
  return profile.borderWarnings;
}

export interface CannabisLayerSummary {
  countryName: string;
  topLevelStatus: CannabisLegalStatus;
  rulesOfTheRoad: string[];
  borderWarnings: BorderWarning[];
  dispensaryCount: number;
  commanderFlagActive: boolean;
  commanderMessage: string | null;
}

export function buildCannabisLayerSummary(
  countryCode: string,
  hasWadaFilter: boolean,
): CannabisLayerSummary | null {
  const profile = getCannabisProfile(countryCode);
  if (!profile) return null;
  return {
    countryName: profile.countryName,
    topLevelStatus: profile.topLevelStatus,
    rulesOfTheRoad: profile.rulesOfTheRoad,
    borderWarnings: profile.borderWarnings,
    dispensaryCount: profile.dispensaryCount,
    commanderFlagActive: hasWadaFilter,
    commanderMessage: hasWadaFilter ? COMMANDER_LAYER_CANNABIS_FLAG : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// JURISDICTION LADDER — town · parish · county · city · state · country
// The chain locked 2026-07-29: after Aficionado finds the dispensary, the
// Chauffeur routes it safe, the dossier carries it, and the Equalizer refuses
// the seal if ANY leg of the route crosses into a jurisdiction where the
// cargo goes illegal. Resolution runs at EVERY waypoint — not just the
// destination. A legal purchase in Bozeman becomes a felony at the wrong
// county line or the moment the route touches federal land.
// ─────────────────────────────────────────────────────────────────────────────

export type JurisdictionLevel =
  | 'town'
  | 'parish'     // Louisiana; corregimiento/district internationally
  | 'county'
  | 'city'
  | 'state'
  | 'country';

export interface RouteWaypoint {
  name: string;                    // "Bozeman", "Carbon County", "Wyoming"…
  level?: JurisdictionLevel;       // optional hint; resolver matches without it
  countryCode?: string;            // defaults to US-MT test bed when absent
}

export interface WaypointLegality {
  waypoint: string;
  level: JurisdictionLevel | 'unresolved';
  status: CannabisLegalStatus | 'UNKNOWN';
  legalForRecreational: boolean;
  note: string;
}

export interface EqualizerCannabisSeal {
  sealed: boolean;                 // false = the Equalizer refuses the seal
  legs: WaypointLegality[];
  flags: string[];                 // every reason the seal was withheld
  commanderFlagActive: boolean;
  commanderMessage: string | null;
}

// Resolve one waypoint against the jurisdiction ladder, most local first:
// town/parish/county match in subJurisdictions → city (dispensary data) →
// state/country top-level. Border warnings handled at the route level.
export function resolveWaypointLegality(
  wp: RouteWaypoint,
): WaypointLegality {
  const profile = getCannabisProfile(wp.countryCode ?? 'US-MT');
  const name = wp.name.trim();
  if (!profile) {
    return {
      waypoint: name, level: 'unresolved', status: 'UNKNOWN',
      legalForRecreational: false,
      note: 'No cannabis profile for this jurisdiction yet. The Equalizer treats unknown as NOT cleared.',
    };
  }

  // Most local rule wins — sub-jurisdiction (county / parish / tribal / town).
  const sub = profile.subJurisdictions.find(
    s => s.name.toLowerCase().includes(name.toLowerCase())
      || name.toLowerCase().includes(s.name.toLowerCase().replace(/ county| parish/i, '')),
  );
  if (sub) {
    return {
      waypoint: name,
      level: wp.level ?? (/parish/i.test(sub.name) ? 'parish' : 'county'),
      status: sub.status,
      legalForRecreational: sub.status === 'RECREATIONAL_LEGAL',
      note: sub.note,
    };
  }

  // City level — a city with active dispensary records inherits state legality
  // with local confirmation.
  const cityHit = MONTANA_DISPENSARIES.some(
    d => d.city.toLowerCase() === name.toLowerCase(),
  );
  if (cityHit) {
    return {
      waypoint: name, level: wp.level ?? 'city', status: profile.topLevelStatus,
      legalForRecreational: profile.topLevelStatus === 'RECREATIONAL_LEGAL',
      note: 'Active dispensary jurisdiction. State rules of the road apply.',
    };
  }

  // Border crossing named as a waypoint — check border warnings.
  const border = profile.borderWarnings.find(
    b => b.borderName.toLowerCase().includes(name.toLowerCase())
      || name.toLowerCase().includes(b.borderName.toLowerCase()),
  );
  if (border) {
    return {
      waypoint: name, level: wp.level ?? 'state', status: 'ILLEGAL',
      legalForRecreational: false,
      note: border.note,
    };
  }

  // Fall through to state/country top level.
  return {
    waypoint: name,
    level: wp.level ?? 'state',
    status: profile.topLevelStatus,
    legalForRecreational: profile.topLevelStatus === 'RECREATIONAL_LEGAL',
    note: 'Top-level jurisdiction rule. Confirm locally — counties and tribal land can override.',
  };
}

// The Equalizer's co-sign on a cannabis-carrying route. Every leg resolved.
// One illegal leg = no seal. Unknown = no seal. Commander layer = flagged.
export function equalizerCannabisSeal(
  waypoints: RouteWaypoint[],
  hasWadaFilter: boolean,
): EqualizerCannabisSeal {
  const legs = waypoints.map(resolveWaypointLegality);
  const flags: string[] = [];

  for (const leg of legs) {
    if (leg.status === 'UNKNOWN') {
      flags.push(`${leg.waypoint}: jurisdiction unresolved — the Equalizer treats unknown as NOT cleared.`);
    } else if (!leg.legalForRecreational) {
      flags.push(`${leg.waypoint} (${leg.level}): ${leg.status} — ${leg.note}`);
    }
  }
  if (hasWadaFilter) flags.push(COMMANDER_LAYER_CANNABIS_FLAG);

  return {
    sealed: flags.length === 0,
    legs,
    flags,
    commanderFlagActive: hasWadaFilter,
    commanderMessage: hasWadaFilter ? COMMANDER_LAYER_CANNABIS_FLAG : null,
  };
}
