import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import { loadMemberProfile, type FullMemberProfile } from '../../lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80';
const LINE = 'rgba(255,255,255,0.10)', GOLD = '#D4A847', CYAN = '#1BB8FF';

type Item = { icon: string; title: string; desc: string; route?: Href };

// YOUR INTELLIGENCES \u2014 the receiving line the Concierge routes you to.
const INTELLIGENCES: Item[] = [
  { icon: '\uD83E\uDDEC', title: 'Bio Buddy',     desc: 'MEMBRANE \u00B7 DEVICES \u00B7 BIOSIGNALS',       route: '/biobuddy' as Href },
  { icon: '\uD83C\uDF73', title: 'The Chef',      desc: 'INTERNATIONAL COOKING \u00B7 AFICIONADO',    route: '/chef' as Href },
  { icon: '\u2728', title: 'The Chauffeur', desc: 'TRAVEL \u00B7 MAP \u00B7 DOSSIER \u00B7 RETAIL',        route: '/chauffeur' as Href },
  { icon: '\u2B21', title: 'The Equalizer', desc: 'VAULT \u00B7 PILL \u00B7 APOTHECARY \u00B7 SPECIES',    route: '/equalizer' as Href },
];

// SURFACES HELD BY CONCIERGE \u2014 top to bottom.
const SURFACES: Item[] = [
  { icon: '\uD83D\uDCE2', title: 'Live Feed',       desc: 'NO NEGATIVE \u2014 all customers post \u00B7 app-to-app \u00B7 post to your board' },
  { icon: '\uD83D\uDCB0', title: 'Aware Dollars',   desc: 'also in Bio Buddy \u2014 what you saved \u00B7 subscription recovery' },
  { icon: '\u25CE', title: 'Vision Board',    desc: 'goals \u00B7 trips & travel \u00B7 language learning \u00B7 share', route: '/vision-board' as Href },
  { icon: '\uD83D\uDCDA', title: 'Learning Center', desc: 'depth-on-demand \u00B7 languages \u00B7 financial \u00B7 devices',   route: '/depth-on-demand' as Href },
];

export default function ConciergeScreen() {
  const [profile, setProfile] = useState<FullMemberProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const p = await loadMemberProfile();
    setProfile(p); setLoaded(true);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sealed = !!profile?.onboardingComplete;
  const name = profile?.name ?? null;
  const go = (route?: Href) => { if (route) router.push(route); };

  const renderRow = (item: Item, i: number) => (
    <Pressable key={i} style={st.row} onPress={() => go(item.route)}>
      <View style={st.rowIcon}><Text style={st.rowIconTxt}>{item.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={st.rowName}>{item.title}</Text>
        <Text style={st.rowDesc}>{item.desc}</Text>
      </View>
      <Text style={st.chev}>›</Text>
    </Pressable>
  );

  return (
    <ScrollView style={st.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={st.hero}>
        <Image source={require('../../assets/doors/door-concierge.jpg')} resizeMode="cover" style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: GOLD }]}>INTELLIGENCE 0X01 · FRONT DOOR</Text>
          <Text style={st.title}>The Concierge</Text>
        </View>
      </View>

      <View style={st.ask}>
        <Text style={st.askQ}>
          {sealed && name ? `How may I assist you, ${name.split(' ')[0]}?` : 'How may I assist you?'}
        </Text>
        <Text style={st.askH}>ask · type · speak  🎤</Text>
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>YOUR INTELLIGENCES</Text>
        {INTELLIGENCES.map(renderRow)}
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>SURFACES HELD BY CONCIERGE</Text>
        {SURFACES.map(renderRow)}
      </View>

      <Text style={st.foot}>One intelligence lets you in and routes you anywhere.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  hero: { height: 230, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.5)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  ask: { margin: 14, borderWidth: 1, borderColor: 'rgba(212,168,71,0.5)', backgroundColor: 'rgba(212,168,71,0.06)', borderRadius: 12, padding: 15 },
  askQ: { fontSize: 19, fontWeight: '800', color: '#e8c887' },
  askH: { fontSize: 11.5, color: MUT, marginTop: 4 },
  section: { paddingHorizontal: 14, paddingTop: 6 },
  sectionH: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: FAINT, marginBottom: 11, marginLeft: 2, marginTop: 10 },
  build: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buildTxt: { color: '#15110a', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  buildSub: { fontSize: 11.5, color: MUT, marginTop: 9, textAlign: 'center', lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 9 },
  rowIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(212,168,71,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(212,168,71,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowIconTxt: { fontSize: 15, color: GOLD },
  rowName: { fontSize: 14, fontWeight: '700', color: INK },
  rowDesc: { fontSize: 11, color: MUT, marginTop: 3, lineHeight: 16 },
  chev: { color: FAINT, fontSize: 18, marginLeft: 6 },
  adjust: { borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, padding: 15, marginTop: 4 },
  adjustQ: { fontSize: 18, fontWeight: '800', color: '#8fd6ff' },
  adjustSub: { fontSize: 11.5, color: MUT, marginTop: 4 },
  foot: { textAlign: 'center', fontSize: 11, color: GOLD, marginTop: 18 },
});
