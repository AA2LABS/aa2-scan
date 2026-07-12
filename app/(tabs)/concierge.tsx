import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import { loadMemberProfile, type FullMemberProfile } from '../../lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80';
const LINE = 'rgba(255,255,255,0.10)', GOLD = '#D4A847', CYAN = '#1BB8FF';

type Fn = { icon: string; title: string; desc: string };
const FUNCTIONS: Fn[] = [
  { icon: '\u25A4', title: 'Introduce the team',            desc: 'Equalizer \u00B7 Bio Buddy \u00B7 Chauffeur \u00B7 Chef \u2014 your whole receiving line' },
  { icon: '\u25C9', title: 'Remember you',                  desc: 'Name \u00B7 personality \u00B7 preferences \u00B7 history \u2014 carried session to session' },
  { icon: '\u25C8', title: 'Onboarding as initiation',      desc: 'The skin of the system \u2014 first contact, identity absorbed' },
  { icon: '\u21BB', title: 'Continuity between sessions',   desc: 'Nothing repeated. Nothing lost. Pick up exactly where you left off.' },
  { icon: '\u25A6', title: 'Explain any part of the system', desc: 'What a spoke does \u00B7 how the Vault works \u00B7 what AWARE DOLLARS means' },
  { icon: '\u25CE', title: 'Cultural & language guidance',  desc: 'Foreign menus \u00B7 regional context \u00B7 survival-relevance learning' },
  { icon: '\u25CB', title: 'Family onboarding',             desc: "Set up spouse \u00B7 children \u00B7 each member's profile and role" },
  { icon: '\u25A0', title: 'Choose your personality',       desc: 'The Coach \u00B7 The Stable \u00B7 COMMAND \u00B7 THE BRIEF' },
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
  const openMembrane = () => router.push('/(tabs)/onboarding' as Href);

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
          {sealed && name ? `How can I help you, ${name.split(' ')[0]}?` : 'How can I help you?'}
        </Text>
        <Text style={st.askH}>speak or type anything…</Text>
      </View>

      {loaded && !sealed ? (
        <View style={st.section}>
          <Pressable style={st.build} onPress={openMembrane}>
            <Text style={st.buildTxt}>◆ BUILD MY MEMBRANE →</Text>
          </Pressable>
          <Text style={st.buildSub}>
            Your stack · your family · your K9 · your allergies · your goals. Customization starts here — and it never closes.
          </Text>
        </View>
      ) : null}

      <View style={st.section}>
        <Text style={st.sectionH}>WHAT THE CONCIERGE DOES</Text>
        {FUNCTIONS.map((f, i) => (
          <Pressable key={i} style={st.row} onPress={openMembrane}>
            <View style={st.rowIcon}><Text style={st.rowIconTxt}>{f.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.rowName}>{f.title}</Text>
              <Text style={st.rowDesc}>{f.desc}</Text>
            </View>
            <Text style={st.chev}>›</Text>
          </Pressable>
        ))}
      </View>

      {sealed ? (
        <View style={st.section}>
          <Pressable style={st.adjust} onPress={openMembrane}>
            <Text style={st.adjustQ}>CHANGE ANYTHING.</Text>
            <Text style={st.adjustSub}>add a life, a device, a goal — the membrane adapts</Text>
          </Pressable>
        </View>
      ) : null}

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
