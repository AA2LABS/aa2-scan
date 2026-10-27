// ─── app/spread.tsx ──────────────────────────────────────────────────────────
// THE SPREAD TABLE · LAW 23 · DISAGREEMENT IS THE DATA
//
// Canon v70 PART XXV, LAW 23: "The spread table is the screen that turns YOUR
// STACK HAS YOU COVERED from a checkmark into the proof. It has not been drawn
// and waits for the founder's word." Drawn 2026-10-27.
//
// STACK COVERAGE says you are covered. THIS says what the coverage found.
// One row per channel, one column per instrument that reads it, the delta on
// the end — the founder's own specification, word for word.
//
// IT NEVER AVERAGES. One heartbeat, one vote: an average would erase exactly
// the finding this page exists to show.

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { dl, lc, useTheme, type Tokens } from '@/lib/theme-mode';
import { getSpreadNight, sourceLabel, type SpreadNight, type SpreadRow } from '@/lib/spread';

const pal = (T: Tokens) => ({
  BG:    dl(T, '#080808', '#F0EEE8'),
  CARD:  dl(T, 'rgba(255,255,255,0.05)', '#FFFFFF'),
  INK:   dl(T, '#FFFFFF', '#1a1a1a'),
  MUT:   dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)'),
  FAINT: dl(T, 'rgba(255,255,255,0.32)', 'rgba(0,0,0,0.38)'),
  LINE:  dl(T, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.10)'),
  CYAN:  dl(T, '#1BB8FF', '#0B79B0'),
  GREEN: dl(T, '#34D399', '#12795A'),
  AMBER: dl(T, '#C49A2A', '#9A7418'),
  RED:   dl(T, '#E24B4A', '#C0392B'),
  GOLD:  dl(T, '#D4A847', '#b8861e'),
});

