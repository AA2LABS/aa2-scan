import * as FileSystem from 'expo-file-system/legacy';
import { router, type Href } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { dl, lc, useTheme, type Tokens } from '@/lib/theme-mode';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// ─── FLAG ─────────────────────────────────────────────────────────────────────
export const ARRIVAL_FLAG_PATH = FileSystem.documentDirectory + 'aa2_arrival_v4';

// THE SKIN LAW (Canon v17 §2 · Initiate Doctrine): "Onboarding IS the
// initiation. No one enters the membrane without passing through the skin."
// This flag exists ONLY after the member seals the membrane. Until then,
// every cold start routes to the initiation — never to the tabs.
export const SEAL_FLAG_PATH = FileSystem.documentDirectory + 'aa2_membrane_sealed_v1';

async function markArrivalDone(): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(ARRIVAL_FLAG_PATH, '1');
  } catch {}
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// const { width: SCREEN_W } = Dimensions.get('window'); — replaced by useWindowDimensions hook
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SCREEN_ASPECT = SCREEN_W / SCREEN_H;
const SLIDE_H = SCREEN_ASPECT < 0.50
  ? SCREEN_H * 0.78
  : SCREEN_H * 0.88;

const F = {
  display: 'BebasNeue-Regular',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
  sans:    'DMSans-Regular',
};

// ─── SCREENS DATA ─────────────────────────────────────────────────────────────
type Screen = {
  tag: string;
  image: any;
  name: string;
  role: string;
  without: string;
  with: string;
  buttonLabel: string;
  accentColor: string;
  buttonColor: string;
  isLast?: boolean;
  imagePosition?: 'top' | 'center' | 'bottom';
};

const SCREENS: Screen[] = [
  {
    tag: 'INTELLIGENCE 0X01',
    image: require('../assets/images/shutterstock_117302320-2590x2590.jpg'),
    name: 'The Concierge',
    role: 'Personal Intelligence · Memory · Continuity',
    without: 'Navigating everything alone. No memory. No continuity.',
    with: 'A personal intelligence who knows you, your goals, your world.',
    accentColor: '#1BB8FF',
    buttonColor: '#1BB8FF',
    buttonLabel: 'Meet the Concierge →',
    imagePosition: 'top',
  },
  {
    tag: 'INTELLIGENCE 0X02',
    image: require('../assets/images/885f815586f74d2493ca39e56aa770dd.jpg'),
    name: 'The Chef',
    role: 'Nutrition Intelligence · Meal Design · Biology-First',
    without: 'Generic recipes. Wrong pairings. Nutrition with no context.',
    with: 'Every meal aligned to your biology, your goals, your life.',
    accentColor: '#1BB8FF',
    buttonColor: '#1BB8FF',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'INTELLIGENCE 0X03',
    image: require('../assets/images/biobuddy_hero.jpg'),
    name: 'Bio Buddy',
    role: 'Biometric Intelligence · Signal Reader · Threshold Guard',
    without: 'Body signals go unread. Patterns invisible. Thresholds unknown.',
    with: 'Speaks only when asked or a threshold is crossed.',
    accentColor: '#1BB8FF',
    buttonColor: '#1BB8FF',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'INTELLIGENCE 0X04',
    image: require('../assets/images/How-Much-Is-Black-Car-Service-in-NYC-Complete-Guide.webp'),
    name: 'The Chauffeur',
    role: 'Travel Intelligence · Route Safety · Waypoint Briefings',
    without: 'Maps with no memory. Routes with no context.',
    with: 'Pre-programmed safe routes. Full briefings at every waypoint.',
    accentColor: '#1BB8FF',
    buttonColor: '#1BB8FF',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'INTELLIGENCE 0X05',
    image: require('../assets/images/equalizer_hero.jpg'),
    name: 'The Equalizer',
    role: 'Immune System · Gate Intelligence · Truth Engine',
    without: 'Harm enters quietly. Labels lie. No one watching the gate.',
    with: 'Nothing passes without clearance. Speaks only in emergencies.',
    accentColor: '#1BB8FF',
    buttonColor: '#1BB8FF',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'K9-FELINE INTELLIGENCE',
    image: require('../assets/images/k9_feline_hero.jpg'),
    name: 'K9 / Feline',
    role: 'Canine · Feline · Nutrition · Safety · Behavior',
    without: 'Pet symptoms missed. Food harm silent. Behavior misread.',
    with: 'Canine and feline biosignals read. Every ingredient screened.',
    accentColor: '#1BB8FF',
    buttonColor: '#1BB8FF',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'SPOKE 28 · EQUESTRIAN',
    image: require('../assets/images/equine_hero.jpg'),
    name: 'Equine Intelligence',
    role: 'Equine Nutritionist · Safety · Performance',
    without: 'Feed guesswork. Supplement interactions missed.',
    with: 'Every feed scanned. Jockey and horse biosignals synced.',
    accentColor: '#C49A2A',
    buttonColor: '#C49A2A',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'SPOKE 29 · AGRICULTURAL',
    image: require('../assets/images/cattle_hero.jpg'),
    name: 'Agricultural Intelligence',
    role: 'Agricultural Analyst · Livestock · Feed Safety',
    without: 'Mycotoxins undetected. Feed additives unchecked.',
    with: 'Full feed stack scanned. Livestock aligned.',
    accentColor: '#4CAF50',
    buttonColor: '#4CAF50',
    buttonLabel: 'Continue →',
    imagePosition: 'top',
  },
  {
    tag: 'SPOKE 27 · TACTICAL',
    image: require('../assets/images/k9_tactical_hero.jpg'),
    name: 'K9 Tactical',
    role: 'Handler + Canine · Mission Readiness',
    without: 'Guesswork in the field. No biosignal tracking.',
    with: 'Handler and canine biosignals synced. Mission ready.',
    accentColor: '#8B7355',
    buttonColor: '#8B7355',
    buttonLabel: 'Enter AA2 →',
    isLast: true,
    imagePosition: 'center',
  },
];

