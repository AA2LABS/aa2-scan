import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── FLAG ─────────────────────────────────────────────────────────────────────
export const ARRIVAL_FLAG_PATH = FileSystem.documentDirectory + 'aa2_arrival_complete';

async function markArrivalDone(): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(ARRIVAL_FLAG_PATH, '1');
  } catch {}
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifMd: 'CormorantGaramond-Medium',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
  sans:    'DMSans-Regular',
  sansMd:  'DMSans-Medium',
};

const C = {
  white:     '#FFFFFF',
  dimWhite:  'rgba(255,255,255,0.65)',
  mutedWhite:'rgba(255,255,255,0.38)',
  teal:      '#2ECFB3',
  red:       '#E05252',
  gold:      '#C49A2A',
  overlay:   'rgba(3,5,10,0.66)',
  panelBg:   'rgba(255,255,255,0.06)',
  withBd:    'rgba(46,207,179,0.60)',
  withoutBd: 'rgba(224,82,82,0.55)',
};

// ─── SCREENS DATA ─────────────────────────────────────────────────────────────
type Screen = {
  tag: string;
  image: any;
  name: string;
  role: string;
  without: string;
  with: string;
  button: string;
  isLast?: boolean;
};

const SCREENS: Screen[] = [
  {
    tag: 'INTELLIGENCE 0X01',
    image: require('../assets/images/shutterstock_117302320-2590x2590.jpg'),
    name: 'The Concierge',
    role: 'Personal Intelligence · Memory · Continuity',
    without: 'Navigating everything alone. No memory. No continuity.',
    with: 'A personal intelligence who knows you, your goals, your world.',
    button: 'Meet the Team →',
  },
  {
    tag: 'INTELLIGENCE 0X02',
    image: require('../assets/images/885f815586f74d2493ca39e56aa770dd.jpg'),
    name: 'The Chef',
    role: 'Nutrition Intelligence · Meal Design · Biology-First',
    without: 'Generic recipes. Wrong pairings. Nutrition with no context.',
    with: 'Every meal aligned to your biology, your goals, your life.',
    button: 'Continue →',
  },
  {
    tag: 'INTELLIGENCE 0X03',
    image: require('../assets/images/image-1769604372662.webp'),
    name: 'Bio Buddy',
    role: 'Biometric Intelligence · Signal Reader · Threshold Guard',
    without: 'Body signals go unread. Patterns invisible. Thresholds unknown.',
    with: 'Speaks only when asked or a threshold is crossed.',
    button: 'Continue →',
  },
  {
    tag: 'INTELLIGENCE 0X04',
    image: require('../assets/images/How-Much-Is-Black-Car-Service-in-NYC-Complete-Guide.webp'),
    name: 'The Chauffeur',
    role: 'Travel Intelligence · Route Safety · Waypoint Briefings',
    without: 'Maps with no memory. Routes with no context.',
    with: 'Pre-programmed safe routes. Full briefings at every waypoint.',
    button: 'Continue →',
  },
  {
    tag: 'INTELLIGENCE 0X05',
    image: require('../assets/images/Gemini_Generated_Image_iwymiiwymiiwymii.png'),
    name: 'The Equalizer',
    role: 'Immune System · Gate Intelligence · Truth Engine',
    without: 'Harm enters quietly. Labels lie. No one watching the gate.',
    with: 'Nothing passes without clearance. Speaks only in emergencies.',
    button: 'Begin Onboarding →',
    isLast: true,
  },
];

// ─── SKIP ─────────────────────────────────────────────────────────────────────
async function handleSkip() {
  await markArrivalDone();
  router.replace('/');
}

// ─── SLIDE COMPONENT ──────────────────────────────────────────────────────────
function Slide({
  item,
  onNext,
}: {
  item: Screen;
  onNext: () => void;
}) {
  const handleButton = async () => {
    if (item.isLast) {
      await markArrivalDone();
      router.replace('/(tabs)/onboarding');
    } else {
      onNext();
    }
  };

  return (
    <View style={sl.root}>
      <ImageBackground
        source={item.image}
        style={sl.imageBg}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={sl.overlay} />

        <SafeAreaView style={sl.safeArea}>
          {/* Skip — top right */}
          <View style={sl.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={handleSkip} style={sl.skipBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={sl.skipText}>SKIP</Text>
            </TouchableOpacity>
          </View>

          {/* Main content */}
          <View style={sl.content}>
            {/* Intelligence tag */}
            <Text style={sl.tag}>{item.tag}</Text>

            {/* Name + Role */}
            <View style={sl.nameBlock}>
              <Text style={sl.name}>{item.name}</Text>
              <Text style={sl.role}>{item.role}</Text>
            </View>

            {/* WITHOUT / WITH panel */}
            <View style={sl.panelRow}>
              <View style={[sl.panel, sl.panelLeft, { borderLeftColor: C.withoutBd }]}>
                <Text style={sl.panelLabel}>WITHOUT</Text>
                <Text style={sl.panelText}>{item.without}</Text>
              </View>
              <View style={[sl.panel, sl.panelRight, { borderLeftColor: C.withBd }]}>
                <Text style={[sl.panelLabel, { color: C.teal }]}>WITH</Text>
                <Text style={sl.panelText}>{item.with}</Text>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={[sl.btn, item.isLast && { backgroundColor: C.teal }]}
              onPress={handleButton}
              activeOpacity={0.85}
            >
              <Text style={[sl.btnText, item.isLast && { color: '#03050A' }]}>
                {item.button}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const sl = StyleSheet.create({
  root: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  imageBg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.dimWhite,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },
  tag: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.mutedWhite,
    letterSpacing: 3,
    marginBottom: 12,
  },
  nameBlock: {
    marginBottom: 20,
  },
  name: {
    fontFamily: F.serifIt,
    fontSize: 52,
    color: C.white,
    lineHeight: 56,
    marginBottom: 6,
  },
  role: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.dimWhite,
    letterSpacing: 0.5,
  },
  panelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  panel: {
    flex: 1,
    backgroundColor: C.panelBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  panelLeft: {
    borderLeftWidth: 3,
  },
  panelRight: {
    borderLeftWidth: 3,
  },
  panelLabel: {
    fontFamily: F.monoMd,
    fontSize: 8,
    color: C.red,
    letterSpacing: 2,
    marginBottom: 8,
  },
  panelText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.dimWhite,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: F.monoMd,
    fontSize: 13,
    color: C.white,
    letterSpacing: 1.5,
  },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ArrivalScreen() {
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
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        renderItem={({ item }) => (
          <Slide item={item} onNext={handleNext} />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {/* Progress dots — overlaid above FlatList */}
      <View style={s.dots} pointerEvents="none">
        {SCREENS.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === activeIndex ? s.dotActive : s.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#03050A',
  },
  dots: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 116 : 96,
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
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
});
