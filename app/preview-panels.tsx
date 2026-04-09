import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const BLUE        = '#1BB8FF';
const BLUE_DIM    = 'rgba(27,184,255,0.15)';
const GREEN       = '#1D9E75';
const RED         = '#E05252';
const GOLD        = '#C49A2A';
const DARK_BG     = '#0A0804';
const CARD_BG     = '#150F0A';
const WHITE       = '#FFFFFF';
const MUTED       = 'rgba(255,255,255,0.55)';
const TEAL        = '#2ECFB3';
const PURPLE      = '#9B59B6';

// ─── FONTS ───────────────────────────────────────────────────────────────────
const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
  sans:    'DMSans-Regular',
};

// ─── DIMENSIONS ──────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

// ─── PANEL DATA ──────────────────────────────────────────────────────────────
const PANELS = [
  {
    id: 1,
    caption: 'This is what your morning looks like. Every device. Every signal. One rhythm.',
  },
  {
    id: 2,
    caption: 'The more you clarify, the more precisely the membrane reflects you — not the population average.',
  },
  {
    id: 3,
    caption: 'Your allergens are the first check on every scan. Labels lie. The Equalizer does not.',
  },
  {
    id: 4,
    caption: 'Roadside stand in Montana. Market in Tokyo. Wild river in Iceland. Point. Scan. Know.',
  },
  {
    id: 5,
    caption: '',
  },
];

// ─── CHIP HELPER ─────────────────────────────────────────────────────────────
function TagChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{
      borderWidth: 1,
      borderColor: color + '80',
      backgroundColor: color + '1F',
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 5,
    }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

// ─── PANEL 1 — MEMBRANE LIVE ─────────────────────────────────────────────────
function Panel1() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 3, flex: 1 }}>
          I AM THE RECEIPT
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN }} />
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 2 }}>
            MEMBRANE LIVE
          </Text>
        </View>
      </View>

      {/* Name + location */}
      <Text style={{ fontFamily: F.serifIt, fontSize: 36, color: WHITE, marginBottom: 4 }}>
        James Pitts
      </Text>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 16 }}>
        BELGRADE, MT
      </Text>

      {/* Device stack */}
      {[
        { label: 'Garmin Tactix 8',    value: '74 HRV',       color: BLUE   },
        { label: 'Oura Ring 4',         value: '68 Readiness', color: GREEN  },
        { label: 'Beats Pro 2',         value: '42ms HRV',     color: GOLD   },
        { label: 'Oakley Meta HSTN',    value: '58 bpm',       color: PURPLE },
      ].map(device => (
        <View key={device.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: device.color }} />
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, flex: 1 }}>{device.label}</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 11, color: device.color }}>{device.value}</Text>
        </View>
      ))}

      {/* Signal bars */}
      <View style={{ marginTop: 16, marginBottom: 16 }}>
        {[
          { color: BLUE,   width: '90%' },
          { color: GREEN,  width: '75%' },
          { color: GOLD,   width: '85%' },
          { color: PURPLE, width: '70%' },
        ].map((bar, i) => (
          <View key={i} style={{ height: 2, borderRadius: 1, backgroundColor: bar.color, width: bar.width as any, marginBottom: 5 }} />
        ))}
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        {[
          { num: '74', label: 'HRV',       color: BLUE   },
          { num: '68', label: 'READINESS', color: GREEN  },
          { num: '42', label: 'HRV MS',    color: GOLD   },
          { num: '58', label: 'BPM',       color: PURPLE },
        ].map(stat => (
          <View key={stat.label} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontFamily: F.monoMd, fontSize: 22, color: stat.color }}>{stat.num}</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 1 }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Act Right Dollars */}
      <View style={{
        marginTop: 16,
        backgroundColor: CARD_BG,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(196,154,42,0.30)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>
            ACT RIGHT DOLLARS
          </Text>
          <Text style={{ fontFamily: F.display, fontSize: 32, color: GOLD }}>$47.20</Text>
        </View>
        <View style={{
          borderWidth: 1,
          borderColor: GOLD,
          borderRadius: 8,
          padding: 8,
          marginLeft: 'auto',
        }}>
          <Text style={{ fontFamily: F.mono, fontSize: 8, color: GOLD, letterSpacing: 1 }}>AA2 · ACT RIGHT</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED, marginTop: 2 }}>**** 4021</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 2 — BIO BUDDY CLARIFIER ───────────────────────────────────────────
