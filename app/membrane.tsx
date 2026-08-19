// ─── app/membrane.tsx ────────────────────────────────────────────────────────
// THE MEMBRANE — LIVE. Preview surface for BIOMETRIC RESONANT MIRRORING.
//
// This is a NEW route. It does not touch a single existing wire screen.
// Founder Law 1 stands: never change a data or wire screen's appearance.
//
// WHAT IS REAL HERE: every channel is the member's OWN reading out of
// biosignal_readings, normalised against the member's OWN 30-day series.
// Never a population, never a vendor's score, never a seeded number.
//
// WHAT IS NOT REAL YET: the Crown is not in this. EEG bands need the Muse SDK
// and a native build. Until then the five channels are driven by the signals
// the member's stack actually produces today — and they are labelled for what
// they are, not dressed up as brainwaves.
//
// NO FAKE DATA. If the membrane has nothing real, it says so and renders
// nothing. Real data or no data.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Membrane, { MembraneChannelMeters, type MembraneChannels } from '../components/Membrane';
import { getLiveReadout, type LiveReadout, type BiosignalSource } from '../lib/biosignals';
import { PALETTE, TYPE } from '../lib/theme';

const NAVY = PALETTE.navy;
const INK = PALETTE.ink;
const MUT = 'rgba(255,255,255,0.55)';
const FAINT = 'rgba(255,255,255,0.32)';

type Metric = 'hrv' | 'sleep' | 'readiness' | 'activity' | 'stress';

/** Normalise a value against the member's OWN observed range. Never a population. */
function selfNorm(value: number | null | undefined, series: number[]): number | null {
  if (value == null || !series.length) return null;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  if (hi - lo < 1e-6) return 0.5;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}

/** Pull every source's newest value for one metric, plus that metric's own history. */
function gather(readout: LiveReadout, metric: Metric): { value: number | null; series: number[]; sources: BiosignalSource[] } {
  const vals: number[] = [];
  const sources: BiosignalSource[] = [];
  (Object.keys(readout.latest) as BiosignalSource[]).forEach(src => {
    const row = readout.latest[src];
    const v = row ? (row as any)[metric] : null;
    if (v != null) { vals.push(Number(v)); sources.push(src); }
  });
  const series: number[] = [];
  (Object.keys(readout.series) as BiosignalSource[]).forEach(src => {
    (readout.series[src] ?? []).forEach(n => series.push(n));
  });
  const value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  return { value, series, sources };
}

