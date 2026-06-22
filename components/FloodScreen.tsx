import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ImageSourcePropType } from 'react-native';

export type FloodRow = {
  icon: string; title: string; desc: string;
  chip?: string; chipKind?: 'clr' | 'watch' | 'hit' | 'accent';
};
export type FloodScreenProps = {
  doorImage: ImageSourcePropType;
  eyebrow: string; title: string; accent: string;
  heroLine: string; heroSub?: string; heroColor?: string;
  rows: FloodRow[]; foot: string;
};

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', LINE = 'rgba(255,255,255,0.10)';
const GREEN = '#34D399', AMBER = '#E0A04A';

function chipColors(kind: FloodRow['chipKind'], accent: string) {
  switch (kind) {
    case 'clr': return { fg: GREEN, bg: 'rgba(52,211,153,0.12)' };
    case 'watch': return { fg: AMBER, bg: 'rgba(224,160,74,0.14)' };
    case 'hit': return { fg: '#FF8C8B', bg: 'rgba(226,75,74,0.14)' };
    default: return { fg: accent, bg: 'rgba(255,255,255,0.06)' };
  }
}

export default function FloodScreen(props: FloodScreenProps) {
  const { doorImage, eyebrow, title, accent, heroLine, heroSub, heroColor, rows, foot } = props;
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
        <Text style={[st.bandLine, { color: heroColor ?? INK }]}>{heroLine}</Text>
        {heroSub ? <Text style={st.bandSub}>{heroSub}</Text> : null}
      </View>
      <View style={st.rows}>
        {rows.map((r, i) => {
          const c = chipColors(r.chipKind, accent);
          return (
            <View key={i} style={[st.row, i > 0 ? st.rowBorder : null]}>
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
            </View>
          );
        })}
      </View>
      <Text style={[st.foot, { color: accent }]}>{foot}</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
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
  rows: { paddingHorizontal: 14, paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.05)' },
  rowIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowIconTxt: { fontSize: 16, color: INK },
  rowTx: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: INK },
  rowDesc: { fontSize: 12, color: MUT, marginTop: 2, lineHeight: 16 },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, marginLeft: 6 },
  chipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, marginTop: 18, paddingHorizontal: 16, lineHeight: 16 },
});