function Panel2() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Alert card */}
      <View style={{
        backgroundColor: 'rgba(224,82,82,0.12)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(224,82,82,0.40)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2 }}>
              BIO BUDDY · BIOSIGNAL EVENT
            </Text>
            <Text style={{ fontFamily: F.display, fontSize: 20, color: WHITE, marginTop: 2 }}>
              Elevated Stress Pattern Detected
            </Text>
          </View>
        </View>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 8 }}>
          TODAY · 2:47 PM
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED }}>Garmin HR 118bpm</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD }}>Oura Stress 74</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED }}>Strava No activity</Text>
        </View>
      </View>

      {/* Clarifier card */}
      <View style={{
        backgroundColor: CARD_BG,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: BLUE_DIM,
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE_DIM, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14 }}>🧠</Text>
          </View>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 2, marginLeft: 8, alignSelf: 'center' }}>
            BIO BUDDY · CLARIFIER
          </Text>
        </View>
        <Text style={{ fontFamily: F.serifIt, fontSize: 16, color: WHITE, lineHeight: 24, marginBottom: 16 }}>
          "Bios reported as stress at 2:47 PM. Is that accurate, or would you like to clarify?"
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: BLUE, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }} activeOpacity={0.8}>
            <Text style={{ fontFamily: F.monoMd, fontSize: 9, color: '#03050A', letterSpacing: 1 }}>YES · LOG AS STRESS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: BLUE_DIM, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }} activeOpacity={0.8}>
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 1 }}>I'D LIKE TO CLARIFY</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clarification logged */}
      <View style={{
        backgroundColor: 'rgba(29,158,117,0.12)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(29,158,117,0.40)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: GREEN }}>✓</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 1, marginLeft: 6 }}>
            CLARIFICATION LOGGED · 2:53 PM
          </Text>
        </View>
        <Text style={{ fontFamily: F.serifIt, fontSize: 14, color: WHITE, lineHeight: 22, marginBottom: 10 }}>
          "That is not stress. I just got promoted and got approved for my new house. That's excitement."
        </Text>
        {[
          { color: BLUE,  text: 'Garmin HR spike — reclassified STRESS → EXCITEMENT' },
          { color: GREEN, text: 'Oura stress 74 — excluded from stress baseline' },
          { color: BLUE,  text: 'Positive life event logged' },
        ].map((bullet, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: bullet.color, marginTop: 4 }} />
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, flex: 1 }}>{bullet.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── PANEL 3 — EQUALIZER + CHEF ──────────────────────────────────────────────
function Panel3() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Heads Up banner */}
      <View style={{
        backgroundColor: 'rgba(196,154,42,0.15)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(196,154,42,0.35)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
        <Text style={{ fontFamily: F.mono, fontSize: 10, color: GOLD, letterSpacing: 1 }}>
          HEADS UP · Read before you buy
        </Text>
      </View>

      {/* Allergen flag */}
      <View style={{
        backgroundColor: 'rgba(224,82,82,0.10)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderLeftWidth: 3,
        borderColor: 'rgba(224,82,82,0.30)',
        borderLeftColor: RED,
      }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 6 }}>
          MEMBRANE FLAG · PEANUT ALLERGEN
        </Text>
        <Text style={{ fontFamily: F.sans, fontSize: 13, color: WHITE, lineHeight: 20 }}>
          This tomato paste{' '}
          <Text style={{ color: RED, fontFamily: F.sans }}>contains traces of peanut oil</Text>
          {' '}from shared equipment. Your membrane flags peanut sensitivity.
        </Text>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {['Muir Glen ✓', 'Bianco DiNapoli ✓', 'Jovial ✓'].map(brand => (
            <TagChip key={brand} label={brand} color={GREEN} />
          ))}
        </View>
      </View>

      {/* Product name */}
      <Text style={{ fontFamily: F.serifIt, fontSize: 22, color: WHITE, marginTop: 12, marginBottom: 2 }}>
        Cento Tomato Paste
      </Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 12 }}>
        6 OZ · CANNED · SCANNED IN STORE
      </Text>

      {/* The Chef */}
      <Text style={{ fontFamily: F.serifIt, fontSize: 18, color: GOLD, marginBottom: 4 }}>
        The Chef
      </Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>
        TAP A RECIPE TO BUILD YOUR LIST
      </Text>

      <View style={{
        backgroundColor: CARD_BG,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.sans, fontSize: 15, color: WHITE }}>Spaghetti Bolognese</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, marginTop: 3 }}>
            8 ingredients · 45 min · 3 still needed
          </Text>
        </View>
        <Text style={{ fontFamily: F.sans, fontSize: 20, color: MUTED, marginLeft: 8 }}>›</Text>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 4 — THE FORAGER ───────────────────────────────────────────────────
