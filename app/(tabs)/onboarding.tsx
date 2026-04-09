import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const BLUE        = '#1BB8FF';
const BLUE_DIM    = 'rgba(27,184,255,0.15)';
const BLUE_BORDER = 'rgba(27,184,255,0.40)';
const GREEN       = '#1D9E75';
const RED         = '#E05252';
const DARK_BG     = '#0A0804';
const CARD_BG     = '#150F0A';
const WHITE       = '#FFFFFF';
const MUTED       = 'rgba(255,255,255,0.55)';

// ─── FONTS ───────────────────────────────────────────────────────────────────
const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifMd: 'CormorantGaramond-Medium',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
  sans:    'DMSans-Regular',
};

// ─── DIMENSIONS ──────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const ACTIVITY_COL_W = Math.floor((SCREEN_W - 48 - 12) / 3);

// ─── FIELD GLOW HELPERS ──────────────────────────────────────────────────────
function fieldBorder(value: string | null, focused: boolean): string {
  if (focused) return BLUE;
  if (value && value.trim().length > 0) return GREEN;
  return RED;
}

function fieldOpacity(value: string | null, focused: boolean): number {
  if (focused) return 1;
  if (value && value.trim().length > 0) return 1;
  return 0.6;
}

// ─── SAVE FIELD ──────────────────────────────────────────────────────────────
async function saveField(field: string, value: any): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      [field]: value,
      updated_at: new Date().toISOString(),
    });
  } catch {}
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
const ACTIVITIES = [
  'Running','Trail Running','Track',
  'Treadmill','Virtual Run',
  'Cycling','Mountain Bike','Road Bike',
  'Gravel','Indoor Bike','E-Bike',
  'Swimming','Pool Swim','Open Water',
  'SUP','Kayak','Row','Sail','Surf',
  'Windsurf','Kitesurf','Dive','Snorkel',
  'Ski','Snowboard','Backcountry Ski',
  'Nordic Ski','Snowshoe',
  'Climb','Bouldering','Indoor Climb',
  'Strength','HIIT','Pilates',
  'Yoga','Barre','Cardio',
  'Soccer','Basketball','Baseball',
  'Hockey','Volleyball','Rugby',
  'Football','Lacrosse',
  'Tennis','Pickleball','Squash',
  'Racquetball','Padel',
  'Golf','Hunt','Fish',
  'Martial Arts','Boxing','MMA',
  'Wrestling',
  'Skydive','Paraglide','Hang Glide',
  'BASE Jump',
  'Triathlon','Duathlon','Walk','Hike',
  'Breathwork','Meditation','Tactical',
];

const ALLERGEN_CHIPS = ['Peanuts','Tree Nuts','Shellfish','Dairy','Gluten','Soy','Eggs','Fish'];

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  completed: number;
  total: number;
  onPress: () => void;
}

function MembraneProgressBar({ completed, total, onPress }: ProgressBarProps) {
  const pct = completed / total;
  const barColor = completed >= total ? GREEN : BLUE;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 4,
        backgroundColor: BLUE_DIM,
      }}
    >
      <View style={{ height: 4, width: `${pct * 100}%` as any, backgroundColor: barColor }} />
    </TouchableOpacity>
  );
}

// ─── BRIEFING CARD ────────────────────────────────────────────────────────────
interface BriefingCardProps {
  text: string;
  blockLabel: string;
  onBegin: () => void;
}

