import { supabase } from '@/lib/supabase';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/constants/theme';

// ─── CANON COLOR DOCTRINE (from index.tsx) + Sanctuary Onboarding ─────────────
const C = {
  nearBlack: '#03050a',
  gold: '#c9a84c',
  dimWhite: 'rgba(255,255,255,0.65)',
  white: '#ffffff',
};

const SANCTUARY = {
  lightBg: '#FAF7F2',
  goldAccent: '#C49A2A',
  darkBg: '#0A0804',
  warmMuted: '#6b5d4f',
  warmMutedLight: '#8a7a6a',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_SCREENS = 5; // 1 Welcome + 4 question screens
const PROGRESS_STEPS = 7;

type ColorMode = 'light' | 'system' | 'dark';
type DeliveryMode = 'video' | 'voice' | 'text';

export default function OnboardingScreen() {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>('system');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('voice');
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // ─── ONBOARDING FORM STATE ───────────────────────────────────────────────────
  const [preferredName, setPreferredName] = useState('');
  const [protecting, setProtecting] = useState<string[]>([]);
  const [speciesInCare, setSpeciesInCare] = useState<string[]>([]);
  const [ageNotes, setAgeNotes] = useState('');

  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);
  const [visionText, setVisionText] = useState('');
  const [foodAllergens, setFoodAllergens] = useState<string[]>([]);
  const [suspectedSensitivities, setSuspectedSensitivities] = useState<string[]>([]);
  const [personalCareAllergens, setPersonalCareAllergens] = useState<string[]>([]);
  const [environmentalTriggers, setEnvironmentalTriggers] = useState<string[]>([]);

  const [conditions, setConditions] = useState<string[]>([]);
  const [activeLimits, setActiveLimits] = useState<string[]>([]);
  const [medications, setMedications] = useState('');
  const [dietTypes, setDietTypes] = useState<string[]>([]);

  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<string | null>(null);
  const [travelFrequency, setTravelFrequency] = useState<string[]>([]);
  const [hardware, setHardware] = useState<string[]>([]);
  const [animalNotes, setAnimalNotes] = useState('');
  const [biosignalNote, setBiosignalNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const effectiveDark = colorMode === 'dark' || (colorMode === 'system' && systemColorScheme === 'dark');
  const isLight = !effectiveDark;

  const bgColor =
    colorMode === 'light'
      ? '#FAF7F2'
      : colorMode === 'dark'
        ? '#0A0804'
        : systemColorScheme === 'dark'
          ? '#0A0804'
          : '#FAF7F2';
  const gold = SANCTUARY.goldAccent;
  const textPrimary = isLight ? C.nearBlack : C.white;
  const textMuted = isLight ? SANCTUARY.warmMutedLight : C.dimWhite;

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index >= 0 && index < NUM_SCREENS) setCurrentIndex(index);
  }, []);

  const toggleChip = useCallback((value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }, []);

  const handleBack = useCallback(() => {
    if (!scrollRef.current) return;
    if (currentIndex <= 0) return;
    scrollRef.current.scrollTo({ x: (currentIndex - 1) * SCREEN_WIDTH, animated: true });
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (!scrollRef.current) return;
    if (currentIndex < NUM_SCREENS - 1) {
      scrollRef.current.scrollTo({ x: (currentIndex + 1) * SCREEN_WIDTH, animated: true });
    }
  }, [currentIndex]);

  const onEnterMembrane = useCallback(async () => {
    if (currentIndex < NUM_SCREENS - 1) {
      handleNext();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error('No authenticated user');
      }

      const memberId = user.id;

      const baseResults = await Promise.all([
        supabase.from('member_profiles').upsert({
          member_id: memberId,
          name: preferredName || null,
          age: ageNotes || null,
          species_protected: protecting,
          delivery_mode: deliveryMode,
          color_mode: colorMode,
          onboarding_complete: true,
        }),
        supabase.from('goal_profiles').upsert({
          member_id: memberId,
          primary_goal: primaryGoals,
          vision_text: visionText || null,
        }),
        supabase.from('allergy_profiles').upsert({
          member_id: memberId,
          food_allergens: foodAllergens,
          suspected_sensitivities: suspectedSensitivities,
          personal_care_allergens: personalCareAllergens,
          environmental_triggers: environmentalTriggers,
        }),
        supabase.from('health_profiles').upsert({
          member_id: memberId,
          conditions: conditions,
          active_limits: activeLimits,
          medications: medications || null,
          diet_types: dietTypes,
        }),
        supabase.from('baseline_profiles').upsert({
          member_id: memberId,
          sleep_score: sleepScore ?? null,
          stress_level: stressLevel ?? null,
        }),
        supabase.from('travel_profiles').upsert({
          member_id: memberId,
          travel_frequency: travelFrequency,
        }),
        supabase.from('device_connections').upsert({
          member_id: memberId,
          hardware: hardware,
        }),
      ]);

      const firstBaseError = baseResults.find((r) => r && 'error' in r && r.error)?.error;
      if (firstBaseError) throw firstBaseError;

      if (animalNotes.trim().length > 0) {
        const animalResult = await supabase.from('animal_profiles').upsert({
          member_id: memberId,
          species: null,
          breed: null,
          age: null,
          weight: null,
          sensitivities: animalNotes.trim(),
        });
        if (animalResult.error) throw animalResult.error;
      }

      if (biosignalNote.trim().length > 0) {
        const biosignalResult = await supabase.from('biosignal_history').upsert({
          member_id: memberId,
          uploaded_file: biosignalNote.trim(),
        });
        if (biosignalResult.error) throw biosignalResult.error;
      }

      // TODO: navigate into main app if routing is wired here
    } catch (err: any) {
      console.error('Onboarding submit failed', err);
      setSubmitError(err?.message ?? 'Something went wrong saving your profile.');
    } finally {
      setSubmitting(false);
    }
  }, [
    currentIndex,
    handleNext,
    preferredName,
    ageNotes,
    protecting,
    deliveryMode,
    colorMode,
    primaryGoals,
    visionText,
    foodAllergens,
    suspectedSensitivities,
    personalCareAllergens,
    environmentalTriggers,
    conditions,
    activeLimits,
    medications,
    dietTypes,
    sleepScore,
    stressLevel,
    travelFrequency,
    hardware,
    animalNotes,
    biosignalNote,
  ]);

  // ─── SCREEN STYLE — fixed height, color-reactive ────────────────────────────
  const screenStyle = {
    width: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT,
    backgroundColor: bgColor,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]} edges={['top']}>
      {/* Progress bar */}
      <View style={[styles.progressWrap, { backgroundColor: bgColor }]}>
        <View style={styles.progressDotsRow}>
          {Array.from({ length: PROGRESS_STEPS }).map((_, i) => {
            const isActive = i === currentIndex;
            const isComplete = i < currentIndex;
            const baseColor = isLight ? SANCTUARY.lightBg : SANCTUARY.darkBg;
            return (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isActive
                      ? SANCTUARY.goldAccent
                      : isComplete
                      ? '#D4B870'
                      : baseColor,
                    borderColor: isActive || isComplete ? SANCTUARY.goldAccent : '#D4B870',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={[styles.scroll, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Screen 1: Welcome — Javier */}
        <View style={screenStyle}>
          <Text style={[styles.spokeTag, { color: gold }]}>Spoke 02 · The Membrane</Text>
          <Text
            style={[
              styles.quote,
              { color: textMuted },
              { fontFamily: Fonts.serif, fontStyle: 'italic' },
            ]}
          >
            Ahh... I see you found your way here. As they say — like attracts like.
          </Text>
          <Text style={[styles.javierName, { color: textPrimary, width: '100%' }]} numberOfLines={1} adjustsFontSizeToFit>
            CONCIERGE
          </Text>

          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, { color: textMuted }]}>Color</Text>
            <View style={styles.selectorRow}>
              {(['light', 'system', 'dark'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.selectorOption,
                    { borderColor: textMuted },
                    colorMode === mode && { backgroundColor: gold, borderColor: gold },
                  ]}
                  onPress={() => setColorMode(mode)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.selectorOptionText,
                      { color: colorMode === mode ? (isLight ? C.nearBlack : C.white) : textMuted },
                    ]}
                  >
                    {mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, { color: textMuted }]}>Delivery</Text>
            <View style={styles.selectorRow}>
              {(['video', 'voice', 'text'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.selectorOption,
                    { borderColor: textMuted },
                    deliveryMode === mode && { backgroundColor: gold, borderColor: gold },
                  ]}
                  onPress={() => setDeliveryMode(mode)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.selectorOptionText,
                      { color: deliveryMode === mode ? (isLight ? C.nearBlack : C.white) : textMuted },
                    ]}
                  >
                    {mode === 'video' ? 'Video' : mode === 'voice' ? 'Voice' : 'Text'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.enterBtn, { backgroundColor: gold }]}
            onPress={onEnterMembrane}
            activeOpacity={0.85}
          >
            <Text style={styles.enterBtnText}>Enter the Membrane</Text>
          </TouchableOpacity>

          <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
        </View>

        {/* Screen 2 — Block 1 Identity (Q1–Q4) */}
        <View style={screenStyle}>
          <Text style={[styles.blockTitle, { color: textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>Block 1 · Identity</Text>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q1 · WHAT NAME SHOULD JAVIER CALL YOU?</Text>
            <TextInput
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="First name, nickname, handle..."
              placeholderTextColor={textMuted}
              style={[
                styles.textInput,
                {
                  color: textPrimary,
                  borderColor: '#D4B870',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
                },
              ]}
            />
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q2 · WHO ARE YOU PROTECTING?</Text>
            <View style={styles.chipRowWrap}>
              {['Myself', 'Child', 'Partner', 'Aging Parent', 'Pet', 'Livestock'].map((opt) => {
                const active = protecting.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, protecting, setProtecting)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q3 · SPECIES IN YOUR CARE?</Text>
            <View style={styles.chipRowWrap}>
              {['Human', 'K9', 'Equestrian', 'Cattle'].map((opt) => {
                const active = speciesInCare.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, speciesInCare, setSpeciesInCare)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q4 · YOUR AGE — AND CHILDREN&apos;S AGES IF APPLICABLE?
            </Text>
            <TextInput
              value={ageNotes}
              onChangeText={setAgeNotes}
              placeholder="Age, and any kids' ages you'd like Javier to know..."
              placeholderTextColor={textMuted}
              style={[
                styles.textInput,
                {
                  color: textPrimary,
                  borderColor: '#D4B870',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
                },
              ]}
              multiline
            />
          </View>

          <View style={styles.navRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.navPrimaryBtn, { backgroundColor: SANCTUARY.goldAccent }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.navPrimaryText}>Next</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
        </View>

        {/* Screen 3 — Blocks 2+3 Goals + Allergens (Q5–Q10) */}
        <View style={screenStyle}>
          <Text style={[styles.blockTitle, { color: textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>Blocks 2 + 3 · Goals + Allergens</Text>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q5 · WHAT DOES WINNING LOOK LIKE IN 90 DAYS?</Text>
            <View style={styles.chipRowWrap}>
              {['Longevity', 'Weight', 'Focus', 'Recovery', 'Performance', 'Safety'].map((opt) => {
                const active = primaryGoals.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, primaryGoals, setPrimaryGoals)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q6 · IS THERE A VERSION OF YOURSELF YOU&apos;RE TRYING TO RETURN TO?
            </Text>
            <TextInput
              value={visionText}
              onChangeText={setVisionText}
              placeholder="Tell Javier about that version of you..."
              placeholderTextColor={textMuted}
              style={[
                styles.textArea,
                {
                  color: textPrimary,
                  borderColor: '#D4B870',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
                },
              ]}
              multiline
            />
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q7 · KNOWN FOOD ALLERGENS</Text>
            <View style={styles.chipRowWrap}>
              {['Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Sesame'].map((opt) => {
                const active = foodAllergens.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, foodAllergens, setFoodAllergens)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q8 · SUSPECTED SENSITIVITIES</Text>
            <View style={styles.chipRowWrap}>
              {['Bloating', 'Brain Fog', 'Inflammation', 'Skin Reactions', 'Mood Shifts'].map((opt) => {
                const active = suspectedSensitivities.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, suspectedSensitivities, setSuspectedSensitivities)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => toggleChip('+ Add', suspectedSensitivities, setSuspectedSensitivities)}
                style={[
                  styles.chip,
                  {
                    borderStyle: 'dashed',
                    borderColor: suspectedSensitivities.includes('+ Add') ? SANCTUARY.goldAccent : '#D4B870',
                    backgroundColor: suspectedSensitivities.includes('+ Add')
                      ? 'rgba(196,154,42,0.12)'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: suspectedSensitivities.includes('+ Add') ? SANCTUARY.goldAccent : textPrimary,
                    },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q9 · PERSONAL CARE ALLERGENS</Text>
            <View style={styles.chipRowWrap}>
              {[
                'Fragrance/Parfum',
                'Parabens',
                'Sulfates',
                'Formaldehyde Releasers',
                'Nickel',
                'Lanolin',
              ].map((opt) => {
                const active = personalCareAllergens.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, personalCareAllergens, setPersonalCareAllergens)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => toggleChip('+ Add', personalCareAllergens, setPersonalCareAllergens)}
                style={[
                  styles.chip,
                  {
                    borderStyle: 'dashed',
                    borderColor: personalCareAllergens.includes('+ Add') ? SANCTUARY.goldAccent : '#D4B870',
                    backgroundColor: personalCareAllergens.includes('+ Add')
                      ? 'rgba(196,154,42,0.12)'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: personalCareAllergens.includes('+ Add') ? SANCTUARY.goldAccent : textPrimary,
                    },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q10 · ENVIRONMENTAL TRIGGERS</Text>
            <View style={styles.chipRowWrap}>
              {[
                'Seasonal Pollen',
                'Mold',
                'Dust Mites',
                'Pet Dander',
                'Latex',
                'Smoke',
                'Chemicals',
              ].map((opt) => {
                const active = environmentalTriggers.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, environmentalTriggers, setEnvironmentalTriggers)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => toggleChip('+ Add', environmentalTriggers, setEnvironmentalTriggers)}
                style={[
                  styles.chip,
                  {
                    borderStyle: 'dashed',
                    borderColor: environmentalTriggers.includes('+ Add') ? SANCTUARY.goldAccent : '#D4B870',
                    backgroundColor: environmentalTriggers.includes('+ Add')
                      ? 'rgba(196,154,42,0.12)'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: environmentalTriggers.includes('+ Add') ? SANCTUARY.goldAccent : textPrimary,
                    },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navSecondaryBtn} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.navSecondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navPrimaryBtn, { backgroundColor: SANCTUARY.goldAccent }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.navPrimaryText}>Next</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
        </View>

        {/* Screen 4 — Block 4 Health Reality (Q11–Q14) */}
        <View style={screenStyle}>
          <Text style={[styles.blockTitle, { color: textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>Block 4 · Health Reality</Text>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q11 · WHAT IS YOUR BODY CURRENTLY MANAGING?
            </Text>
            <View style={styles.chipRowWrap}>
              {[
                'Hypertension',
                'Kidney Function',
                'Diabetes T1',
                'Diabetes T2',
                'Autoimmune',
                'Thyroid',
                'Heart Condition',
                'Liver',
                'Crohn\'s',
                'IBS',
                'PCOS',
                'Lupus',
              ].map((opt) => {
                const active = conditions.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, conditions, setConditions)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => toggleChip('+ Add', conditions, setConditions)}
                style={[
                  styles.chip,
                  {
                    borderStyle: 'dashed',
                    borderColor: conditions.includes('+ Add') ? SANCTUARY.goldAccent : '#D4B870',
                    backgroundColor: conditions.includes('+ Add')
                      ? 'rgba(196,154,42,0.12)'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: conditions.includes('+ Add') ? SANCTUARY.goldAccent : textPrimary },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q12 · WHAT DO YOU ACTIVELY LIMIT?
            </Text>
            <Text style={[styles.helperText, { color: textMuted }]}>
              Permanent filter on every scan from this moment forward.
            </Text>
            <View style={styles.chipRowWrap}>
              {['Sodium', 'Potassium', 'Phosphorus', 'Sugar', 'Alcohol', 'Caffeine', 'NSAIDs'].map((opt) => {
                const active = activeLimits.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, activeLimits, setActiveLimits)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => toggleChip('+ Add', activeLimits, setActiveLimits)}
                style={[
                  styles.chip,
                  {
                    borderStyle: 'dashed',
                    borderColor: activeLimits.includes('+ Add') ? SANCTUARY.goldAccent : '#D4B870',
                    backgroundColor: activeLimits.includes('+ Add')
                      ? 'rgba(196,154,42,0.12)'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: activeLimits.includes('+ Add') ? SANCTUARY.goldAccent : textPrimary },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q13 · MEDICATIONS OR SUPPLEMENTS?</Text>
            <TextInput
              value={medications}
              onChangeText={setMedications}
              placeholder="Optional — for interaction scanning..."
              placeholderTextColor={textMuted}
              style={[
                styles.textInput,
                {
                  color: textPrimary,
                  borderColor: '#D4B870',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
                },
              ]}
              multiline
            />
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q14 · YOUR DIET</Text>
            <Text style={[styles.helperText, { color: textMuted }]}>TOP 10 + more modalities below.</Text>
            <View style={styles.chipRowWrap}>
              {[
                'Mediterranean',
                'Carnivore',
                'Vegan',
                'Vegetarian',
                'Keto',
                'Gluten-Free',
                'Halal',
                'Kosher',
                'Paleo',
                'Low Sodium',
              ].map((opt) => {
                const active = dietTypes.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, dietTypes, setDietTypes)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.moreDietsBlock}>
              <Text style={[styles.moreDietsTitle, { color: textPrimary }]}>More diets ↓</Text>
              <Text style={[styles.moreDietsCategory, { color: textPrimary }]}>
                Plant-Based · Flexitarian · Pescatarian · WFPB · Raw Vegan
              </Text>
              <Text style={[styles.moreDietsCategory, { color: textPrimary }]}>
                Clinical · DASH · Cardiac · Diabetic · AIP · Low-FODMAP
              </Text>
              <Text style={[styles.moreDietsCategory, { color: textPrimary }]}>
                Performance · High-Protein · Intermittent Fasting · OMAD
              </Text>
              <Text style={[styles.moreDietsCategory, { color: textPrimary }]}>
                Cultural · Caribbean · Traditional Chinese · Soul Food · Sattvic
              </Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navSecondaryBtn} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.navSecondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navPrimaryBtn, { backgroundColor: SANCTUARY.goldAccent }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.navPrimaryText}>Next</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
        </View>

        {/* Screen 5 — Blocks 5+6+7 Baseline + World + Animals (Q15–Q20) */}
        <View style={screenStyle}>
          <Text style={[styles.blockTitle, { color: textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>Blocks 5 + 6 + 7 · Baseline + World + Animals</Text>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q15 · SLEEP QUALITY LAST 30 DAYS
            </Text>
            <View style={styles.sleepRow}>
              {['Restless', 'Light', 'Inconsistent', 'Mostly Solid', 'Deep'].map((label, idx) => {
                const score = idx + 1;
                const active = sleepScore === score;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setSleepScore(score)}
                    style={[
                      styles.sleepPill,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q16 · DAILY STRESS BASELINE</Text>
            <View style={styles.chipRowWrap}>
              {['Low', 'Moderate', 'High', 'Unpredictable'].map((opt) => {
                const active = stressLevel === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setStressLevel(opt)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q17 · HOW DO YOU MOVE THROUGH THE WORLD?
            </Text>
            <View style={styles.chipRowWrap}>
              {['Local Only', 'Domestic', 'International', 'Frequent Flyer', 'Deployed', 'Remote'].map((opt) => {
                const active = travelFrequency.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, travelFrequency, setTravelFrequency)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>Q18 · HARDWARE CONNECTING? BYOH</Text>
            <View style={styles.chipRowWrap}>
              {['Garmin', 'Oura', 'Beats', 'Meta Glasses', 'Mudra', 'Apple Watch'].map((opt) => {
                const active = hardware.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleChip(opt, hardware, setHardware)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? SANCTUARY.goldAccent : '#D4B870',
                        backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? SANCTUARY.goldAccent : textPrimary },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => toggleChip('+ Add', hardware, setHardware)}
                style={[
                  styles.chip,
                  {
                    borderStyle: 'dashed',
                    borderColor: hardware.includes('+ Add') ? SANCTUARY.goldAccent : '#D4B870',
                    backgroundColor: hardware.includes('+ Add')
                      ? 'rgba(196,154,42,0.12)'
                      : 'transparent',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: hardware.includes('+ Add') ? SANCTUARY.goldAccent : textPrimary },
                  ]}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q19 · ANIMAL IN YOUR CARE?
            </Text>
            <TextInput
              value={animalNotes}
              onChangeText={setAnimalNotes}
              placeholder="Breed, age, weight, sensitivities... (optional)"
              placeholderTextColor={textMuted}
              style={[
                styles.textInput,
                {
                  color: textPrimary,
                  borderColor: '#D4B870',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
                },
              ]}
              multiline
            />
          </View>

          <View style={styles.questionBlock}>
            <Text style={[styles.questionLabel, { color: textMuted }]} numberOfLines={2}>
              Q20 · BIOSIGNAL HISTORY UPLOAD · BYOB
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.uploadBox,
                {
                  borderColor: '#C49A2A',
                  backgroundColor: isLight ? 'rgba(250,247,242,0.9)' : 'rgba(20,16,10,0.8)',
                },
              ]}
            >
              <Text style={[styles.uploadText, { color: textPrimary }]}>
                Garmin · Oura · Apple Health · Google Fit
              </Text>
            </TouchableOpacity>
            <TextInput
              value={biosignalNote}
              onChangeText={setBiosignalNote}
              placeholder="Optional note or link to your biosignal export..."
              placeholderTextColor={textMuted}
              style={[
                styles.textInput,
                {
                  color: textPrimary,
                  borderColor: '#D4B870',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
                },
              ]}
              multiline
            />
          </View>

          {submitError && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorTitle, { color: textPrimary }]}>We hit a bump saving your membrane.</Text>
              <Text style={[styles.errorMessage, { color: textMuted }]}>{submitError}</Text>
            </View>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navSecondaryBtn} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.navSecondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navPrimaryBtn,
                { backgroundColor: '#2C7A50', opacity: submitting ? 0.7 : 1 },
              ]}
              onPress={onEnterMembrane}
              activeOpacity={0.85}
              disabled={submitting}
            >
              <Text style={styles.navPrimaryText}>Enter the Membrane</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  progressDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  screen: {
    paddingTop: 8,
    paddingBottom: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spokeTag: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 20,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  quote: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  javierName: {
    fontFamily: Fonts.sans,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 36,
    flexShrink: 1,
  },
  selectorBlock: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 20,
    overflow: 'hidden',
  },
  selectorLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  selectorOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorOptionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  enterBtn: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  enterBtnText: {
    color: '#03050a',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    flexShrink: 1,
  },
  receipt: {
    marginTop: 'auto',
    paddingTop: 24,
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    flexShrink: 1,
  },
  placeholderScreen: {
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
    flexShrink: 1,
  },
  placeholderSub: {
    fontSize: 14,
    marginBottom: 24,
    flexShrink: 1,
  },
  blockTitle: {
    width: '100%',
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 30,
    marginBottom: 24,
    flexShrink: 1,
  },
  questionBlock: {
    width: '100%',
    maxWidth: '100%',
    marginBottom: 18,
    overflow: 'hidden',
  },
  questionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    flexShrink: 1,
  },
  helperText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    marginBottom: 6,
    flexShrink: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: 14,
    minWidth: 0,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: Fonts.sans,
    fontSize: 14,
    maxWidth: '100%',
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    flexShrink: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '100%',
    marginTop: 16,
    overflow: 'hidden',
  },
  navPrimaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPrimaryText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#03050a',
    flexShrink: 1,
  },
  navSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4B870',
  },
  navSecondaryText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    letterSpacing: 1,
    color: '#D4B870',
    flexShrink: 1,
  },
  moreDietsBlock: {
    marginTop: 12,
    gap: 4,
    overflow: 'hidden',
  },
  moreDietsTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    marginBottom: 4,
    flexShrink: 1,
  },
  moreDietsCategory: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    flexShrink: 1,
  },
  sleepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  sleepPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  uploadText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    flexShrink: 1,
  },
  errorBox: {
    width: '100%',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(196,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(196,0,0,0.35)',
    marginTop: 10,
    overflow: 'hidden',
  },
  errorTitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    flexShrink: 1,
  },
  errorMessage: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    flexShrink: 1,
  },
});
