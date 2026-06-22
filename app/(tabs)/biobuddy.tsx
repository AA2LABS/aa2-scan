import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadMemberProfile, type FullMemberProfile } from '../../lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80', LINE = 'rgba(255,255,255,0.10)';
const CYAN = '#1BB8FF', GREEN = '#34D399', AMBER = '#E0A04A';

const DEVICE_LABELS: Record<string, { name: string; icon: string }> = {
  garmin_tactix_8: { name: 'Garmin Tactix 8', icon: '\u25D0' },
  oura_ring_4:     { name: 'Oura Ring 4', icon: '\u25EF' },
  whoop:           { name: 'WHOOP 5.0', icon: '\u25D1' },
  whoop_5:         { name: 'WHOOP 5.0', icon: '\u25D1' },
  muse_s_athena:   { name: 'Muse S Athena', icon: '\u266A' },
  beats_pro_2:     { name: 'Beats Pro 2', icon: '\u25C9' },
  oakley_meta:     { name: 'Oakley Meta HSTN', icon: '\u25C8' },
};

function deviceMeta(key: string) {
  const k = String(key).toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return DEVICE_LABELS[k] ?? { name: String(key), icon: '\u25CB' };
}

export default function BioBuddyScreen() {
  const [profile, setProfile] = useState<FullMemberProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = await loadMemberProfile();
    setProfile(p); setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const hardware = profile?.hardware ?? [];
  const hasDevices = hardware.length > 0;
  const firstName = profile?.name ? profile.name.split(' ')[0] : null;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
    >
      <View style={st.hero}>
        <Image source={require('../../assets/doors/door-biobuddy.jpg')} resizeMode="cover" style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: CYAN }]}>INTELLIGENCE · NERVOUS SYSTEM</Text>
          <Text style={st.title}>Bio Buddy</Text>
        </View>
      </View>

      <View style={st.band}>
        <Text style={st.bandLine}>
          {hasDevices ? 'Every device read as one body.' : 'Connect a device to read your body as one.'}
        </Text>
        <Text style={st.bandSub}>
          {firstName ? `${firstName}'s baseline` : 'Your baseline'} — translated, not just numbers.
        </Text>
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>BASELINE</Text>
        <View style={st.statRow}>
          <View style={st.stat}>
            <Text style={st.statVal}>{profile?.sleepScore != null ? String(profile.sleepScore) : '—'}</Text>
            <Text style={st.statLbl}>SLEEP SCORE</Text>
          </View>
          <View style={st.stat}>
            <Text style={st.statVal}>{profile?.stressLevel ?? '—'}</Text>
            <Text style={st.statLbl}>STRESS</Text>
          </View>
          <View style={st.stat}>
            <Text style={st.statVal}>{hardware.length}</Text>
            <Text style={st.statLbl}>DEVICES</Text>
          </View>
        </View>
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>YOUR STACK</Text>
        {!loaded ? (
          <Text style={st.empty}>Reading your stack…</Text>
        ) : !hasDevices ? (
          <Text style={st.empty}>No devices connected yet. Add hardware in onboarding and it reads here.</Text>
        ) : hardware.map((key, i) => {
          const meta = deviceMeta(key);
          return (
            <View key={i} style={st.dev}>
              <View style={st.devIcon}><Text style={st.devIconTxt}>{meta.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.devName}>{meta.name}</Text>
                <Text style={st.devDesc}>Connected · feeding the membrane.</Text>
              </View>
              <View style={[st.chip, { backgroundColor: GREEN + '1F' }]}>
                <Text style={[st.chipTxt, { color: GREEN }]}>SYNCED</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={st.foot}>One nervous system, one truth.</Text>
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
  band: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE },
  bandLine: { fontSize: 17, fontWeight: '800', color: INK, lineHeight: 23 },
  bandSub: { fontSize: 12, color: MUT, marginTop: 7, lineHeight: 17 },
  section: { paddingHorizontal: 14, paddingTop: 16 },
  sectionH: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: FAINT, marginBottom: 11, marginLeft: 2 },
  empty: { fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 8, lineHeight: 17 },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: CYAN },
  statLbl: { fontSize: 9, letterSpacing: 1, color: FAINT, marginTop: 5, fontWeight: '700' },
  dev: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 10 },
  devIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: 'rgba(27,184,255,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(27,184,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  devIconTxt: { fontSize: 17, color: CYAN },
  devName: { fontSize: 14, fontWeight: '700', color: INK },
  devDesc: { fontSize: 11, color: MUT, marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  chipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, color: CYAN, marginTop: 18 },
});