function Panel4() {
  const infoRows = [
    {
      label: 'HABITAT',
      value: 'Cold, clear mountain streams. Yellowstone drainage. Thrives in Montana\'s Clark Fork system.',
      color: WHITE,
    },
    {
      label: 'EDIBILITY',
      value: 'Excellent. Mild, clean flavor. Best pan-fried or grilled over open flame within 24 hours.',
      color: GREEN,
    },
    {
      label: 'NUTRITION',
      value: 'High Omega-3 (1.9g/100g). 20g protein. Low mercury. Vitamin D, B12, selenium.',
      color: WHITE,
    },
    {
      label: 'REGULATIONS',
      value: 'Montana FWP: 5 fish/day limit. Local water restrictions. License required.',
      color: RED,
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header badge */}
      <View style={{
        backgroundColor: CARD_BG,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: BLUE_DIM,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
        <Text style={{ fontSize: 16 }}>🌿</Text>
        <View>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 2 }}>
            THE EQUALIZER · FORAGER LAYER
          </Text>
          <Text style={{ fontFamily: F.serifIt, fontSize: 16, color: WHITE, marginTop: 2 }}>
            Fish & Water
          </Text>
        </View>
      </View>

      {/* Result card */}
      <View style={{
        backgroundColor: CARD_BG,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BLUE_DIM,
      }}>
        {/* Status bar */}
        <View style={{
          backgroundColor: 'rgba(29,158,117,0.20)',
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN }} />
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: GREEN, letterSpacing: 2 }}>
            ALL CLEAR · EDIBLE
          </Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, marginLeft: 'auto' }}>
            Identified with high confidence
          </Text>
        </View>

        <View style={{ padding: 14 }}>
          <Text style={{ fontFamily: F.serifIt, fontSize: 28, color: WHITE, marginBottom: 2 }}>
            Rainbow Trout
          </Text>
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, marginBottom: 10 }}>
            Oncorhynchus mykiss · Salmonidae
          </Text>

          {/* Tag chips */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <TagChip label="SAFE TO EAT" color={GREEN} />
            <TagChip label="NATIVE · MT" color={BLUE} />
            <TagChip label="IN SEASON"   color={TEAL} />
          </View>

          {/* Info rows */}
          {infoRows.map((row, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.06)',
            }}>
              <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 1, width: 80 }}>
                {row.label}
              </Text>
              <Text style={{ fontFamily: F.sans, fontSize: 12, color: row.color, flex: 1, lineHeight: 18 }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 5 — NORTH STAR TRANSITION ─────────────────────────────────────────
function Panel5({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <Text style={{
        fontFamily: F.mono,
        fontSize: 9,
        color: BLUE,
        letterSpacing: 3,
        textAlign: 'center',
        marginBottom: 40,
      }}>
        THE MEMBRANE · AA2 BIOSIGNAL SYSTEM
      </Text>

      <Text style={{
        fontFamily: F.serifIt,
        fontSize: 26,
        color: WHITE,
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 16,
      }}>
        "The more of yourself you bring to this system — the more the system's mirror can reflect back to you."
      </Text>

      <Text style={{
        fontFamily: F.mono,
        fontSize: 10,
        color: BLUE,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 48,
      }}>
        5 MINUTES · 8 BLOCKS · ONE MEMBRANE
      </Text>

      <TouchableOpacity
        onPress={onComplete}
        activeOpacity={0.85}
        style={{ width: '100%' }}
      >
        <View style={{
          backgroundColor: BLUE,
          borderRadius: 14,
          paddingVertical: 18,
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: F.monoMd,
            fontSize: 13,
            color: '#03050A',
            letterSpacing: 2,
          }}>
            BUILD MY MEMBRANE →
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PreviewPanels({ onComplete }: { onComplete: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  };

  const renderPanel = ({ item }: { item: typeof PANELS[0] }) => {
    const isLast = item.id === 5;
    return (
      <View style={{
        width: SCREEN_W,
        flex: 1,
        backgroundColor: DARK_BG,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 48 : 60,
        paddingBottom: 100,
      }}>
        {item.id === 1 && <Panel1 />}
        {item.id === 2 && <Panel2 />}
        {item.id === 3 && <Panel3 />}
        {item.id === 4 && <Panel4 />}
        {item.id === 5 && <Panel5 onComplete={onComplete} />}

        {/* Caption — panels 1-4 only */}
        {!isLast && item.caption.length > 0 && (
          <View style={styles.captionWrap} pointerEvents="none">
            <Text style={styles.caption}>{item.caption}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: DARK_BG }}>
      <FlatList
        ref={flatListRef}
        data={PANELS}
        keyExtractor={item => String(item.id)}
        renderItem={renderPanel}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_W}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* Progress dots */}
      <View style={styles.dotsWrap} pointerEvents="none">
        {PANELS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === activeIndex ? 12 : 6,
                backgroundColor: i === activeIndex ? BLUE : 'rgba(255,255,255,0.25)',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  captionWrap: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  caption: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
