import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useFocusEffect, router, type Href } from 'expo-router';
import { loadMemberProfile, type FullMemberProfile } from '../../lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80', LINE = 'rgba(255,255,255,0.10)';
const CYAN = '#1BB8FF', GREEN = '#34D399', AMBER = '#E0A04A', GOLD = '#D4A847';

const PAGES = ['STEP 1 · THE DOOR', 'STEP 2 · CONTROL PANEL · FLOOD', 'STEP 3 · THE MEMBRANE · EDIT'];

const DEVICE_LABELS: Record<string, { name: string; icon: string }> = {
  garmin_tactix_8: { name: 'Garmin Tactix 8', icon: '◐' },
  oura_ring_4:     { name: 'Oura Ring 4', icon: '◯' },
  whoop:           { name: 'WHOOP 5.0', icon: '◑' },
  whoop_5:         { name: 'WHOOP 5.0', icon: '◑' },
  muse_s_athena:   { name: 'Muse S Athena', icon: '♪' },
  beats_pro_2:     { name: 'Beats Pro 2', icon: '◉' },
  oakley_meta:     { name: 'Oakley Meta HSTN', icon: '◈' },
  strava:          { name: 'Strava', icon: '▲' },
};

function deviceMeta(key: string) {
  const k = String(key).toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return DEVICE_LABELS[k] ?? { name: String(key), icon: '○' };
}

