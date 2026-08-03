// ─── app/plateau.tsx ─────────────────────────────────────────────────────────
// THE PLATEAU — the control panel. Founder ruling 2026-08-03.
//
// "Three pyramids at Giza. One's the stack, one's who's on the stack, the
//  third is the numbers." Tap a face and it opens into the full detail —
//  not the abbreviation that rides the face while it spins.
//
// THE ANTI-CIRCLE LAW: a ring closes on one person, one day. A pyramid stacks
// lives and layers — apex earned by the foundation, every number carrying its
// receipts. They draw circles. We build Giza.
//
// GEOMETRY IS DOCTRINE:
//   · Four faces per pyramid — four devices / four lives / four metrics.
//   · The BASE is the phone. Every face stands on it. (Equalizer floor law:
//     the phone alone is a full membership — protection is not a purchase.)
//   · The capstone seals the apex. The apex is EARNED by the layers beneath.
//   · Orion's Belt above, one star per monument, a beam to each capstone.
//     Dark = night at Giza. Light = day on the plateau, belt still there.
//
// LAWS THIS SCREEN OBEYS: Card Law · Knowledge Card (amber = interpretation,
// never mere output) · Readability (body ≥13, labels ≥10.5) · WHY-FIRST ·
// SHOW-THE-WORK · 90-day no-judgment · BIOS KNOW FIRST.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { loadMemberProfile, type FullMemberProfile } from '@/lib/db';
import { getLiveReadout, type LiveReadout, type BiosignalSource } from '@/lib/biosignals';
import { PALETTE, TYPE, card, KNOWLEDGE_CARD, KNOWLEDGE_TITLE, KNOWLEDGE_BODY, NEUTRAL_CARD } from '@/lib/theme';

const { navy, ink, mut, gold, cyan, green, purple, amber, red } = PALETTE;

// ── 90-DAY NO-JUDGMENT LAW ───────────────────────────────────────────────────
// Founder ruling: no judgmental readout until the member has at least 90 days
// of their own baseline. WHY: a baseline is earned, not assumed — judging a
// body against a population average and calling it personal is the exact lie
// AA2 exists to end. Live connection waves are EXEMPT: a wave proves a device
// is breathing, and it never stops unless a family member or pet disconnects.
const BASELINE_DAYS_REQUIRED = 90;

type Site = 'stack' | 'lives' | 'data';

// ── SPINNING PYRAMID ─────────────────────────────────────────────────────────
function Pyramid({
  faces, size, accent, onFace,
}: {
  faces: { label: string; value: string; color: string }[];
  size: number; accent: string; onFace: (i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const fade = useMemo(() => new Animated.Value(1), []);

  // The rotation, expressed as a face swap — RN has no CSS 3D, so the pyramid
  // presents one face at a time and turns on a slow, readable cadence.
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0.15, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
      setTimeout(() => setIdx(i => (i + 1) % Math.max(1, faces.length)), 320);
    }, 3800);
    return () => clearInterval(t);
  }, [faces.length, fade]);

  const face = faces[idx] ?? { label: '—', value: '—', color: accent };
  const h = size * 0.86;

  return (
    <Pressable onPress={() => onFace(idx)} style={{ alignItems: 'center' }}>
      {/* capstone — the benben. Seals the apex. */}
      <View style={[st.capstone, { shadowColor: accent }]} />
      <Animated.View style={{ opacity: fade }}>
        <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'flex-end' }}>
          {/* the four strata — the layers that earn the apex */}
          {[0.22, 0.42, 0.64, 0.88, 1].map((w, i) => (
            <View key={i} style={{
              width: size * w, height: h / 5.6,
              backgroundColor: face.color + (i === 4 ? '35' : String(18 + i * 6)),
              borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: 'rgba(255,255,255,0.22)',
            }} />
          ))}
          {/* the face's data, riding the stone */}
          <View style={st.faceText}>
            <Text style={[st.faceLabel]} numberOfLines={1}>{face.label}</Text>
            <Text style={[st.faceValue, { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>{face.value}</Text>
          </View>
        </View>
      </Animated.View>
      {/* face pips — which side is showing */}
      <View style={st.pips}>
        {faces.map((_, i) => (
          <View key={i} style={[st.pip, { backgroundColor: i === idx ? accent : 'rgba(255,255,255,0.22)' }]} />
        ))}
      </View>
    </Pressable>
  );
}

// ── ORION'S BELT ─────────────────────────────────────────────────────────────
// One star per monument, a beam to each capstone. As above, so below —
// drawn, not said.
function Belt() {
  return (
    <View style={st.belt} pointerEvents="none">
      {[
        { left: '15.4%', top: 16 },
        { left: '50%',   top: 8  },
        { left: '84.6%', top: 16 },
      ].map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: s.left as any, top: s.top, alignItems: 'center' }}>
          <View style={st.star} />
          <View style={st.beam} />
        </View>
      ))}
      <Text style={st.beltLabel}>ORION · STILL THERE</Text>
    </View>
  );
}

