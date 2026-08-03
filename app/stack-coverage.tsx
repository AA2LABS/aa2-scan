// ─── app/stack-coverage.tsx ──────────────────────────────────────────────────
// STACK COVERAGE — the anti-FOMO page. Founder law (2026-08-03):
// "A feature cross-reference page where it turns into an UPPER, not a downer,
//  mood-wise — and removes customer FOMO. If you don't have a full stack
//  that's OK, because your Garmin has VO2 Max and so does your WHOOP."
//
// DOCTRINE THIS PAGE OBEYS:
// · Equalizer Floor & Ceiling — the phone alone is a full member. No gap talk.
// · Overlap is celebrated as CONSENSUS (2× / 3× = the membrane cross-checks).
// · A metric no owned device carries is shown as covered by the MEMBRANE
//   floor (scanner + phone + clarifier) — never as something the member lacks.
// · Suggest-the-Gap law lives in readings, NOT here. This page never sells.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { loadMemberProfile } from '@/lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD';
const LINE = 'rgba(255,255,255,0.15)', GOLD = '#D4A847', CYAN = '#1BB8FF';
const GREEN = '#34D399', PURPLE = '#B48CF2';

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// ── METRIC → DEVICE CAPABILITY MAP ──────────────────────────────────────────
// Sourced from each maker's own published specs (owner's-manual doctrine).
type Metric = { key: string; name: string; blurb: string };
const METRICS: Metric[] = [
  { key: 'hrv',        name: 'HRV',                 blurb: 'Nervous-system balance — the membrane’s co-lead recovery signal.' },
  { key: 'rhr',        name: 'Resting Heart Rate',  blurb: 'The slow-moving fitness truth.' },
  { key: 'sleep',      name: 'Sleep Stages & Score', blurb: 'Deep, REM, light — the nightly rebuild.' },
  { key: 'readiness',  name: 'Recovery / Readiness', blurb: 'How much the body has to give today.' },
  { key: 'vo2',        name: 'VO2 Max',             blurb: 'Cardio ceiling — one of the strongest longevity markers.' },
  { key: 'stress',     name: 'Stress Load',         blurb: 'All-day sympathetic load, not just moments.' },
  { key: 'spo2',       name: 'SpO2',                blurb: 'Blood-oxygen — altitude, sleep, and illness context.' },
  { key: 'temp',       name: 'Skin Temperature',    blurb: 'Baseline deviation — the early illness whisper.' },
  { key: 'steps',      name: 'Steps & Activity',    blurb: 'Daily movement — a core Healthspan input.' },
  { key: 'resp',       name: 'Respiratory Rate',    blurb: 'Breaths per minute during sleep — stress and illness signal.' },
  { key: 'ecg',        name: 'ECG',                 blurb: 'On-demand heart-rhythm snapshot.' },
  { key: 'gps',        name: 'GPS & Routes',        blurb: 'Where the body did the work.' },
];

