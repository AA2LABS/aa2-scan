import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, dl, type Tokens } from '@/lib/theme-mode';
import {
  getRetentionRecord, getDueRecallChecks, answerRecallCheck,
  type RetentionRecord, type RecallCheck,
} from '@/lib/db';
import { pathBySlug } from '@/lib/study-content';

// ─────────────────────────────────────────────────────────────────────────────
// SPOKE 17 · THE RETENTION RECORD — wired 2026-09-19.
//
// The thing nothing on the market does: not how long you studied, but what
// you still hold.
//
// NO NAKED NUMBERS — every rate on this screen is printed beside the two
// counts that produced it. "5 of 6 held" before "83%", always, and never the
// percentage alone. A rate with no denominator is a lie with a decimal point.
//
// SERVE THE TABLE — an unanswered check is UNANSWERED. Never overdue, never
// red, never a miss. The member is not behind.
//
// DID NOT HOLD IS NOT FAILURE. It is the single most useful row on the screen:
// it is the system telling you exactly what to read again.
// ─────────────────────────────────────────────────────────────────────────────

const SAND  = '#D49A4A';
const GREEN = '#34D399';
const AMBER = '#E0A04A';

const FELT_LABEL: Record<string, string> = {
  locked:    'Locked in',
  ordinary:  'Ordinary',
  scattered: 'Scattered',
};

