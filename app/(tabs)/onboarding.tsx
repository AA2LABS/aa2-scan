import Anthropic from '@anthropic-ai/sdk';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, useColorScheme, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:      '#FAF7F2',
  card:    '#FFFFFF',
  border:  '#E8DFD0',
  text:    '#0A0804',
  muted:   '#8A7A6A',
  chip:    '#F0EBE3',
  chipBd:  '#D4C9B8',
  accent:  '#1BB8FF',
  gold:    '#1BB8FF',
  receipt: '#8A7A6A',
};
const DARK = {
  bg:      '#0A0804',
  card:    '#150F08',
  border:  '#2E2208',
  text:    '#FAF7F2',
  muted:   'rgba(250,247,242,0.55)',
  chip:    '#1A1408',
  chipBd:  '#2E2208',
  accent:  '#1BB8FF',
  gold:    '#1BB8FF',
  receipt: 'rgba(250,247,242,0.35)',
};

// ─── FONTS ────────────────────────────────────────────────────────────────────
const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifMd: 'CormorantGaramond-Medium',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TOTAL_DATA_SCREENS = 5;

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── CHIP OPTIONS ─────────────────────────────────────────────────────────────
const CONCIERGE_VOICE_OPTIONS = ['The Coach', 'The Stable', 'COMMAND', 'THE BRIEF'];

const GOAL_OPTIONS = [
  'Weight management', 'Muscle building', 'Better sleep', 'Stress reduction',
  'Gut health', 'Hormone balance', 'Athletic performance', 'Longevity',
  'Family nutrition', 'Inflammation reduction',
];
const ALLERGEN_OPTIONS = [
  'Gluten', 'Dairy', 'Tree nuts', 'Peanuts', 'Shellfish', 'Fish',
  'Eggs', 'Soy', 'Sesame', 'Corn', 'Nightshades', 'None known',
];
const ENV_TRIGGER_OPTIONS = [
  'Pollen', 'Mold', 'Dust mites', 'Pet dander', 'Smoke', 'Synthetic fragrance',
  'Latex', 'None known',
];
const CONDITION_OPTIONS = [
  'Type 1 diabetes', 'Type 2 diabetes', 'Hypertension', 'Autoimmune',
  'Thyroid (hypo/hyper)', 'PCOS', 'Celiac disease', 'Crohn\'s / IBD',
  'IBS', 'Heart disease', 'Cancer history', 'Kidney disease', 'None',
];
const DIET_OPTIONS = [
  'Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Paleo',
  'Mediterranean', 'Carnivore', 'Halal', 'Kosher', 'Whole30',
  'Gluten-free', 'Dairy-free',
];
const TRAVEL_OPTIONS = [
  'Local only', 'Regional (same country)', 'International frequent',
  'Off-grid expeditions', 'Full-time nomad',
];
const SPECIES_OPTIONS = [
  'Dogs', 'Cats', 'Horses', 'Cattle', 'Chickens',
  'Goats', 'Sheep', 'Pigs', 'Rabbits',
];
const HARDWARE_OPTIONS = [
  'Garmin', 'Oura Ring 4', 'Apple Watch', 'Samsung Galaxy Watch',
  'Strava', 'Whoop', 'Fitbit', 'Beats Pro', 'Meta Glasses', 'Muse S', 'None',
];
const STRESS_OPTIONS = [
  { label: 'Low — fully in control',  value: 'low' },
  { label: 'Moderate — manageable',   value: 'moderate' },
  { label: 'High — feeling the weight', value: 'high' },
  { label: 'Critical — overwhelmed',  value: 'critical' },
];
const DELIVERY_OPTIONS = [
  { label: '🎬  Video', value: 'video' },
  { label: '🎙  Voice', value: 'voice' },
  { label: '📝  Text',  value: 'text' },
];
const COLOR_OPTIONS = [
  { label: '☀  Light',  value: 'light' },
  { label: '⚙  System', value: 'system' },
  { label: '🌑  Dark',  value: 'dark' },
];
const STACK_OPTIONS = [
  { label: 'Quarter Stack — just starting',     value: 'quarter' },
  { label: 'Half Stack — building momentum',    value: 'half' },
  { label: 'Three-Quarter Stack — serious',     value: 'three_quarter' },
  { label: 'Full Stack — no compromise',        value: 'full' },
];