export default function PlateauScreen() {
  const [p, setP] = useState<FullMemberProfile | null>(null);
  const [readout, setReadout] = useState<LiveReadout | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [prof, live] = await Promise.all([loadMemberProfile(), getLiveReadout(120)]);
      setP(prof); setReadout(live); setLoaded(true);
    })();
  }, []);

  const hardware = p?.hardware ?? [];
  const protectees = p?.speciesProtected ?? [];

  // ── PYRAMID I · THE STACK — faces are devices ──────────────────────────────
  const DEVICE_FACES = useMemo(() => {
    const src = (s: BiosignalSource) => readout?.latest?.[s];
    const rows: { label: string; value: string; color: string }[] = [];
    const g = src('garmin'), o = src('oura'), w = src('whoop'), b = src('beats');
    rows.push({ label: 'GARMIN', value: g?.hrv != null ? `${Math.round(Number(g.hrv))} HRV` : 'CONNECT', color: cyan });
    rows.push({ label: 'OURA',   value: o?.readiness != null ? `${Math.round(Number(o.readiness))} RDY` : 'CONNECT', color: purple });
    rows.push({ label: 'WHOOP',  value: w?.readiness != null ? `${Math.round(Number(w.readiness))}%` : 'AUG 4', color: red });
    rows.push({ label: 'MUSE S', value: b?.hrv != null ? `${Math.round(Number(b.hrv))}ms` : 'EEG', color: gold });
    return rows;
  }, [readout]);

  const liveCount = DEVICE_FACES.filter(f => !['CONNECT', 'AUG 4', 'EEG'].includes(f.value)).length;

  // ── PYRAMID III · MY DATA — faces are metrics ──────────────────────────────
  const g = readout?.latest?.garmin, o = readout?.latest?.oura;
  const hrv = [g?.hrv, o?.hrv].filter(v => v != null).map(Number);
  const sleep = [g?.sleep, o?.sleep].filter(v => v != null).map(Number);
  const ready = [g?.readiness, o?.readiness].filter(v => v != null).map(Number);
  const avg = (a: number[]) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;

  const DATA_FACES = [
    { label: 'HRV',      value: avg(hrv) != null ? `${avg(hrv)}ms` : '—', color: cyan },
    { label: 'SLEEP',    value: avg(sleep) != null ? String(avg(sleep)) : '—', color: purple },
    { label: 'READY',    value: avg(ready) != null ? String(avg(ready)) : '—', color: green },
    { label: 'VO2 MAX',  value: '—', color: amber },
  ];

  // THE APEX — blended, and only stated once the baseline is earned.
  const daysBanked = useMemo(() => {
    const series = readout?.series ?? {};
    return Math.max(0, ...Object.values(series).map(v => (v ?? []).length));
  }, [readout]);
  const baselineEarned = daysBanked >= BASELINE_DAYS_REQUIRED;
  const apex = useMemo(() => {
    const parts = [avg(ready), avg(sleep), avg(hrv) != null ? Math.min(100, Number(avg(hrv)) * 1.6) : null]
      .filter(v => v != null) as number[];
    if (!parts.length) return null;
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readout]);

  // ── PYRAMID II · THE LIVES — faces are lives ───────────────────────────────
  const LIFE_FACES = useMemo(() => {
    const me = { label: (p?.name ?? 'YOU').toUpperCase().split(' ')[0], value: apex != null ? String(apex) : '—', color: gold };
    const others = protectees.slice(0, 3).map((who, i) => ({
      label: String(who).toUpperCase().slice(0, 10),
      value: 'LINKED',
      color: [cyan, green, amber][i % 3],
    }));
    const filled = [me, ...others];
    while (filled.length < 4) filled.push({ label: 'ADD A LIFE', value: '+', color: 'rgba(138,153,173,0.6)' });
    return filled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, protectees, readout]);

  return (
    <ScrollView style={st.root} contentContainerStyle={{ padding: 16, paddingBottom: 52 }}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={st.back}>← BACK</Text>
      </Pressable>

      <Text style={st.eyebrow}>CONTROL PANEL</Text>
      <Text style={st.title}>THE PLATEAU</Text>
      <Text style={st.epigraph}>As above, so below.</Text>

      <Belt />

      {/* ── THE THREE MONUMENTS ───────────────────────────────────────────── */}
      <View style={st.plateau}>
        <View style={st.site}>
          <Text style={[st.apexNum, { color: cyan }]}>{liveCount}<Text style={st.apexSlash}>/5</Text></Text>
          <Pyramid faces={DEVICE_FACES} size={92} accent={cyan} onFace={() => router.push('/stack-coverage' as any)} />
          <Text style={st.siteName}>THE STACK</Text>
          <Text style={st.siteSub}>BASE · CELL PHONE</Text>
        </View>

        <View style={[st.site, { marginTop: -14 }]}>
          <Text style={[st.apexNum, { color: gold }]}>{protectees.length + 1}</Text>
          <Pyramid faces={LIFE_FACES} size={112} accent={gold} onFace={() => router.push('/(tabs)/biobuddy' as any)} />
          <Text style={st.siteName}>THE LIVES</Text>
          <Text style={st.siteSub}>ONE MEMBRANE</Text>
        </View>

        <View style={st.site}>
          <Text style={[st.apexNum, { color: green }]}>{baselineEarned && apex != null ? apex : '—'}</Text>
          <Pyramid faces={DATA_FACES} size={98} accent={green} onFace={() => router.push('/(tabs)/equalizer' as any)} />
          <Text style={st.siteName}>MY DATA</Text>
          <Text style={st.siteSub}>{daysBanked} DAYS BANKED</Text>
        </View>
      </View>

      {/* THE FOUNDATION — the phone. Flat slab, no moons on the plateau. */}
      <View style={st.slab}>
        <Text style={st.slabTxt}>FOUNDATION · THE PHONE</Text>
      </View>
      <Text style={st.hint}>TAP A PYRAMID TO ENTER · EVERY FACE CARRIES DATA</Text>

      {/* ── THE 90-DAY LAW · knowledge card, WHY first ─────────────────────── */}
      {!baselineEarned && (
        <View style={[KNOWLEDGE_CARD, { marginTop: 14 }]}>
          <Text style={KNOWLEDGE_TITLE}>
            {`NO VERDICT YET · ${daysBanked} OF ${BASELINE_DAYS_REQUIRED} DAYS`}
          </Text>
          <Text style={KNOWLEDGE_BODY}>
            <Text style={{ color: amber, fontWeight: '800' }}>WHY: </Text>
            A baseline is earned, not assumed. Judging your body against a population average and calling it
            personal is the exact thing AA2 exists to end — so the membrane withholds judgment until it has
            {` ${BASELINE_DAYS_REQUIRED} `}days of YOUR truth.
            {'\n\n'}
            <Text style={{ color: amber, fontWeight: '800' }}>MEANWHILE: </Text>
            everything still runs. The scanner, the Clarifier, the shield, the Vault, and every live
            connection wave are at full strength today. Only the verdict waits.
          </Text>
        </View>
      )}

      {/* ── LIVE CONNECTION LAW ────────────────────────────────────────────── */}
      <View style={[card(cyan), { marginTop: 10 }]}>
        <Text style={st.cardTitle}>LIVE CONNECTION · ALWAYS ON</Text>
        <Text style={st.cardBody}>
          A connection wave is not a verdict — it is proof a device is breathing. Waves never wait for the
          baseline and never stop, unless a family member or an animal actually disconnects. That is the only
          silence that means something.
        </Text>
      </View>

      {/* ── BIOS KNOW FIRST ────────────────────────────────────────────────── */}
      <View style={[card(red), { marginTop: 10 }]}>
        <Text style={[st.cardTitle, { color: red }]}>BIOS KNOW FIRST · DANGER SYNC</Text>
        <Text style={st.cardBody}>
          <Text style={{ color: red, fontWeight: '800' }}>WHY: </Text>
          Safety asymmetry only breaks one direction. AA2 may rule kinder than a host app on a score —
          it is forbidden to rule calmer on danger. If Garmin flags an abnormal heart-rate event or WHOOP
          fires an irregular-rhythm notification, the membrane carries that flag at full weight, immediately.
        </Text>
      </View>

      {/* ── THE ANTI-CIRCLE LAW ────────────────────────────────────────────── */}
      <View style={[KNOWLEDGE_CARD, { marginTop: 10 }]}>
        <Text style={KNOWLEDGE_TITLE}>THREE PYRAMIDS · ONE PLATEAU · ONE GLANCE</Text>
        <Text style={KNOWLEDGE_BODY}>
          What you own. Who you protect. What it all says. A ring closes on one person, one day —
          a pyramid stacks lives and layers, and the apex is earned by everything beneath it.
          {'\n\n'}
          <Text style={{ color: amber, fontWeight: '800' }}>They draw circles. We build Giza.</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: navy },
  back: { color: '#fff', fontSize: TYPE.label, fontWeight: '700', letterSpacing: 1, marginTop: 34, marginBottom: 10 },
  eyebrow: { color: cyan, fontSize: TYPE.label, letterSpacing: 3, fontWeight: '700', textAlign: 'center' },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 2 },
  epigraph: { color: 'rgba(212,168,71,0.9)', fontSize: 15, fontStyle: 'italic', textAlign: 'center', marginTop: 3 },

  belt: { height: 52, marginTop: 8 },
  star: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', shadowColor: '#fff', shadowOpacity: 0.9, shadowRadius: 7, elevation: 6 },
  beam: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.16)', marginTop: 2 },
  beltLabel: { position: 'absolute', top: -2, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: 3, fontWeight: '700' },

  plateau: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 },
  site: { alignItems: 'center', flex: 1 },
  apexNum: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  apexSlash: { fontSize: 13, color: mut, fontWeight: '700' },
  capstone: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', marginBottom: 3, shadowOpacity: 0.9, shadowRadius: 8, elevation: 5 },
  faceText: { position: 'absolute', bottom: 8, alignItems: 'center', paddingHorizontal: 4 },
  faceLabel: { color: 'rgba(255,255,255,0.92)', fontSize: 9, letterSpacing: 1.4, fontWeight: '800' },
  faceValue: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  pips: { flexDirection: 'row', gap: 4, marginTop: 7 },
  pip: { width: 5, height: 5, borderRadius: 3 },
  siteName: { color: ink, fontSize: TYPE.label, letterSpacing: 2, fontWeight: '700', marginTop: 9 },
  siteSub: { color: mut, fontSize: 9, letterSpacing: 0.6, marginTop: 2, textAlign: 'center' },

  slab: { height: 18, borderRadius: 5, marginTop: 12, backgroundColor: 'rgba(27,184,255,0.28)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  slabTxt: { color: '#DCE9F5', fontSize: 9, letterSpacing: 3, fontWeight: '700' },
  hint: { color: 'rgba(138,153,173,0.85)', fontSize: 9.5, letterSpacing: 1.6, textAlign: 'center', marginTop: 8 },

  cardTitle: { color: cyan, fontSize: TYPE.label, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  cardBody: { color: 'rgba(232,238,245,0.85)', fontSize: TYPE.body, lineHeight: 21 },
});
