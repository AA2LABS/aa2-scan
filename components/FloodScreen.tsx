import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { dl, lc, useTheme, type Tokens } from '@/lib/theme-mode';
export type FloodRow = {
  icon: string; title: string; desc: string;
  chip?: string; chipKind?: 'clr' | 'watch' | 'hit' | 'accent';
  route?: string;
};
export type FloodScreenProps = {
  doorImage: ImageSourcePropType;
  eyebrow: string; title: string; accent: string;
  heroLine: string; heroSub?: string; heroColor?: string;
  rows: FloodRow[]; foot: string;
  sectionHeader?: string;
  ask?: { q: string; hint: string };
};

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const pal = (T: Tokens) => ({
  NAVY: dl(T, '#0E1B33', '#F0EEE8'),
  INK: dl(T, '#E8EEF5', '#1a1a1a'),
  MUT: dl(T, '#8A99AD', 'rgba(0,0,0,0.55)'),
  LINE: dl(T, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
  GREEN: dl(T, '#34D399', '#12795A'),
  AMBER: dl(T, '#E0A04A', '#8A6410'),
});

function chipColors(T: Tokens, kind: FloodRow['chipKind'], accent: string) {
  const C = pal(T);
  switch (kind) {
    case 'clr': return { fg: C.GREEN, bg: lc(T, 'rgba(52,211,153,0.12)') };
    case 'watch': return { fg: C.AMBER, bg: lc(T, 'rgba(224,160,74,0.14)') };
    case 'hit': return { fg: dl(T, '#FF8C8B', '#C0392B'), bg: lc(T, 'rgba(226,75,74,0.14)') };
    default: return { fg: lc(T, accent), bg: lc(T, 'rgba(255,255,255,0.06)') };
  }
}

export default function FloodScreen(props: FloodScreenProps) {
  const TH = useTheme();
  const st = useMemo(() => make_st(TH), [TH]);
  const C = pal(TH);

  const { doorImage, eyebrow, title, accent, heroLine, heroSub, heroColor, rows, foot, sectionHeader, ask } = props;
  return (
    <ScrollView style={st.root} contentContainerStyle={st.content}>
      <View style={st.hero}>
        <Image source={doorImage} resizeMode="cover" style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: accent }]}>{eyebrow}</Text>
          <Text style={st.title}>{title}</Text>
        </View>
      </View>
      <View style={st.band}>
        <Text style={[st.bandLine, { color: heroColor ?? C.INK }]}>{heroLine}</Text>
        {heroSub ? <Text style={st.bandSub}>{heroSub}</Text> : null}
      </View>
      {ask ? (
        <View style={[st.ask, { borderColor: accent + '80', backgroundColor: accent + '10' }]}>
          <Text style={[st.askQ, { color: accent }]}>{ask.q}</Text>
          <Text style={st.askH}>{ask.hint}</Text>
        </View>
      ) : null}
      <View style={st.rows}>
        {sectionHeader ? <Text style={st.sectionH}>{sectionHeader}</Text> : null}
        {rows.map((r, i) => {
          const c = chipColors(TH, r.chipKind, accent);
          const inner = (
            <>
              <View style={st.rowIcon}><Text style={st.rowIconTxt}>{r.icon}</Text></View>
              <View style={st.rowTx}>
                <Text style={st.rowTitle}>{r.title}</Text>
                <Text style={st.rowDesc}>{r.desc}</Text>
              </View>
              {r.chip ? (
                <View style={[st.chip, { backgroundColor: c.bg }]}>
                  <Text style={[st.chipTxt, { color: c.fg }]}>{r.chip}</Text>
                </View>
              ) : null}
            </>
          );
          return r.route ? (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => router.push(r.route as any)}
              style={[st.row, i > 0 ? st.rowBorder : null]}
            >
              {inner}
            </TouchableOpacity>
          ) : (
            <View key={i} style={[st.row, i > 0 ? st.rowBorder : null]}>
              {inner}
            </View>
          );
        })}
      </View>
      <Text style={[st.foot, { color: accent }]}>{foot}</Text>
    </ScrollView>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_st = (T: Tokens) => {
  const { NAVY, INK, MUT, LINE, GREEN, AMBER } = pal(T);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  content: { paddingBottom: 40 },
  hero: { height: 260, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.45)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  band: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE },
  bandLine: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  bandSub: { fontSize: 12, color: MUT, marginTop: 7, lineHeight: 17 },
  ask: { margin: 14, borderWidth: 1, borderRadius: 12, padding: 15 },
  askQ: { fontSize: 19, fontWeight: '800' },
  askH: { fontSize: 11.5, color: MUT, marginTop: 4 },
  sectionH: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: dl(T, '#5C6B80', 'rgba(0,0,0,0.38)'), marginBottom: 6, marginLeft: 2, marginTop: 8 },
  rows: { paddingHorizontal: 14, paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)') },
  rowIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowIconTxt: { fontSize: 16, color: INK },
  rowTx: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: INK },
  rowDesc: { fontSize: 12, color: MUT, marginTop: 2, lineHeight: 16 },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, marginLeft: 6 },
  chipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, marginTop: 18, paddingHorizontal: 16, lineHeight: 16 },
});
};