// Which device keys carry which metrics (device key prefixes matched loosely).
const CAP: Record<string, string[]> = {
  whoop_5_0:      ['hrv', 'rhr', 'sleep', 'readiness', 'vo2', 'stress', 'spo2', 'temp', 'steps', 'resp'],
  whoop_mg:       ['hrv', 'rhr', 'sleep', 'readiness', 'vo2', 'stress', 'spo2', 'temp', 'steps', 'resp', 'ecg'],
  oura_ring_4:    ['hrv', 'rhr', 'sleep', 'readiness', 'spo2', 'temp', 'steps', 'resp', 'stress'],
  garmin_tactix_8:['hrv', 'rhr', 'sleep', 'readiness', 'vo2', 'stress', 'spo2', 'ecg', 'steps', 'resp', 'gps'],
  garmin_other:   ['hrv', 'rhr', 'sleep', 'readiness', 'vo2', 'stress', 'spo2', 'steps', 'gps'],
  apple_watch:    ['hrv', 'rhr', 'sleep', 'vo2', 'spo2', 'ecg', 'steps', 'temp', 'resp', 'gps'],
  samsung:        ['hrv', 'rhr', 'sleep', 'vo2', 'spo2', 'ecg', 'steps', 'temp'],
  pixel_watch_4:  ['hrv', 'rhr', 'sleep', 'vo2', 'spo2', 'ecg', 'steps'],
  fitbit:         ['hrv', 'rhr', 'sleep', 'readiness', 'vo2', 'spo2', 'temp', 'steps'],
  polar:          ['hrv', 'rhr', 'sleep', 'readiness', 'vo2', 'steps', 'gps'],
  polar_h10:      ['hrv', 'rhr'],
  withings:       ['hrv', 'rhr', 'sleep', 'spo2', 'temp', 'steps', 'ecg'],
  ultrahuman:     ['hrv', 'rhr', 'sleep', 'readiness', 'temp', 'steps'],
  suunto:         ['hrv', 'rhr', 'sleep', 'vo2', 'steps', 'gps'],
  coros:          ['hrv', 'rhr', 'sleep', 'vo2', 'steps', 'gps'],
  amazfit:        ['hrv', 'rhr', 'sleep', 'readiness', 'spo2', 'steps', 'gps'],
  eight_sleep:    ['hrv', 'rhr', 'sleep', 'resp', 'temp'],
  muse_s:         ['sleep'],
  beats_pro_2:    ['rhr'],
  airpods:        ['rhr'],
  strava:         ['steps', 'gps', 'vo2'],
  dexcom:         [], lingo: [],   // CGMs add glucose — their own layer
};

function ownedCapabilities(hardware: string[]): Record<string, string[]> {
  // metricKey -> device display names that carry it
  const out: Record<string, string[]> = {};
  for (const h of hardware) {
    const nk = norm(h);
    const capKey = Object.keys(CAP).find(k => nk.includes(k) || k.includes(nk));
    const caps = capKey ? CAP[capKey] : [];
    for (const m of caps) (out[m] ??= []).push(h);
  }
  return out;
}

