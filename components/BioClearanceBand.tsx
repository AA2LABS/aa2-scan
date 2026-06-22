import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = { result: any };

const RED = '#E24B4A', GREEN = '#34D399', AMBER = '#E0A04A', INK = '#E8EEF5', MUT = '#8A99AD';

function clearance(result: any) {
  if (result?.allergyAlert?.triggered) {
    return {
      state: 'NOT CLEARED', color: RED, icon: '\u26D4',
      line: `Conflicts with your ${result.allergyAlert.allergen} allergy.`,
      sub: result.allergyAlert.ingredient
        ? `${result.allergyAlert.ingredient} detected.`
        : 'Allergen match on your profile.',
    };
  }
  const v = result?.verdict;
  if (v === 'PAY ATTENTION' || v === 'TAKE NOTICE') {
    return {
      state: 'CAUTION', color: AMBER, icon: '\u26A0',
      line: result?.verdictReason || 'Cleared with caution.',
      sub: 'No allergen hit on your profile — review before contact.',
    };
  }
  return {
    state: 'CLEARED', color: GREEN, icon: '\u2713',
    line: result?.verdictReason || 'Cleared against your profile.',
    sub: 'No allergen hit. Safe to proceed.',
  };
}

export default function BioClearanceBand({ result }: Props) {
  if (!result) return null;
  const c = clearance(result);
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

const st = StyleSheet.create({
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
