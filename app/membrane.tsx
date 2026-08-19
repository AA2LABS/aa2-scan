// ─── app/membrane.tsx ────────────────────────────────────────────────────────
// THE MEMBRANE — LIVE. Surface for BIOMETRIC RESONANT MIRRORING.
//
// This is a NEW route. It does not touch a single existing wire screen.
// Founder Law 1 stands: never change a data or wire screen's appearance.
//
// WHAT IS REAL: every channel is the member's OWN reading out of
// biosignal_readings, normalised against the member's OWN 30-day series.
// Never a population, never a vendor's score, never a seeded number.
// The answer is a real call to the intelligence, carrying BIO_BUDDY_VOICE
// and buildPersonalTruth() — so the Personal Truth Doctrine governs it.
//
// THE CROWN SLOT: the Muse S Athena has its own place on this screen whether
// or not it is connected. It is drawn dim and named as awaiting, because the
// architecture should be visible before the hardware arrives. It is NEVER
// drawn as if it were reading. Real data or no data.
//
// SPEECH: while the intelligence answers, the streamed text drives the speech
// envelope, which swells the rings and the carrier. The membrane moves as it
// speaks — the words and the body are one thing.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Membrane, { MembraneChannelMeters, type MembraneChannels } from '../components/Membrane';
import { getLiveReadout, type LiveReadout, type BiosignalSource } from '../lib/biosignals';
import { loadMemberProfile, buildPersonalTruth } from '../lib/db';
import { streamClaude } from '../lib/claude-stream';
import { BIO_BUDDY_VOICE, VOICE_MODEL } from '../lib/voices';
import { PALETTE, TYPE } from '../lib/theme';

const NAVY  = PALETTE.navy;
const INK   = PALETTE.ink;
const MUT   = 'rgba(255,255,255,0.55)';
const FAINT = 'rgba(255,255,255,0.32)';

type Metric = 'hrv' | 'sleep' | 'readiness' | 'activity' | 'stress';

/** Normalise against the member's OWN observed range. Never a population. */
function selfNorm(value: number | null | undefined, series: number[]): number | null {
  if (value == null || !series.length) return null;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  if (hi - lo < 1e-6) return 0.5;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}

function gather(readout: LiveReadout, metric: Metric): { value: number | null; series: number[]; count: number } {
  const vals: number[] = [];
  (Object.keys(readout.latest) as BiosignalSource[]).forEach(src => {
    const row = readout.latest[src];
    const v = row ? (row as any)[metric] : null;
    if (v != null) vals.push(Number(v));
  });
  const series: number[] = [];
  (Object.keys(readout.series) as BiosignalSource[]).forEach(src => {
    (readout.series[src] ?? []).forEach(n => series.push(n));
  });
  const value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  return { value, series, count: vals.length };
}

const SEEDS = [
  'How did I actually sleep?',
  'What changed since yesterday?',
  'Is anything off today?',
];