export default function RetentionScreen() {
  const T = useTheme();
  const s = useMemo(() => make(T), [T]);
  const [rec, setRec] = useState<RetentionRecord | null>(null);
  const [due, setDue] = useState<RecallCheck[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, d] = await Promise.all([getRetentionRecord(), getDueRecallChecks(20)]);
    setRec(r); setDue(d);
  }, []);

  useFocusEffect(useCallback(() => { let a = true;
    (async () => { const [r, d] = await Promise.all([getRetentionRecord(), getDueRecallChecks(20)]);
      if (a) { setRec(r); setDue(d); } })();
    return () => { a = false; }; }, []));

  const answer = async (id: string, held: boolean) => {
    setBusy(id);
    await answerRecallCheck(id, held);
    await load();
    setBusy(null);
  };

  const r = rec;
  const hasAny = !!r && (r.sessions > 0 || r.answered > 0);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backTxt}>← BACK</Text>
        </TouchableOpacity>

        <Text style={s.kicker}>SPOKE 17 · THE RETENTION RECORD</Text>
        <Text style={s.h1}>Not how long</Text>
        <Text style={[s.h1, s.h1b]}>you studied.</Text>
        <Text style={s.sub}>
          What you still hold. Every figure below is printed with the counts that produced it —
          a rate on its own is a lie with a decimal point.
        </Text>

        {/* ── CHECKS DUE ────────────────────────────────────────────── */}
        {due.length > 0 && (
          <>
            <View style={s.legendRow}>
              <Text style={s.legend}>READY WHEN YOU ARE</Text>
              <Text style={s.count}>{due.length}</Text>
            </View>
            <Text style={s.legendBody}>
              One tap. Did it hold, or not? Either answer is useful — "did not hold" is the
              system telling you what to read again.
            </Text>
            {due.map(c => (
              <View key={c.id} style={s.checkCard}>
                <Text style={s.checkMeta}>
                  +{c.intervalDay} {c.intervalDay === 1 ? 'DAY' : 'DAYS'}
                  {c.moduleLabel ? ` · ${c.moduleLabel.toUpperCase()}` : ''}
                </Text>
                <Text style={s.checkPrompt}>{c.prompt}</Text>
                <View style={s.checkBtns}>
                  <TouchableOpacity disabled={busy === c.id} activeOpacity={0.85}
                    style={[s.btn, s.btnHeld]} onPress={() => answer(c.id, true)}>
                    <Text style={s.btnHeldTxt}>IT HELD</Text>
                  </TouchableOpacity>
                  <TouchableOpacity disabled={busy === c.id} activeOpacity={0.85}
                    style={[s.btn, s.btnNot]} onPress={() => answer(c.id, false)}>
                    <Text style={s.btnNotTxt}>NOT YET</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── THE RECORD ────────────────────────────────────────────── */}
        {!hasAny ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>Nothing recorded yet, and that is honest.</Text>
            <Text style={s.emptyTxt}>
              Run a study session and the first checks arrive tomorrow. Nothing here is
              simulated to make the screen look alive.
            </Text>
            <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => router.back()}>
              <Text style={s.ctaTxt}>Pick a module</Text>
              <Text style={s.ctaArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.stats}>
              <Stat s={s} v={String(r!.sessions)} l="SESSIONS" />
              <Stat s={s} v={String(Math.round(r!.minutes / 60))} l="HOURS" />
              <Stat s={s} v={String(r!.answered)} l="CHECKS ANSWERED" />
            </View>

            <Rate s={s} label="OVERALL" held={r!.held} of={r!.answered} />
            {r!.pending > 0 && (
              <Text style={s.pendingNote}>
                {r!.pending} {r!.pending === 1 ? 'check is' : 'checks are'} still scheduled.
                Unanswered is unanswered — it is not a miss.
              </Text>
            )}

            {r!.byInterval.length > 0 && (
              <>
                <Text style={s.legend}>HOW IT DECAYS</Text>
                <View style={s.card}>
                  {r!.byInterval.map((b, i) => (
                    <View key={b.day} style={[s.row, i === r!.byInterval.length - 1 && s.last]}>
                      <Text style={s.rowK}>+{b.day} {b.day === 1 ? 'day' : 'days'}</Text>
                      <Text style={s.rowV}>{b.held} of {b.answered} held</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {r!.byFelt.length > 0 && (
              <>
                <Text style={s.legend}>AGAINST HOW THE SESSION FELT</Text>
                <Text style={s.legendBody}>
                  Your own word for the session, set against what survived it. This is the
                  correlation nothing else on the market will show you.
                </Text>
                <View style={s.card}>
                  {r!.byFelt.map((b, i) => (
                    <View key={b.felt} style={[s.row, i === r!.byFelt.length - 1 && s.last]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowK}>{FELT_LABEL[b.felt] ?? b.felt}</Text>
                        <Text style={s.rowSub}>{b.sessions} {b.sessions === 1 ? 'session' : 'sessions'}</Text>
                      </View>
                      <Text style={s.rowV}>
                        {b.answered ? `${b.held} of ${b.answered} held` : 'no checks answered yet'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {r!.byPath.length > 0 && (
              <>
                <Text style={s.legend}>BY PATH</Text>
                <View style={s.card}>
                  {r!.byPath.map((b, i) => (
                    <View key={b.pathSlug} style={[s.row, i === r!.byPath.length - 1 && s.last]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowK}>{pathBySlug(b.pathSlug)?.title ?? b.pathSlug}</Text>
                        <Text style={s.rowSub}>
                          {b.sessions} {b.sessions === 1 ? 'session' : 'sessions'} · {Math.round(b.minutes / 60)} h
                        </Text>
                      </View>
                      <Text style={s.rowV}>
                        {b.answered ? `${b.held} of ${b.answered} held` : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        <Text style={s.foot}>A score is the system's opinion of you. A baseline is you.</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ s, v, l }: { s: any; v: string; l: string }) {
  return <View style={s.stat}><Text style={s.statV}>{v}</Text><Text style={s.statL}>{l}</Text></View>;
}

/** Counts first, rate second, and never the rate alone. */
function Rate({ s, label, held, of }: { s: any; label: string; held: number; of: number }) {
  if (!of) return null;
  const pct = Math.round((held / of) * 100);
  return (
    <View style={s.rateBox}>
      <Text style={s.rateLabel}>{label}</Text>
      <Text style={s.rateCounts}>{held} of {of} held</Text>
      <Text style={s.ratePct}>{pct}%</Text>
    </View>
  );
}

const make = (T: Tokens) => {
  const BG    = dl(T, '#0A0804', '#FAF7F2');
  const CARD  = dl(T, '#150F0A', '#FFFFFF');
  const LINE  = dl(T, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.10)');
  const INK   = dl(T, '#FFFFFF', '#141414');
  const MUT   = dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)');
  const FAINT = dl(T, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    pad: { padding: 20, paddingBottom: 56 },
    back: { marginBottom: 14 },
    backTxt: { color: FAINT, fontSize: 10, letterSpacing: 1.6 },
    kicker: { color: SAND, fontSize: 9, letterSpacing: 1.8, marginBottom: 10 },
    h1: { color: INK, fontSize: 33, lineHeight: 36, fontWeight: '300', letterSpacing: -0.6 },
    h1b: { fontWeight: '700', marginBottom: 12 },
    sub: { color: MUT, fontSize: 13, lineHeight: 20, marginBottom: 24 },

    legend: { color: FAINT, fontSize: 10, letterSpacing: 1.8, marginTop: 26, marginBottom: 6 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
    legendBody: { color: MUT, fontSize: 11, lineHeight: 17, marginBottom: 12 },
    count: { color: SAND, fontSize: 12, fontWeight: '700' },

    checkCard: { borderWidth: 1, borderColor: SAND, borderRadius: 6, padding: 14, marginBottom: 10, backgroundColor: CARD },
    checkMeta: { color: SAND, fontSize: 8, letterSpacing: 1.6, marginBottom: 7 },
    checkPrompt: { color: INK, fontSize: 14, lineHeight: 20, marginBottom: 14 },
    checkBtns: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, borderRadius: 4, paddingVertical: 11, alignItems: 'center', borderWidth: 1 },
    btnHeld: { borderColor: GREEN, backgroundColor: 'rgba(52,211,153,0.12)' },
    btnHeldTxt: { color: GREEN, fontSize: 11, letterSpacing: 1.4, fontWeight: '700' },
    btnNot: { borderColor: LINE },
    btnNotTxt: { color: MUT, fontSize: 11, letterSpacing: 1.4 },

    stats: { flexDirection: 'row', gap: 10, marginTop: 6 },
    stat: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
    statV: { color: INK, fontSize: 20, fontWeight: '700' },
    statL: { color: FAINT, fontSize: 8, letterSpacing: 1.2, marginTop: 3, textAlign: 'center' },

    rateBox: { marginTop: 14, borderWidth: 1, borderColor: SAND, borderRadius: 6, padding: 16 },
    rateLabel: { color: FAINT, fontSize: 9, letterSpacing: 1.6 },
    rateCounts: { color: INK, fontSize: 18, marginTop: 6 },
    ratePct: { color: SAND, fontSize: 30, fontWeight: '700', marginTop: 2 },
    pendingNote: { color: FAINT, fontSize: 11, lineHeight: 17, marginTop: 10, fontStyle: 'italic' },

    card: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 6 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: 1, borderBottomColor: LINE, gap: 10 },
    last: { borderBottomWidth: 0 },
    rowK: { color: INK, fontSize: 13 },
    rowSub: { color: FAINT, fontSize: 9, letterSpacing: 1.1, marginTop: 3 },
    rowV: { color: MUT, fontSize: 12 },

    emptyBox: { borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 18, marginTop: 8 },
    emptyTitle: { color: INK, fontSize: 15, marginBottom: 6 },
    emptyTxt: { color: MUT, fontSize: 12, lineHeight: 19 },
    cta: { marginTop: 18, backgroundColor: SAND, borderRadius: 4, padding: 14,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ctaTxt: { color: '#0A0804', fontSize: 13, fontWeight: '700' },
    ctaArrow: { color: '#0A0804', fontSize: 15, fontWeight: '700' },

    foot: { color: FAINT, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
  });
};