export default function BioBuddyScreen() {
  const [profile, setProfile] = useState<FullMemberProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const load = useCallback(async () => {
    const p = await loadMemberProfile();
    setProfile(p); setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const openMembrane = () => router.push('/(tabs)/onboarding' as Href);
  const goPage = (i: number) => pagerRef.current?.setPage(i);

  const hardware   = profile?.hardware ?? [];
  const hasDevices = hardware.length > 0;
  const firstName  = profile?.name ? profile.name.split(' ')[0] : null;
  const sealed     = !!profile?.onboardingComplete;

  const allergens  = profile?.foodAllergens ?? [];
  const activities = profile?.activities ?? [];
  const diet       = profile?.dietTypes ?? [];
  const species    = profile?.animalSpecies ?? null;
  const n30        = profile?.northStar30d ?? null;
  const n90        = profile?.northStar90d ?? null;
  const commander  = profile?.commanderLayerActive ?? false;
  const meds       = profile?.medications ?? null;

  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />;

  return (
    <View style={st.root}>
      {/* PAGE DOTS + CAPTION */}
      <View style={st.pagerNav}>
        <View style={st.dotsRow}>
          {[0, 1, 2].map(i => (
            <TouchableOpacity key={i} onPress={() => goPage(i)}>
              <View style={[st.dot, page === i && [st.dotActive, { backgroundColor: CYAN }]]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={st.caption}>{PAGES[page]}</Text>
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={e => setPage(e.nativeEvent.position)}
      >
        {/* ── PAGE 1 · THE DOOR ── */}
        <View key="door" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={st.hero}>
              <Image source={require('../../assets/doors/door-biobuddy.jpg')} resizeMode="cover" style={st.heroImg} />
              <View style={st.heroScrim} />
              <View style={st.heroContent}>
                <Text style={[st.eyebrow, { color: CYAN }]}>INTELLIGENCE 0X03 · NERVOUS SYSTEM</Text>
                <Text style={st.title}>Bio Buddy</Text>
              </View>
            </View>

            <Pressable style={st.navBtn} onPress={() => goPage(1)}>
              <Text style={st.navBtnTxt}>CONTINUE →</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── PAGE 2 · CONTROL PANEL · FLOOD ── */}
        <View key="flood" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={refresh}>
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
                <Pressable onPress={openMembrane}>
                  <Text style={st.empty}>No devices yet. Tap CHANGE ANYTHING to add your stack — it reads here instantly.</Text>
                </Pressable>
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

            <View style={st.section}>
              <Pressable style={st.navBtn} onPress={() => goPage(2)}>
                <Text style={st.navBtnTxt}>◆ OPEN MEMBRANE · EDIT EVERYTHING →</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* ── PAGE 3 · THE MEMBRANE · EDIT ── */}
        <View key="edit" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={refresh}>
            <Pressable style={st.backRow} onPress={() => goPage(1)}>
              <Text style={st.backTxt}>← BACK TO PANEL</Text>
            </Pressable>

            <Pressable style={st.change} onPress={openMembrane}>
              <View style={{ flex: 1 }}>
                <Text style={st.changeQ}>Change anything.</Text>
                <Text style={st.changeSub}>add a life, a device, a goal…</Text>
              </View>
              <Text style={st.changeArrow}>→</Text>
            </Pressable>

            {sealed ? (
              <View style={st.section}>
                <Text style={st.sectionH}>WHAT THE MEMBRANE HOLDS</Text>

                <Pressable style={st.hold} onPress={openMembrane}>
                  <Text style={st.holdLbl}>ALLERGIES &amp; SENSITIVITIES</Text>
                  <Text style={[st.holdVal, allergens.length ? { color: AMBER } : null]}>
                    {allergens.length ? allergens.join(' · ') : 'None declared — a clean baseline is data too.'}
                  </Text>
                </Pressable>

                <Pressable style={st.hold} onPress={openMembrane}>
                  <Text style={st.holdLbl}>ACTIVITIES</Text>
                  <Text style={st.holdVal}>{activities.length ? activities.join(' · ') : 'Not set.'}</Text>
                </Pressable>

                <Pressable style={st.hold} onPress={openMembrane}>
                  <Text style={st.holdLbl}>DIETARY APPROACH</Text>
                  <Text style={st.holdVal}>{diet.length ? diet.join(' · ') : 'Not set.'}</Text>
                </Pressable>

                <Pressable style={st.hold} onPress={openMembrane}>
                  <Text style={st.holdLbl}>LIVES · PETS · LIVESTOCK</Text>
                  <Text style={st.holdVal}>{species ? species : 'No animals on file.'}</Text>
                </Pressable>

                <Pressable style={st.hold} onPress={openMembrane}>
                  <Text style={st.holdLbl}>MEDICATIONS</Text>
                  <Text style={st.holdVal}>{meds ? meds : 'No current medications.'}</Text>
                </Pressable>

                <View style={st.starRow}>
                  <Pressable style={st.star} onPress={openMembrane}>
                    <Text style={st.holdLbl}>NORTH STAR · 30D</Text>
                    <Text style={st.starVal}>{n30 ?? 'Not set.'}</Text>
                  </Pressable>
                  <Pressable style={st.star} onPress={openMembrane}>
                    <Text style={st.holdLbl}>NORTH STAR · 90D</Text>
                    <Text style={st.starVal}>{n90 ?? 'Not set.'}</Text>
                  </Pressable>
                </View>

                <Pressable style={st.hold} onPress={openMembrane}>
                  <Text style={st.holdLbl}>TACTICAL · COMMANDER LAYER</Text>
                  <Text style={[st.holdVal, commander ? { color: AMBER } : null]}>
                    {commander ? 'ARMED · WADA / FEI / DoD / USADA checked on every scan' : 'OFF'}
                  </Text>
                </Pressable>

                <Text style={st.holdNote}>
                  Every change writes the same tables this panel reads. Change it there — this updates instantly.
                </Text>
              </View>
            ) : loaded ? (
              <View style={st.section}>
                <Pressable style={st.build} onPress={openMembrane}>
                  <Text style={st.buildTxt}>CHANGE ANYTHING →</Text>
                </Pressable>
                <Text style={st.empty}>
                  Generic truth. A blank chart. Build the membrane and every scan reads YOUR baseline, family, pets, herd.
                </Text>
              </View>
            ) : null}

            <View style={st.savedRow}>
              <Text style={st.savedTxt}>◆ THE MEMBRANE HOLDS · SAVED LIVE ✓</Text>
            </View>
          </ScrollView>
        </View>
      </PagerView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  body: { flex: 1 },
  pagerNav: { paddingTop: 44, paddingBottom: 8, alignItems: 'center', backgroundColor: NAVY },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18 },
  caption: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' },
  hero: { height: 230, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.5)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  navBtn: { margin: 14, borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  navBtnTxt: { color: '#8fd6ff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  backRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  backTxt: { fontFamily: 'DMMono-Regular', fontSize: 11, letterSpacing: 1.5, color: MUT },
  savedRow: { alignItems: 'center', paddingVertical: 18 },
  savedTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: CYAN },
  change: { flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, padding: 15 },
  changeQ: { fontSize: 19, fontWeight: '800', color: '#8fd6ff', letterSpacing: 0.3 },
  changeSub: { fontSize: 11.5, color: MUT, marginTop: 4 },
  changeArrow: { fontSize: 20, color: CYAN, marginLeft: 10 },
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
  hold: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 9 },
  holdLbl: { fontSize: 9, letterSpacing: 1.3, fontWeight: '700', color: FAINT },
  holdVal: { fontSize: 13, color: INK, marginTop: 5, lineHeight: 18 },
  starRow: { flexDirection: 'row', gap: 9, marginBottom: 9 },
  star: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13 },
  starVal: { fontSize: 13, color: INK, marginTop: 5, fontWeight: '700' },
  holdNote: { fontSize: 10.5, color: FAINT, textAlign: 'center', marginTop: 8, lineHeight: 16, fontStyle: 'italic' },
  build: { borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  buildTxt: { color: '#8fd6ff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
});