// ─── HARDWARE FILE MAPS ───────────────────────────────────────────────────────
const HW_ACCEPT: Record<string, string[]> = {
  'Garmin':               ['application/zip', 'application/x-zip-compressed'],
  'Oura Ring 4':          ['application/zip', 'application/x-zip-compressed'],
  'Apple Watch':          ['text/xml', 'application/xml'],
  'Samsung Galaxy Watch': ['application/json'],
  'Strava':               ['application/zip', 'application/x-zip-compressed'],
  'Whoop':                ['application/json', 'text/csv'],
  'Fitbit':               ['application/json', 'text/csv'],
  'Beats Pro':            ['application/json', 'text/csv'],
  'Meta Glasses':         ['application/json', 'text/csv'],
  'Muse S':               ['application/json', 'text/csv'],
};
const HW_EXPORT_NOTE: Record<string, string> = {
  'Garmin':               'Garmin Connect app → My Data → Export Data (.zip)',
  'Oura Ring 4':          'Oura app → Profile → Data Export (.zip)',
  'Apple Watch':          'Health app → Profile icon → Export All Health Data (.xml)',
  'Samsung Galaxy Watch': 'Samsung Health → Profile → Settings → Download Personal Data (.json)',
  'Strava':               'Strava Settings → My Account → Download or Delete Your Data (.zip)',
  'Whoop':                'WHOOP app → Profile → Privacy → Export Data (.csv)',
  'Fitbit':               'Fitbit app → Account → Export Your Account Archive (.json or .csv)',
  'Beats Pro':            'Beats app → Settings → Export Health Data (.json)',
  'Meta Glasses':         'Meta View app → Settings → Export Data (.json)',
  'Muse S':               'Muse app → Settings → Data Export (.csv)',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type HwParseResult = {
  sleep_score_avg: number | null;
  readiness_avg: number | null;
  hrv_trend: number | null;
  resting_heart_rate: number | null;
};

type Answers = {
  name: string;
  age: string;
  conciergeVoice: string;
  deliveryMode: string;
  colorMode: string;
  primaryGoal: string[];
  visionText: string;
  targetDate: string;
  stackTier: string;
  foodAllergens: string[];
  suspectedSensitivities: string;
  personalCareAllergens: string;
  environmentalTriggers: string[];
  conditions: string[];
  activeLimits: string;
  medications: string;
  dietTypes: string[];
  sleepScore: number;
  stressLevel: string;
  travelFrequency: string[];
  speciesProtected: string[];
  hardware: string[];
};

const DEFAULT_ANSWERS: Answers = {
  name: '', age: '', conciergeVoice: '', deliveryMode: 'voice', colorMode: 'system',
  primaryGoal: [], visionText: '', targetDate: '', stackTier: 'quarter',
  foodAllergens: [], suspectedSensitivities: '', personalCareAllergens: '',
  environmentalTriggers: [], conditions: [], activeLimits: '', medications: '',
  dietTypes: [], sleepScore: 3, stressLevel: 'moderate',
  travelFrequency: [], speciesProtected: [], hardware: [],
};

// ─── HARDWARE FILE PARSER ────────────────────────────────────────────────────
async function parseHardwareFile(uri: string, deviceName: string): Promise<HwParseResult> {
  let raw = '';
  try {
    raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    throw new Error('Could not read this file. If it is a zip archive, extract the CSV or XML inside and upload that file instead.');
  }
  // Detect binary content early
  const sample = raw.slice(0, 600);
  let nonPrint = 0;
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i);
    if (c < 9 || (c > 13 && c < 32) || c === 127) nonPrint++;
    if (nonPrint > 25) {
      throw new Error('This appears to be a zip or binary file. Extract the CSV or XML inside first, then upload that file.');
    }
  }
  const truncated = raw.slice(0, 80000);
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: `Extract 90-day health averages where data is available, otherwise use the full available date range from a ${deviceName} data export. Return ONLY valid JSON with exactly these keys (null if not found): {"sleep_score_avg":number|null,"readiness_avg":number|null,"hrv_trend":number|null,"resting_heart_rate":number|null}. HRV in milliseconds. Heart rate in BPM. Sleep and readiness as 0–100 scores where applicable. No markdown, no explanation.`,
    messages: [{ role: 'user', content: truncated }],
  });
  return JSON.parse(((resp.content[0] as any).text ?? '').replace(/```json|```/g, '').trim());
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function Chips({
  options, selected, onToggle, C,
}: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; C: typeof LIGHT;
}) {
  return (
    <View style={ch.wrap}>
      {options.map(o => {
        const on = selected.includes(o);
        return (
          <TouchableOpacity
            key={o}
            style={[ch.chip, {
              backgroundColor: on ? C.accent : C.chip,
              borderColor:     on ? C.accent : C.chipBd,
            }]}
            onPress={() => onToggle(o)}
          >
            <Text style={[ch.label, { color: on ? '#FFFFFF' : C.muted, fontFamily: F.mono }]}>
              {o}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const ch = StyleSheet.create({
  wrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip:  { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  label: { fontSize: 12 },
});

function SingleSelect({
  options, selected, onSelect, C,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  C: typeof LIGHT;
}) {
  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      {options.map(o => {
        const on = selected === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[ss.row, {
              backgroundColor: on ? C.accent + '18' : C.chip,
              borderColor:     on ? C.accent : C.chipBd,
            }]}
            onPress={() => onSelect(o.value)}
          >
            <View style={[ss.dot, { borderColor: on ? C.accent : C.chipBd }]}>
              {on && <View style={[ss.dotFill, { backgroundColor: C.accent }]} />}
            </View>
            <Text style={[ss.label, { color: on ? C.accent : C.text, fontFamily: F.mono }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const ss = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1 },
  dot:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotFill: { width: 9, height: 9, borderRadius: 5 },
  label:   { fontSize: 13, flex: 1 },
});

function SleepSelector({ value, onChange, C }: { value: number; onChange: (n: number) => void; C: typeof LIGHT }) {
  const labels = ['', 'Poor', 'Fair', 'Average', 'Good', 'Excellent'];
  return (
    <View style={{ marginTop: 12 }}>
      <View style={sl.row}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            style={[sl.btn, { backgroundColor: value === n ? C.accent : C.chip, borderColor: value === n ? C.accent : C.chipBd }]}
            onPress={() => onChange(n)}
          >
            <Text style={[sl.num, { color: value === n ? '#FFFFFF' : C.muted, fontFamily: F.display }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {value > 0 && (
        <Text style={[sl.label, { color: C.accent, fontFamily: F.mono }]}>{labels[value]}</Text>
      )}
    </View>
  );
}
const sl = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btn:   { flex: 1, aspectRatio: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  num:   { fontSize: 22 },
  label: { fontSize: 11, letterSpacing: 2, textAlign: 'center', marginTop: 4 },
});

function ProgressBar({ screen, C }: { screen: number; C: typeof LIGHT }) {
  const pct = screen === 0 ? 0 : (screen / TOTAL_DATA_SCREENS) * 100;
  return (
    <View style={[pb.track, { backgroundColor: C.chipBd }]}>
      <View style={[pb.fill, { width: `${pct}%` as any, backgroundColor: C.accent }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 3, borderRadius: 2, marginHorizontal: 20, marginBottom: 8 },
  fill:  { height: 3, borderRadius: 2 },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;

  const [screen,       setScreen]       = useState(0);
  const [answers,      setAnswers]      = useState<Answers>(DEFAULT_ANSWERS);
  const [saving,       setSaving]       = useState(false);
  const [done,         setDone]         = useState(false);
  const [alreadyDone,  setAlreadyDone]  = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saveError,    setSaveError]    = useState('');
  const [hwFileResult, setHwFileResult] = useState<HwParseResult | null>(null);
  const [hwParsing,    setHwParsing]    = useState(false);
  const [hwParseError, setHwParseError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('member_profiles')
            .select('onboarding_complete, name')
            .eq('member_id', session.user.id)
            .maybeSingle();
          if (data?.onboarding_complete) {
            setAlreadyDone(true);
            if (data.name) setAnswers(prev => ({ ...prev, name: data.name }));
          }
        }
      } catch {}
      setCheckingAuth(false);
    })();
  }, []);

  const set    = (key: keyof Answers, val: any) => setAnswers(prev => ({ ...prev, [key]: val }));
  const toggle = (key: keyof Answers, val: string) => {
    const arr = answers[key] as string[];
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const pickHardwareFile = async (deviceName: string) => {
    setHwParseError('');
    setHwFileResult(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: HW_ACCEPT[deviceName] ?? ['*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const { uri } = result.assets[0];
      setHwParsing(true);
      const parsed = await parseHardwareFile(uri, deviceName);
      setHwFileResult(parsed);
    } catch (e: any) {
      setHwParseError(e?.message || 'Could not parse this file. Try exporting again in a different format.');
    } finally {
      setHwParsing(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let userId: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
        } else {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          if (anonData?.user) userId = anonData.user.id;
        }
      } catch { /* proceed locally without session */ }

      if (userId) {
        await Promise.all([
          supabase.from('member_profiles').upsert({
            member_id:           userId,
            name:                answers.name || null,
            age:                 answers.age || null,
            concierge_voice:     answers.conciergeVoice || null,
            delivery_mode:       answers.deliveryMode,
            color_mode:          answers.colorMode,
            stack_tier:          answers.stackTier,
            species_protected:   answers.speciesProtected,
            onboarding_complete: true,
          }, { onConflict: 'member_id' }),

          supabase.from('goal_profiles').upsert({
            member_id:    userId,
            primary_goal: answers.primaryGoal,
            vision_text:  answers.visionText || null,
            target_date:  answers.targetDate || null,
          }, { onConflict: 'member_id' }),

          supabase.from('allergy_profiles').upsert({
            member_id:               userId,
            food_allergens:          answers.foodAllergens,
            suspected_sensitivities: answers.suspectedSensitivities
              ? answers.suspectedSensitivities.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            personal_care_allergens: answers.personalCareAllergens
              ? answers.personalCareAllergens.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            environmental_triggers:  answers.environmentalTriggers,
          }, { onConflict: 'member_id' }),

          supabase.from('health_profiles').upsert({
            member_id:     userId,
            conditions:    answers.conditions,
            active_limits: answers.activeLimits
              ? answers.activeLimits.split(',').map(s => s.trim()).filter(Boolean)
              : [],
            medications:   answers.medications || null,
            diet_types:    answers.dietTypes,
          }, { onConflict: 'member_id' }),

          supabase.from('baseline_profiles').upsert({
            member_id:              userId,
            sleep_score:            answers.sleepScore,
            stress_level:           answers.stressLevel,
            hrv_baseline_30d:       hwFileResult?.hrv_trend ?? null,
            readiness_baseline_30d: hwFileResult?.readiness_avg ?? null,
          }, { onConflict: 'member_id' }),

          supabase.from('travel_profiles').upsert({
            member_id:        userId,
            travel_frequency: answers.travelFrequency,
          }, { onConflict: 'member_id' }),

          supabase.from('device_connections').upsert({
            member_id: userId,
            hardware:  answers.hardware.filter(h => h !== 'None'),
          }, { onConflict: 'member_id' }),

          supabase.from('animal_profiles').upsert({
            member_id: userId,
            species:   answers.speciesProtected.join(', ') || null,
          }, { onConflict: 'member_id' }),
        ]);
      }

      setDone(true);
      setTimeout(() => router.replace('/'), 2000);
    } catch (e: any) {
      setSaveError(e?.message || 'Connection failed. Check your network and try again.');
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(C);

  // ── LOADING / AUTH CHECK ──────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    );
  }

  // ── ALREADY COMPLETE ──────────────────────────────────────────────────────
  if (alreadyDone) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.receiptRow}>
          <Text style={s.receipt}>I AM THE RECEIPT</Text>
        </View>
        <ScrollView contentContainerStyle={s.doneWrap}>
          <Text style={s.doneGlyph}>🧬</Text>
          <Text style={[s.doneTitle, { fontFamily: F.display }]}>MEMBRANE COMPLETE</Text>
          <Text style={[s.doneBody, { fontFamily: F.serifIt }]}>
            {answers.name ? `${answers.name}, your` : 'Your'} truth table is built. Every scan you run is now
            specific to you — your body, your people, your animals. The Equalizer knows what to flag.
            {'\n\n'}
            The membrane is active. You are protected.
          </Text>
          <View style={[s.doneBadge, { borderColor: C.accent }]}>
            <Text style={[s.doneBadgeText, { color: C.accent, fontFamily: F.mono }]}>
              TRUTH TABLE ACTIVE
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── COMPLETE / DONE ───────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.receiptRow}>
          <Text style={s.receipt}>I AM THE RECEIPT</Text>
        </View>
        <ScrollView contentContainerStyle={s.doneWrap}>
          <Text style={s.doneGlyph}>🧬</Text>
          <Text style={[s.doneTitle, { fontFamily: F.display }]}>THE MEMBRANE IS LIVE</Text>
          <Text style={[s.doneBody, { fontFamily: F.serifIt }]}>
            {answers.name ? `${answers.name}, ` : ''}your truth table is written. From this moment,
            every scan The Equalizer runs is filtered through everything you just told us.
            {'\n\n'}
            Your allergens are the first check on every scan. Your active limits are a permanent
            filter. What protects your animals is loaded into every species analysis.
            {'\n\n'}
            You are initiated. The membrane holds.
          </Text>
          <View style={[s.doneBadge, { borderColor: C.accent }]}>
            <Text style={[s.doneBadgeText, { color: C.accent, fontFamily: F.mono }]}>
              ✓  INITIATED · AA2 MEMBER
            </Text>
          </View>
          <ActivityIndicator size="small" color={C.accent} style={{ marginTop: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SCREEN 0 — THE CONCIERGE OPENING ─────────────────────────────────────
  if (screen === 0) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.receiptRow}>
          <Text style={s.receipt}>I AM THE RECEIPT</Text>
        </View>
        <ProgressBar screen={0} C={C} />
        <ScrollView contentContainerStyle={s.openingWrap} keyboardShouldPersistTaps="handled">
          <Text style={s.openingDna}>🧬</Text>
          <Text style={[s.openingTitle, { fontFamily: F.display, color: C.text }]}>
            THE MEMBRANE
          </Text>
          <Text style={[s.openingVoice, { fontFamily: F.display, color: C.accent }]}>
            I AM THE CONCIERGE.
          </Text>
          <Text style={[s.openingBody, { fontFamily: F.serif, color: C.text }]}>
            What you tell me becomes the filter that makes every scan specific to you —
            your body, your people, your animals.
          </Text>
          <Text style={[s.openingBody, { fontFamily: F.serifMd, color: C.text }]}>
            This is not a form. This is your truth table.
          </Text>
          <Text style={[s.openingBody, { fontFamily: F.serif, color: C.text }]}>
            The next five screens take about four minutes. Answer honestly.
            The donut will know about the bikini. The shampoo will know about the condition.
            The supplement will know about the medication.
          </Text>
          <TouchableOpacity style={[s.beginBtn, { backgroundColor: C.accent }]} onPress={() => setScreen(1)}>
            <Text style={[s.beginBtnText, { fontFamily: F.display }]}>BEGIN</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SCREENS 1–5 ───────────────────────────────────────────────────────────
  const screenLabel = ['', 'WHO YOU ARE', 'WHAT YOU\'RE BUILDING', 'YOUR TRUTH TABLE', 'YOUR BODY', 'YOUR WORLD'][screen];
  const isLastScreen = screen === TOTAL_DATA_SCREENS;
  const canAdvance = () => {
    if (screen === 1) return answers.name.trim().length > 0;
    return true;
  };

  const activeHardware = answers.hardware.filter(h => h !== 'None');

  return (
    <SafeAreaView style={s.root}>
      <View style={s.receiptRow}>
        <Text style={s.receipt}>I AM THE RECEIPT</Text>
      </View>
      <ProgressBar screen={screen} C={C} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.screenWrap, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Screen header */}
          <View style={s.screenHeader}>
            <Text style={[s.screenNum, { color: C.accent, fontFamily: F.mono }]}>
              {screen} / {TOTAL_DATA_SCREENS}
            </Text>
            <Text style={[s.screenTitle, { color: C.text, fontFamily: F.display }]}>
              {screenLabel}
            </Text>
          </View>

          {/* ── SCREEN 1 ── WHO YOU ARE */}
          {screen === 1 && (
            <>
              <Question n={1} label="YOUR NAME" C={C}>
                <TextInput
                  style={[s.input, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="First name or preferred name"
                  placeholderTextColor={C.muted}
                  value={answers.name}
                  onChangeText={v => set('name', v)}
                  autoCapitalize="words"
                />
              </Question>

              <Question n={2} label="YOUR AGE" C={C}>
                <TextInput
                  style={[s.input, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="e.g. 34"
                  placeholderTextColor={C.muted}
                  value={answers.age}
                  onChangeText={v => set('age', v)}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </Question>

              <Question n={3} label="CHOOSE YOUR CONCIERGE VOICE" sub="This is the voice AA2 speaks through" C={C}>
                <Chips
                  options={CONCIERGE_VOICE_OPTIONS}
                  selected={answers.conciergeVoice ? [answers.conciergeVoice] : []}
                  onToggle={v => set('conciergeVoice', answers.conciergeVoice === v ? '' : v)}
                  C={C}
                />
              </Question>

              <Question n={4} label="HOW WOULD YOU LIKE AA2 TO REACH YOU" C={C}>
                <SingleSelect
                  options={DELIVERY_OPTIONS}
                  selected={answers.deliveryMode}
                  onSelect={v => set('deliveryMode', v)}
                  C={C}
                />
              </Question>

              <Question n={5} label="DISPLAY PREFERENCE" C={C}>
                <SingleSelect
                  options={COLOR_OPTIONS}
                  selected={answers.colorMode}
                  onSelect={v => set('colorMode', v)}
                  C={C}
                />
              </Question>
            </>
          )}

          {/* ── SCREEN 2 ── WHAT YOU'RE BUILDING */}
          {screen === 2 && (
            <>
              <Question n={1} label="YOUR PRIMARY GOALS" sub="Select all that apply" C={C}>
                <Chips
                  options={GOAL_OPTIONS}
                  selected={answers.primaryGoal}
                  onToggle={v => toggle('primaryGoal', v)}
                  C={C}
                />
              </Question>

              <Question n={2} label="YOUR VISION" sub="In your own words — what does winning look like?" C={C}>
                <TextInput
                  style={[s.inputMulti, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.serif }]}
                  placeholder="Describe what you're building toward..."
                  placeholderTextColor={C.muted}
                  value={answers.visionText}
                  onChangeText={v => set('visionText', v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Question>

              <Question n={3} label="TARGET DATE" sub="When do you want to be there?" C={C}>
                <TextInput
                  style={[s.input, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="e.g. December 2025, Summer 2026"
                  placeholderTextColor={C.muted}
                  value={answers.targetDate}
                  onChangeText={v => set('targetDate', v)}
                />
              </Question>

              <Question n={4} label="COMMITMENT LEVEL" C={C}>
                <SingleSelect
                  options={STACK_OPTIONS}
                  selected={answers.stackTier}
                  onSelect={v => set('stackTier', v)}
                  C={C}
                />
              </Question>
            </>
          )}

          {/* ── SCREEN 3 ── YOUR TRUTH TABLE */}
          {screen === 3 && (
            <>
              <View style={[s.doctrineNote, { borderLeftColor: C.accent, backgroundColor: C.chip }]}>
                <Text style={[s.doctrineText, { color: C.muted, fontFamily: F.serifIt }]}>
                  This screen is your allergen truth table. These flags are permanent —
                  The Equalizer checks them first on every single scan. No exceptions.
                </Text>
              </View>

              <Question n={1} label="KNOWN FOOD ALLERGENS" sub="Select all confirmed allergens" C={C}>
                <Chips
                  options={ALLERGEN_OPTIONS}
                  selected={answers.foodAllergens}
                  onToggle={v => toggle('foodAllergens', v)}
                  C={C}
                />
              </Question>

              <Question n={2} label="SUSPECTED SENSITIVITIES" sub="Not confirmed but you've noticed reactions — separate with commas" C={C}>
                <TextInput
                  style={[s.input, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="e.g. Canola oil, MSG, artificial sweeteners"
                  placeholderTextColor={C.muted}
                  value={answers.suspectedSensitivities}
                  onChangeText={v => set('suspectedSensitivities', v)}
                />
              </Question>

              <Question n={3} label="PERSONAL CARE REACTIONS" sub="Products or ingredients that have caused reactions — separate with commas" C={C}>
                <TextInput
                  style={[s.input, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="e.g. Parabens, fragrance, benzoyl peroxide"
                  placeholderTextColor={C.muted}
                  value={answers.personalCareAllergens}
                  onChangeText={v => set('personalCareAllergens', v)}
                />
              </Question>

              <Question n={4} label="ENVIRONMENTAL TRIGGERS" sub="Select all that apply" C={C}>
                <Chips
                  options={ENV_TRIGGER_OPTIONS}
                  selected={answers.environmentalTriggers}
                  onToggle={v => toggle('environmentalTriggers', v)}
                  C={C}
                />
              </Question>
            </>
          )}

          {/* ── SCREEN 4 ── YOUR BODY */}
          {screen === 4 && (
            <>
              <Question n={1} label="HEALTH CONDITIONS" sub="Select all that apply" C={C}>
                <Chips
                  options={CONDITION_OPTIONS}
                  selected={answers.conditions}
                  onToggle={v => toggle('conditions', v)}
                  C={C}
                />
              </Question>

              <Question n={2} label="ACTIVE LIMITS" sub="Anything The Equalizer must always flag — ingredients, compounds, additives. Separate with commas." C={C}>
                <TextInput
                  style={[s.inputMulti, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="e.g. High sodium (>400mg), Red dye 40, Aspartame"
                  placeholderTextColor={C.muted}
                  value={answers.activeLimits}
                  onChangeText={v => set('activeLimits', v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Question>

              <Question n={3} label="CURRENT MEDICATIONS OR SUPPLEMENTS" sub="Used for interaction awareness only — never shared externally" C={C}>
                <TextInput
                  style={[s.inputMulti, { color: C.text, borderColor: C.border, backgroundColor: C.card, fontFamily: F.mono }]}
                  placeholder="e.g. Metformin, Lisinopril, Vitamin D3, Magnesium glycinate"
                  placeholderTextColor={C.muted}
                  value={answers.medications}
                  onChangeText={v => set('medications', v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Question>

              <Question n={4} label="DIET TYPE(S)" sub="Select all that apply" C={C}>
                <Chips
                  options={DIET_OPTIONS}
                  selected={answers.dietTypes}
                  onToggle={v => toggle('dietTypes', v)}
                  C={C}
                />
              </Question>
            </>
          )}

          {/* ── SCREEN 5 ── YOUR WORLD */}
          {screen === 5 && (
            <>
              <Question n={1} label="SLEEP QUALITY" sub="Average quality of sleep over the last 30 days" C={C}>
                <SleepSelector value={answers.sleepScore} onChange={v => set('sleepScore', v)} C={C} />
              </Question>

              <Question n={2} label="STRESS LEVEL" sub="Current baseline — honest assessment" C={C}>
                <SingleSelect
                  options={STRESS_OPTIONS}
                  selected={answers.stressLevel}
                  onSelect={v => set('stressLevel', v)}
                  C={C}
                />
              </Question>

              <Question n={3} label="TRAVEL FREQUENCY" sub="Select all that apply" C={C}>
                <Chips
                  options={TRAVEL_OPTIONS}
                  selected={answers.travelFrequency}
                  onToggle={v => toggle('travelFrequency', v)}
                  C={C}
                />
              </Question>

              <Question n={4} label="SPECIES YOU PROTECT" sub="Select animals in your care — activates species-specific intelligence" C={C}>
                <Chips
                  options={SPECIES_OPTIONS}
                  selected={answers.speciesProtected}
                  onToggle={v => toggle('speciesProtected', v)}
                  C={C}
                />
              </Question>

              <Question n={5} label="CONNECTED HARDWARE" sub="Optional — upload a health export for 30-day baseline calibration" C={C}>
                <Chips
                  options={HARDWARE_OPTIONS}
                  selected={answers.hardware}
                  onToggle={v => {
                    toggle('hardware', v);
                    setHwFileResult(null);
                    setHwParseError('');
                  }}
                  C={C}
                />

                {activeHardware.length > 0 && (
                  <View style={[s.hwUploadCard, { borderColor: C.border, backgroundColor: C.card }]}>
                    <Text style={[s.hwUploadLabel, { color: C.accent, fontFamily: F.mono }]}>
                      HOW TO EXPORT YOUR DATA
                    </Text>
                    {activeHardware.map(device => (
                      <View key={device} style={s.hwDeviceRow}>
                        <Text style={[s.hwDeviceName, { color: C.text, fontFamily: F.monoMd }]}>{device}</Text>
                        <Text style={[s.hwDeviceNote, { color: C.muted, fontFamily: F.mono }]}>
                          {HW_EXPORT_NOTE[device] ?? 'Export health data from the device app'}
                        </Text>
                      </View>
                    ))}

                    {!hwFileResult && (
                      <TouchableOpacity
                        style={[s.hwUploadBtn, {
                          borderColor: C.accent,
                          backgroundColor: C.accent + '18',
                          opacity: hwParsing ? 0.6 : 1,
                        }]}
                        onPress={() => {
                          const dev = activeHardware[0];
                          if (dev) pickHardwareFile(dev);
                        }}
                        disabled={hwParsing}
                      >
                        {hwParsing ? (
                          <ActivityIndicator size="small" color={C.accent} />
                        ) : (
                          <Text style={[s.hwUploadBtnText, { color: C.accent, fontFamily: F.mono }]}>
                            ↑ UPLOAD HEALTH EXPORT
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {hwParseError !== '' && (
                      <Text style={[s.hwParseError, { fontFamily: F.mono }]}>{hwParseError}</Text>
                    )}

                    {hwFileResult && (
                      <View style={[s.hwConfirmCard, { borderColor: C.accent, backgroundColor: C.accent + '10' }]}>
                        <Text style={[s.hwConfirmTitle, { color: C.accent, fontFamily: F.mono }]}>
                          ✓ BASELINE CALIBRATED
                        </Text>
                        {hwFileResult.sleep_score_avg != null && (
                          <Text style={[s.hwConfirmRow, { color: C.text, fontFamily: F.mono }]}>
                            Sleep Score (30d avg){'  '}{hwFileResult.sleep_score_avg}
                          </Text>
                        )}
                        {hwFileResult.readiness_avg != null && (
                          <Text style={[s.hwConfirmRow, { color: C.text, fontFamily: F.mono }]}>
                            Readiness (30d avg){'  '}{hwFileResult.readiness_avg}
                          </Text>
                        )}
                        {hwFileResult.hrv_trend != null && (
                          <Text style={[s.hwConfirmRow, { color: C.text, fontFamily: F.mono }]}>
                            HRV Trend{'  '}{hwFileResult.hrv_trend}ms
                          </Text>
                        )}
                        {hwFileResult.resting_heart_rate != null && (
                          <Text style={[s.hwConfirmRow, { color: C.text, fontFamily: F.mono }]}>
                            Resting HR{'  '}{hwFileResult.resting_heart_rate} BPM
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => { setHwFileResult(null); setHwParseError(''); }}
                          style={{ marginTop: 10 }}
                        >
                          <Text style={[s.hwReupload, { color: C.muted, fontFamily: F.mono }]}>
                            ↺ UPLOAD DIFFERENT FILE
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </Question>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* NAV FOOTER */}
      <View style={[s.navFooter, { backgroundColor: C.bg, borderTopColor: C.border }]}>
        {saveError !== '' && (
          <Text style={[s.saveError, { color: '#E05252', fontFamily: F.mono }]}>{saveError}</Text>
        )}
        <View style={s.navRow}>
          <TouchableOpacity
            style={[s.backBtn, { borderColor: C.border }]}
            onPress={() => setScreen(sc => sc - 1)}
          >
            <Text style={[s.backBtnText, { color: C.muted, fontFamily: F.mono }]}>← BACK</Text>
          </TouchableOpacity>

          {isLastScreen ? (
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: C.accent, opacity: saving ? 0.7 : 1 }]}
              onPress={handleComplete}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={[s.nextBtnText, { fontFamily: F.display }]}>SEAL THE MEMBRANE</Text>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: canAdvance() ? C.accent : C.chipBd }]}
              onPress={() => { if (canAdvance()) setScreen(sc => sc + 1); }}
              disabled={!canAdvance()}
            >
              <Text style={[s.nextBtnText, { fontFamily: F.display }]}>NEXT →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </SafeAreaView>
  );
}

// ─── QUESTION WRAPPER ─────────────────────────────────────────────────────────
function Question({
  n, label, sub, children, C,
}: {
  n: number; label: string; sub?: string; children: React.ReactNode; C: typeof LIGHT;
}) {
  return (
    <View style={q.wrap}>
      <View style={q.labelRow}>
        <Text style={[q.num, { color: C.accent, fontFamily: F.mono }]}>{String(n).padStart(2, '0')}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[q.label, { color: C.text, fontFamily: F.display }]}>{label}</Text>
          {sub && <Text style={[q.sub, { color: C.muted, fontFamily: F.mono }]}>{sub}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}
const q = StyleSheet.create({
  wrap:     { marginBottom: 28 },
  labelRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 4 },
  num:      { fontSize: 11, marginTop: 4, width: 22 },
  label:    { fontSize: 20, letterSpacing: 1, lineHeight: 24 },
  sub:      { fontSize: 10, letterSpacing: 0.5, marginTop: 3, lineHeight: 14 },
});

// ─── DYNAMIC STYLES ───────────────────────────────────────────────────────────
function makeStyles(C: typeof LIGHT) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    receiptRow: {
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    receipt: {
      fontFamily: F.mono,
      fontSize: 9,
      color: C.receipt,
      letterSpacing: 3,
    },

    // Opening screen
    openingWrap: {
      paddingHorizontal: 28,
      paddingTop: 24,
      paddingBottom: 60,
      alignItems: 'center',
    },
    openingDna:   { fontSize: 44, marginBottom: 12 },
    openingTitle: { fontSize: 40, letterSpacing: 4, marginBottom: 16, textAlign: 'center' },
    openingVoice: { fontSize: 28, letterSpacing: 3, marginBottom: 24, textAlign: 'center' },
    openingBody:  { fontSize: 18, lineHeight: 28, marginBottom: 16, textAlign: 'center' },
    beginBtn:     { paddingVertical: 18, paddingHorizontal: 56, borderRadius: 10, marginTop: 28, marginBottom: 20 },
    beginBtnText: { fontSize: 28, color: '#FFFFFF', letterSpacing: 4 },

    // Screen layout
    screenWrap:   { paddingHorizontal: 20, paddingTop: 20 },
    screenHeader: { marginBottom: 28 },
    screenNum:    { fontSize: 11, letterSpacing: 2, marginBottom: 4 },
    screenTitle:  { fontSize: 34, letterSpacing: 3, lineHeight: 38 },

    // Inputs
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 14,
      marginTop: 8,
    },
    inputMulti: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 16,
      marginTop: 8,
      minHeight: 100,
    },

    // Doctrine note
    doctrineNote: {
      borderLeftWidth: 3,
      borderRadius: 6,
      padding: 14,
      marginBottom: 24,
    },
    doctrineText: { fontSize: 15, lineHeight: 22 },

    // Hardware upload section
    hwUploadCard:    { marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1 },
    hwUploadLabel:   { fontSize: 9, letterSpacing: 2, marginBottom: 12 },
    hwDeviceRow:     { marginBottom: 10 },
    hwDeviceName:    { fontSize: 12, marginBottom: 3 },
    hwDeviceNote:    { fontSize: 10, lineHeight: 15 },
    hwUploadBtn:     { marginTop: 12, paddingVertical: 13, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    hwUploadBtnText: { fontSize: 11, letterSpacing: 1.5 },
    hwParseError:    { fontSize: 11, marginTop: 10, lineHeight: 16, color: '#E05252' },
    hwConfirmCard:   { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1 },
    hwConfirmTitle:  { fontSize: 10, letterSpacing: 2, marginBottom: 10 },
    hwConfirmRow:    { fontSize: 12, marginBottom: 5 },
    hwReupload:      { fontSize: 10, letterSpacing: 1 },

    // Nav footer
    navFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
    },
    saveError:   { fontSize: 11, letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
    navRow:      { flexDirection: 'row', gap: 12, alignItems: 'center' },
    backBtn:     { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1 },
    backBtnText: { fontSize: 12, letterSpacing: 1 },
    nextBtn:     { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
    nextBtnText: { fontSize: 22, color: '#FFFFFF', letterSpacing: 3 },

    // Done screens
    doneWrap:     { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 40, paddingBottom: 60 },
    doneGlyph:    { fontSize: 52, marginBottom: 16 },
    doneTitle:    { fontSize: 36, letterSpacing: 4, color: C.text, textAlign: 'center', marginBottom: 24 },
    doneBody:     { fontSize: 18, lineHeight: 29, color: C.text, textAlign: 'center', marginBottom: 32 },
    doneBadge:    { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5 },
    doneBadgeText:{ fontSize: 11, letterSpacing: 3 },
  });
}
