import { supabase } from '@/lib/supabase';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions, Modal, NativeSyntheticEvent, NativeScrollEvent,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/constants/theme';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const SANCTUARY = { gold: '#C49A2A', darkBg: '#0A0804', lightBg: '#FAF7F2', mutedLight: '#8a7a6a' };
const C = { nearBlack: '#03050a', dimWhite: 'rgba(255,255,255,0.65)', white: '#ffffff' };
const { width: SW, height: SH } = Dimensions.get('window');

type ColorMode    = 'light' | 'system' | 'dark';
type DeliveryMode = 'video' | 'voice' | 'text';
type StackTier    = 'quarter' | 'half' | 'three_quarter' | 'full';

// ─── DEVICE PANEL COPY ───────────────────────────────────────────────────────
const DEVICE_PANELS: Record<string, { title: string; subtitle: string; body: string; unlocks: string[] }> = {
  Garmin: {
    title: 'Garmin Watch',
    subtitle: 'Your instrument panel. Not a fitness tracker.',
    body: `Let me ask you something.

When you looked at your watch this morning — what did you think you were looking at? The time? Your steps? A recovery score? Maybe a notification you were going to ignore anyway?

What you were actually looking at — or what you will be looking at the moment AA2 is on your wrist — is your instrument panel.

Not your fitness tracker. Not your sleep score. Not a number that tells you how many calories you burned doing something your body already forgot.

Your instrument panel.

Pilots do not look at the cockpit to feel motivated. They look at it to know their state. Their altitude. Their direction. Whether they are climbing or descending. Whether something needs attention before it becomes a problem.

That is what the AA2 watch face does for you.

You glance. You know. No menus. No digging. No opening an app. No waiting for a summary. The truth is on your wrist the moment you raise it — your biosignal state, your trend, your direction.

The wrist is the first language. Before your phone. Before your glasses. Before your voice. The wrist speaks first.

This is not steps. This is state. Trend. Direction.

You do not open AA2. You wear it.

The watch face is the promise made visible.`,
    unlocks: [
      'HRV trending over days and weeks',
      'Activity load and recovery advisor',
      'Sleep staging — light, deep, REM',
      'Stress score running continuously',
      'AA2 watch face — state, trend, direction on your wrist',
      'Historical data may import immediately — your baseline may already exist',
    ],
  },
  Oura: {
    title: 'Smart Ring · Oura Gen 3 or Gen 4',
    subtitle: 'The most accurate passive sleep layer available.',
    body: `There is a window in your day that most biosignal devices miss entirely.

It happens while you are asleep.

The ring stays on when the watch comes off. It reads through the night — continuous HRV during sleep, the most important HRV window of the day. It catches temperature deviation before you feel it. Before your throat hurts. Before you cancel plans. Before you lose three days.

The readiness score it builds is not a guess. It is built from your HRV, your resting heart rate, your body temperature trend, and your sleep architecture from the night before.

When you combine it with a watch — you have 24-hour coverage. Wrist during the day. Finger during sleep. The Equalizer center line is no longer a daily snapshot. It is a continuous living signal.`,
    unlocks: [
      'Most accurate passive sleep staging available',
      'Readiness score from HRV, temperature, and sleep history',
      'Temperature deviation — catches illness before symptoms',
      'Continuous HRV during sleep',
      '24-hour coverage when combined with a watch',
    ],
  },
  Beats: {
    title: 'Heart Rate Earbuds · Beats Pro 2',
    subtitle: 'No dead zones in your signal.',
    body: `Every biosignal device has hours it cannot see.

The watch comes off to charge. The ring stays on but cannot capture workout intensity at high heart rates. There are gaps in your signal — and gaps in your signal are gaps in your truth.

The earbuds close them.

Real-time heart rate during workouts, commutes, high-stimulation environments. Signal during the hours the watch is off. Audio environment awareness — the membrane knows when you are in a high-stress environment versus rest.

When you add the earbuds to the stack, you close the gaps. The Equalizer center line becomes uninterrupted.`,
    unlocks: [
      'Real-time heart rate during workouts and commutes',
      'Signal during hours the watch is off or charging',
      'Audio environment awareness',
      'Continuous signal from waking through sleep with full stack',
    ],
  },
  'Meta Glasses': {
    title: 'Meta Ray-Ban Glasses',
    subtitle: 'The peripheral that makes the membrane wearable.',
    body: `Let me ask you something else.

When you put these on this morning — what did you think you were wearing? Sunglasses? A camera? A translation tool? Maybe a conversation piece because they look good and people notice them?

You are not wrong. They do look good. You probably did get a compliment.

But what you actually put on your face this morning was a safety peripheral. A documentation device. A verification system. A communication line. A learning center. A travel companion. And yes — a cosmetic gift that happens to be one of the most quietly powerful pieces of technology you will ever own.

You did not just buy glasses that take pictures.

You bought the ability to make a hands-free call to your emergency contact the moment something feels wrong — without touching your phone, without looking suspicious, without tipping anyone off that you are calling for help. And while that call is live, the person on the other end sees exactly what you see. The driver. The license plate. The surroundings. If you need to capture evidence — you take the photo hands-free. Your emergency contact has documentation before anything escalates.

You bought a language lab that goes everywhere you go. While you are walking, cooking, commuting, running — the Depth-On-Demand Learning Center is in your ears.

You bought two ways to know what is in front of you. Hey Meta, translate this — ingredients in your ear in seconds. Pull out your phone and run the AA2 scanner — not just what it says, but what it means for your body specifically.

And when you are standing in a kitchen in Costa Rica with a family you just met — cooking native Latin American dishes, laughing in a language you have been learning for weeks, on a trip the Travel Engine found and your Act Right Dollars helped fund — your glasses are translating the conversation in real time, your scanner already cleared every ingredient in the pot, and someone back home is watching through your eyes on a WhatsApp call.

The Vault remembers all of it.

So no. You did not just buy sunglasses. You bought a peripheral that makes the membrane wearable. And they look good doing it.`,
    unlocks: [
      'Hands-free emergency call — contact sees what you see',
      '12MP hands-free photo capture — evidence before anything escalates',
      'Live translation in 6 languages',
      'Depth-On-Demand Learning Center in your ears while moving',
      'AA2 scanner gives depth — not just what it says, but what it means for your body',
    ],
  },
  Mudra: {
    title: 'Mudra Band / Muse Headband',
    subtitle: 'The only device that reads above the neck.',
    body: `Every device in your stack reads from the wrist down.

Heart rate. HRV. Sleep. Temperature. Steps. Recovery. All of it comes from the body's physical systems — cardiovascular, thermal, metabolic.

None of it reads your mind.

The Muse reads your brain waves directly. EEG during meditation. EEG during focus work. EEG during sleep — a layer of neural signal that no ring and no watch can access. The only device in the stack that reads above the neck.

Meditation quality scored. Sleep EEG beyond what the ring captures. Cognitive load during your workday.

Physical readiness without cognitive readiness is an incomplete picture. The membrane needs both.`,
    unlocks: [
      'EEG — direct brain wave reading during meditation and sleep',
      'Meditation quality scored in real time',
      'Sleep EEG beyond ring and watch capability',
      'Cognitive load indicator during focus work',
      'Completes the full stack — body and mind simultaneously',
    ],
  },
  'Apple Watch': {
    title: 'Apple Watch',
    subtitle: 'Full biosignal integration through Apple Health.',
    body: `If you are wearing an Apple Watch, your biosignal history may already exist.

Apple Health has been collecting your heart rate, HRV, sleep, activity, and stress data since the day you set it up. AA2 reads that history directly — and uses it to build your center line faster than starting from scratch.

The longer you have worn it, the more the membrane already knows about you before you answer a single question.

Combined with the AA2 scanner, your Apple Watch becomes part of the Peripheral Nervous System — reading your internal state while the scanner reads the external world.`,
    unlocks: [
      'Apple Health import — baseline may already exist',
      'Heart rate and HRV continuous monitoring',
      'Sleep staging and recovery data',
      'Activity and stress scoring',
      'Full AA2 watch face through Apple Watch complications',
    ],
  },
};

