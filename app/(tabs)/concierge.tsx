import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import DoorCover from '@/components/DoorCover';
import { loadMemberProfile, buildPersonalTruth, logMembraneEvent, type FullMemberProfile } from '../../lib/db';
import { streamClaude } from '../../lib/claude-stream';

// ─────────────────────────────────────────────────────────────────────────────
// THE CONCIERGE — Intelligence 0X01 · The Voice · Broca's Area
// Door first, then the function list — every string from the approved door HTML.
// Javier speaks live. Rows seed the ask. No dead ends.
// ─────────────────────────────────────────────────────────────────────────────

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = 'rgba(255,255,255,0.55)', FAINT = 'rgba(255,255,255,0.32)';
const LINE = 'rgba(255,255,255,0.10)', GOLD = '#D4A847';

type FnRow = { icon: string; title: string; sub: string; seed?: string; route?: Href };

// WHAT THE CONCIERGE DOES — verbatim from the wire. Eight functions.
const FUNCTIONS: FnRow[] = [
  { icon: '🎙️', title: 'Introduce the team',
    sub: 'Equalizer · Bio Buddy · Chauffeur · Chef · your whole receiving line',
    seed: 'Introduce me to the team — who does what inside AA2?' },
  { icon: '🧠', title: 'Remember you',
    sub: 'Name · personality · preferences · history — carried session to session',
    seed: 'What do you remember about me so far?' },
  { icon: '🚪', title: 'Onboarding as initiation',
    sub: 'The skin of the system — first contact, identity absorbed',
    route: '/(tabs)/onboarding' as Href },
  { icon: '🔄', title: 'Continuity between sessions',
    sub: 'Nothing repeated. Nothing lost. Pick up exactly where you left off.',
    seed: 'Pick up exactly where we left off — what was I working on?' },
  { icon: '📋', title: 'Explain any part of the system',
    sub: 'What a spoke does · how the Vault works · what AWARE DOLLARS means',
    seed: 'Explain how the Vault works and what AWARE DOLLARS means.' },
  { icon: '🌍', title: 'Cultural & language guidance',
    sub: 'Foreign menus · regional context · survival-relevance learning',
    seed: 'Help me read a foreign menu with regional context — teach me through what matters for my safety.' },
  { icon: '👨‍👩‍👧', title: 'Family onboarding',
    sub: "Set up spouse · children · each member's profile and role",
    route: '/(tabs)/biobuddy?page=2' as Href },
  { icon: '🎭', title: 'Choose your personality',
    sub: 'The Coach · The Stable · COMMAND · THE BRIEF',
    seed: 'Show me the personalities I can choose — The Coach, The Stable, COMMAND, THE BRIEF — and set the one that fits me.' },
];

export default function ConciergeScreen() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [profile, setProfile] = useState<FullMemberProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => { setProfile(await loadMemberProfile()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const runQuery = useCallback(async (seed?: string) => {
    const q = (seed ?? query).trim();
    if (!q || asking) return;
    setQuery(q); setAnswer(''); setAsking(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      const truth = buildPersonalTruth(profile);
      await streamClaude({
        system: `You are Javier — The Concierge, AA2's voice. Warm, unhurried, intelligent. You walk the member in, introduce the team, remember them, and explain any part of the system plainly. Never name internal databases. Never mention internal doctrine names.${truth ? `\n\n${truth}` : ''}`,
        content: q,
        max_tokens: 700,
        onPartial: acc => setAnswer(acc),
      });
    } catch (e: any) {
      setAnswer(`The Concierge stepped away for a moment. ${e?.message ?? ''}`.trim());
    } finally {
      setAsking(false);
    }
  }, [query, asking, profile]);

  const openRow = (r: FnRow) => {
    if (r.route) { router.push(r.route); return; }
    if (r.seed) {
      runQuery(r.seed);
      logMembraneEvent({ eventType: 'concierge_function_run', sourceScreen: 'concierge', subject: r.title });
    }
  };

  if (!doorOpen) {
    return (
      <ScrollView style={st.root} contentContainerStyle={{ flexGrow: 1 }}>
        <DoorCover
          art={require('../../assets/doors/door-concierge.jpg')}
          intelChip="INTELLIGENCE 0X01"
          skip
          roleLine="PERSONAL INTELLIGENCE · MEMORY · CONTINUITY"
          titleLines={['THE', 'CONCIERGE']}
          desc="The voice. The host who walks you in and introduces everyone. The skin of the system — first contact, absorbs identity."
          withLabel="WITH THE CONCIERGE"
          withText="A personal intelligence who knows you, your goals, your world."
          withoutLabel="WITHOUT"
          withoutText="Navigating everything alone. No memory. No continuity."
          openLabel="Meet the Concierge →"
          accent={GOLD}
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
    >
      <View style={st.subhead}>
        <Text style={st.subheadL}>◆ THE CONCIERGE</Text>
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
            placeholder="speak or type anything…"
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
          {asking && !answer ? <ActivityIndicator color={GOLD} /> : null}
          {answer ? <Text style={st.answerTxt}>{answer}</Text> : null}
        </View>
      ) : null}

      <View style={st.section}>
        <Text style={st.fntitle}>WHAT THE CONCIERGE DOES</Text>
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
        <Pressable style={st.action} onPress={() => runQuery(query || 'Walk me in — where should I start today?')}>
          <Text style={st.actionTxt}>◆ SPEAK TO THE CONCIERGE</Text>
          <Text style={[st.actionTxt, { marginLeft: 8 }]}>→</Text>
        </Pressable>
      </View>

      <Text style={st.note}>
        WELL HELLO. WE HAVE BEEN ANTICIPATING YOUR ARRIVAL. EVERYONE IS HERE AND READY.
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: GOLD },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    margin: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(212,168,71,0.5)',
    backgroundColor: 'rgba(212,168,71,0.06)', borderRadius: 12, padding: 15,
  },
  askQ: { fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: '#e8c887' },
  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  askInput: { flex: 1, color: INK, fontFamily: 'DMSans-Regular', fontSize: 13, paddingVertical: 4 },

  answer: {
    marginHorizontal: 14, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 14,
  },
  answerTxt: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, lineHeight: 19 },

  section: { paddingHorizontal: 14, paddingTop: 14 },
  fntitle: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, color: GOLD, marginBottom: 10 },
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
    borderWidth: 1, borderColor: 'rgba(212,168,71,0.5)', backgroundColor: 'rgba(212,168,71,0.08)',
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: '#e8c887' },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },
});