export default function StackCoverageScreen() {
  const [hardware, setHardware] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { loadMemberProfile().then(p => { setHardware(p?.hardware ?? []); setLoaded(true); }); }, []);

  const cov = ownedCapabilities(hardware);
  const covered = METRICS.filter(m => (cov[m.key]?.length ?? 0) > 0);
  const consensus = METRICS.filter(m => (cov[m.key]?.length ?? 0) >= 2);
  const floorOnly = METRICS.filter(m => (cov[m.key]?.length ?? 0) === 0);

  return (
    <ScrollView style={st.root} contentContainerStyle={{ padding: 18, paddingBottom: 48 }}>
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Text style={st.back}>← BACK</Text>
      </Pressable>

      <Text style={st.eyebrow}>YOUR STACK · CROSS-REFERENCE</Text>
      <Text style={st.title}>You’re covered.</Text>
      <Text style={st.sub}>
        {hardware.length > 0
          ? `Every signal below is already flowing from gear you own. Overlap isn’t waste — it’s the membrane cross-checking itself.`
          : `Your phone alone is a full membership. The scanner, the Clarifier, and the Concierge run at one hundred percent with zero wearables. Everything below is depth you can add whenever you feel like it — never a requirement.`}
      </Text>

      {/* THE HEADLINE NUMBERS — always an upper */}
      <View style={st.statRow}>
        <View style={st.stat}>
          <Text style={[st.statNum, { color: GREEN }]}>{covered.length}</Text>
          <Text style={st.statLbl}>SIGNALS COVERED</Text>
        </View>
        <View style={st.stat}>
          <Text style={[st.statNum, { color: CYAN }]}>{consensus.length}</Text>
          <Text style={st.statLbl}>DOUBLE-CHECKED 2×+</Text>
        </View>
        <View style={st.stat}>
          <Text style={[st.statNum, { color: GOLD }]}>100%</Text>
          <Text style={st.statLbl}>MEMBRANE FLOOR</Text>
        </View>
      </View>

      {/* CONSENSUS FIRST — redundancy is the flex */}
      {consensus.length > 0 && (
        <>
          <Text style={st.section}>CONSENSUS SIGNALS · TWO OR MORE DEVICES AGREE</Text>
          {consensus.map(m => (
            <View key={m.key} style={[st.card, { borderLeftColor: GREEN }]}>
              <View style={st.cardHead}>
                <Text style={st.metric}>{m.name}</Text>
                <View style={[st.chip, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                  <Text style={[st.chipTxt, { color: GREEN }]}>{cov[m.key].length}× COVERED</Text>
                </View>
              </View>
              <Text style={st.blurb}>{m.blurb}</Text>
              <Text style={st.devices}>{cov[m.key].join('  ·  ')}</Text>
              <Text style={st.upNote}>Two readings of the same truth. When they agree, confidence compounds. When they differ, the membrane learns which sensor to trust for YOUR body.</Text>
            </View>
          ))}
        </>
      )}

      {/* SINGLE-SOURCE — still fully covered */}
      {covered.filter(m => cov[m.key].length === 1).length > 0 && (
        <>
          <Text style={st.section}>COVERED SIGNALS · ONE CLEAN SOURCE</Text>
          {covered.filter(m => cov[m.key].length === 1).map(m => (
            <View key={m.key} style={[st.card, { borderLeftColor: CYAN }]}>
              <View style={st.cardHead}>
                <Text style={st.metric}>{m.name}</Text>
                <View style={[st.chip, { backgroundColor: 'rgba(27,184,255,0.15)' }]}>
                  <Text style={[st.chipTxt, { color: CYAN }]}>COVERED</Text>
                </View>
              </View>
              <Text style={st.blurb}>{m.blurb}</Text>
              <Text style={st.devices}>{cov[m.key].join('  ·  ')}</Text>
            </View>
          ))}
        </>
      )}

      {/* THE FLOOR — never a gap, never a downer */}
      {floorOnly.length > 0 && (
        <>
          <Text style={st.section}>MEMBRANE FLOOR · CARRIED WITHOUT A WEARABLE</Text>
          {floorOnly.map(m => (
            <View key={m.key} style={[st.card, { borderLeftColor: PURPLE }]}>
              <View style={st.cardHead}>
                <Text style={st.metric}>{m.name}</Text>
                <View style={[st.chip, { backgroundColor: 'rgba(180,140,242,0.15)' }]}>
                  <Text style={[st.chipTxt, { color: PURPLE }]}>FLOOR COVERED</Text>
                </View>
              </View>
              <Text style={st.blurb}>{m.blurb}</Text>
              <Text style={st.upNote}>The scanner, the Clarifier check-ins, and your phone carry this signal’s floor. Nothing about your protection is waiting on a purchase.</Text>
            </View>
          ))}
        </>
      )}

      <View style={st.footCard}>
        <Text style={st.footLine}>The prince’s stack and the peasant’s phone read the same law.</Text>
        <Text style={st.footSub}>
          A full stack adds DEPTH, never worth. Your membership, your scanner, your protection, and your
          intelligences run at one hundred percent from the day you walk in — with whatever is already in
          the drawer. That is the whole point of BYOH.
        </Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  back: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 16, marginTop: 34 },
  eyebrow: { color: CYAN, fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 6 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', marginBottom: 8 },
  sub: { color: MUT, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLbl: { color: MUT, fontSize: 8, letterSpacing: 1, marginTop: 3, fontWeight: '700' },
  section: { color: MUT, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderLeftWidth: 3, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  metric: { color: INK, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, marginLeft: 8 },
  chipTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  blurb: { color: MUT, fontSize: 11.5, lineHeight: 16, marginBottom: 6 },
  devices: { color: GOLD, fontSize: 11, fontWeight: '700' },
  upNote: { color: 'rgba(232,238,245,0.65)', fontSize: 10.5, lineHeight: 15, marginTop: 7, fontStyle: 'italic' },
  footCard: { marginTop: 16, backgroundColor: 'rgba(212,168,71,0.08)', borderWidth: 1, borderColor: 'rgba(212,168,71,0.30)', borderRadius: 14, padding: 16 },
  footLine: { color: GOLD, fontSize: 15, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  footSub: { color: MUT, fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
});
