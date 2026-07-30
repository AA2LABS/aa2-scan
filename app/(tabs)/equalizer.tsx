import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import DoorCover from '@/components/DoorCover';
import { loadMemberProfile, buildPersonalTruth, logMembraneEvent } from '../../lib/db';
import { streamClaude } from '../../lib/claude-stream';
import { EQUALIZER_VOICE, VOICE_MODEL } from '../../lib/voices';

// ─────────────────────────────────────────────────────────────────────────────
// THE EQUALIZER — Intelligence 0X05 · The Immune System
// Door first, then the longest function list in the app — every string from
// the approved door HTML. Nine functions. Aficionado does NOT live here.
// ─────────────────────────────────────────────────────────────────────────────

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = 'rgba(255,255,255,0.55)', FAINT = 'rgba(255,255,255,0.32)';
const LINE = 'rgba(255,255,255,0.10)', CYAN = '#1BB8FF';

type FnRow = { icon: string; title: string; sub: string; seed?: string; route?: Href };

// WHAT THE EQUALIZER DOES · LONGEST LIST — verbatim from the wire. Nine functions.
const FUNCTIONS: FnRow[] = [
  { icon: '🔍', title: 'Co-sign every scan',
    sub: 'ALL CLEAR · TAKE NOTICE · PAY ATTENTION — 9 databases, every time',
    route: '/' as Href },
  { icon: '🧬', title: 'Chemical doctrine analysis',
    sub: 'Exposure > label · cumulative load · biosignal cross-check',
    seed: 'Run a chemical doctrine read on my recent exposures — exposure over label, cumulative load, biosignal cross-check.' },
  { icon: '🏦', title: 'Guard the Vault',
    sub: 'Money + all saved items · AWARE DOLLARS · subscription recovery',
    route: '/vision-board' as Href },
  { icon: '✍️', title: 'Co-sign Dossiers',
    sub: 'Security audit · single-exit route flag · seal approval',
    route: '/travel' as Href },
  { icon: '💊', title: 'Pill Clarifier',
    sub: '15 databases · 5 cross-refs · WADA/FEI/DoD flags · interaction check',
    seed: 'Check my medications and supplements for interactions.' },
  { icon: '🐾', title: 'Species safety guard',
    sub: 'K9 · Feline · Equine · Agricultural — ASPCA + FEI layers',
    route: '/k9' as Href },
  { icon: '🌿', title: 'Apothecary intelligence',
    sub: 'Still Alive & Safe · Alive Codes · synergy pairs · off-grid dispensary',
    route: '/apothecary' as Href },
  { icon: '🏠', title: 'Environmental awareness',
    sub: 'BE AWARE · location-based threat intelligence · early warning',
    route: '/map' as Href },
  { icon: '🚨', title: 'Emergency escalation',
    sub: 'Last Known Good · Level 1–3 · law enforcement packet (opt-in)',
    seed: 'Walk me through emergency escalation — Last Known Good, Levels 1 to 3, and the law-enforcement packet opt-in.' },
];