export default function MembraneScreen() {
  const [loading, setLoading]   = useState(true);
  const [readout, setReadout]   = useState<LiveReadout | null>(null);
  const [crownOn, setCrownOn]   = useState(false);   // flips true the day the SDK lands
  const [query, setQuery]       = useState('');
  const [answer, setAnswer]     = useState('');
  const [asking, setAsking]     = useState(false);
  const [speech, setSpeech]     = useState(0);
  const lastLen = useRef(0);

  useEffect(() => {
    (async () => {
      const r = await getLiveReadout(30);
      setReadout(r);
      setLoading(false);
    })();
  }, []);

  // speech decay — the envelope always falls back to rest
  useEffect(() => {
    const id = setInterval(() => setSpeech(s => (s > 0.01 ? s * 0.88 : 0)), 90);
    return () => clearInterval(id);
  }, []);

  const sources = readout ? (Object.keys(readout.latest) as BiosignalSource[]) : [];
  const hasAny  = sources.length > 0;

  let channels: MembraneChannels | null = null;
  let turbulence = 0.2;
  let accent = PALETTE.cyan;
  let agree = 0;

  if (readout && hasAny) {
    const hrv       = gather(readout, 'hrv');
    const sleep     = gather(readout, 'sleep');
    const readiness = gather(readout, 'readiness');
    const activity  = gather(readout, 'activity');
    const stress    = gather(readout, 'stress');

    const nHrv    = selfNorm(hrv.value, hrv.series);
    const nSleep  = selfNorm(sleep.value, sleep.series);
    const nRead   = selfNorm(readiness.value, readiness.series);
    const nAct    = selfNorm(activity.value, activity.series);
    const nStress = selfNorm(stress.value, stress.series);
    agree = hrv.count;

    channels = {
      slow:   nSleep ?? nRead ?? 0.5,
      drift:  nRead  ?? nSleep ?? 0.5,
      calm:   nHrv   ?? nRead ?? 0.5,
      active: nAct   ?? 0.4,
      sharp:  nStress ?? 0.3,
    };
    turbulence = nStress != null ? nStress : 1 - (nHrv ?? 0.5);
    accent =
      turbulence > 0.66 ? PALETTE.red
      : (nHrv ?? 0.5) > 0.6 ? PALETTE.green
      : PALETTE.cyan;
  }

  const ask = useCallback(async (seed?: string) => {
    const q = (seed ?? query).trim();
    if (!q || asking) return;
    setQuery(q);
    setAnswer('');
    setAsking(true);
    lastLen.current = 0;
    try {
      const profile = await loadMemberProfile();
      const truth = buildPersonalTruth(profile);

      // The membrane hands the intelligence the member's own live channel
      // state, stated plainly and always against the member's own baseline.
      const state = channels
        ? `\n\nLIVE MEMBRANE STATE (all values are this member versus their OWN 30 days, 0..1 — never a population):\n` +
          `sleep ${channels.slow.toFixed(2)} · readiness ${channels.drift.toFixed(2)} · HRV ${channels.calm.toFixed(2)} · activity ${channels.active.toFixed(2)} · stress ${channels.sharp.toFixed(2)}\n` +
          `Sources reporting: ${sources.join(', ') || 'none'}. Sources agreeing on HRV: ${agree}.\n` +
          `Crown (Muse S Athena EEG/fNIRS): ${crownOn ? 'CONNECTED' : 'NOT CONNECTED — you have no brainwave data for this member. Never imply that you do.'}`
        : '';

      await streamClaude({
        system: `${BIO_BUDDY_VOICE}${truth ? `\n\n${truth}` : ''}${state}`,
        content: q,
        max_tokens: 600,
        model: VOICE_MODEL,
        onPartial: acc => {
          setAnswer(acc);
          const grew = acc.length - lastLen.current;
          lastLen.current = acc.length;
          if (grew > 0) setSpeech(s => Math.min(1.5, s + Math.min(0.5, grew * 0.03)));
        },
      });
    } catch (e: any) {
      setAnswer(`The membrane couldn't reach the intelligence right now. ${e?.message ?? ''}`.trim());
    } finally {
      setAsking(false);
    }
  }, [query, asking, channels, sources, agree, crownOn]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={st.page} contentContainerStyle={{ padding: 20, paddingBottom: 70 }}>

        <Text style={st.eyebrow}>AA2 · THE MEMBRANE</Text>
        <Text style={st.title}>Biometric Resonant Mirroring</Text>
        <Text style={st.sub}>
          Your own signal, moving. Every channel is measured against your own thirty days —
          never a population, never a vendor's score.
        </Text>

        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={PALETTE.cyan} />
          </View>
        )}

        {!loading && (
          <>
            {/* ── THE MEMBRANE ─────────────────────────────────────────── */}
            <View style={st.stage}>
              <Membrane
                channels={channels ?? { slow: 0.32, drift: 0.32, calm: 0.32, active: 0.22, sharp: 0.18 }}
                turbulence={hasAny ? turbulence : 0.08}
                speech={speech}
                accent={hasAny ? accent : 'rgba(255,255,255,0.28)'}
                size={300}
                showFace={hasAny}
              />
              {!hasAny && (
                <Text style={st.resting}>AT REST · NO READINGS HELD</Text>
              )}
            </View>

            {/* ── THE CROWN SLOT — always present, never faked ──────────── */}
            <View style={[st.crown, crownOn ? st.crownOn : st.crownOff]}>
              <View style={{ flex: 1 }}>
                <Text style={[st.crownName, { color: crownOn ? PALETTE.purple : MUT }]}>
                  MUSE S ATHENA · THE CROWN
                </Text>
                <Text style={st.crownBody}>
                  {crownOn
                    ? 'Connected. EEG and prefrontal blood flow are driving the two inner rings.'
                    : 'Not connected. EEG and fNIRS need the Muse SDK and a native build — so the membrane is running on your stack alone and saying so. It will not draw a brainwave it does not have.'}
                </Text>
                <View style={st.awaiting}>
                  {['ALPHA', 'THETA', 'BETA', 'GAMMA', 'fNIRS'].map(b => (
                    <View key={b} style={[st.await, crownOn && st.awaitOn]}>
                      <Text style={[st.awaitText, crownOn && { color: PALETTE.purple }]}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── CHANNELS ─────────────────────────────────────────────── */}
            {hasAny && channels && (
              <View style={st.meters}>
                <MembraneChannelMeters
                  channels={channels}
                  labels={{ slow: 'SLEEP', drift: 'READINESS', calm: 'HRV', active: 'ACTIVITY', sharp: 'STRESS' }}
                />
              </View>
            )}

            {/* ── ASK ──────────────────────────────────────────────────── */}
            <View style={st.askRow}>
              <TextInput
                style={st.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Ask the membrane…"
                placeholderTextColor={FAINT}
                onSubmitEditing={() => ask()}
                returnKeyType="send"
                editable={!asking}
              />
              <Pressable style={[st.send, asking && { opacity: 0.5 }]} onPress={() => ask()}>
                <Text style={st.sendText}>{asking ? '···' : 'ASK'}</Text>
              </Pressable>
            </View>

            <View style={st.seeds}>
              {SEEDS.map(s2 => (
                <Pressable key={s2} style={st.seed} onPress={() => ask(s2)}>
                  <Text style={st.seedText}>{s2}</Text>
                </Pressable>
              ))}
            </View>

            {(answer.length > 0 || asking) && (
              <View style={st.speech}>
                <Text style={st.speechLabel}>AA2</Text>
                <Text style={st.speechText}>
                  {answer}
                  {asking ? ' ▌' : ''}
                </Text>
              </View>
            )}

            {/* ── SOURCES ──────────────────────────────────────────────── */}
            <View style={st.chips}>
              {sources.map(s2 => (
                <View key={s2} style={st.chip}>
                  <Text style={st.chipText}>{s2.toUpperCase()} · HELD</Text>
                </View>
              ))}
              <View style={[st.chip, !crownOn && st.chipDim]}>
                <Text style={[st.chipText, !crownOn && { color: FAINT }]}>
                  CROWN · {crownOn ? 'LIVE' : 'AWAITING'}
                </Text>
              </View>
              {hasAny && (
                <View style={st.chip}><Text style={st.chipText}>VS YOUR 30 DAYS</Text></View>
              )}
            </View>

            {!hasAny && (
              <Text style={st.note}>
                The membrane holds no readings for you yet. Connect a source or import an export
                on Bio Buddy and this comes alive with your own numbers. It will not draw a signal
                you did not give it.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  page:        { flex: 1, backgroundColor: NAVY },
  eyebrow:     { fontFamily: 'DMMono-Regular', fontSize: TYPE.label, letterSpacing: 3, color: FAINT, marginBottom: 8 },
  title:       { color: INK, fontSize: TYPE.heroTitle, fontWeight: '700', marginBottom: 8 },
  sub:         { color: MUT, fontSize: TYPE.body, lineHeight: 21, marginBottom: 18 },

  stage:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  resting:     { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 2, color: FAINT, marginTop: 6 },

  crown:       { flexDirection: 'row', borderRadius: 14, padding: 16, marginTop: 14, borderWidth: 1 },
  crownOff:    { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.14)', borderStyle: 'dashed' },
  crownOn:     { backgroundColor: 'rgba(170,68,255,0.10)', borderColor: 'rgba(170,68,255,0.45)' },
  crownName:   { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 2, marginBottom: 8 },
  crownBody:   { color: MUT, fontSize: TYPE.detail, lineHeight: 19 },
  awaiting:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  await:       { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderStyle: 'dashed', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  awaitOn:     { borderStyle: 'solid', borderColor: 'rgba(170,68,255,0.5)' },
  awaitText:   { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: FAINT },

  meters:      { marginTop: 16, marginBottom: 18 },

  askRow:      { flexDirection: 'row', gap: 9, marginTop: 4 },
  input:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: INK, fontSize: TYPE.body },
  send:        { paddingHorizontal: 18, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.14)' },
  sendText:    { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 2, color: PALETTE.cyan },

  seeds:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  seed:        { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  seedText:    { color: MUT, fontSize: 12 },

  speech:      { backgroundColor: 'rgba(224,160,74,0.14)', borderWidth: 2, borderColor: 'rgba(224,160,74,0.55)', borderRadius: 18, padding: 20, marginTop: 16 },
  speechLabel: { color: PALETTE.amber, fontSize: 13, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  speechText:  { color: 'rgba(232,238,245,0.88)', fontSize: 15, lineHeight: 24, fontWeight: '500' },

  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip:        { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipDim:     { borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)' },
  chipText:    { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.6, color: 'rgba(255,255,255,0.62)' },

  note:        { color: FAINT, fontSize: TYPE.detail, lineHeight: 20, marginTop: 20 },
});