export default function MembraneScreen() {
  const [loading, setLoading] = useState(true);
  const [readout, setReadout] = useState<LiveReadout | null>(null);
  const [speech, setSpeech] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    (async () => {
      const r = await getLiveReadout(30);
      setReadout(r);
      setLoading(false);
    })();
  }, []);

  const sources = readout ? (Object.keys(readout.latest) as BiosignalSource[]) : [];
  const hasAny = sources.length > 0;

  // ── build channels from the member's own numbers ──
  let channels: MembraneChannels | null = null;
  let turbulence = 0.2;
  let accent = PALETTE.cyan;
  let line = '';

  if (readout && hasAny) {
    const hrv = gather(readout, 'hrv');
    const sleep = gather(readout, 'sleep');
    const readiness = gather(readout, 'readiness');
    const activity = gather(readout, 'activity');
    const stress = gather(readout, 'stress');

    const nHrv = selfNorm(hrv.value, hrv.series);
    const nSleep = selfNorm(sleep.value, sleep.series);
    const nRead = selfNorm(readiness.value, readiness.series);
    const nAct = selfNorm(activity.value, activity.series);
    const nStress = selfNorm(stress.value, stress.series);

    channels = {
      slow:   nSleep ?? nRead ?? 0.5,
      drift:  nRead ?? nSleep ?? 0.5,
      calm:   nHrv ?? nRead ?? 0.5,
      active: nAct ?? 0.4,
      sharp:  nStress ?? 0.3,
    };

    turbulence = nStress != null ? nStress : 1 - (nHrv ?? 0.5);
    accent =
      turbulence > 0.66 ? PALETTE.red
      : (nHrv ?? 0.5) > 0.6 ? PALETTE.green
      : PALETTE.cyan;

    // Copy is assembled from real values only. No number is stated naked,
    // and nothing is claimed that the readings do not carry.
    const agree = hrv.sources.length;
    const src = sources.join(' · ').toUpperCase();
    if (nHrv != null && nHrv > 0.6) {
      line = agree > 1
        ? `Your stack agrees — you're sitting near the top of your own thirty days right now. Not a score, just you against you. ${agree} sources reading the same body, saying the same thing.`
        : `You're sitting near the top of your own thirty days right now. Not a score — you against you.`;
    } else if (nHrv != null && nHrv < 0.35) {
      line = `You're running below your own last thirty days today. That's not a verdict, it's a reading. Nothing here says anything is wrong — it says today is different from your usual, and you're the one who knows why.`;
    } else {
      line = `You're sitting right about your own middle today. Nothing's shouting. That's what a normal day looks like on your own scale — which is the only scale I use.`;
    }
  }

  // Speech envelope — swells while the line reveals, decays after.
  useEffect(() => {
    if (!line) return;
    setShown(0);
    const words = line.split(' ');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      setSpeech(s => Math.min(1.4, s + (i % 5 === 0 ? 0.5 : 0.15)));
      if (i >= words.length) clearInterval(id);
    }, 110);
    return () => clearInterval(id);
  }, [line]);

  useEffect(() => {
    const id = setInterval(() => setSpeech(s => s * 0.9), 90);
    return () => clearInterval(id);
  }, []);

  const words = line.split(' ');

  return (
    <ScrollView style={st.page} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={st.eyebrow}>AA2 · THE MEMBRANE</Text>
      <Text style={st.title}>Biometric Resonant Mirroring</Text>
      <Text style={st.sub}>
        Your own signal, moving. Every channel is normalised against your own thirty days — never a population, never a vendor's score.
      </Text>

      {loading && (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={PALETTE.cyan} />
        </View>
      )}

      {!loading && !hasAny && (
        <View style={st.empty}>
          <Text style={st.emptyTitle}>Nothing real to show yet</Text>
          <Text style={st.emptyBody}>
            The membrane holds no readings for you. Connect a source or import an
            export on Bio Buddy, and this comes alive with your own numbers.
            {'\n\n'}It will not draw a signal you did not give it.
          </Text>
        </View>
      )}

      {!loading && hasAny && channels && (
        <>
          <View style={st.stage}>
            <Membrane
              channels={channels}
              turbulence={turbulence}
              speech={speech}
              accent={accent}
              size={300}
            />
          </View>

          <View style={st.meters}>
            <MembraneChannelMeters
              channels={channels}
              labels={{ slow: 'SLEEP', drift: 'READINESS', calm: 'HRV', active: 'ACTIVITY', sharp: 'STRESS' }}
            />
          </View>

          <View style={st.speech}>
            <Text style={st.speechLabel}>AA2</Text>
            <Text style={st.speechText}>
              {words.slice(0, shown).join(' ')}
              {shown < words.length ? ' ▌' : ''}
            </Text>
          </View>

          <View style={st.chips}>
            {sources.map(s2 => (
              <View key={s2} style={st.chip}>
                <Text style={st.chipText}>{s2.toUpperCase()} · LIVE</Text>
              </View>
            ))}
            <View style={st.chip}><Text style={st.chipText}>VS YOUR 30 DAYS</Text></View>
          </View>

          <Pressable style={st.btn} onPress={() => setShown(0)}>
            <Text style={st.btnText}>▶ SPEAK AGAIN</Text>
          </Pressable>

          <Text style={st.note}>
            The Crown is not in this yet. EEG and fNIRS need the Muse SDK and a native
            build — until then these five channels are what your stack actually
            produces, labelled for what they are. Nothing here is dressed up as a brainwave.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page:        { flex: 1, backgroundColor: NAVY },
  eyebrow:     { fontFamily: 'DMMono-Regular', fontSize: TYPE.label, letterSpacing: 3, color: FAINT, marginBottom: 8 },
  title:       { color: INK, fontSize: TYPE.heroTitle, fontWeight: '700', marginBottom: 8 },
  sub:         { color: MUT, fontSize: TYPE.body, lineHeight: 21, marginBottom: 22 },
  stage:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  meters:      { marginTop: 14, marginBottom: 20 },
  speech:      { backgroundColor: 'rgba(224,160,74,0.14)', borderWidth: 2, borderColor: 'rgba(224,160,74,0.55)', borderRadius: 18, padding: 20 },
  speechLabel: { color: PALETTE.amber, fontSize: 13, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  speechText:  { color: 'rgba(232,238,245,0.88)', fontSize: 15, lineHeight: 24, fontWeight: '500', minHeight: 72 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip:        { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipText:    { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.6, color: 'rgba(255,255,255,0.62)' },
  btn:         { marginTop: 18, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.14)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  btnText:     { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 2, color: PALETTE.cyan },
  note:        { color: FAINT, fontSize: TYPE.detail, lineHeight: 20, marginTop: 22 },
  empty:       { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 18, marginTop: 10 },
  emptyTitle:  { color: INK, fontSize: TYPE.title, fontWeight: '700', marginBottom: 8 },
  emptyBody:   { color: MUT, fontSize: TYPE.body, lineHeight: 22 },
});
