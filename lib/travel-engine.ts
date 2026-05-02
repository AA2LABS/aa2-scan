// ─── lib/travel-engine.ts ─────────────────────────────────────────────────────
// AA2 Travel Engine · Canonical 6-question Dossier compiler
// v50 · Mockup-locked against panel #8 (Dossier Builder) and panel #9 (Generated Dossier)
//
// Architectural locks:
//   1. Country-agnostic. NO PANAMA_INSTANCE default. Destination country
//      resolves at runtime from the answer to Q1 (Where).
//   2. Canonical 6-question schema (memory #27):
//        Q1  WHERE     - destination country/city
//        Q2  WHEN      - date range (departure -> return)
//        Q3  ACTIVITIES - what they're doing there (multi-select)
//        Q4  WHO       - which household members are traveling, who is staying
//        Q5  DEVICES   - which devices in the stack are coming
//        Q6  COMMANDER - which Commander Layer filters are ON (WADA, USADA, DoD)
//   3. Modules in the generated Dossier are DYNAMIC, not preset. Lily's
//      allergens trigger the Allergen Brief. Mexico City's altitude triggers
//      the Altitude module. WADA filter triggers the Commander flag inside
//      the Cannabis Brief. No filter, no module.

import { supabase } from './supabase';
import { CountryCode, resolveCountryInstance } from './aa2-pay';

export interface DestinationAnswer {
  country_code: string;
  region: string | null;
  city: string;
  altitude_m: number | null;
}

export interface DateRangeAnswer {
  depart: string;
  return: string;
  nights: number;
}

export type ActivityTag =
  | 'urban_explore'
  | 'beach'
  | 'hiking'
  | 'cycling'
  | 'culinary'
  | 'business'
  | 'family'
  | 'wellness_retreat'
  | 'adventure'
  | 'cultural'
  | 'nightlife'
  | 'training_camp'
  | 'hunting'
  | 'fishing';

export interface TravelerRoster {
  member_ids_traveling: string[];
  member_ids_staying: string[];
}

export type DeviceTag =
  | 'garmin_tactix_8'
  | 'oura_ring_4'
  | 'beats_pro_2'
  | 'oakley_meta'
  | 'muse_s_athena'
  | 'whoop'
  | 'apple_watch';

export type CommanderFilter = 'wada' | 'usada' | 'dod' | 'ncaa';

export interface DossierAnswers {
  q1_where: DestinationAnswer;
  q2_when: DateRangeAnswer;
  q3_activities: ActivityTag[];
  q4_who: TravelerRoster;
  q5_devices: DeviceTag[];
  q6_commander: CommanderFilter[];
}

export interface DestinationContext {
  countryCode: CountryCode | null;
  brandLine: string;
  currency: string;
  emergencyNumber: string;
  altitudeM: number | null;
  primaryLanguage: string;
}

const ALTITUDE_LOOKUP: Record<string, number> = {
  'mexico city': 2240,
  'bogota': 2640,
  'denver': 1609,
  'cusco': 3399,
  'la paz': 3640,
  'quito': 2850,
  'addis ababa': 2355,
  'bozeman': 1463,
  'helena': 1230,
  'panama city': 2,
  'san jose': 1170,
  'medellin': 1495,
};

const PRIMARY_LANGUAGE_LOOKUP: Record<string, string> = {
  PA: 'es',
  US: 'en',
  CR: 'es',
  MX: 'es',
  CO: 'es',
};

export function resolveDestinationContext(
  destination: DestinationAnswer,
): DestinationContext {
  const instance = resolveCountryInstance(destination.country_code);
  const altitudeKey = destination.city.trim().toLowerCase();
  const altitudeM = ALTITUDE_LOOKUP[altitudeKey] ?? destination.altitude_m;
  const primaryLanguage =
    PRIMARY_LANGUAGE_LOOKUP[destination.country_code.toUpperCase()] ?? 'en';

  return {
    countryCode: instance?.code ?? null,
    brandLine: instance?.brandLine ?? `AA2 ${destination.country_code.toUpperCase()}`,
    currency: instance?.currency ?? 'USD',
    emergencyNumber: instance?.emergencyNumber ?? '911',
    altitudeM,
    primaryLanguage,
  };
}

export interface DossierModuleSet {
  safetyBrief: boolean;
  allergenBrief: boolean;
  medicalAccess: boolean;
  emergencyContacts: boolean;
  cannabisBrief: boolean;
  languageModule: boolean;
  altitudeNote: boolean;
  borderCrossing: boolean;
  paperLayer: boolean;
}

export interface ModuleDetectionInput {
  destinationContext: DestinationContext;
  travelerHasAllergens: boolean;
  isInternationalFromOrigin: boolean;
  destinationHasCannabisLegality: boolean;
}