// ─── STACK TIER LOGIC ────────────────────────────────────────────────────────
function computeStackTier(hardware: string[]): StackTier {
  if (hardware.length === 0) return 'quarter';
  if (hardware.length === 1) return 'half';
  if (hardware.length <= 3) return 'three_quarter';
  return 'full';
}

const STACK_TIER_LABELS: Record<StackTier, { name: string; description: string }> = {
  quarter:       { name: 'Quarter Stack',       description: 'Scanner only — generic truth, begins to personalize' },
  half:          { name: 'Half Stack',           description: 'Scanner + one device — personal truth begins' },
  three_quarter: { name: 'Three-Quarter Stack',  description: 'Scanner + 2–3 devices — 24-hr signal, pattern recognition' },
  full:          { name: 'Full Stack',           description: 'Complete membrane — everything, at full depth' },
};

// ─── NUM SCREENS ─────────────────────────────────────────────────────────────
// S0: Welcome / Javier
// S1: Hardware Discovery
// S2: Identity (Block 1 · Q1–Q4)
// S3: Goals + Allergens (Blocks 2+3 · Q5–Q10)
// S4: Health Reality (Block 4 · Q11–Q14)
// S5: Baseline + World + Animals (Blocks 5+6+7 · Q15–Q20)
const NUM_SCREENS = 6;