export default function SpreadScreen() {
  const TH = useTheme();
  const C = pal(TH);
  const [night, setNight] = useState<SpreadNight | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(useCallback(() => {
    let alive = true;
    setLoaded(false);
    getSpreadNight()
      .then(n => { if (alive) { setNight(n); setLoaded(true); } })
      .catch(() => { if (alive) { setNight(null); setLoaded(true); } });
    return () => { alive = false; };
  }, []));

  const bandColor = (b: SpreadRow['band']) =>
    b === 'agree' ? C.GREEN : b === 'watch' ? C.AMBER : b === 'finding' ? C.RED : C.FAINT;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.BG }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={[s.back, { color: C.FAINT }]}>← BACK</Text>
      </Pressable>

      <Text style={[s.h1, { color: C.INK }]}>THE SPREAD</Text>
      <Text style={[s.sub, { color: C.MUT }]}>
        One night. Every instrument that answered. The difference on the end.
      </Text>

      {!loaded ? (
        <Text style={[s.empty, { color: C.FAINT }]}>Reading the night…</Text>
      ) : !night ? (
        // NO FAKE DATA. A member with one instrument, or none, is told the
        // truth rather than shown an invented argument.
        <View style={[s.card, { borderColor: C.LINE, backgroundColor: C.CARD, marginTop: 18 }]}>
          <Text style={[s.lbl, { color: C.CYAN }]}>NOTHING TO COMPARE YET</Text>
          <Text style={[s.body, { color: C.MUT }]}>
            This page needs one night read by more than one instrument. Import an
            account export or connect a second instrument, and the argument shows up here.
          </Text>
        </View>
      ) : (
        <>
          <View style={s.headRow}>
            <Text style={[s.date, { color: C.GOLD }]}>{night.readingDate}</Text>
            <Text style={[s.lbl, { color: C.FAINT }]}>
              {night.sources.map(sourceLabel).join(' · ').toUpperCase()}
            </Text>
          </View>

          {/* THE TABLE */}
          <View style={[s.card, { borderColor: C.LINE, backgroundColor: C.CARD, padding: 0, marginTop: 12 }]}>
            {night.rows.map((r, i) => (
              <View key={r.channel.key} style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.LINE }]}>
                <View style={s.rowTop}>
                  <Text style={[s.ch, { color: C.INK }]}>{r.channel.label}</Text>
                  <View style={s.cells}>
                    {r.cells.map(c => (
                      <View key={c.source} style={s.cell}>
                        <Text style={[s.cellV, { color: C.INK }]}>{c.value}</Text>
                        <Text style={[s.cellS, { color: C.FAINT }]}>{sourceLabel(c.source).toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.deltaWrap}>
                    <Text style={[s.delta, { color: bandColor(r.band) }]}>
                      {r.delta == null ? '—' : r.delta}
                    </Text>
                    <Text style={[s.cellS, { color: C.FAINT }]}>{r.channel.unit}</Text>
                  </View>
                </View>
                {/* NO NAKED NUMBERS — every row says what its number means. */}
                <Text style={[s.why, { color: C.MUT }]}>{r.why}</Text>
              </View>
            ))}
          </View>

          {/* THE ROOM IS THE TIEBREAKER. Canon: the Ozlo case earned
              ENVIRONMENT + for exactly the 101-degrees case. */}
          {night.room && (night.room.tempC != null || night.room.noiseDb != null) ? (
            <View style={[s.card, { borderColor: C.LINE, backgroundColor: C.CARD, marginTop: 12 }]}>
              <Text style={[s.lbl, { color: C.CYAN }]}>THE ROOM · THE TIEBREAKER</Text>
              <Text style={[s.body, { color: C.MUT }]}>
                {night.room.tempC != null ? `${Number(night.room.tempC).toFixed(1)}°C` : '—'}
                {night.room.noiseDb != null ? ` · ${night.room.noiseDb} dB` : ''}
                {night.room.pressure != null ? ` · ${night.room.pressure} hPa` : ''}
                {'\n'}Skin moved and the room held → the mask did it. Skin moved and the
                room moved → the room did it. Neither channel can tell those apart alone.
              </Text>
            </View>
          ) : null}

          <View style={[s.card, { borderColor: C.LINE, backgroundColor: C.CARD, marginTop: 12 }]}>
            <Text style={[s.lbl, { color: C.GOLD }]}>WHY THIS PAGE REFUSES TO AVERAGE</Text>
            <Text style={[s.body, { color: C.MUT }]}>
              Every vendor rounds its raw signal into a score before you see it, and
              the port de-duplicates on the way in. Your instruments already disagree
              every night — nobody ever put the columns side by side.{'\n\n'}
              An instrument that disagrees on a poor-contact night loses weight for
              that night, not for good.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  back:   { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, marginBottom: 18 },
  h1:     { fontFamily: 'BebasNeue-Regular', fontSize: 34, letterSpacing: 3 },
  sub:    { fontFamily: 'CormorantGaramond-Italic', fontSize: 15, marginTop: 4 },
  empty:  { fontFamily: 'DMSans-Regular', fontSize: 13, marginTop: 20 },
  headRow:{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  date:   { fontFamily: 'BebasNeue-Regular', fontSize: 20, letterSpacing: 1.6 },
  card:   { borderWidth: 1, borderRadius: 12, padding: 14 },
  row:    { paddingVertical: 11, paddingHorizontal: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ch:     { fontFamily: 'DMSans-Regular', fontSize: 13, fontWeight: '700', flexBasis: 78 },
  cells:  { flex: 1, flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  cell:   { alignItems: 'flex-end' },
  cellV:  { fontFamily: 'DMMono-Medium', fontSize: 13 },
  cellS:  { fontFamily: 'DMMono-Regular', fontSize: 7.5, letterSpacing: 1 },
  deltaWrap: { alignItems: 'flex-end', minWidth: 44 },
  delta:  { fontFamily: 'BebasNeue-Regular', fontSize: 20, letterSpacing: 1 },
  why:    { fontFamily: 'DMSans-Regular', fontSize: 11.5, lineHeight: 16, marginTop: 7 },
  lbl:    { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.5 },
  body:   { fontFamily: 'DMSans-Regular', fontSize: 12.5, lineHeight: 18, marginTop: 7 },
});
