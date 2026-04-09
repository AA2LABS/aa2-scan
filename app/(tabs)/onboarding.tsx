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
      <View style={{ height: 4, width: `${pct * 100}%` as any, backgroundColor: BLUE }} />
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
  | 'pass1_complete';

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
  const [activities,         setActivities]         = useState<string[]>([]);
  const [trainingFrequency,  setTrainingFrequency]  = useState('');
  const [trainingPhase,      setTrainingPhase]      = useState('');
  const [trainsOthers,       setTrainsOthers]       = useState('');

  // ── Block 4
  const [foodAllergies,    setFoodAllergies]    = useState('');
  const [allergiesNa,      setAllergiesNa]      = useState(false);
  const [medications,      setMedications]      = useState('');
  const [medicationsNa,    setMedicationsNa]    = useState(false);
  const [medicalConditions,setMedicalConditions]= useState('');
  const [conditionsNa,     setConditionsNa]     = useState(false);
  const [dietaryApproach,  setDietaryApproach]  = useState('');
  const [supplementStack,  setSupplementStack]  = useState('');
  const [supplementsNa,    setSupplementsNa]    = useState(false);

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

  // ── Progress calculation — 18 total fields
  const completedFields = (
    (conciergeName.trim()            ? 1 : 0) +
    (biologicalSex                   ? 1 : 0) +
    (birthYear.trim()                ? 1 : 0) +
    (homeLocation.trim()             ? 1 : 0) +
    (aliveBestDay.trim()             ? 1 : 0) +
    (aliveBuildingToward.trim()      ? 1 : 0) +
    (aliveQuietActivity.trim()       ? 1 : 0) +
    (aliveMostYourself.length > 0    ? 1 : 0) +
    (aliveBodySurprises.trim()       ? 1 : 0) +
    (activities.length > 0           ? 1 : 0) +
    (trainingFrequency               ? 1 : 0) +
    (trainingPhase                   ? 1 : 0) +
    (trainsOthers                    ? 1 : 0) +
    ((foodAllergies.trim() || allergiesNa)   ? 1 : 0) +
    ((medications.trim()   || medicationsNa) ? 1 : 0) +
    ((medicalConditions.trim() || conditionsNa) ? 1 : 0) +
    (dietaryApproach                 ? 1 : 0) +
    ((supplementStack.trim() || supplementsNa) ? 1 : 0)
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

  // ── Pass 1 complete
  const handlePass1Complete = async () => {
    setSaving(true);
    await saveField('membrane_pass1_complete', true);
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
        total={18}
        onPress={() => setStep('north_star_intro')}
      />

      {/* ── NORTH STAR INTRO ─────────────────────────────────────────────── */}
      {step === 'north_star_intro' && (
        <ScrollView
          contentContainerStyle={st.northWrap}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={st.northQuote}>
            "The more of yourself you bring to this system — the more the system's mirror can reflect back to you."
          </Text>
          <Text style={st.northSub}>
            5 MINUTES. 8 QUESTIONS. ONE MEMBRANE.
          </Text>
          <TouchableOpacity
            style={st.northBtn}
            onPress={() => setStep('briefing_1')}
            activeOpacity={0.85}
          >
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
                onSelect={v => { setTrainsOthers(v); saveField('trains_others', v); }}
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

            {/* food_allergies */}
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

            {/* medications */}
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

            {/* medical_conditions */}
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

            {/* dietary_approach */}
            <View style={st.fieldGroup}>
              <FieldLabel text="DIETARY APPROACH" />
              <ChipSelector
                options={['Omnivore','Vegetarian','Vegan','Keto','Paleo','Halal','Kosher','Gluten-Free','No Restriction','Other']}
                selected={dietaryApproach}
                onSelect={v => { setDietaryApproach(v); saveField('dietary_approach', v); }}
              />
            </View>

            {/* supplement_stack */}
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
            style={[st.completeBtn, { opacity: saving ? 0.6 : 1 }]}
            onPress={handlePass1Complete}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#03050A" />
              : <Text style={st.completeBtnText}>CONTINUE WHEN READY →</Text>
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

  // Pass 1 complete
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