export default function OnboardingScreen() {
  const systemScheme = useColorScheme();
  const [colorMode,    setColorMode]    = useState<ColorMode>('system');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('voice');
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // ── Hardware state
  const [hardware,       setHardware]       = useState<string[]>([]);
  const [activePanel,    setActivePanel]    = useState<string | null>(null);
  const stackTier = computeStackTier(hardware);

  // ── Identity (Block 1)
  const [preferredName,  setPreferredName]  = useState('');
  const [protecting,     setProtecting]     = useState<string[]>([]);
  const [speciesInCare,  setSpeciesInCare]  = useState<string[]>([]);
  const [ageNotes,       setAgeNotes]       = useState('');

  // ── Goals (Block 2)
  const [primaryGoals,   setPrimaryGoals]   = useState<string[]>([]);
  const [visionText,     setVisionText]     = useState('');

  // ── Allergens (Block 3)
  const [foodAllergens,          setFoodAllergens]          = useState<string[]>([]);
  const [suspectedSensitivities, setSuspectedSensitivities] = useState<string[]>([]);
  const [personalCareAllergens,  setPersonalCareAllergens]  = useState<string[]>([]);
  const [environmentalTriggers,  setEnvironmentalTriggers]  = useState<string[]>([]);

  // ── Health (Block 4)
  const [conditions,   setConditions]   = useState<string[]>([]);
  const [activeLimits, setActiveLimits] = useState<string[]>([]);
  const [medications,  setMedications]  = useState('');
  const [dietTypes,    setDietTypes]    = useState<string[]>([]);

  // ── Baseline (Block 5)
  const [sleepScore,   setSleepScore]   = useState<number | null>(null);
  const [stressLevel,  setStressLevel]  = useState<string | null>(null);

  // ── World (Block 6)
  const [travelFrequency, setTravelFrequency] = useState<string[]>([]);

  // ── Animals + BYOB (Block 7)
  const [animalNotes,    setAnimalNotes]    = useState('');
  const [biosignalNote,  setBiosignalNote]  = useState('');

  // ── Submit state
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  // ── Theme
  const isLight   = colorMode === 'light' || (colorMode === 'system' && systemScheme !== 'dark');
  const bgColor   = isLight ? SANCTUARY.lightBg : SANCTUARY.darkBg;
  const gold      = SANCTUARY.gold;
  const textPrim  = isLight ? C.nearBlack : C.white;
  const textMuted = isLight ? SANCTUARY.mutedLight : C.dimWhite;

  // ── Navigation
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (i >= 0 && i < NUM_SCREENS) setCurrentIndex(i);
  }, []);

  const goTo = (idx: number) =>
    scrollRef.current?.scrollTo({ x: idx * SW, animated: true });

  const toggleChip = (v: string, list: string[], setter: (n: string[]) => void) =>
    setter(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const toggleHardware = (device: string) => {
    setHardware(prev =>
      prev.includes(device) ? prev.filter(d => d !== device) : [...prev, device]
    );
  };

  // ── Submit
  const onEnterMembrane = useCallback(async () => {
    if (currentIndex < NUM_SCREENS - 1) { goTo(currentIndex + 1); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const { data: { user }, error: ue } = await supabase.auth.getUser();
      if (ue || !user) throw ue ?? new Error('No authenticated user');
      const id = user.id;

      const results = await Promise.all([
        supabase.from('member_profiles').upsert({
          member_id: id, name: preferredName || null, age: ageNotes || null,
          species_protected: protecting, delivery_mode: deliveryMode,
          color_mode: colorMode, stack_tier: stackTier, onboarding_complete: true,
        }, { onConflict: 'member_id' }),
        supabase.from('goal_profiles').upsert({
          member_id: id, primary_goal: primaryGoals, vision_text: visionText || null,
        }, { onConflict: 'member_id' }),
        supabase.from('allergy_profiles').upsert({
          member_id: id, food_allergens: foodAllergens,
          suspected_sensitivities: suspectedSensitivities,
          personal_care_allergens: personalCareAllergens,
          environmental_triggers:  environmentalTriggers,
        }, { onConflict: 'member_id' }),
        supabase.from('health_profiles').upsert({
          member_id: id, conditions, active_limits: activeLimits,
          medications: medications || null, diet_types: dietTypes,
        }, { onConflict: 'member_id' }),
        supabase.from('baseline_profiles').upsert({
          member_id: id, sleep_score: sleepScore, stress_level: stressLevel,
        }, { onConflict: 'member_id' }),
        supabase.from('travel_profiles').upsert({
          member_id: id, travel_frequency: travelFrequency,
        }, { onConflict: 'member_id' }),
        supabase.from('device_connections').upsert({
          member_id: id, hardware, stack_tier: stackTier,
        }, { onConflict: 'member_id' }),
      ]);

      const err = results.find(r => r?.error)?.error;
      if (err) throw err;

      if (animalNotes.trim()) {
        const r = await supabase.from('animal_profiles').upsert(
          { member_id: id, sensitivities: animalNotes.trim() },
          { onConflict: 'member_id' }
        );
        if (r.error) throw r.error;
      }
      if (biosignalNote.trim()) {
        const r = await supabase.from('biosignal_history').insert({
          member_id: id, uploaded_file: biosignalNote.trim(), input_tier: 'TEXT',
        });
        if (r.error) throw r.error;
      }
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Something went wrong. Please try again.');
    } finally { setSubmitting(false); }
  }, [
    currentIndex, preferredName, ageNotes, protecting, deliveryMode, colorMode,
    stackTier, primaryGoals, visionText, foodAllergens, suspectedSensitivities,
    personalCareAllergens, environmentalTriggers, conditions, activeLimits,
    medications, dietTypes, sleepScore, stressLevel, travelFrequency, hardware,
    animalNotes, biosignalNote,
  ]);

  // ── UI Components
  const inp = [styles.textInput, {
    color: textPrim, borderColor: gold + '88',
    backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)',
  }] as const;

  const Chip = ({ label, active, onPress, dashed }: {
    label: string; active: boolean; onPress: () => void; dashed?: boolean;
  }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[
      styles.chip,
      dashed && { borderStyle: 'dashed' as const },
      { borderColor: active ? gold : gold + '55', backgroundColor: active ? gold + '22' : 'transparent' },
    ]}>
      <Text style={[styles.chipText, { color: active ? gold : textPrim }]}>{label}</Text>
    </TouchableOpacity>
  );

  const Chips = ({ opts, sel, tog, extra }: {
    opts: string[]; sel: string[]; tog: (v: string) => void; extra?: boolean;
  }) => (
    <View style={styles.chips}>
      {opts.map(o => <Chip key={o} label={o} active={sel.includes(o)} onPress={() => tog(o)} />)}
      {extra && <Chip label="+ Add" active={false} onPress={() => {}} dashed />}
    </View>
  );

  const Q = ({ lbl, helper, children }: { lbl: string; helper?: string; children: React.ReactNode }) => (
    <View style={styles.qBlock}>
      <Text style={[styles.qLabel, { color: textMuted }]}>{lbl}</Text>
      {helper && <Text style={[styles.helper, { color: textMuted }]}>{helper}</Text>}
      {children}
    </View>
  );

  const Nav = ({ back, next, label, color }: {
    back?: () => void; next: () => void; label?: string; color?: string;
  }) => (
    <View style={styles.navRow}>
      {back
        ? <TouchableOpacity style={styles.navBack} onPress={back} activeOpacity={0.8}>
            <Text style={[styles.navBackTxt, { color: gold }]}>Back</Text>
          </TouchableOpacity>
        : <View style={{ flex: 1 }} />}
      <TouchableOpacity
        style={[styles.navNext, { backgroundColor: color ?? gold }]}
        onPress={next} activeOpacity={0.85} disabled={submitting}>
        <Text style={styles.navNextTxt}>{label ?? 'Next →'}</Text>
      </TouchableOpacity>
    </View>
  );

  const Receipt = () => (
    <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
  );

  // ── Device Panel Modal
  const DeviceModal = () => {
    if (!activePanel || !DEVICE_PANELS[activePanel]) return null;
    const p = DEVICE_PANELS[activePanel];
    const isActive = hardware.includes(activePanel);
    return (
      <Modal visible={!!activePanel} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setActivePanel(null)}>
        <SafeAreaView style={[styles.modalRoot, { backgroundColor: bgColor }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActivePanel(null)} activeOpacity={0.7}>
              <Text style={[styles.modalClose, { color: textMuted }]}>✕ Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { toggleHardware(activePanel); setActivePanel(null); }}
              activeOpacity={0.85}
              style={[styles.modalToggle, { backgroundColor: isActive ? '#2C7A50' : gold }]}>
              <Text style={styles.modalToggleTxt}>
                {isActive ? '✓ Connected' : 'Connect This Device'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: textPrim }]}>{p.title}</Text>
            <Text style={[styles.modalSubtitle, { color: gold }]}>{p.subtitle}</Text>
            <Text style={[styles.modalBody, { color: textPrim }]}>{p.body}</Text>
            <View style={[styles.modalUnlocks, { borderColor: gold + '44', backgroundColor: gold + '11' }]}>
              <Text style={[styles.modalUnlocksTitle, { color: gold }]}>WHAT THIS UNLOCKS IN AA2</Text>
              {p.unlocks.map((u, i) => (
                <Text key={i} style={[styles.modalUnlockItem, { color: textPrim }]}>· {u}</Text>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]} edges={['top']}>
      {/* Progress dots */}
      <View style={[styles.dots, { backgroundColor: bgColor }]}>
        {Array.from({ length: NUM_SCREENS }).map((_, i) => (
          <View key={i} style={[styles.dot, {
            backgroundColor: i === currentIndex ? gold : i < currentIndex ? gold + 'aa' : 'transparent',
            borderColor: i <= currentIndex ? gold : textMuted + '55',
          }]} />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        scrollEnabled={false}
        style={styles.outer}>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SCREEN 0 — ARRIVAL / JAVIER OPENS ONCE               */}
        {/* ══════════════════════════════════════════════════════ */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.spokeTag, { color: gold }]}>Spoke 02 · The Membrane</Text>
            <Text style={[styles.quote, { color: textMuted, fontFamily: Fonts.serif, fontStyle: 'italic' }]}>
              "Ahh... I see you found your way here. As they say — like attracts like."
            </Text>
            <Text style={[styles.heroName, { color: textPrim }]} numberOfLines={1} adjustsFontSizeToFit>
              CONCIERGE
            </Text>
            <Text style={[styles.javiBody, { color: textMuted }]}>
              Most systems wait for you to get sick, stressed, broke, or lost before they say anything. AA2 does not wait.
            </Text>
            <Text style={[styles.javiBody, { color: textMuted }]}>
              This is a living membrane. It learns your body — not your demographics, not your purchase history, not your social graph. Your body. Your rhythms. Your signals.
            </Text>
            <Text style={[styles.javiBody, { color: textMuted }]}>
              What you are about to build is a biological baseline. Your center line. Not a population average — yours. Everything this system does runs against that center line.
            </Text>
            <Text style={[styles.javiBody, { color: textMuted }]}>
              How well each intelligence performs for you depends entirely on one thing — what data they have access to. That starts with your hardware. Let's find out what you carry.
            </Text>
            <View style={styles.selBlock}>
              <Text style={[styles.selLabel, { color: textMuted }]}>Color</Text>
              <View style={styles.selRow}>
                {(['light', 'system', 'dark'] as ColorMode[]).map(m => (
                  <TouchableOpacity key={m} onPress={() => setColorMode(m)} activeOpacity={0.8}
                    style={[styles.selOpt, { borderColor: textMuted + '55' },
                      colorMode === m && { backgroundColor: gold, borderColor: gold }]}>
                    <Text style={[styles.selOptTxt, { color: colorMode === m ? C.nearBlack : textMuted }]}>
                      {m === 'system' ? 'System' : m === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.selBlock}>
              <Text style={[styles.selLabel, { color: textMuted }]}>Delivery</Text>
              <View style={styles.selRow}>
                {(['video', 'voice', 'text'] as DeliveryMode[]).map(m => (
                  <TouchableOpacity key={m} onPress={() => setDeliveryMode(m)} activeOpacity={0.8}
                    style={[styles.selOpt, { borderColor: textMuted + '55' },
                      deliveryMode === m && { backgroundColor: gold, borderColor: gold }]}>
                    <Text style={[styles.selOptTxt, { color: deliveryMode === m ? C.nearBlack : textMuted }]}>
                      {m === 'video' ? 'Video' : m === 'voice' ? 'Voice' : 'Text'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.enterBtn, { backgroundColor: gold }]}
              onPress={() => goTo(1)} activeOpacity={0.85}>
              <Text style={styles.enterTxt}>Let's go →</Text>
            </TouchableOpacity>
            <Receipt />
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SCREEN 1 — HARDWARE DISCOVERY                        */}
        {/* ══════════════════════════════════════════════════════ */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.spokeTag, { color: gold }]}>Hardware Discovery · BYOH</Text>
            <Text style={[styles.blockTitle, { color: textPrim }]}>
              What are you carrying?
            </Text>
            <Text style={[styles.javiBody, { color: textMuted }]}>
              Hardware first. Every question that follows is interpreted against what you actually have — not what is theoretically possible. Tap any device to hear Javier explain what it unlocks inside the membrane.
            </Text>

            {/* Stack tier indicator */}
            <View style={[styles.tierCard, { borderColor: gold + '55', backgroundColor: gold + '0d' }]}>
              <Text style={[styles.tierName, { color: gold }]}>{STACK_TIER_LABELS[stackTier].name}</Text>
              <Text style={[styles.tierDesc, { color: textMuted }]}>{STACK_TIER_LABELS[stackTier].description}</Text>
            </View>

            {/* Device cards */}
            {Object.keys(DEVICE_PANELS).map(device => {
              const isConnected = hardware.includes(device);
              return (
                <TouchableOpacity
                  key={device}
                  onPress={() => setActivePanel(device)}
                  activeOpacity={0.85}
                  style={[styles.deviceCard, {
                    borderColor: isConnected ? gold : gold + '33',
                    backgroundColor: isConnected ? gold + '11' : isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
                  }]}>
                  <View style={styles.deviceCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deviceCardName, { color: textPrim }]}>{device}</Text>
                      <Text style={[styles.deviceCardSub, { color: textMuted }]}>
                        {DEVICE_PANELS[device].subtitle}
                      </Text>
                    </View>
                    <View style={[styles.deviceStatus, {
                      backgroundColor: isConnected ? '#2C7A50' : 'transparent',
                      borderColor: isConnected ? '#2C7A50' : textMuted + '55',
                    }]}>
                      <Text style={[styles.deviceStatusTxt, { color: isConnected ? C.white : textMuted }]}>
                        {isConnected ? '✓' : 'Tap'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.deviceCardCta, { color: gold }]}>
                    Hear what this unlocks →
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.helper, { color: textMuted, marginTop: 16, textAlign: 'center' }]}>
              Don't have any of these yet? No problem. The membrane works at every stack level. You can always connect devices later.
            </Text>

            <Nav back={() => goTo(0)} next={() => goTo(2)} />
            <Receipt />
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SCREEN 2 — IDENTITY · Block 1 · Q1–Q4               */}
        {/* ══════════════════════════════════════════════════════ */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrim }]}>Block 1 · Identity</Text>
            <Q lbl="Q1 · WHAT NAME SHOULD JAVIER CALL YOU?">
              <TextInput value={preferredName} onChangeText={setPreferredName}
                placeholder="First name, nickname, handle..." placeholderTextColor={textMuted} style={inp} />
            </Q>
            <Q lbl="Q2 · WHO ARE YOU PROTECTING?">
              <Chips opts={['Myself', 'Child', 'Partner', 'Aging Parent', 'Pet', 'Livestock']}
                sel={protecting} tog={v => toggleChip(v, protecting, setProtecting)} />
            </Q>
            <Q lbl="Q3 · SPECIES IN YOUR CARE?">
              <Chips opts={['Human', 'K9', 'Equestrian', 'Cattle']}
                sel={speciesInCare} tog={v => toggleChip(v, speciesInCare, setSpeciesInCare)} />
            </Q>
            <Q lbl="Q4 · YOUR AGE — AND CHILDREN'S AGES?">
              <TextInput value={ageNotes} onChangeText={setAgeNotes}
                placeholder="Age, and any kids' ages..." placeholderTextColor={textMuted}
                style={inp} multiline />
            </Q>
            <Nav back={() => goTo(1)} next={() => goTo(3)} />
            <Receipt />
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SCREEN 3 — GOALS + ALLERGENS · Blocks 2+3 · Q5–Q10  */}
        {/* ══════════════════════════════════════════════════════ */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrim }]}>Blocks 2 + 3 · Goals + Allergens</Text>
            <Q lbl="Q5 · WHAT DOES WINNING LOOK LIKE IN 90 DAYS?">
              <Chips opts={['Longevity', 'Weight', 'Focus', 'Recovery', 'Performance', 'Safety']}
                sel={primaryGoals} tog={v => toggleChip(v, primaryGoals, setPrimaryGoals)} />
            </Q>
            <Q lbl="Q6 · A VERSION OF YOURSELF YOU'RE TRYING TO RETURN TO?">
              <TextInput value={visionText} onChangeText={setVisionText}
                placeholder="Tell Javier about that version of you..."
                placeholderTextColor={textMuted}
                style={[inp, { minHeight: 80, textAlignVertical: 'top' }]} multiline />
            </Q>
            <Q lbl="Q7 · KNOWN FOOD ALLERGENS"
              helper="These fire first on every scan. No exceptions. Ever.">
              <Chips opts={['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Sesame']}
                sel={foodAllergens} tog={v => toggleChip(v, foodAllergens, setFoodAllergens)} extra />
            </Q>
            <Q lbl="Q8 · SUSPECTED SENSITIVITIES">
              <Chips opts={['Bloating', 'Brain Fog', 'Inflammation', 'Skin Reactions', 'Mood Shifts', 'Fatigue']}
                sel={suspectedSensitivities} tog={v => toggleChip(v, suspectedSensitivities, setSuspectedSensitivities)} extra />
            </Q>
            <Q lbl="Q9 · PERSONAL CARE ALLERGENS"
              helper="Flagged first on every personal care scan.">
              <Chips opts={['Fragrance/Parfum', 'Parabens', 'Sulfates', 'Formaldehyde Releasers', 'Nickel', 'Lanolin']}
                sel={personalCareAllergens} tog={v => toggleChip(v, personalCareAllergens, setPersonalCareAllergens)} extra />
            </Q>
            <Q lbl="Q10 · ENVIRONMENTAL TRIGGERS">
              <Chips opts={['Seasonal Pollen', 'Mold', 'Dust Mites', 'Pet Dander', 'Latex', 'Smoke', 'Chemicals']}
                sel={environmentalTriggers} tog={v => toggleChip(v, environmentalTriggers, setEnvironmentalTriggers)} extra />
            </Q>
            <Nav back={() => goTo(2)} next={() => goTo(4)} />
            <Receipt />
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SCREEN 4 — HEALTH REALITY · Block 4 · Q11–Q14       */}
        {/* ══════════════════════════════════════════════════════ */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrim }]}>Block 4 · Health Reality</Text>
            <Q lbl="Q11 · WHAT IS YOUR BODY CURRENTLY MANAGING?">
              <Chips opts={['Hypertension', 'Kidney Function', 'Diabetes T1', 'Diabetes T2', 'Autoimmune', 'Thyroid', 'Heart Condition', 'Liver', "Crohn's", 'IBS', 'PCOS', 'Lupus']}
                sel={conditions} tog={v => toggleChip(v, conditions, setConditions)} extra />
            </Q>
            <Q lbl="Q12 · WHAT DO YOU ACTIVELY LIMIT?"
              helper="Permanent scan filter applied to every result from this moment forward.">
              <Chips opts={['Sodium', 'Potassium', 'Phosphorus', 'Sugar', 'Alcohol', 'Caffeine', 'NSAIDs']}
                sel={activeLimits} tog={v => toggleChip(v, activeLimits, setActiveLimits)} extra />
            </Q>
            <Q lbl="Q13 · MEDICATIONS OR SUPPLEMENTS?">
              <TextInput value={medications} onChangeText={setMedications}
                placeholder="Optional — for interaction scanning..."
                placeholderTextColor={textMuted} style={inp} multiline />
            </Q>
            <Q lbl="Q14 · YOUR DIET">
              <Chips opts={['Mediterranean', 'Carnivore', 'Vegan', 'Vegetarian', 'Keto', 'Gluten-Free', 'Halal', 'Kosher', 'Paleo', 'Low Sodium']}
                sel={dietTypes} tog={v => toggleChip(v, dietTypes, setDietTypes)} />
              <View style={{ marginTop: 10, gap: 3 }}>
                <Text style={[styles.moreDietsTitle, { color: textPrim }]}>More diet modalities ↓</Text>
                {[
                  'Plant-Based · Flexitarian · Pescatarian · Whole Food Plant-Based · Raw Vegan',
                  'Clinical · DASH · Cardiac · Diabetic · AIP · Low-FODMAP',
                  'Performance · High-Protein · Intermittent Fasting · OMAD',
                  'Cultural · Caribbean · Traditional Chinese · Soul Food · Sattvic',
                ].map(t => <Text key={t} style={[styles.moreDietsCat, { color: textMuted }]}>{t}</Text>)}
              </View>
            </Q>
            <Nav back={() => goTo(3)} next={() => goTo(5)} />
            <Receipt />
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SCREEN 5 — BASELINE + WORLD + ANIMALS · Blocks 5+6+7 */}
        {/* ══════════════════════════════════════════════════════ */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrim }]}>
              Blocks 5 + 6 + 7 · Baseline + World + Animals
            </Text>

            <Q lbl="Q15 · SLEEP QUALITY LAST 30 DAYS">
              <View style={styles.chips}>
                {['Restless', 'Light', 'Inconsistent', 'Mostly Solid', 'Deep'].map((l, i) => (
                  <Chip key={l} label={l} active={sleepScore === i + 1} onPress={() => setSleepScore(i + 1)} />
                ))}
              </View>
            </Q>

            <Q lbl="Q16 · DAILY STRESS BASELINE">
              <View style={styles.chips}>
                {['Low', 'Moderate', 'High', 'Unpredictable'].map(o => (
                  <Chip key={o} label={o} active={stressLevel === o} onPress={() => setStressLevel(o)} />
                ))}
              </View>
            </Q>

            <Q lbl="Q17 · HOW DO YOU MOVE THROUGH THE WORLD?">
              <Chips opts={['Local Only', 'Domestic', 'International', 'Frequent Flyer', 'Deployed', 'Remote']}
                sel={travelFrequency} tog={v => toggleChip(v, travelFrequency, setTravelFrequency)} />
            </Q>

            <Q lbl="Q18 · HARDWARE — ANYTHING ELSE TO ADD?"
              helper="You can always go back and connect more from the Hardware screen.">
              <Chips opts={['Chest Strap · Polar H10', 'Wahoo TICKR', 'Whoop', 'Samsung Galaxy Watch']}
                sel={hardware} tog={v => toggleChip(v, hardware, setHardware)} extra />
            </Q>

            <Q lbl="Q19 · ANIMAL IN YOUR CARE?">
              <TextInput value={animalNotes} onChangeText={setAnimalNotes}
                placeholder="Breed, age, weight, known sensitivities..."
                placeholderTextColor={textMuted} style={inp} multiline />
            </Q>

            <Q lbl="Q20 · BIOSIGNAL HISTORY UPLOAD · BYOB"
              helper="Upload an existing biosignal file or add a note. The membrane builds faster when you bring your existing data.">
              <View style={[styles.uploadBox, { borderColor: gold + '88', backgroundColor: gold + '0d' }]}>
                <Text style={[styles.uploadTxt, { color: textMuted }]}>
                  Garmin Connect export · Oura CSV · Apple Health XML · Google Fit
                </Text>
                <Text style={[styles.uploadSub, { color: textMuted }]}>
                  File upload available on the web at aa2scan.com
                </Text>
              </View>
              <TextInput value={biosignalNote} onChangeText={setBiosignalNote}
                placeholder="Optional note, link, or describe your history..."
                placeholderTextColor={textMuted} style={inp} multiline />
            </Q>

            {submitError && (
              <View style={[styles.errBox, { borderColor: '#CC333355' }]}>
                <Text style={[styles.errTitle, { color: textPrim }]}>Something went wrong.</Text>
                <Text style={[styles.errMsg, { color: textMuted }]}>{submitError}</Text>
              </View>
            )}

            <Nav back={() => goTo(4)} next={onEnterMembrane}
              label={submitting ? 'Saving...' : 'Enter the Membrane'}
              color="#2C7A50" />
            <Receipt />
          </ScrollView>
        </View>

      </ScrollView>

      {/* Device panel modal */}
      <DeviceModal />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:           { flex: 1 },
  dots:           { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  dot:            { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  outer:          { flex: 1 },
  page:           { width: SW },
  inner:          { flex: 1 },
  innerContent:   { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 80 },
  spokeTag:       { fontSize: 11, letterSpacing: 2.5, fontWeight: '700', marginBottom: 20, textTransform: 'uppercase' },
  quote:          { fontSize: 19, lineHeight: 27, textAlign: 'center', marginBottom: 20, paddingHorizontal: 4 },
  heroName:       { fontFamily: Fonts.sans, fontSize: 52, fontWeight: '900', letterSpacing: 4, marginBottom: 20, textAlign: 'center' },
  javiBody:       { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, marginBottom: 16 },
  selBlock:       { width: '100%', marginBottom: 18 },
  selLabel:       { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  selRow:         { flexDirection: 'row', gap: 10 },
  selOpt:         { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  selOptTxt:      { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  enterBtn:       { marginTop: 8, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  enterTxt:       { color: '#03050a', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  receipt:        { marginTop: 32, textAlign: 'center', fontSize: 9, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  blockTitle:     { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 30, marginBottom: 24 },
  qBlock:         { width: '100%', marginBottom: 20 },
  qLabel:         { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  helper:         { fontFamily: Fonts.sans, fontSize: 12, marginBottom: 6, lineHeight: 18 },
  textInput:      { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: 14 },
  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  chip:           { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText:       { fontFamily: Fonts.sans, fontSize: 12 },
  navRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  navNext:        { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  navNextTxt:     { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', letterSpacing: 1, color: '#03050a' },
  navBack:        { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: '#C49A2A55' },
  navBackTxt:     { fontFamily: Fonts.sans, fontSize: 13, letterSpacing: 1 },
  moreDietsTitle: { fontFamily: Fonts.serif, fontSize: 15, marginBottom: 4 },
  moreDietsCat:   { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 20 },
  uploadBox:      { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', marginBottom: 10 },
  uploadTxt:      { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center', marginBottom: 4 },
  uploadSub:      { fontFamily: Fonts.sans, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  errBox:         { width: '100%', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(196,0,0,0.05)', borderWidth: 1, marginTop: 10 },
  errTitle:       { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  errMsg:         { fontFamily: Fonts.sans, fontSize: 12 },
  // Hardware Discovery
  tierCard:       { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 20 },
  tierName:       { fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  tierDesc:       { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  deviceCard:     { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  deviceCardRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  deviceCardName: { fontFamily: Fonts.sans, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  deviceCardSub:  { fontFamily: Fonts.sans, fontSize: 12 },
  deviceCardCta:  { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1 },
  deviceStatus:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deviceStatusTxt:{ fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700' },
  // Modal
  modalRoot:      { flex: 1 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(196,154,42,0.3)' },
  modalClose:     { fontFamily: Fonts.sans, fontSize: 14 },
  modalToggle:    { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  modalToggleTxt: { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', color: '#03050a' },
  modalScroll:    { flex: 1 },
  modalContent:   { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60 },
  modalTitle:     { fontFamily: Fonts.sans, fontSize: 26, fontWeight: '700', marginBottom: 8 },
  modalSubtitle:  { fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1, marginBottom: 24 },
  modalBody:      { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 27, marginBottom: 32 },
  modalUnlocks:   { borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  modalUnlocksTitle: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 4 },
  modalUnlockItem: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 },
});