export default function EqualizerScreen() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const onRefresh = useCallback(async () => { setRefreshing(true); setRefreshing(false); }, []);

  const runQuery = useCallback(async (seed?: string) => {
    const q = (seed ?? query).trim();
    if (!q || asking) return;
    setQuery(q); setAnswer(''); setAsking(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      const profile = await loadMemberProfile();
      const truth = buildPersonalTruth(profile);
      await streamClaude({
        system: `${EQUALIZER_VOICE}${truth ? `\n\n${truth}` : ''}`,
        content: q,
        max_tokens: 700,
        model: VOICE_MODEL,
        onPartial: acc => setAnswer(acc),
      });
    } catch (e: any) {
      setAnswer(`The Equalizer couldn't reach the intelligence right now. ${e?.message ?? ''}`.trim());
    } finally {
      setAsking(false);
    }
  }, [query, asking]);

  const openRow = (r: FnRow) => {
    if (r.route) { router.push(r.route); return; }
    if (r.seed) {
      runQuery(r.seed);
      logMembraneEvent({ eventType: 'equalizer_function_run', sourceScreen: 'equalizer', subject: r.title });
    }
  };

  if (!doorOpen) {
    return (
      <ScrollView style={st.root} contentContainerStyle={{ flexGrow: 1 }}>
        <DoorCover
          art={require('../../assets/doors/door-equalizer.jpg')}
          intelChip="INTELLIGENCE 0X05"
          skip
          roleLine="IMMUNE SYSTEM · GATE INTELLIGENCE · TRUTH ENGINE"
          titleLines={['THE', 'EQUALIZER']}
          desc="The immune system of the membrane. Monitors continuously. Detects before symptoms. Never alarmist. Never silent about real danger."
          withLabel="WITH THE EQUALIZER"
          withText="Nothing passes without clearance. Speaks only in emergencies."
          withoutLabel="WITHOUT"
          withoutText="Harm enters quietly. Labels lie. No one watching the gate."
          openLabel="Continue →"
          accent={CYAN}
          onOpen={() => setDoorOpen(true)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
    >
      <View style={st.subhead}>
        <Text style={st.subheadL}>◆ THE EQUALIZER</Text>
        <Pressable onPress={() => setDoorOpen(false)} hitSlop={8}>
          <Text style={st.subheadR}>← BACK</Text>
        </Pressable>
      </View>

      <View style={st.ask}>
        <Text style={st.askQ}>HOW CAN I HELP YOU?</Text>
        <View style={st.askRow}>
          <TextInput
            style={st.askInput}
            value={query}
            onChangeText={setQuery}
            placeholder="ask the Equalizer anything…"
            placeholderTextColor={FAINT}
            onSubmitEditing={() => runQuery()}
            returnKeyType="send"
          />
          <Pressable onPress={() => runQuery()} hitSlop={8}>
            <Text style={{ fontSize: 16 }}>🎤</Text>
          </Pressable>
        </View>
      </View>

      {(asking || answer) ? (
        <View style={st.answer}>
          {asking && !answer ? <ActivityIndicator color={CYAN} /> : null}
          {answer ? <Text style={st.answerTxt}>{answer}</Text> : null}
        </View>
      ) : null}

      <View style={st.section}>
        <Text style={st.fntitle}>WHAT THE EQUALIZER DOES · LONGEST LIST</Text>
        {FUNCTIONS.map((r, i) => (
          <Pressable key={i} style={st.fnrow} onPress={() => openRow(r)}>
            <Text style={st.ico}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.txt}>{r.title}</Text>
              <Text style={st.sub}>{r.sub}</Text>
            </View>
            <Text style={st.arr}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={st.section}>
        <Pressable style={st.action} onPress={() => router.push('/vision-board' as Href)}>
          <Text style={st.actionTxt}>◆ OPEN THE VAULT</Text>
          <Text style={[st.actionTxt, { marginLeft: 8 }]}>→</Text>
        </Pressable>
      </View>

      <Text style={st.note}>
        THE IMMUNE SYSTEM. EARLY AWARENESS, NOT FEAR. SAFETY IS CERTAINTY.
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: CYAN },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    margin: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)',
    backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, padding: 15,
  },
  askQ: { fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: '#8fd6ff' },
  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  askInput: { flex: 1, color: INK, fontFamily: 'DMSans-Regular', fontSize: 13, paddingVertical: 4 },

  answer: {
    marginHorizontal: 14, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 14,
  },
  answerTxt: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, lineHeight: 19 },

  section: { paddingHorizontal: 14, paddingTop: 14 },
  fntitle: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, color: CYAN, marginBottom: 10 },
  fnrow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13, marginBottom: 9,
  },
  ico: { fontSize: 16 },
  txt: { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700', color: INK },
  sub: { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 0.3, color: MUT, marginTop: 3, lineHeight: 14 },
  arr: { color: FAINT, fontSize: 17 },

  action: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.08)',
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: '#8fd6ff' },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },
});
