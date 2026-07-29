import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, ImageSourcePropType, useWindowDimensions } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// DOOR COVER — the vertical full-bleed door every intelligence opens with.
// Law: DOOR = COVER · OPEN IT · INTELLIGENCE FLOODS IN · BACK BUTTON ALWAYS WIRED.
// This component renders structure only. Every string is injected verbatim
// from the approved door HTML by the screen that owns it. No copy lives here.
// ─────────────────────────────────────────────────────────────────────────────

export type DoorCoverProps = {
  art: ImageSourcePropType;
  intelChip: string;        // e.g. "INTELLIGENCE 0X03"
  freeChip?: string;        // e.g. "FREE" | "FREE ENTRY"
  skip?: boolean;           // SKIP chip top-right (doors that allow skipping)
  roleLine: string;         // mono eyebrow under the chips
  titleLines: string[];     // display title, one entry per line
  desc: string;             // serif italic description
  withLabel: string;        // e.g. "WITH BIO BUDDY"
  withText: string;
  withoutLabel: string;     // "WITHOUT"
  withoutText: string;
  openLabel: string;        // e.g. "◆ OPEN THE DOOR" | "Meet the Concierge →"
  accent: string;           // per-intelligence accent color
  onOpen: () => void;
};

export default function DoorCover(p: DoorCoverProps) {
  const { height } = useWindowDimensions();
  return (
    <View style={[st.root, { minHeight: height - 120 }]}>
      <Image source={p.art} resizeMode="cover" style={st.art} />
      <View style={st.scrim} />

      <View style={st.topTag}>
        <View style={[st.chipBox, { borderColor: p.accent + '66' }]}>
          <Text style={[st.chipTxt, { color: p.accent }]}>{p.intelChip}</Text>
        </View>
        {p.skip ? (
          <Pressable onPress={p.onOpen} hitSlop={10}>
            <Text style={st.skipTxt}>SKIP</Text>
          </Pressable>
        ) : p.freeChip ? (
          <View style={[st.chipBox, { borderColor: 'rgba(52,211,153,0.35)' }]}>
            <Text style={[st.chipTxt, { color: '#34D399' }]}>{p.freeChip}</Text>
          </View>
        ) : null}
      </View>

      <View style={st.bottom}>
        <Text style={[st.role, { color: p.accent }]}>{p.roleLine}</Text>
        {p.titleLines.map((l, i) => (
          <Text key={i} style={st.title}>{l}</Text>
        ))}
        <Text style={st.desc}>{p.desc}</Text>

        <View style={st.wpillWith}>
          <Text style={st.wk}>{p.withLabel}</Text>
          <Text style={st.wt}>{p.withText}</Text>
        </View>
        <View style={st.wpillWithout}>
          <Text style={[st.wk, { color: '#E24B4A' }]}>{p.withoutLabel}</Text>
          <Text style={st.wt}>{p.withoutText}</Text>
        </View>

        <Pressable
          style={[st.open, { borderColor: p.accent + '80', backgroundColor: p.accent + '14' }]}
          onPress={p.onOpen}
        >
          <Text style={[st.openTxt, { color: p.accent }]}>{p.openLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: 'relative', justifyContent: 'flex-end', backgroundColor: '#08111F' },
  art: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  scrim: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(8,17,31,0.30)',
  },
  topTag: {
    position: 'absolute', top: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 2,
  },
  chipBox: {
    backgroundColor: 'rgba(8,17,31,0.6)', borderWidth: 0.5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  chipTxt: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 2 },
  skipTxt: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.55)' },
  bottom: { padding: 18, paddingBottom: 22, zIndex: 2, backgroundColor: 'rgba(8,17,31,0.86)' },
  role: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 2, marginBottom: 7 },
  title: { fontFamily: 'BebasNeue-Regular', fontSize: 44, letterSpacing: 2, lineHeight: 40, color: '#FFF' },
  desc: {
    fontFamily: 'CormorantGaramond-Italic', fontStyle: 'italic', fontSize: 15,
    color: 'rgba(255,255,255,0.82)', lineHeight: 21, marginTop: 8, marginBottom: 12,
  },
  wpillWith: {
    borderLeftWidth: 2, borderLeftColor: '#1BB8FF', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8, padding: 10, marginBottom: 8,
  },
  wpillWithout: {
    borderLeftWidth: 2, borderLeftColor: '#E24B4A', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8, padding: 10, marginBottom: 14,
  },
  wk: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1.5, color: '#1BB8FF', marginBottom: 3 },
  wt: { fontFamily: 'DMSans-Regular', fontSize: 12.5, color: 'rgba(255,255,255,0.9)', lineHeight: 17 },
  open: { borderWidth: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  openTxt: { fontFamily: 'DMMono-Medium', fontSize: 13, letterSpacing: 2 },
});
