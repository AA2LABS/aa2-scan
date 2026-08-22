import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { dl, useTheme, type Tokens } from '@/lib/theme-mode';
type Props = { result: any };

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const pal = (T: Tokens) => ({
  RED: dl(T, '#E24B4A', '#C0392B'),
  GREEN: dl(T, '#34D399', '#12795A'),
  AMBER: dl(T, '#E0A04A', '#8A6410'),
  INK: dl(T, '#E8EEF5', '#1a1a1a'),
  MUT: dl(T, '#8A99AD', 'rgba(0,0,0,0.55)'),
});

function clearance(T: Tokens, result: any) {
  const C = pal(T);
  if (result?.allergyAlert?.triggered) {
    return {
      state: 'NOT CLEARED', color: C.RED, icon: '\u26D4',
      line: `Conflicts with your ${result.allergyAlert.allergen} allergy.`,
      sub: result.allergyAlert.ingredient
        ? `${result.allergyAlert.ingredient} detected.`
        : 'Allergen match on your profile.',
    };
  }
  const v = result?.verdict;
  if (v === 'PAY ATTENTION' || v === 'TAKE NOTICE') {
    return {
      state: 'CAUTION', color: C.AMBER, icon: '\u26A0',
      line: result?.verdictReason || 'Cleared with caution.',
      sub: 'No allergen hit on your profile — review before contact.',
    };
  }
  return {
    state: 'CLEARED', color: C.GREEN, icon: '\u2713',
    line: result?.verdictReason || 'Cleared against your profile.',
    sub: 'No allergen hit. Safe to proceed.',
  };
}

export default function BioClearanceBand({ result }: Props) {
  const TH = useTheme();
  const st = useMemo(() => make_st(TH), [TH]);

  if (!result) return null;
  const c = clearance(TH, result);
  return (
    <View style={[st.wrap, { borderColor: c.color + '88', backgroundColor: c.color + '14' }]}>
      <Text style={[st.eyebrow, { color: c.color }]}>{'\u25C6'} BIO CLEARANCE</Text>
      <View style={st.row}>
        <View style={[st.badge, { borderColor: c.color + '88', backgroundColor: c.color + '22' }]}>
          <Text style={[st.badgeIcon, { color: c.color }]}>{c.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.state, { color: c.color }]}>{c.state}</Text>
          <Text style={st.checked}>CHECKED vs YOUR ALLERGY + BIO PROFILE</Text>
        </View>
      </View>
      <Text style={st.line}>{c.line}</Text>
      {c.sub ? <Text style={st.sub}>{c.sub}</Text> : null}
    </View>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_st = (T: Tokens) => {
  const { RED, GREEN, AMBER, INK, MUT } = pal(T);
  return StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 },
  eyebrow: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  badgeIcon: { fontSize: 22 },
  state: { fontSize: 19, fontWeight: '800', letterSpacing: 0.5 },
  checked: { fontFamily: 'DMMono-Regular', fontSize: 9, color: MUT, marginTop: 5, letterSpacing: 0.5 },
  line: { fontSize: 15, fontWeight: '700', color: INK, marginTop: 13, lineHeight: 20 },
  sub: { fontSize: 12, color: MUT, marginTop: 5, lineHeight: 16 },
});
};