export function detectDossierModules(
  input: ModuleDetectionInput,
): DossierModuleSet {
  const altitudeNote =
    input.destinationContext.altitudeM !== null &&
    input.destinationContext.altitudeM >= 2000;

  return {
    safetyBrief: true,
    allergenBrief: input.travelerHasAllergens,
    medicalAccess: true,
    emergencyContacts: true,
    cannabisBrief: input.destinationHasCannabisLegality,
    languageModule: input.destinationContext.primaryLanguage !== 'en',
    altitudeNote,
    borderCrossing: input.isInternationalFromOrigin,
    paperLayer: true,
  };
}

const LOCAL_DISH_RISK: Record<string, Record<string, string[]>> = {
  MX: {
    'tree nuts': [
      'mole poblano',
      'chiles en nogada',
      'marzipan-style sweets',
    ],
    shellfish: [
      'ceviche',
      'aguachile',
      'arroz a la tumbada',
      'caldo de mariscos',
    ],
    dairy: ['queso fundido', 'crema-based salsas', 'flan'],
  },
  CR: {
    'tree nuts': ['cajeta de coco variants'],
    shellfish: ['ceviche tico', 'arroz con mariscos'],
    dairy: ['queso turrialba dishes', 'natilla-based sauces'],
  },
  PA: {
    'tree nuts': [],
    shellfish: ['ceviche panameno', 'arroz con guandu con coco'],
    dairy: ['hojaldra with cheese fillings'],
  },
  US: {
    'tree nuts': ['pesto', 'frangipane desserts', 'baklava regional'],
    shellfish: ['gumbo', 'chowders', 'cioppino'],
    dairy: ['mac and cheese', 'cream-based chowders'],
  },
};

export function getLocalDishRisks(
  countryCode: string,
  allergenNames: string[],
): Array<{ allergen: string; dishes: string[] }> {
  const lookup = LOCAL_DISH_RISK[countryCode.toUpperCase()];
  if (!lookup) return [];

  const result: Array<{ allergen: string; dishes: string[] }> = [];
  for (const allergen of allergenNames) {
    const key = allergen.toLowerCase();
    const dishes = lookup[key];
    if (dishes && dishes.length > 0) {
      result.push({ allergen, dishes });
    }
  }
  return result;
}

export interface TravelDossierRow {
  id: string;
  user_id: string;
  destination: string;
  date_range: string;
  country_code: string;
  traveler_type: string;
  purpose: string;
  traveling_with_animals: boolean;
  safety_brief: string | null;
  allergen_brief: string | null;
  doctrine_summary: string | null;
  medical_facilities: any[];
  emergency_contacts: any[];
  canine_requirements: any | null;
  profiles_used: any[];
  generated_at: string;
  created_at: string;
}

export interface SaveDossierInput {
  destination: string;
  date_range: string;
  country_code: string;
  traveler_type: string;
  purpose: string;
  traveling_with_animals: boolean;
  safety_brief?: string | null;
  allergen_brief?: string | null;
  doctrine_summary?: string | null;
  medical_facilities?: any[];
  emergency_contacts?: any[];
  canine_requirements?: any | null;
  profiles_used?: any[];
}

export async function saveDossier(
  input: SaveDossierInput,
): Promise<TravelDossierRow | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    console.error('[travel-engine] no auth user for saveDossier', authError);
    return null;
  }

  const { data, error } = await supabase
    .from('travel_dossiers')
    .insert({
      user_id: authData.user.id,
      destination: input.destination,
      date_range: input.date_range,
      country_code: input.country_code,
      traveler_type: input.traveler_type,
      purpose: input.purpose,
      traveling_with_animals: input.traveling_with_animals,
      safety_brief: input.safety_brief ?? null,
      allergen_brief: input.allergen_brief ?? null,
      doctrine_summary: input.doctrine_summary ?? null,
      medical_facilities: input.medical_facilities ?? [],
      emergency_contacts: input.emergency_contacts ?? [],
      canine_requirements: input.canine_requirements ?? null,
      profiles_used: input.profiles_used ?? [],
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[travel-engine] saveDossier error:', error);
    return null;
  }
  return data as TravelDossierRow;
}

export async function getRecentDossiers(
  limit: number = 10,
): Promise<TravelDossierRow[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return [];

  const { data, error } = await supabase
    .from('travel_dossiers')
    .select('*')
    .eq('user_id', authData.user.id)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[travel-engine] getRecentDossiers error:', error);
    return [];
  }
  return (data ?? []) as TravelDossierRow[];
}

export function calcNights(departISO: string, returnISO: string): number {
  const d = new Date(departISO).getTime();
  const r = new Date(returnISO).getTime();
  if (isNaN(d) || isNaN(r) || r <= d) return 0;
  return Math.round((r - d) / (24 * 60 * 60 * 1000));
}
