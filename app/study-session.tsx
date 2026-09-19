import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useTheme, dl, type Tokens } from '@/lib/theme-mode';
import { pathBySlug } from '@/lib/study-content';
import { startStudySession, endStudySession } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// SPOKE 17 · THE STUDY SESSION — wired 2026-09-19.
//
// This is NOT a Pomodoro. It counts UP, not down, because a timer that counts
// down decides for you when you are finished and this one does not. The module
// carries a SCOPE, never a target, and running over it is not an overrun.
//
// On close it schedules the module's recall prompts at +1, +3, +7 and +30 days.
// That is the whole point: the session is the input, the checks are the output.
//
// SERVE THE TABLE — nothing here tells the member to focus, warns them they
// have stopped, or grades the session. "How did that go?" takes THEIR word:
// locked, ordinary, scattered. Never a score, never derived from a sensor.
// ─────────────────────────────────────────────────────────────────────────────

const SAND = '#D49A4A';
const FELTS = [
  { k: 'locked'    as const, label: 'Locked in' },
  { k: 'ordinary'  as const, label: 'Ordinary' },
  { k: 'scattered' as const, label: 'Scattered' },
];

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export default function StudySessionScreen() {
  const T = useTheme();
  const s = useMemo(() => make(T), [T]);
  const { path: pathSlug, module: moduleId } = useLocalSearchParams<{ path: string; module: string }>();

  const p = pathBySlug(String(pathSlug ?? ''));
  const m = p?.modules.find(x => x.id === String(moduleId ?? ''));

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [sec, setSec] = useState(0);
  const [done, setDone] = useState(false);
  const [felt, setFelt] = useState<'locked' | 'ordinary' | 'scattered' | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) tick.current = setInterval(() => setSec(v => v + 1), 1000);
    else if (tick.current) { clearInterval(tick.current); tick.current = null; }
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running]);

  if (!p || !m) {
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={s.pad}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backTxt}>← BACK</Text>
          </TouchableOpacity>
          <Text style={s.h1}>Module not found.</Text>
          <Text style={s.sub}>Pick one from the Study Layer and this screen opens against it.</Text>
        </ScrollView>
      </View>
    );
  }

  const begin = async () => {
    const id = await startStudySession({ pathSlug: p.slug, moduleId: m.id, moduleLabel: m.label });
    setSessionId(id);          // null = no auth; the timer still runs, nothing is lost silently
    setRunning(true);
  };

  const finish = () => { setRunning(false); setDone(true); };

  const save = async () => {
    setSaving(true);
    if (sessionId) {
      await endStudySession({
        sessionId, minutes: Math.max(1, Math.round(sec / 60)),
        felt: felt ?? undefined, note: note.trim() || undefined,
        prompts: m.recall,
      });
    }
    setSaving(false);
    router.replace('/retention' as Href);
  };

  const over = sec / 60 > m.scope;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backTxt}>← {p.title.toUpperCase()}</Text>
        </TouchableOpacity>

        <Text style={s.kicker}>STUDY SESSION</Text>
        <Text style={s.h1}>{m.label}</Text>
        <Text style={s.sub}>{m.intent}</Text>

        <View style={s.clockBox}>
          <Text style={s.clock}>{mmss(sec)}</Text>
          <Text style={s.scope}>
            {m.scope} MIN SCOPED{over ? ' · YOU ARE PAST IT, WHICH IS FINE' : ''}
          </Text>
        </View>

        {!done ? (
          running ? (
            <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={finish}>
              <Text style={s.ctaTxt}>Finish the session</Text>
              <Text style={s.ctaArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={begin}>
              <Text style={s.ctaTxt}>{sec ? 'Pick it back up' : 'Start'}</Text>
              <Text style={s.ctaArrow}>→</Text>
            </TouchableOpacity>
          )
        ) : (
          <>
            <Text style={s.legend}>HOW DID THAT GO?</Text>
            <Text style={s.legendBody}>
              Your word, not a score. It gets set against what you still hold in a month.
            </Text>
            <View style={s.feltRow}>
              {FELTS.map(f => (
                <TouchableOpacity key={f.k} activeOpacity={0.8}
                  onPress={() => setFelt(felt === f.k ? null : f.k)}
                  style={[s.feltChip, felt === f.k && s.feltOn]}>
                  <Text style={[s.feltTxt, felt === f.k && s.feltTxtOn]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.legend}>ANYTHING WORTH KEEPING?</Text>
            <TextInput
              style={s.input} value={note} onChangeText={setNote}
              placeholder="Optional. One line to your future self."
              placeholderTextColor={dl(T, 'rgba(255,255,255,0.3)', 'rgba(0,0,0,0.3)')}
              multiline
            />

            <Text style={s.legend}>WHAT GETS CHECKED</Text>
            <View style={s.card}>
              {m.recall.map((q, i) => (
                <View key={i} style={[s.qRow, i === m.recall.length - 1 && s.last]}>
                  <Text style={s.qTxt}>{q}</Text>
                </View>
              ))}
              <View style={s.sched}>
                <Text style={s.schedTxt}>Asked at +1, +3, +7 and +30 days. One tap each.</Text>
              </View>
            </View>

            {!sessionId && (
              <Text style={s.warn}>
                Not signed in — this session will not be recorded. The time still counted;
                it just has nowhere to land.
              </Text>
            )}

            <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={save} disabled={saving}>
              <Text style={s.ctaTxt}>{saving ? 'Closing…' : 'Close the session'}</Text>
              <Text style={s.ctaArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={s.foot}>It counts up. You decide when you are done.</Text>
      </ScrollView>
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
    kicker: { color: SAND, fontSize: 9, letterSpacing: 1.8, marginBottom: 8 },
    h1: { color: INK, fontSize: 26, lineHeight: 31, fontWeight: '700', marginBottom: 10 },
    sub: { color: MUT, fontSize: 13, lineHeight: 20, marginBottom: 24 },
    clockBox: { borderWidth: 1, borderColor: LINE, borderRadius: 6, paddingVertical: 28, alignItems: 'center' },
    clock: { color: INK, fontSize: 54, fontWeight: '200', letterSpacing: 2 },
    scope: { color: FAINT, fontSize: 9, letterSpacing: 1.4, marginTop: 8, textAlign: 'center' },
    cta: { marginTop: 22, backgroundColor: SAND, borderRadius: 4, padding: 16,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ctaTxt: { color: '#0A0804', fontSize: 14, fontWeight: '700' },
    ctaArrow: { color: '#0A0804', fontSize: 16, fontWeight: '700' },
    legend: { color: FAINT, fontSize: 10, letterSpacing: 1.8, marginTop: 26, marginBottom: 6 },
    legendBody: { color: MUT, fontSize: 11, lineHeight: 17, marginBottom: 10 },
    feltRow: { flexDirection: 'row', gap: 8 },
    feltChip: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
    feltOn: { borderColor: SAND, backgroundColor: 'rgba(212,154,74,0.14)' },
    feltTxt: { color: MUT, fontSize: 11, letterSpacing: 0.8 },
    feltTxtOn: { color: SAND, fontWeight: '700' },
    input: { borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 12, minHeight: 70,
      color: INK, fontSize: 13, textAlignVertical: 'top', backgroundColor: CARD },
    card: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 6 },
    qRow: { padding: 13, borderBottomWidth: 1, borderBottomColor: LINE },
    last: { borderBottomWidth: 0 },
    qTxt: { color: INK, fontSize: 13, lineHeight: 19 },
    sched: { borderTopWidth: 1, borderTopColor: LINE, padding: 11 },
    schedTxt: { color: FAINT, fontSize: 10, letterSpacing: 0.8 },
    warn: { color: '#E0A04A', fontSize: 11, lineHeight: 17, marginTop: 14 },
    foot: { color: FAINT, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
  });
};