function BriefingCard({ text, blockLabel, onBegin }: BriefingCardProps) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: DARK_BG,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    }}>
      <Text style={{
        fontFamily: F.mono,
        fontSize: 10,
        color: BLUE,
        letterSpacing: 3,
        marginBottom: 32,
      }}>
        {blockLabel}
      </Text>
      <Text style={{
        fontFamily: F.serifIt,
        fontSize: 24,
        color: WHITE,
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 48,
      }}>
        "{text}"
      </Text>
      <TouchableOpacity
        onPress={onBegin}
        style={{
          borderWidth: 1,
          borderColor: BLUE_BORDER,
          borderRadius: 12,
          paddingHorizontal: 32,
          paddingVertical: 16,
        }}
        activeOpacity={0.8}
      >
        <Text style={{
          fontFamily: F.monoMd,
          fontSize: 11,
          color: BLUE,
          letterSpacing: 2,
        }}>
          TAP TO BEGIN {blockLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── NA CHIP ─────────────────────────────────────────────────────────────────
interface NAChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function NAChip({ label, selected, onPress }: NAChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? GREEN : BLUE_BORDER,
        backgroundColor: selected ? 'rgba(29,158,117,0.15)' : BLUE_DIM,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        alignSelf: 'flex-start',
        marginTop: 8,
      }}
    >
      <Text style={{
        fontFamily: F.mono,
        fontSize: 11,
        color: selected ? GREEN : BLUE,
        letterSpacing: 1,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── CHIP SELECTOR ────────────────────────────────────────────────────────────
interface ChipProps {
  options: string[];
  selected: string | string[];
  multi?: boolean;
  onSelect: (val: string) => void;
  accentColor?: string;
}

function ChipSelector({ options, selected, multi = false, onSelect, accentColor = BLUE }: ChipProps) {
  const isSelected = (opt: string) =>
    multi
      ? (selected as string[]).includes(opt)
      : selected === opt;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          style={{
            borderWidth: 1,
            borderColor: isSelected(opt) ? accentColor : BLUE_BORDER,
            backgroundColor: isSelected(opt) ? `${accentColor}26` : BLUE_DIM,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 7,
          }}
        >
          <Text style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: isSelected(opt) ? accentColor : MUTED,
          }}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── ACTIVITY GRID ────────────────────────────────────────────────────────────
interface ActivityGridProps {
  selected: string[];
  onSelect: (val: string) => void;
}

function ActivityGrid({ selected, onSelect }: ActivityGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {ACTIVITIES.map(act => {
        const on = selected.includes(act);
        return (
          <TouchableOpacity
            key={act}
            onPress={() => onSelect(act)}
            style={{
              width: ACTIVITY_COL_W,
              borderWidth: 1,
              borderColor: on ? BLUE : BLUE_BORDER,
              backgroundColor: on ? BLUE_DIM : 'transparent',
              borderRadius: 8,
              paddingHorizontal: 6,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontFamily: F.mono,
              fontSize: 10,
              color: on ? BLUE : MUTED,
              textAlign: 'center',
            }}>
              {act}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── FIELD LABEL ─────────────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return (
    <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginBottom: 8 }}>
      {text}
    </Text>
  );
}

// ─── FLOW TYPE ───────────────────────────────────────────────────────────────
type FlowStep =
  | 'north_star_intro'
  | 'briefing_1' | 'block_1'
  | 'briefing_2' | 'block_2'
  | 'briefing_3' | 'block_3'
  | 'briefing_4' | 'block_4'
  | 'pass1_complete'
  | 'briefing_5' | 'block_5'
  | 'briefing_6' | 'block_6'
  | 'briefing_7' | 'block_7'
  | 'briefing_8' | 'block_8'
  | 'membrane_complete';

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  // ── Auth
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ── Flow
  const [step, setStep] = useState<FlowStep>('north_star_intro');

  // ── Focus tracking
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── Saving
  const [saving, setSaving] = useState(false);

  // ── Block 1
  const [conciergeName,   setConciergeName]   = useState('');
  const [biologicalSex,   setBiologicalSex]   = useState('');
  const [birthYear,       setBirthYear]       = useState('');
  const [homeLocation,    setHomeLocation]    = useState('');

  // ── Block 2
  const [aliveBestDay,        setAliveBestDay]        = useState('');
  const [aliveBuildingToward, setAliveBuildingToward] = useState('');
  const [aliveQuietActivity,  setAliveQuietActivity]  = useState('');
  const [aliveMostYourself,   setAliveMostYourself]   = useState<string[]>([]);
  const [aliveBodySurprises,  setAliveBodySurprises]  = useState('');

  // ── Block 3
  const [activities,        setActivities]        = useState<string[]>([]);
  const [trainingFrequency, setTrainingFrequency] = useState('');
  const [trainingPhase,     setTrainingPhase]     = useState('');
  const [trainsOthers,      setTrainsOthers]      = useState('');

  // ── Block 4
  const [foodAllergies,     setFoodAllergies]     = useState('');
  const [allergiesNa,       setAllergiesNa]       = useState(false);
  const [medications,       setMedications]       = useState('');
  const [medicationsNa,     setMedicationsNa]     = useState(false);
  const [medicalConditions, setMedicalConditions] = useState('');
  const [conditionsNa,      setConditionsNa]      = useState(false);
  const [dietaryApproach,   setDietaryApproach]   = useState('');
  const [supplementStack,   setSupplementStack]   = useState('');
  const [supplementsNa,     setSupplementsNa]     = useState(false);

  // ── Block 5
  const [wearables,          setWearables]          = useState<string[]>([]);
  const [ouraToken,          setOuraToken]           = useState('');
  const [garminExportReady,  setGarminExportReady]  = useState('');

  // ── Block 6
  const [setupFor,    setSetupFor]    = useState('');
  const [petSpecies,  setPetSpecies]  = useState<string[]>([]);
  const [petNames,    setPetNames]    = useState('');

  // ── Block 7
  const [conciergeVoice, setConciergeVoice] = useState('');

  // ── Block 8
  const [northStar30d,        setNorthStar30d]        = useState('');
  const [northStar90d,        setNorthStar90d]        = useState('');
  const [northStarProtecting, setNorthStarProtecting] = useState('');

  // ── Auth bootstrap on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        }
      } catch {}
      setCheckingAuth(false);
    })();
  }, []);

  // ── Progress calculation — 27 total fields
  const completedFields = (
    // Block 1 (4)
    (conciergeName.trim()               ? 1 : 0) +
    (biologicalSex                      ? 1 : 0) +
    (birthYear.trim()                   ? 1 : 0) +
    (homeLocation.trim()                ? 1 : 0) +
    // Block 2 (5)
    (aliveBestDay.trim()                ? 1 : 0) +
    (aliveBuildingToward.trim()         ? 1 : 0) +
    (aliveQuietActivity.trim()          ? 1 : 0) +
    (aliveMostYourself.length > 0       ? 1 : 0) +
    (aliveBodySurprises.trim()          ? 1 : 0) +
    // Block 3 (4)
    (activities.length > 0              ? 1 : 0) +
    (trainingFrequency                  ? 1 : 0) +
    (trainingPhase                      ? 1 : 0) +
    (trainsOthers                       ? 1 : 0) +
    // Block 4 (5)
    ((foodAllergies.trim() || allergiesNa)        ? 1 : 0) +
    ((medications.trim()   || medicationsNa)      ? 1 : 0) +
    ((medicalConditions.trim() || conditionsNa)   ? 1 : 0) +
    (dietaryApproach                    ? 1 : 0) +
    ((supplementStack.trim() || supplementsNa)    ? 1 : 0) +
    // Block 5 (3)
    (wearables.length > 0               ? 1 : 0) +
    (ouraToken.trim()                   ? 1 : 0) +
    (garminExportReady                  ? 1 : 0) +
    // Block 6 (2)
    (setupFor                           ? 1 : 0) +
    ((petSpecies.length > 0 || setupFor === 'Just me') ? 1 : 0) +
    // Block 7 (1)
    (conciergeVoice                     ? 1 : 0) +
    // Block 8 (3)
    (northStar30d.trim()                ? 1 : 0) +
    (northStar90d.trim()                ? 1 : 0) +
    (northStarProtecting.trim()         ? 1 : 0)
  );

  // ── Activity toggle
  const toggleActivity = (act: string) => {
    const next = activities.includes(act)
      ? activities.filter(a => a !== act)
      : [...activities, act];
    setActivities(next);
    saveField('activities', next);
  };

  // ── alive_most_yourself toggle
  const toggleMostYourself = (val: string) => {
    const next = aliveMostYourself.includes(val)
      ? aliveMostYourself.filter(v => v !== val)
      : [...aliveMostYourself, val];
    setAliveMostYourself(next);
    saveField('alive_most_yourself', next);
  };

  // ── Allergen chip append
  const appendAllergen = (chip: string) => {
    const current = foodAllergies.trim();
    const next = current ? `${current}, ${chip}` : chip;
    setFoodAllergies(next);
    setAllergiesNa(false);
    saveField('food_allergies', next);
  };

  // ── Wearable toggle
  const toggleWearable = (w: string) => {
    const next = wearables.includes(w)
      ? wearables.filter(x => x !== w)
      : [...wearables, w];
    setWearables(next);
    saveField('wearables', next);
  };

  // ── Pet species toggle
  const togglePetSpecies = (s: string) => {
    if (s === 'No pets') {
      const next = ['No pets'];
      setPetSpecies(next);
      saveField('pet_species', next);
    } else {
      const filtered = petSpecies.filter(x => x !== 'No pets');
      const next = filtered.includes(s)
        ? filtered.filter(x => x !== s)
        : [...filtered, s];
      setPetSpecies(next);
      saveField('pet_species', next);
    }
  };

  // ── Membrane complete
  const handleMembraneComplete = async () => {
    setSaving(true);
    await saveField('membrane_complete', true);
    setSaving(false);
    router.replace('/');
  };

  // ── Loading
  if (checkingAuth) {
    return (
      <SafeAreaView style={st.root}>
        <ActivityIndicator size="large" color={BLUE} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.root}>
      <MembraneProgressBar
        completed={completedFields}
        total={27}
        onPress={() => setStep('north_star_intro')}
      />

      {/* ── NORTH STAR INTRO ─────────────────────────────────────────────── */}
      {step === 'north_star_intro' && (
        <ScrollView contentContainerStyle={st.northWrap} keyboardShouldPersistTaps="handled">
          <Text style={st.northQuote}>
            "The more of yourself you bring to this system — the more the system's mirror can reflect back to you."
          </Text>
          <Text style={st.northSub}>
            5 MINUTES. 8 QUESTIONS. ONE MEMBRANE.
          </Text>
          <TouchableOpacity style={st.northBtn} onPress={() => setStep('briefing_1')} activeOpacity={0.85}>
            <Text style={st.northBtnText}>BUILD MY MEMBRANE →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── BRIEFING CARDS ───────────────────────────────────────────────── */}
      {step === 'briefing_1' && (
        <BriefingCard
          blockLabel="BLOCK 1 · IDENTITY"
          text="Before anything else, I need to know who I'm speaking to. Not for a database. So everything I do from here sounds like it was made for you. Because it was."
          onBegin={() => setStep('block_1')}
        />
      )}
      {step === 'briefing_2' && (
        <BriefingCard
          blockLabel="BLOCK 2 · THE ALIVE LAYER"
          text="Most systems ask what's wrong with you. I'm asking what's right. Your best day, your best feeling, what your body does that still surprises you — that becomes my ceiling. Every scan is measured against your peak. Not a population average."
          onBegin={() => setStep('block_2')}
        />
      )}
      {step === 'briefing_3' && (
        <BriefingCard
          blockLabel="BLOCK 3 · ACTIVITY"
          text="A skydiver's heart rate on jump day looks like a crisis to a hospital. I'll know it's Tuesday. Tell me what your body does — I'll know what normal looks like for you."
          onBegin={() => setStep('block_3')}
        />
      )}
      {step === 'briefing_4' && (
        <BriefingCard
          blockLabel="BLOCK 4 · GUARD RAILS"
          text="Now tell me what to protect you from. No allergies, no medications, no conditions — that is not an empty answer. A clean baseline is some of the most powerful data I can hold. N/A here means confirmed clear. I treat it that way."
          onBegin={() => setStep('block_4')}
        />
      )}
      {step === 'briefing_5' && (
        <BriefingCard
          blockLabel="BLOCK 5 · HARDWARE"
          text="Tell me what is connected. The more signal I receive, the more precise I become. But even without hardware, the membrane works. Start with what you have."
          onBegin={() => setStep('block_5')}
        />
      )}
      {step === 'briefing_6' && (
        <BriefingCard
          blockLabel="BLOCK 6 · FAMILY & SPECIES"
          text="Now tell me who else you are protecting. The membrane extends to everyone in your care — family, dogs, horses, livestock. One account. Every signal."
          onBegin={() => setStep('block_6')}
        />
      )}
      {step === 'briefing_7' && (
        <BriefingCard
          blockLabel="BLOCK 7 · YOUR VOICE"
          text="Last thing before the North Star. Choose how I speak to you. This does not change what I know. It changes how I deliver it."
          onBegin={() => setStep('block_7')}
        />
      )}
      {step === 'briefing_8' && (
        <BriefingCard
          blockLabel="BLOCK 8 · NORTH STAR"
          text="These last three questions never get shown back to you as data. They shape everything I do quietly. Answer them honestly. They are just for the system."
          onBegin={() => setStep('block_8')}
        />
      )}

      {/* ── BLOCK 1 · IDENTITY ───────────────────────────────────────────── */}
      {step === 'block_1' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 1 · IDENTITY</Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT NAME SHOULD THE CONCIERGE CALL YOU?" />
              <TextInput
                style={[st.input, {
                  borderColor: fieldBorder(conciergeName, focusedField === 'concierge_name'),
                  opacity: fieldOpacity(conciergeName, focusedField === 'concierge_name'),
                }]}
                placeholderTextColor={MUTED}
                value={conciergeName}
                onChangeText={setConciergeName}
                onFocus={() => setFocusedField('concierge_name')}
                onBlur={() => { setFocusedField(null); saveField('concierge_name', conciergeName); }}
                autoCapitalize="words"
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="BIOLOGICAL SEX" />
              <ChipSelector
                options={['Male','Female','Intersex','Prefer not to say']}
                selected={biologicalSex}
                onSelect={v => { setBiologicalSex(v); saveField('biological_sex', v); }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="YEAR OF BIRTH" />
              <TextInput
                style={[st.input, {
                  borderColor: fieldBorder(birthYear, focusedField === 'birth_year'),
                  opacity: fieldOpacity(birthYear, focusedField === 'birth_year'),
                }]}
                placeholderTextColor={MUTED}
                value={birthYear}
                onChangeText={setBirthYear}
                onFocus={() => setFocusedField('birth_year')}
                onBlur={() => { setFocusedField(null); saveField('birth_year', birthYear ? parseInt(birthYear, 10) : null); }}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHERE ARE YOU BASED?" />
              <TextInput
                style={[st.input, {
                  borderColor: fieldBorder(homeLocation, focusedField === 'home_location'),
                  opacity: fieldOpacity(homeLocation, focusedField === 'home_location'),
                }]}
                placeholder="City, Country"
                placeholderTextColor={MUTED}
                value={homeLocation}
                onChangeText={setHomeLocation}
                onFocus={() => setFocusedField('home_location')}
                onBlur={() => { setFocusedField(null); saveField('home_location', homeLocation); }}
              />
            </View>

            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('briefing_2')} activeOpacity={0.85}>
              <Text style={st.nextBtnText}>NEXT →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── BLOCK 2 · THE ALIVE LAYER ────────────────────────────────────── */}
      {step === 'block_2' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 2 · THE ALIVE LAYER</Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT DOES YOUR BEST PHYSICAL DAY FEEL LIKE?" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: fieldBorder(aliveBestDay, focusedField === 'alive_best_day'),
                  opacity: fieldOpacity(aliveBestDay, focusedField === 'alive_best_day'),
                }]}
                placeholderTextColor={MUTED}
                value={aliveBestDay}
                onChangeText={setAliveBestDay}
                onFocus={() => setFocusedField('alive_best_day')}
                onBlur={() => { setFocusedField(null); saveField('alive_best_day', aliveBestDay); }}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT ARE YOU CURRENTLY BUILDING TOWARD?" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: fieldBorder(aliveBuildingToward, focusedField === 'alive_building_toward'),
                  opacity: fieldOpacity(aliveBuildingToward, focusedField === 'alive_building_toward'),
                }]}
                placeholderTextColor={MUTED}
                value={aliveBuildingToward}
                onChangeText={setAliveBuildingToward}
                onFocus={() => setFocusedField('alive_building_toward')}
                onBlur={() => { setFocusedField(null); saveField('alive_building_toward', aliveBuildingToward); }}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT ACTIVITY MAKES YOUR MIND GO COMPLETELY QUIET?" />
              <TextInput
                style={[st.input, {
                  borderColor: fieldBorder(aliveQuietActivity, focusedField === 'alive_quiet_activity'),
                  opacity: fieldOpacity(aliveQuietActivity, focusedField === 'alive_quiet_activity'),
                }]}
                placeholderTextColor={MUTED}
                value={aliveQuietActivity}
                onChangeText={setAliveQuietActivity}
                onFocus={() => setFocusedField('alive_quiet_activity')}
                onBlur={() => { setFocusedField(null); saveField('alive_quiet_activity', aliveQuietActivity); }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHEN DO YOU FEEL MOST LIKE YOURSELF?" />
              <ChipSelector
                options={['After training','In nature','After rest','Early morning','Late night','In competition']}
                selected={aliveMostYourself}
                multi
                onSelect={toggleMostYourself}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT DOES YOUR BODY DO THAT STILL SURPRISES YOU?" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: fieldBorder(aliveBodySurprises, focusedField === 'alive_body_surprises'),
                  opacity: fieldOpacity(aliveBodySurprises, focusedField === 'alive_body_surprises'),
                }]}
                placeholderTextColor={MUTED}
                value={aliveBodySurprises}
                onChangeText={setAliveBodySurprises}
                onFocus={() => setFocusedField('alive_body_surprises')}
                onBlur={() => { setFocusedField(null); saveField('alive_body_surprises', aliveBodySurprises); }}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('briefing_3')} activeOpacity={0.85}>
              <Text style={st.nextBtnText}>NEXT →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── BLOCK 3 · ACTIVITY ───────────────────────────────────────────── */}
      {step === 'block_3' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 3 · ACTIVITY</Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="PRIMARY ACTIVITIES — SELECT ALL THAT APPLY" />
              <ActivityGrid selected={activities} onSelect={toggleActivity} />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="TRAINING FREQUENCY" />
              <ChipSelector
                options={['1-2 days','3-4 days','5-6 days','Daily','Varies']}
                selected={trainingFrequency}
                onSelect={v => { setTrainingFrequency(v); saveField('training_frequency', v); }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="CURRENT TRAINING PHASE" />
              <ChipSelector
                options={['Building','Peak','Recovery','Off-season','Maintenance','No structured training']}
                selected={trainingPhase}
                onSelect={v => { setTrainingPhase(v); saveField('training_phase', v); }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="DO YOU TRAIN OTHERS?" />
              <ChipSelector
                options={['Yes — athletes','Yes — general','Yes — tactical','No']}
                selected={trainsOthers}
                onSelect={v => {
                  setTrainsOthers(v);
                  saveField('trains_others', v);
                  if (v.startsWith('Yes')) {
                    saveField('commander_layer_active', true);
                  }
                }}
              />
            </View>

            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('briefing_4')} activeOpacity={0.85}>
              <Text style={st.nextBtnText}>NEXT →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── BLOCK 4 · GUARD RAILS ────────────────────────────────────────── */}
      {step === 'block_4' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 4 · GUARD RAILS</Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="KNOWN FOOD ALLERGIES" />
              <TextInput
                style={[st.input, {
                  borderColor: allergiesNa ? GREEN : fieldBorder(foodAllergies, focusedField === 'food_allergies'),
                  opacity: allergiesNa ? 1 : fieldOpacity(foodAllergies, focusedField === 'food_allergies'),
                }]}
                placeholderTextColor={MUTED}
                value={foodAllergies}
                onChangeText={v => { setFoodAllergies(v); setAllergiesNa(false); }}
                onFocus={() => setFocusedField('food_allergies')}
                onBlur={() => { setFocusedField(null); saveField('food_allergies', foodAllergies); }}
                editable={!allergiesNa}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {ALLERGEN_CHIPS.map(chip => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => appendAllergen(chip)}
                    style={{
                      borderWidth: 1,
                      borderColor: BLUE_BORDER,
                      backgroundColor: BLUE_DIM,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontFamily: F.mono, fontSize: 10, color: BLUE }}>+ {chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <NAChip
                label="No Known Allergies"
                selected={allergiesNa}
                onPress={() => {
                  const next = !allergiesNa;
                  setAllergiesNa(next);
                  if (next) {
                    setFoodAllergies('N/A');
                    saveField('food_allergies', 'N/A');
                    saveField('allergies_na', true);
                  } else {
                    setFoodAllergies('');
                    saveField('allergies_na', false);
                  }
                }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="CURRENT MEDICATIONS" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: medicationsNa ? GREEN : fieldBorder(medications, focusedField === 'medications'),
                  opacity: medicationsNa ? 1 : fieldOpacity(medications, focusedField === 'medications'),
                }]}
                placeholderTextColor={MUTED}
                value={medications}
                onChangeText={v => { setMedications(v); setMedicationsNa(false); }}
                onFocus={() => setFocusedField('medications')}
                onBlur={() => { setFocusedField(null); saveField('medications', medications); }}
                multiline
                textAlignVertical="top"
                editable={!medicationsNa}
              />
              <NAChip
                label="No Current Medications"
                selected={medicationsNa}
                onPress={() => {
                  const next = !medicationsNa;
                  setMedicationsNa(next);
                  if (next) {
                    setMedications('N/A');
                    saveField('medications', 'N/A');
                    saveField('medications_na', true);
                  } else {
                    setMedications('');
                    saveField('medications_na', false);
                  }
                }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="KNOWN MEDICAL CONDITIONS" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: conditionsNa ? GREEN : fieldBorder(medicalConditions, focusedField === 'medical_conditions'),
                  opacity: conditionsNa ? 1 : fieldOpacity(medicalConditions, focusedField === 'medical_conditions'),
                }]}
                placeholderTextColor={MUTED}
                value={medicalConditions}
                onChangeText={v => { setMedicalConditions(v); setConditionsNa(false); }}
                onFocus={() => setFocusedField('medical_conditions')}
                onBlur={() => { setFocusedField(null); saveField('medical_conditions', medicalConditions); }}
                multiline
                textAlignVertical="top"
                editable={!conditionsNa}
              />
              <NAChip
                label="No Known Conditions"
                selected={conditionsNa}
                onPress={() => {
                  const next = !conditionsNa;
                  setConditionsNa(next);
                  if (next) {
                    setMedicalConditions('N/A');
                    saveField('medical_conditions', 'N/A');
                    saveField('conditions_na', true);
                  } else {
                    setMedicalConditions('');
                    saveField('conditions_na', false);
                  }
                }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="DIETARY APPROACH" />
              <ChipSelector
                options={['Omnivore','Vegetarian','Vegan','Keto','Paleo','Halal','Kosher','Gluten-Free','No Restriction','Other']}
                selected={dietaryApproach}
                onSelect={v => { setDietaryApproach(v); saveField('dietary_approach', v); }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="SUPPLEMENT STACK (OPTIONAL)" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: supplementsNa ? GREEN : fieldBorder(supplementStack, focusedField === 'supplement_stack'),
                  opacity: supplementsNa ? 1 : fieldOpacity(supplementStack, focusedField === 'supplement_stack'),
                }]}
                placeholderTextColor={MUTED}
                value={supplementStack}
                onChangeText={v => { setSupplementStack(v); setSupplementsNa(false); }}
                onFocus={() => setFocusedField('supplement_stack')}
                onBlur={() => { setFocusedField(null); saveField('supplement_stack', supplementStack); }}
                multiline
                textAlignVertical="top"
                editable={!supplementsNa}
              />
              <NAChip
                label="No Supplements"
                selected={supplementsNa}
                onPress={() => {
                  const next = !supplementsNa;
                  setSupplementsNa(next);
                  if (next) {
                    setSupplementStack('N/A');
                    saveField('supplement_stack', 'N/A');
                    saveField('supplements_na', true);
                  } else {
                    setSupplementStack('');
                    saveField('supplements_na', false);
                  }
                }}
              />
            </View>

            <TouchableOpacity
              style={[st.nextBtn, { opacity: saving ? 0.6 : 1 }]}
              onPress={() => { if (!saving) setStep('pass1_complete'); }}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator size="small" color="#03050A" />
                : <Text style={st.nextBtnText}>COMPLETE PASS 1 →</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── PASS 1 COMPLETE ──────────────────────────────────────────────── */}
      {step === 'pass1_complete' && (
        <View style={st.completeOuter}>
          <Text style={st.completeEyebrow}>MEMBRANE PROGRESS · PASS 1 OF 2</Text>
          <Text style={st.completeTitle}>Good.</Text>
          <Text style={st.completeBody}>
            Half your membrane is built.{'\n'}The rest waits when you're ready.
          </Text>
          <View style={st.completePbTrack}>
            <View style={[st.completePbFill, { width: '50%' }]} />
          </View>
          <TouchableOpacity
            style={st.completeBtn}
            onPress={() => setStep('briefing_5')}
            activeOpacity={0.85}
          >
            <Text style={st.completeBtnText}>CONTINUE WHEN READY →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep('block_4')}
            style={{ marginTop: 16, paddingVertical: 12, alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: 'DMMono-Regular', fontSize: 11, color: MUTED, letterSpacing: 2 }}>
              ← BACK TO BLOCK 4
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BLOCK 5 · BIOSIGNAL HARDWARE ─────────────────────────────────── */}
      {step === 'block_5' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 5 · BIOSIGNAL HARDWARE</Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHICH WEARABLES DO YOU USE?" />
              <ChipSelector
                options={['Garmin','Oura Ring','Apple Watch','Whoop','Fitbit','Polar','Samsung Watch','None']}
                selected={wearables}
                multi
                onSelect={toggleWearable}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="OURA PERSONAL API TOKEN" />
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED, marginBottom: 8 }}>
                cloud.ouraring.com/personal-access-tokens
              </Text>
              {wearables.includes('Oura Ring') ? (
                <TextInput
                  style={[st.input, {
                    borderColor: fieldBorder(ouraToken, focusedField === 'oura_token'),
                    opacity: fieldOpacity(ouraToken, focusedField === 'oura_token'),
                  }]}
                  placeholder="Paste token here"
                  placeholderTextColor={MUTED}
                  value={ouraToken}
                  onChangeText={setOuraToken}
                  onFocus={() => setFocusedField('oura_token')}
                  onBlur={() => { setFocusedField(null); saveField('oura_token', ouraToken); }}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              ) : (
                <View style={[st.input, { opacity: 0.4, justifyContent: 'center' }]}>
                  <Text style={{ fontFamily: F.mono, fontSize: 11, color: MUTED, letterSpacing: 1 }}>
                    CONNECT OURA RING ABOVE TO ACTIVATE
                  </Text>
                </View>
              )}
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="GARMIN DATA EXPORT READY?" />
              <ChipSelector
                options={['Yes','Not yet','Skip for now']}
                selected={garminExportReady}
                onSelect={v => { setGarminExportReady(v); saveField('garmin_export_ready', v); }}
              />
            </View>

            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('briefing_6')} activeOpacity={0.85}>
              <Text style={st.nextBtnText}>NEXT →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── BLOCK 6 · FAMILY & SPECIES ───────────────────────────────────── */}
      {step === 'block_6' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 6 · FAMILY & SPECIES</Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="SETTING THIS UP FOR" />
              <ChipSelector
                options={['Just me','Me + family','Family account']}
                selected={setupFor}
                onSelect={v => { setSetupFor(v); saveField('setup_for', v); }}
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="DO YOU HAVE PETS OR ANIMALS IN YOUR CARE?" />
              <ChipSelector
                options={['Dog','Cat','Horse','Cattle','Other','No pets']}
                selected={petSpecies}
                multi
                onSelect={togglePetSpecies}
              />
            </View>

            {petSpecies.length > 0 && !petSpecies.includes('No pets') && (
              <View style={st.fieldGroup}>
                <FieldLabel text="PET NAMES" />
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED, marginBottom: 8 }}>
                  One per line or comma separated
                </Text>
                <TextInput
                  style={[st.inputMulti, {
                    borderColor: fieldBorder(petNames, focusedField === 'pet_names'),
                    opacity: fieldOpacity(petNames, focusedField === 'pet_names'),
                  }]}
                  placeholder="e.g. Max, Luna, Scout"
                  placeholderTextColor={MUTED}
                  value={petNames}
                  onChangeText={setPetNames}
                  onFocus={() => setFocusedField('pet_names')}
                  onBlur={() => { setFocusedField(null); saveField('pet_names', petNames); }}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}

            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('briefing_7')} activeOpacity={0.85}>
              <Text style={st.nextBtnText}>NEXT →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── BLOCK 7 · YOUR VOICE ─────────────────────────────────────────── */}
      {step === 'block_7' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
          <Text style={st.blockHeader}>BLOCK 7 · YOUR VOICE</Text>

          <View style={st.fieldGroup}>
            <FieldLabel text="HOW SHOULD THE CONCIERGE SPEAK TO YOU?" />
            <View style={{ gap: 12, marginTop: 8 }}>
              {([
                { value: 'The Coach',  title: 'THE COACH',  desc: 'Direct, motivating, holds you accountable' },
                { value: 'The Stable', title: 'THE STABLE', desc: 'Calm, steady, no noise unless necessary' },
                { value: 'COMMAND',    title: 'COMMAND',    desc: 'Tactical, minimal, ops-ready' },
                { value: 'THE BRIEF',  title: 'THE BRIEF',  desc: 'Executive, fast, only what matters' },
              ] as const).map(card => {
                const on = conciergeVoice === card.value;
                return (
                  <TouchableOpacity
                    key={card.value}
                    onPress={() => { setConciergeVoice(card.value); saveField('concierge_personality', card.value); }}
                    style={{
                      borderRadius: 14,
                      padding: 20,
                      borderWidth: 1.5,
                      borderColor: on ? BLUE : BLUE_BORDER,
                      backgroundColor: on ? 'rgba(27,184,255,0.10)' : CARD_BG,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontFamily: F.monoMd, fontSize: 14, color: WHITE, letterSpacing: 2 }}>
                      {card.title}
                    </Text>
                    <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginTop: 6 }}>
                      {card.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[st.nextBtn, { opacity: conciergeVoice ? 1 : 0.4 }]}
            onPress={() => { if (conciergeVoice) setStep('briefing_8'); }}
            activeOpacity={0.85}
          >
            <Text style={st.nextBtnText}>NEXT →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── BLOCK 8 · NORTH STAR ─────────────────────────────────────────── */}
      {step === 'block_8' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={st.blockWrap} keyboardShouldPersistTaps="handled">
            <Text style={st.blockHeader}>BLOCK 8 · NORTH STAR</Text>

            <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginBottom: 24, lineHeight: 20 }}>
              These answers are never shown back to you as data. They shape everything the system does quietly.
            </Text>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT DO YOU WANT TO FEEL IN 30 DAYS THAT YOU DO NOT FEEL TODAY?" />
              <TextInput
                style={[st.inputMulti, {
                  minHeight: 100,
                  borderColor: fieldBorder(northStar30d, focusedField === 'north_star_30d'),
                  opacity: fieldOpacity(northStar30d, focusedField === 'north_star_30d'),
                }]}
                placeholderTextColor={MUTED}
                value={northStar30d}
                onChangeText={setNorthStar30d}
                onFocus={() => setFocusedField('north_star_30d')}
                onBlur={() => { setFocusedField(null); saveField('north_star_30d', northStar30d); }}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHAT WOULD MAKE THE NEXT 90 DAYS THE BEST QUARTER OF YOUR LIFE?" />
              <TextInput
                style={[st.inputMulti, {
                  minHeight: 100,
                  borderColor: fieldBorder(northStar90d, focusedField === 'north_star_90d'),
                  opacity: fieldOpacity(northStar90d, focusedField === 'north_star_90d'),
                }]}
                placeholderTextColor={MUTED}
                value={northStar90d}
                onChangeText={setNorthStar90d}
                onFocus={() => setFocusedField('north_star_90d')}
                onBlur={() => { setFocusedField(null); saveField('north_star_90d', northStar90d); }}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={st.fieldGroup}>
              <FieldLabel text="WHO ARE YOU PROTECTING WITH THIS SYSTEM?" />
              <TextInput
                style={[st.inputMulti, {
                  borderColor: fieldBorder(northStarProtecting, focusedField === 'north_star_protecting'),
                  opacity: fieldOpacity(northStarProtecting, focusedField === 'north_star_protecting'),
                }]}
                placeholder="Your name, your family, your dog, your unit..."
                placeholderTextColor={MUTED}
                value={northStarProtecting}
                onChangeText={setNorthStarProtecting}
                onFocus={() => setFocusedField('north_star_protecting')}
                onBlur={() => { setFocusedField(null); saveField('north_star_protecting', northStarProtecting); }}
                multiline
                textAlignVertical="top"
              />
              <Text style={{
                fontFamily: F.serifIt,
                fontSize: 16,
                color: BLUE,
                textAlign: 'center',
                marginTop: 16,
                marginBottom: 8,
              }}>
                The membrane holds what matters.
              </Text>
            </View>

            <TouchableOpacity
              style={[st.sealBtn, { opacity: saving ? 0.6 : 1 }]}
              onPress={() => { if (!saving) { setSaving(true); saveField('membrane_complete', false).then(() => { setSaving(false); setStep('membrane_complete'); }); } }}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#03050A" />
                : <Text style={st.sealBtnText}>SEAL THE MEMBRANE →</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── MEMBRANE COMPLETE ─────────────────────────────────────────────── */}
      {step === 'membrane_complete' && (
        <View style={st.completeOuter}>
          <Text style={st.completeEyebrow}>MEMBRANE SEALED · AA2 ACTIVE</Text>
          <Text style={{ fontFamily: F.serifIt, fontSize: 64, color: WHITE, textAlign: 'center', marginBottom: 8 }}>
            The membrane holds.
          </Text>
          <Text style={{ fontFamily: F.sans, fontSize: 15, color: MUTED, textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
            {northStarProtecting.trim()
              ? `Protecting: ${northStarProtecting.trim()}`
              : 'Every scan from here is yours alone.'
            }
          </Text>
          <View style={[st.completePbTrack, { marginBottom: 40 }]}>
            <View style={[st.completePbFill, { width: '100%', backgroundColor: GREEN }]} />
          </View>
          <TouchableOpacity
            style={[st.completeBtn, { opacity: saving ? 0.6 : 1 }]}
            onPress={handleMembraneComplete}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#03050A" />
              : <Text style={st.completeBtnText}>ENTER AA2 →</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  // North star
  northWrap: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  northQuote: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    color: WHITE,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 32,
  },
  northSub: {
    fontFamily: 'DMMono-Regular',
    fontSize: 11,
    color: BLUE,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 48,
  },
  northBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  northBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 13,
    color: '#03050A',
    letterSpacing: 2,
  },

  // Block layout
  blockWrap: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
  },
  blockHeader: {
    fontFamily: 'DMMono-Regular',
    fontSize: 9,
    color: BLUE,
    letterSpacing: 3,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 28,
  },

  // Inputs
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    color: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
  },
  inputMulti: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    color: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Next button
  nextBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  nextBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 13,
    color: '#03050A',
    letterSpacing: 2,
  },

  // Seal button (block 8)
  sealBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  sealBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 14,
    color: '#03050A',
    letterSpacing: 2,
  },

  // Complete screens
  completeOuter: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeEyebrow: {
    fontFamily: 'DMMono-Regular',
    fontSize: 10,
    color: BLUE,
    letterSpacing: 3,
    marginBottom: 24,
    textAlign: 'center',
  },
  completeTitle: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 52,
    color: WHITE,
    marginBottom: 16,
  },
  completeBody: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  completePbTrack: {
    height: 4,
    width: '100%',
    backgroundColor: BLUE_DIM,
    borderRadius: 2,
    marginBottom: 40,
    overflow: 'hidden',
  },
  completePbFill: {
    height: 4,
    backgroundColor: GREEN,
    borderRadius: 2,
  },
  completeBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  completeBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 13,
    color: '#03050A',
    letterSpacing: 2,
  },
});
