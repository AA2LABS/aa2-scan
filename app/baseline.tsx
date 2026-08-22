// ─── app/baseline.tsx ────────────────────────────────────────────────────────
// YOUR OWN RECORD — the face of the baseline engine.
//
// FOUNDER ORDER 2026-08-21: "MAKE THIS WORK IN AA2 i want my instruments live!"
//
// This is the screen that does what no app in the category does: it ranks a
// night against THE MEMBER'S OWN NIGHTS, in the same part of the year, per
// instrument, and says out loud when the calendar was doing the talking instead
// of the body.
//
// THE PROOF THIS PAGE EXISTS FOR, 2026-08-21: a night every app called mediocre
// sat in the top tenth of the founder's year for slow-wave sleep. And a step
// change eight days earlier — deep +27%, REM +25%, awake −36% — that no vendor
// mentioned, while WHOOP's own recovery score FELL NINE POINTS across the same
// window. The vendor verdict disagreed with the vendor's own inputs.
//
// DOCTRINE THIS PAGE OBEYS:
// · NOBODY'S 61 IS ANYBODY ELSE'S 74 — there is no population on this screen.
// · NO NAKED NUMBERS — every rank carries how many of the member's own nights
//   it was measured against, and the member's own median.
// · ONE HEARTBEAT, ONE VOTE — sources ranked separately, never averaged. When
//   they disagree, THE DISAGREEMENT IS THE FINDING and it gets its own card.
// · THE CARD LAW — amber KNOWLEDGE cards whenever AA2 interprets rather than
//   reports. Step changes and disagreements are interpretation. They wear amber.
// · THE MEMBER OWNS THE WHY — this page finds WHEN. It never names a cause.
// · ZERO SHAME — no metric is scored, graded, or judged. Ranked only.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  loadNights, rankNight, findAllStepChanges, describeRank, describeStepChange,
  tierFor, METRICS,
  type NightRow, type NightRank, type MetricRank, type StepChange,
} from '@/lib/baseline';
import type { BiosignalSource } from '@/lib/biosignals';

import { dl, useTheme, type Tokens } from '@/lib/theme-mode';
/**
 * TWO MODES, ONE PALETTE. Every DARK value below is the literal that shipped
 * — still readable in this file, which is how LAW 1 is proved rather than
 * promised. Every LIGHT value is lifted from the founder's own year-old
 * two-mode file, where all ten surfaces sat on ONE cream ground and were
 * told apart by the colour of the type, not the colour of the room.
 */