// ─── SKIP ─────────────────────────────────────────────────────────────────────
// ─── SLIDE COMPONENT ──────────────────────────────────────────────────────────
function Slide({
  item,
  onNext,
  onComplete,
}: {
  item: Screen;
  onNext: () => void;
  /** Founder flow law (2026-08-01): the intelligence flip book (Concierge →
      K9 Tactical) plays AFTER the Nine Stories — learn the app through
      stories, THEN meet the intelligences. When embedded in onboarding this
      hands control back instead of routing. */
  onComplete?: () => void;
}) {
  const TH = useTheme();
  const sl = useMemo(() => make_sl(TH), [TH]);

  const finish = async () => {
    await markArrivalDone();
    if (onComplete) { onComplete(); return; }
    router.replace('/onboarding' as Href);
  };
  const handleButton = async () => {
    if (item.isLast) {
      await finish();
    } else {
      onNext();
    }
  };

  return (
    <View style={sl.root}>
      {/* Full bleed hero */}
      <Image
        source={item.image}
        resizeMode="cover"
        style={[
          sl.imageFill,
          {
            top: item.imagePosition === 'center'
              ? '10%'
              : item.imagePosition === 'bottom'
              ? '20%'
              : '-5%',
          }
        ]}
      />

      {/* Dark overlay */}
      <View style={sl.overlay} />

      {/* Content layer — pinned to bottom */}
      <View style={sl.contentLayer}>
        <Text style={sl.tag}>{item.tag}</Text>
        <Text style={sl.name}>{item.name}</Text>
        <Text style={sl.role}>{item.role}</Text>

        {/* WITHOUT card */}
        <View style={sl.panelWithout}>
          <Text style={sl.labelWithout}>WITHOUT</Text>
          <Text style={sl.panelText}>{item.without}</Text>
        </View>

        {/* WITH card */}
        <View style={[sl.panelWith, { borderLeftColor: lc(TH, item.accentColor) }]}>
          <Text style={[sl.labelWith, { color: lc(TH, item.accentColor) }]}>WITH</Text>
          <Text style={sl.panelText}>{item.with}</Text>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[sl.btn, { backgroundColor: lc(TH, item.buttonColor) }]}
          onPress={handleButton}
          activeOpacity={0.85}
        >
          <Text style={sl.btnText}>{item.buttonLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Skip — absolute top right */}
      <TouchableOpacity
        style={sl.skipBtn}
        onPress={finish}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={sl.skipText}>SKIP</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_sl = (T: Tokens) => {
  return StyleSheet.create({
  root: {
    width: SCREEN_W,
    height: SLIDE_H,
    position: 'relative',
    overflow: 'hidden',
  },
  imageFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  tag: {
    fontFamily: F.mono,
    fontSize: 9,
    color: dl(T, 'rgba(255,255,255,0.60)', 'rgba(0,0,0,0.55)'),
    letterSpacing: 3,
    marginBottom: 6,
  },
  name: {
    fontFamily: F.display,
    fontSize: 52,
    color: '#FFFFFF',
    lineHeight: 54,
    marginBottom: 4,
  },
  role: {
    fontFamily: F.sans,
    fontSize: 14,
    color: dl(T, 'rgba(255,255,255,0.70)', 'rgba(0,0,0,0.66)'),
    marginBottom: 20,
  },
  panelWithout: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: dl(T, '#E05252', '#C0392B'),
    marginBottom: 10,
  },
  panelWith: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 2,
    marginBottom: 16,
  },
  labelWithout: {
    fontFamily: F.monoMd,
    fontSize: 11,
    color: dl(T, '#E05252', '#C0392B'),
    letterSpacing: 2,
    marginBottom: 6,
  },
  labelWith: {
    fontFamily: F.monoMd,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  panelText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: dl(T, 'rgba(255,255,255,0.85)', 'rgba(0,0,0,0.82)'),
    lineHeight: 20,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: F.monoMd,
    fontSize: 13,
    color: dl(T, '#03050A', '#F0EEE8'),
    letterSpacing: 1.5,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 52 : 56,
    right: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: dl(T, 'rgba(255,255,255,0.65)', 'rgba(0,0,0,0.55)'),
    letterSpacing: 2,
  },
});
};


// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ArrivalScreen({ onComplete }: { onComplete?: () => void } = {}) {
  const TH = useTheme();
  const s = useMemo(() => make_s(TH), [TH]);

  const { width: SCREEN_W } = useWindowDimensions();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  }, []);

  const handleNext = useCallback(() => {
    const next = Math.min(activeIndex + 1, SCREENS.length - 1);
    flatRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }, [activeIndex]);

  return (
    <View style={s.root}>
      <FlatList
        ref={flatRef}
        data={SCREENS}
        keyExtractor={item => item.tag}
        horizontal
        pagingEnabled
        snapToInterval={SCREEN_W}
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        renderItem={({ item }) => (
          <Slide item={item} onNext={handleNext} onComplete={onComplete} />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {/* Progress dots */}
      <View style={s.dots} pointerEvents="none">
        {SCREENS.map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === activeIndex ? s.dotActive : s.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_s = (T: Tokens) => {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: dl(T, '#03050A', '#F0EEE8'),
  },
  dots: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  dotInactive: {
    backgroundColor: dl(T, 'rgba(255,255,255,0.30)', 'rgba(0,0,0,0.34)'),
  },
});
};

