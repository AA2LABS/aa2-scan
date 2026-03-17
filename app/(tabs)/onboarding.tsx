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

const C = { nearBlack: '#03050a', dimWhite: 'rgba(255,255,255,0.65)', white: '#ffffff' };
const SANCTUARY = { lightBg: '#FAF7F2', goldAccent: '#C49A2A', darkBg: '#0A0804', warmMutedLight: '#8a7a6a' };
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_SCREENS = 5;
const PROGRESS_STEPS = 5;
type ColorMode = 'light' | 'system' | 'dark';
type DeliveryMode = 'video' | 'voice' | 'text';

export default function OnboardingScreen() {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>('system');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('voice');
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
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

  const isLight = colorMode === 'light' || (colorMode === 'system' && systemColorScheme !== 'dark');
  const bgColor = isLight ? '#FAF7F2' : '#0A0804';
  const gold = SANCTUARY.goldAccent;
  const textPrimary = isLight ? C.nearBlack : C.white;
  const textMuted = isLight ? SANCTUARY.warmMutedLight : C.dimWhite;

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index >= 0 && index < NUM_SCREENS) setCurrentIndex(index);
  }, []);

  const toggleChip = (value: string, list: string[], setter: (n: string[]) => void) =>
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

  const goTo = (idx: number) => scrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });

  const onEnterMembrane = useCallback(async () => {
    if (currentIndex < NUM_SCREENS - 1) { goTo(currentIndex + 1); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const { data: { user }, error: ue } = await supabase.auth.getUser();
      if (ue || !user) throw ue ?? new Error('No user');
      const id = user.id;
      const results = await Promise.all([
        supabase.from('member_profiles').upsert({ member_id: id, name: preferredName || null, age: ageNotes || null, species_protected: protecting, delivery_mode: deliveryMode, color_mode: colorMode, onboarding_complete: true }),
        supabase.from('goal_profiles').upsert({ member_id: id, primary_goal: primaryGoals, vision_text: visionText || null }),
        supabase.from('allergy_profiles').upsert({ member_id: id, food_allergens: foodAllergens, suspected_sensitivities: suspectedSensitivities, personal_care_allergens: personalCareAllergens, environmental_triggers: environmentalTriggers }),
        supabase.from('health_profiles').upsert({ member_id: id, conditions, active_limits: activeLimits, medications: medications || null, diet_types: dietTypes }),
        supabase.from('baseline_profiles').upsert({ member_id: id, sleep_score: sleepScore, stress_level: stressLevel }),
        supabase.from('travel_profiles').upsert({ member_id: id, travel_frequency: travelFrequency }),
        supabase.from('device_connections').upsert({ member_id: id, hardware }),
      ]);
      const err = results.find(r => r && 'error' in r && r.error)?.error;
      if (err) throw err;
      if (animalNotes.trim()) { const r = await supabase.from('animal_profiles').upsert({ member_id: id, sensitivities: animalNotes.trim() }); if (r.error) throw r.error; }
      if (biosignalNote.trim()) { const r = await supabase.from('biosignal_history').upsert({ member_id: id, uploaded_file: biosignalNote.trim() }); if (r.error) throw r.error; }
    } catch (e: any) { setSubmitError(e?.message ?? 'Something went wrong.'); }
    finally { setSubmitting(false); }
  }, [currentIndex, preferredName, ageNotes, protecting, deliveryMode, colorMode, primaryGoals, visionText, foodAllergens, suspectedSensitivities, personalCareAllergens, environmentalTriggers, conditions, activeLimits, medications, dietTypes, sleepScore, stressLevel, travelFrequency, hardware, animalNotes, biosignalNote]);

  const inp = [styles.textInput, { color: textPrimary, borderColor: '#D4B870', backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.7)' }] as const;

  const Chip = ({ label, active, onPress, dashed }: { label: string; active: boolean; onPress: () => void; dashed?: boolean }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, dashed && { borderStyle: 'dashed' as const }, { borderColor: active ? gold : '#D4B870', backgroundColor: active ? 'rgba(196,154,42,0.12)' : 'transparent' }]}>
      <Text style={[styles.chipText, { color: active ? gold : textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const Chips = ({ opts, sel, tog, extra }: { opts: string[]; sel: string[]; tog: (v: string) => void; extra?: boolean }) => (
    <View style={styles.chips}>
      {opts.map(o => <Chip key={o} label={o} active={sel.includes(o)} onPress={() => tog(o)} />)}
      {extra && <Chip label="+ Add" active={sel.includes('+ Add')} onPress={() => tog('+ Add')} dashed />}
    </View>
  );

  const Nav = ({ back, next, label, color }: { back?: () => void; next: () => void; label?: string; color?: string }) => (
    <View style={styles.navRow}>
      {back ? <TouchableOpacity style={styles.navBack} onPress={back} activeOpacity={0.8}><Text style={styles.navBackTxt}>Back</Text></TouchableOpacity> : <View style={{ flex: 1 }} />}
      <TouchableOpacity style={[styles.navNext, { backgroundColor: color ?? gold }]} onPress={next} activeOpacity={0.85} disabled={submitting}>
        <Text style={styles.navNextTxt}>{label ?? 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );

  const Q = ({ lbl, helper, children }: { lbl: string; helper?: string; children: React.ReactNode }) => (
    <View style={styles.qBlock}>
      <Text style={[styles.qLabel, { color: textMuted }]}>{lbl}</Text>
      {helper && <Text style={[styles.helper, { color: textMuted }]}>{helper}</Text>}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]} edges={['top']}>
      <View style={[styles.dots, { backgroundColor: bgColor }]}>
        {Array.from({ length: PROGRESS_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, {
            backgroundColor: i === currentIndex ? gold : i < currentIndex ? '#D4B870' : (isLight ? '#FAF7F2' : '#0A0804'),
            borderColor: i <= currentIndex ? gold : '#D4B870',
          }]} />
        ))}
      </View>

      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={onScroll} scrollEventThrottle={32} style={styles.outer}>

        {/* S1 Welcome */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.spokeTag, { color: gold }]}>Spoke 02 · The Membrane</Text>
            <Text style={[styles.quote, { color: textMuted, fontFamily: Fonts.serif, fontStyle: 'italic' }]}>Ahh... I see you found your way here. As they say — like attracts like.</Text>
            <Text style={[styles.heroName, { color: textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>CONCIERGE</Text>
            <View style={styles.selBlock}>
              <Text style={[styles.selLabel, { color: textMuted }]}>Color</Text>
              <View style={styles.selRow}>
                {(['light','system','dark'] as ColorMode[]).map(m => (
                  <TouchableOpacity key={m} style={[styles.selOpt, { borderColor: textMuted }, colorMode === m && { backgroundColor: gold, borderColor: gold }]} onPress={() => setColorMode(m)} activeOpacity={0.8}>
                    <Text style={[styles.selOptTxt, { color: colorMode === m ? C.nearBlack : textMuted }]}>{m === 'system' ? 'System' : m === 'light' ? 'Light' : 'Dark'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.selBlock}>
              <Text style={[styles.selLabel, { color: textMuted }]}>Delivery</Text>
              <View style={styles.selRow}>
                {(['video','voice','text'] as DeliveryMode[]).map(m => (
                  <TouchableOpacity key={m} style={[styles.selOpt, { borderColor: textMuted }, deliveryMode === m && { backgroundColor: gold, borderColor: gold }]} onPress={() => setDeliveryMode(m)} activeOpacity={0.8}>
                    <Text style={[styles.selOptTxt, { color: deliveryMode === m ? C.nearBlack : textMuted }]}>{m === 'video' ? 'Video' : m === 'voice' ? 'Voice' : 'Text'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.enterBtn, { backgroundColor: gold }]} onPress={() => goTo(1)} activeOpacity={0.85}>
              <Text style={styles.enterTxt}>Enter the Membrane</Text>
            </TouchableOpacity>
            <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
          </ScrollView>
        </View>

        {/* S2 Identity */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrimary }]}>Block 1 · Identity</Text>
            <Q lbl="Q1 · WHAT NAME SHOULD JAVIER CALL YOU?"><TextInput value={preferredName} onChangeText={setPreferredName} placeholder="First name, nickname, handle..." placeholderTextColor={textMuted} style={inp} /></Q>
            <Q lbl="Q2 · WHO ARE YOU PROTECTING?"><Chips opts={['Myself','Child','Partner','Aging Parent','Pet','Livestock']} sel={protecting} tog={v => toggleChip(v, protecting, setProtecting)} /></Q>
            <Q lbl="Q3 · SPECIES IN YOUR CARE?"><Chips opts={['Human','K9','Equestrian','Cattle']} sel={speciesInCare} tog={v => toggleChip(v, speciesInCare, setSpeciesInCare)} /></Q>
            <Q lbl="Q4 · YOUR AGE — AND CHILDREN'S AGES?"><TextInput value={ageNotes} onChangeText={setAgeNotes} placeholder="Age, and any kids' ages..." placeholderTextColor={textMuted} style={inp} multiline /></Q>
            <Nav next={() => goTo(2)} />
            <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
          </ScrollView>
        </View>

        {/* S3 Goals + Allergens */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrimary }]}>Blocks 2 + 3 · Goals + Allergens</Text>
            <Q lbl="Q5 · WHAT DOES WINNING LOOK LIKE IN 90 DAYS?"><Chips opts={['Longevity','Weight','Focus','Recovery','Performance','Safety']} sel={primaryGoals} tog={v => toggleChip(v, primaryGoals, setPrimaryGoals)} /></Q>
            <Q lbl="Q6 · A VERSION OF YOURSELF YOU'RE TRYING TO RETURN TO?"><TextInput value={visionText} onChangeText={setVisionText} placeholder="Tell Javier about that version of you..." placeholderTextColor={textMuted} style={[inp, { minHeight: 80, textAlignVertical: 'top' }]} multiline /></Q>
            <Q lbl="Q7 · KNOWN FOOD ALLERGENS"><Chips opts={['Peanuts','Tree Nuts','Shellfish','Dairy','Gluten','Eggs','Soy','Sesame']} sel={foodAllergens} tog={v => toggleChip(v, foodAllergens, setFoodAllergens)} /></Q>
            <Q lbl="Q8 · SUSPECTED SENSITIVITIES"><Chips opts={['Bloating','Brain Fog','Inflammation','Skin Reactions','Mood Shifts']} sel={suspectedSensitivities} tog={v => toggleChip(v, suspectedSensitivities, setSuspectedSensitivities)} extra /></Q>
            <Q lbl="Q9 · PERSONAL CARE ALLERGENS"><Chips opts={['Fragrance/Parfum','Parabens','Sulfates','Formaldehyde Releasers','Nickel','Lanolin']} sel={personalCareAllergens} tog={v => toggleChip(v, personalCareAllergens, setPersonalCareAllergens)} extra /></Q>
            <Q lbl="Q10 · ENVIRONMENTAL TRIGGERS"><Chips opts={['Seasonal Pollen','Mold','Dust Mites','Pet Dander','Latex','Smoke','Chemicals']} sel={environmentalTriggers} tog={v => toggleChip(v, environmentalTriggers, setEnvironmentalTriggers)} extra /></Q>
            <Nav back={() => goTo(1)} next={() => goTo(3)} />
            <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
          </ScrollView>
        </View>

        {/* S4 Health */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrimary }]}>Block 4 · Health Reality</Text>
            <Q lbl="Q11 · WHAT IS YOUR BODY CURRENTLY MANAGING?"><Chips opts={['Hypertension','Kidney Function','Diabetes T1','Diabetes T2','Autoimmune','Thyroid','Heart Condition','Liver',"Crohn's",'IBS','PCOS','Lupus']} sel={conditions} tog={v => toggleChip(v, conditions, setConditions)} extra /></Q>
            <Q lbl="Q12 · WHAT DO YOU ACTIVELY LIMIT?" helper="Permanent filter on every scan from this moment forward."><Chips opts={['Sodium','Potassium','Phosphorus','Sugar','Alcohol','Caffeine','NSAIDs']} sel={activeLimits} tog={v => toggleChip(v, activeLimits, setActiveLimits)} extra /></Q>
            <Q lbl="Q13 · MEDICATIONS OR SUPPLEMENTS?"><TextInput value={medications} onChangeText={setMedications} placeholder="Optional — for interaction scanning..." placeholderTextColor={textMuted} style={inp} multiline /></Q>
            <Q lbl="Q14 · YOUR DIET" helper="TOP 10 + more modalities below.">
              <Chips opts={['Mediterranean','Carnivore','Vegan','Vegetarian','Keto','Gluten-Free','Halal','Kosher','Paleo','Low Sodium']} sel={dietTypes} tog={v => toggleChip(v, dietTypes, setDietTypes)} />
              <View style={{ marginTop: 12, gap: 4 }}>
                <Text style={[styles.moreDietsTitle, { color: textPrimary }]}>More diets ↓</Text>
                {['Plant-Based · Flexitarian · Pescatarian · WFPB · Raw Vegan','Clinical · DASH · Cardiac · Diabetic · AIP · Low-FODMAP','Performance · High-Protein · Intermittent Fasting · OMAD','Cultural · Caribbean · Traditional Chinese · Soul Food · Sattvic'].map(t => (
                  <Text key={t} style={[styles.moreDietsCat, { color: textPrimary }]}>{t}</Text>
                ))}
              </View>
            </Q>
            <Nav back={() => goTo(2)} next={() => goTo(4)} />
            <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
          </ScrollView>
        </View>

        {/* S5 Baseline + World + Animals */}
        <View style={[styles.page, { backgroundColor: bgColor }]}>
          <ScrollView style={styles.inner} contentContainerStyle={styles.innerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.blockTitle, { color: textPrimary }]}>Blocks 5 + 6 + 7 · Baseline + World + Animals</Text>
            <Q lbl="Q15 · SLEEP QUALITY LAST 30 DAYS">
              <View style={styles.chips}>
                {['Restless','Light','Inconsistent','Mostly Solid','Deep'].map((l, i) => (
                  <Chip key={l} label={l} active={sleepScore === i + 1} onPress={() => setSleepScore(i + 1)} />
                ))}
              </View>
            </Q>
            <Q lbl="Q16 · DAILY STRESS BASELINE">
              <View style={styles.chips}>
                {['Low','Moderate','High','Unpredictable'].map(o => (
                  <Chip key={o} label={o} active={stressLevel === o} onPress={() => setStressLevel(o)} />
                ))}
              </View>
            </Q>
            <Q lbl="Q17 · HOW DO YOU MOVE THROUGH THE WORLD?"><Chips opts={['Local Only','Domestic','International','Frequent Flyer','Deployed','Remote']} sel={travelFrequency} tog={v => toggleChip(v, travelFrequency, setTravelFrequency)} /></Q>
            <Q lbl="Q18 · HARDWARE CONNECTING? BYOH"><Chips opts={['Garmin','Oura','Beats','Meta Glasses','Mudra','Apple Watch']} sel={hardware} tog={v => toggleChip(v, hardware, setHardware)} extra /></Q>
            <Q lbl="Q19 · ANIMAL IN YOUR CARE?"><TextInput value={animalNotes} onChangeText={setAnimalNotes} placeholder="Breed, age, weight, sensitivities..." placeholderTextColor={textMuted} style={inp} multiline /></Q>
            <Q lbl="Q20 · BIOSIGNAL HISTORY UPLOAD · BYOB">
              <View style={[styles.uploadBox, { borderColor: gold, backgroundColor: isLight ? 'rgba(250,247,242,0.9)' : 'rgba(20,16,10,0.8)' }]}>
                <Text style={[styles.uploadTxt, { color: textPrimary }]}>Garmin · Oura · Apple Health · Google Fit</Text>
              </View>
              <TextInput value={biosignalNote} onChangeText={setBiosignalNote} placeholder="Optional note or link..." placeholderTextColor={textMuted} style={inp} multiline />
            </Q>
            {submitError && <View style={styles.errBox}><Text style={[styles.errTitle, { color: textPrimary }]}>Error saving your membrane.</Text><Text style={[styles.errMsg, { color: textMuted }]}>{submitError}</Text></View>}
            <Nav back={() => goTo(3)} next={onEnterMembrane} label={submitting ? 'Saving...' : 'Enter the Membrane'} color="#2C7A50" />
            <Text style={[styles.receipt, { color: textMuted }]}>I AM THE RECEIPT</Text>
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dots: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  outer: { flex: 1 },
  page: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  inner: { flex: 1 },
  innerContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },
  spokeTag: { fontSize: 11, letterSpacing: 2.5, fontWeight: '700', marginBottom: 20, textTransform: 'uppercase' },
  quote: { fontSize: 20, lineHeight: 28, textAlign: 'center', marginBottom: 28, paddingHorizontal: 8 },
  heroName: { fontFamily: Fonts.sans, fontSize: 56, fontWeight: '900', letterSpacing: 4, marginBottom: 36 },
  selBlock: { width: '100%', marginBottom: 20 },
  selLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  selRow: { flexDirection: 'row', gap: 10 },
  selOpt: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  selOptTxt: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  enterBtn: { marginTop: 12, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  enterTxt: { color: '#03050a', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  receipt: { marginTop: 32, textAlign: 'center', fontSize: 9, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  blockTitle: { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 30, marginBottom: 24 },
  qBlock: { width: '100%', marginBottom: 18 },
  qLabel: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  helper: { fontFamily: Fonts.sans, fontSize: 12, marginBottom: 6 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: Fonts.sans, fontSize: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16 },
  navNext: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  navNextTxt: { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', letterSpacing: 1, color: '#03050a' },
  navBack: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: '#D4B870' },
  navBackTxt: { fontFamily: Fonts.sans, fontSize: 13, letterSpacing: 1, color: '#D4B870' },
  moreDietsTitle: { fontFamily: Fonts.serif, fontSize: 16, marginBottom: 4 },
  moreDietsCat: { fontFamily: Fonts.sans, fontSize: 12 },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  uploadTxt: { fontFamily: Fonts.sans, fontSize: 12 },
  errBox: { width: '100%', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(196,0,0,0.05)', borderWidth: 1, borderColor: 'rgba(196,0,0,0.35)', marginTop: 10 },
  errTitle: { fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  errMsg: { fontFamily: Fonts.sans, fontSize: 12 },
});