const pal = (T: Tokens) => ({
  NAVY: dl(T, '#0E1B33', '#F0EEE8'),
  INK: dl(T, '#E8EEF5', '#1a1a1a'),
  MUT: dl(T, '#8A99AD', 'rgba(0,0,0,0.55)'),
  LINE: dl(T, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
  GOLD: dl(T, '#D4A847', '#b8861e'),
  CYAN: dl(T, '#1BB8FF', '#2a7faa'),
  GREEN: dl(T, '#34D399', '#12795A'),
  PURPLE: dl(T, '#B48CF2', '#5566aa'),
  RED: dl(T, '#E24B4A', '#C0392B'),
});

/** ORIGIN_SOURCE — the pipe is not the sensor. One colour per instrument, in
 *  both modes. Founder ruling 2026-08-22: two versions of everything. */
const sourceColor = (T: Tokens): Record<string, string> => {
  const C = pal(T);
  return {
    oura: C.GREEN, whoop: dl(T, '#7CE7C4', '#12795A'), garmin: C.CYAN,
    muse: dl(T, '#8fd6ff', '#1f6a90'), beats: C.GOLD,
    strava: dl(T, '#5CD65C', '#2a882a'), manual: C.MUT,
  };
};
const SOURCE_NAME: Record<string, string> = {
  oura: 'OURA RING 4', whoop: 'WHOOP MG', garmin: 'GARMIN TACTIX 8',
  muse: 'MUSE S ATHENA · THE CROWN', beats: 'BEATS PRO 2',
  strava: 'STRAVA', manual: 'ENTERED BY HAND',
};

export default function BaselineScreen() {
  const T = useTheme();
  const st = useMemo(() => makeSt(T), [T]);
  const C = pal(T);

  const [rows, setRows] = useState<NightRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    setRows(await loadNights(730));
    setLoading(false);
  })(); }, []);

  // Sources present, ordered by how much history each one holds — the one that
  // can say the most goes first.
  const sources = useMemo(() => {
    const c = new Map<string, number>();
    for (const r of rows) c.set(r.source, (c.get(r.source) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  // The most recent night any instrument recorded.
  const latestDate = useMemo(
    () => rows.reduce((m, r) => (r.reading_date > m ? r.reading_date : m), ''),
    [rows]
  );

  const ranks = useMemo(() => {
    if (!latestDate) return [] as NightRank[];
    return sources
      .map(([s]) => rankNight(latestDate, rows, s as BiosignalSource))
      .filter((x): x is NightRank => x != null);
  }, [rows, sources, latestDate]);

  const steps = useMemo(() => {
    const out: { source: string; changes: StepChange[] }[] = [];
    for (const [s] of sources) {
      const mine = rows.filter(r => r.source === s);
      if (mine.length < 12) continue;
      const c = findAllStepChanges(mine, 12).slice(0, 4);
      if (c.length) out.push({ source: s, changes: c });
    }
    return out;
  }, [rows, sources]);

  // WHERE THE INSTRUMENTS DISAGREE ON THE SAME NIGHT. The finding, not the bug.
  const disagreements = useMemo(() => {
    if (ranks.length < 2) return [] as { label: string; unit: string; spread: number; parts: { s: string; v: number }[] }[];
    const out: { label: string; unit: string; spread: number; parts: { s: string; v: number }[] }[] = [];
    for (const m of METRICS) {
      const parts = ranks
        .map(r => ({ s: r.source as string, v: r.metrics.find(x => x.key === m.key)?.value }))
        .filter((p): p is { s: string; v: number } => typeof p.v === 'number');
      if (parts.length < 2) continue;
      const vals = parts.map(p => p.v);
      const spread = Math.max(...vals) - Math.min(...vals);
      const base = Math.max(1, Math.min(...vals.map(Math.abs)));
      if (spread / base >= 0.25) out.push({ label: m.label, unit: m.unit, spread, parts });
    }
    return out.sort((a, b) => (b.spread / Math.max(1, b.parts[0].v)) - (a.spread / Math.max(1, a.parts[0].v))).slice(0, 5);
  }, [ranks]);

  const totalNights = rows.length;

  if (loading) {
    return (
      <View style={[st.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.CYAN} />
        <Text style={{ color: C.MUT, fontSize: 12, marginTop: 12 }}>Reading your own record…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={st.root} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Pressable onPress={() => router.back()}><Text style={st.back}>‹ BACK</Text></Pressable>
      <Text style={st.eyebrow}>THE BASELINE</Text>
      <Text style={st.title}>Your Own{'\n'}Record</Text>
      <Text style={st.sub}>
        Every number here is ranked against <Text style={{ color: C.INK, fontWeight: '700' }}>your nights</Text> —
        in the same part of the year, on the same instrument. No population. No normal range.
        Nobody's 61 is anybody else's 74.
      </Text>

      {/* ── WHAT THE MEMBRANE HOLDS ── */}
      {totalNights === 0 ? (
        <View style={st.emptyCard}>
          <Text style={st.emptyTitle}>No nights on the membrane yet</Text>
          <Text style={st.emptyBody}>
            Import an account export from Bio Buddy and this page fills itself. One tap brings in
            everything the instrument ever recorded — the whole night, not the score.
          </Text>
          <Pressable style={st.cta} onPress={() => router.push('/(tabs)/biobuddy' as any)}>
            <Text style={st.ctaTxt}>GO TO BIO BUDDY →</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={st.statRow}>
            <View style={st.stat}>
              <Text style={[st.statNum, { color: C.CYAN }]}>{totalNights}</Text>
              <Text style={st.statLbl}>NIGHTS HELD</Text>
            </View>
            <View style={st.stat}>
              <Text style={[st.statNum, { color: C.GREEN }]}>{sources.length}</Text>
              <Text style={st.statLbl}>INSTRUMENTS</Text>
            </View>
            <View style={st.stat}>
              <Text style={[st.statNum, { color: C.GOLD }]}>{tierFor(totalNights).slice(0, 4)}</Text>
              <Text style={st.statLbl}>CONFIDENCE</Text>
            </View>
          </View>

          <Text style={st.section}>WHAT EACH INSTRUMENT HAS SEEN</Text>
          {sources.map(([s, n]) => {
            const mine = rows.filter(r => r.source === s);
            const first = mine[0]?.reading_date, last = mine[mine.length - 1]?.reading_date;
            const col = sourceColor(T)[s] ?? C.MUT;
            return (
              <View key={s} style={[st.card, { borderLeftColor: col }]}>
                <View style={st.cardHead}>
                  <Text style={st.metric}>{SOURCE_NAME[s] ?? s.toUpperCase()}</Text>
                  <View style={[st.chip, { backgroundColor: col + '22' }]}>
                    <Text style={[st.chipTxt, { color: col }]}>{tierFor(n)}</Text>
                  </View>
                </View>
                <Text style={st.blurb}>
                  {n} night{n === 1 ? '' : 's'} on the membrane · {first} → {last}
                </Text>
              </View>
            );
          })}

          {/* ── THE LAST NIGHT, RANKED ── */}
          {ranks.length > 0 && (
            <>
              <Text style={st.section}>{latestDate} · RANKED AGAINST YOU</Text>
              {ranks.map(r => {
                const col = sourceColor(T)[r.source as string] ?? C.MUT;
                const show: MetricRank[] = r.standouts.length ? r.standouts : r.metrics.slice(0, 4);
                return (
                  <View key={r.source as string} style={[st.card, { borderLeftColor: col }]}>
                    <Text style={[st.metric, { marginBottom: 8 }]}>{SOURCE_NAME[r.source as string] ?? String(r.source).toUpperCase()}</Text>
                    {r.standouts.length === 0 && (
                      <Text style={st.upNote}>
                        Nothing unusual for you last night. That is a finding too — it means the night
                        sat inside your own ordinary range on every channel this instrument reads.
                      </Text>
                    )}
                    {show.map(m => (
                      <View key={m.key} style={st.rankRow}>
                        <View style={[st.rankPip, { backgroundColor: pipColor(T, m) }]} />
                        <Text style={st.rankTxt}>{describeRank(m)}</Text>
                      </View>
                    ))}
                    {show.some(m => m.seasonalArtifact) && (
                      <View style={st.knowledge}>
                        <Text style={st.knowledgeLbl}>AA2 INTERPRETS</Text>
                        <Text style={st.knowledgeTxt}>
                          One or more readings above would look very different measured against your
                          whole record instead of this time of year. That gap is the calendar, not you.
                          A August night judged by a January baseline lies.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* ── WHAT CHANGED — amber, because this is interpretation ── */}
          {steps.length > 0 && (
            <>
              <Text style={st.section}>WHEN SOMETHING CHANGED</Text>
              {steps.map(({ source, changes }) => (
                <View key={source} style={st.knowledgeCard}>
                  <Text style={st.knowledgeLbl}>
                    AA2 INTERPRETS · {SOURCE_NAME[source] ?? source.toUpperCase()}
                  </Text>
                  {changes.map((c, i) => (
                    <Text key={i} style={st.knowledgeTxt}>• {describeStepChange(c)}</Text>
                  ))}
                  <Text style={st.ownTheWhy}>
                    AA2 finds the WHEN. It will never guess the WHY — that is yours, and you are the
                    only one who was there.
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* ── DISAGREEMENT IS THE DATASET ── */}
          {disagreements.length > 0 && (
            <>
              <Text style={st.section}>WHERE YOUR INSTRUMENTS DISAGREE</Text>
              <View style={st.knowledgeCard}>
                <Text style={st.knowledgeLbl}>AA2 INTERPRETS · {latestDate}</Text>
                {disagreements.map((d, i) => (
                  <Text key={i} style={st.knowledgeTxt}>
                    • <Text style={{ color: C.INK, fontWeight: '700' }}>{d.label}</Text>{' '}
                    {d.parts.map(p => `${SOURCE_NAME[p.s]?.split(' ')[0] ?? p.s} ${Math.round(p.v * 10) / 10}${d.unit}`).join('  ·  ')}
                  </Text>
                ))}
                <Text style={st.ownTheWhy}>
                  Not one of them is broken. They measure from different places with different
                  methods, and no single one of them holds the night. The spread IS the reading —
                  and you are the only person standing where all of them arrive.
                </Text>
              </View>
            </>
          )}

          <View style={st.footCard}>
            <Text style={st.footLine}>A vendor score is a population's opinion of you.</Text>
            <Text style={[st.footLine, { fontSize: 20, marginBottom: 10 }]}>A baseline is you.</Text>
            <Text style={st.footSub}>
              Every night you add makes every night before it mean more. Nothing here compares you to
              a stranger, an average, or a chart in a magazine — only to the person you were last week.
              {'\n\n'}You are the control group.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** Colour by how far from ordinary, never by "good" or "bad". ZERO SHAME. */
function pipColor(T: Tokens, m: MetricRank): string {
  const C = pal(T);
  const p = m.seasonPct ?? m.allPct;
  if (p == null) return C.MUT;
  if (p >= 85 || p <= 15) return m.dir === 'neutral' ? C.PURPLE : (isFavourable(m, p) ? C.GREEN : C.GOLD);
  return C.MUT;
}
function isFavourable(m: MetricRank, p: number): boolean {
  if (m.dir === 'higher') return p >= 50;
  if (m.dir === 'lower') return p < 50;
  return true;
}

const makeSt = (T: Tokens) => {
  const { NAVY, INK, MUT, LINE, GOLD, CYAN, GREEN, PURPLE, RED } = pal(T);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  back: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 16, marginTop: 34 },
  eyebrow: { color: CYAN, fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 6 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', marginBottom: 8, lineHeight: 38 },
  sub: { color: MUT, fontSize: 13, lineHeight: 19, marginBottom: 18 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stat: { flex: 1, backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLbl: { color: MUT, fontSize: 8, letterSpacing: 1, marginTop: 3, fontWeight: '700' },

  section: { color: MUT, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  card: { backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderLeftWidth: 3, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  metric: { color: INK, fontSize: 14, fontWeight: '700', flexShrink: 1, letterSpacing: 0.5 },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, marginLeft: 8 },
  chipTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  blurb: { color: MUT, fontSize: 11.5, lineHeight: 16 },

  rankRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  rankPip: { width: 7, height: 7, borderRadius: 4, marginTop: 6, marginRight: 9 },
  // READABILITY LAW: body ≥ 13.
  rankTxt: { color: INK, fontSize: 13, lineHeight: 18.5, flex: 1 },

  // THE CARD LAW — amber hero. Worn whenever AA2 interprets rather than reports.
  knowledgeCard: { backgroundColor: dl(T, 'rgba(212,168,71,0.14)', 'rgba(184,134,30,0.14)'), borderWidth: 2, borderColor: dl(T, 'rgba(212,168,71,0.55)', 'rgba(184,134,30,0.55)'), borderRadius: 14, padding: 16, marginBottom: 10 },
  knowledge: { backgroundColor: dl(T, 'rgba(212,168,71,0.14)', 'rgba(184,134,30,0.14)'), borderWidth: 2, borderColor: dl(T, 'rgba(212,168,71,0.55)', 'rgba(184,134,30,0.55)'), borderRadius: 12, padding: 12, marginTop: 8 },
  knowledgeLbl: { color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 8 },
  knowledgeTxt: { color: INK, fontSize: 13, lineHeight: 18.5, marginBottom: 8 },
  ownTheWhy: { color: 'rgba(232,238,245,0.72)', fontSize: 11.5, lineHeight: 16.5, fontStyle: 'italic', marginTop: 2 },

  upNote: { color: 'rgba(232,238,245,0.65)', fontSize: 11.5, lineHeight: 16.5, fontStyle: 'italic', marginBottom: 8 },

  emptyCard: { backgroundColor: dl(T, 'rgba(27,184,255,0.08)', 'rgba(42,127,170,0.08)'), borderWidth: 1, borderColor: dl(T, 'rgba(27,184,255,0.32)', 'rgba(42,127,170,0.32)'), borderRadius: 14, padding: 18 },
  emptyTitle: { color: INK, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  emptyBody: { color: MUT, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  cta: { borderWidth: 1, borderColor: dl(T, 'rgba(27,184,255,0.45)', 'rgba(42,127,170,0.45)'), backgroundColor: dl(T, 'rgba(27,184,255,0.10)', 'rgba(42,127,170,0.10)'), borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  ctaTxt: { color: CYAN, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  footCard: { marginTop: 20, backgroundColor: dl(T, 'rgba(212,168,71,0.08)', 'rgba(184,134,30,0.08)'), borderWidth: 1, borderColor: dl(T, 'rgba(212,168,71,0.30)', 'rgba(184,134,30,0.30)'), borderRadius: 14, padding: 16 },
  footLine: { color: GOLD, fontSize: 16, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  footSub: { color: MUT, fontSize: 12, lineHeight: 17.5, textAlign: 'center' },
});
};
