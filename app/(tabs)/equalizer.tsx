import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getScanHistory, loadMemberProfile, buildPersonalTruth, logMembraneEvent, getMembraneEvents } from '../../lib/db';
import { streamClaude } from '../../lib/claude-stream';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80', LINE = 'rgba(255,255,255,0.10)';
const CYAN = '#1BB8FF', GREEN = '#34D399', AMBER = '#E0A04A', RED = '#E24B4A';

function clearanceOf(row: any) {
  const v = row?.verdict_label;
  if (row?.allergen_triggered || v === 'PAY ATTENTION') {
    return { tag: 'BLOCKED', color: RED, dot: RED };
  }
  if (v === 'TAKE NOTICE' || v === 'HEADS UP' || row?.verdict_level === 'caution') {
    return { tag: 'CAUTION', color: AMBER, dot: AMBER };
  }
  return { tag: 'CLEARED', color: GREEN, dot: GREEN };
}

type GateRow = { icon: string; title: string; desc: string; chip?: string; chipColor?: string; route?: string; seed?: string };

// HUMAN FUNCTIONS — exact order. A row either routes to a screen or seeds the ask bar.
const HUMAN: GateRow[] = [
  { icon: '✍️', title: 'Co-sign every scan',        desc: 'every scan verified before it clears', seed: 'Show me the co-sign status of my recent scans.' },
  { icon: '🛡️', title: 'Threshold Guard',           desc: 'watching your limits · speaks only when crossed', seed: 'What thresholds am I approaching right now?' },
  { icon: '🧪', title: 'Chemical doctrine analysis', desc: 'compounds · exposures · cumulative load', seed: 'Run a chemical doctrine analysis on my recent exposures.' },
  { icon: '👑', title: 'Guard the Vault',           desc: 'AWARE DOLLARS · all saved items · subscription recovery', chip: 'SEALED', chipColor: GREEN, route: '/vision-board' },
  { icon: '💊', title: 'Pill Clarifier',            desc: '15 databases · 5 cross-refs · interaction check', chip: 'CLEAR', chipColor: GREEN, seed: 'Check my medications and supplements for interactions.' },
  { icon: '🌿', title: 'Apothecary Intelligence',   desc: 'Still Alive & Safe · synergy pairs · off-grid dispensary', chip: 'LIVE', chipColor: GREEN, route: '/apothecary' },
  { icon: '🧾', title: 'Co-sign flooders',          desc: 'pending co-signs across your saved items', seed: 'Which of my saved items are pending co-sign?' },
  { icon: '📑', title: 'Co-sign Dossiers',          desc: 'security audit · single-exit route flag · seal approval', chip: 'READY', chipColor: GREEN, route: '/travel' },
  { icon: '📡', title: 'Environmental Awareness',   desc: 'BE AWARE · location-based threat · early warning', chip: 'WATCHING', chipColor: AMBER, seed: 'What environmental risks are near me right now?' },
  { icon: '🚨', title: 'Emergency escalation',      desc: 'get help fast · the right responder first', seed: 'Show my emergency escalation plan and contacts.' },
];

// SPECIES SAFETY — below the human functions, unchanged
const SPECIES: GateRow[] = [
  { icon: '🐾', title: 'K9 / Feline',   desc: 'ASPCA toxicology', route: '/k9' },
  { icon: '🐎', title: 'Equine',        desc: 'FEI · equine nutritionist', route: '/equine' },
  { icon: '🐄', title: 'Agricultural',  desc: 'livestock · feed safety · mycotoxin', route: '/agricultural' },
];

// RESTRICTED LAYERS · ARM TO ENABLE — default OFF, require a YES/CANCEL confirm
const RESTRICTED: GateRow[] = [
  { icon: '🌿', title: 'Aficionado',                desc: 'opt-in', chip: 'OFF', chipColor: AMBER, route: '/aficionado' },
  { icon: '⚔', title: 'Tactical · Commander Layer', desc: 'arm to enable', chip: 'OFF', chipColor: AMBER },
];

export default function EqualizerScreen() {
  const [scans, setScans] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Restricted layers that have been armed — loaded from membrane_events so the
  // chip reads ARMED across restarts, never silently reset to OFF.
  const [armedLayers, setArmedLayers] = useState<Record<string, boolean>>({});

  // Live ask bar — a seeded or typed question runs against The Equalizer.
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    const rows = await getScanHistory(8);
    setScans(rows);
    const events = await getMembraneEvents(200);
    const armed: Record<string, boolean> = {};
    for (const e of events) {
      if (e.event_type === 'restricted_layer_armed' && e.subject) armed[e.subject] = true;
    }
    setArmedLayers(armed);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  const runQuery = useCallback(async (seed?: string) => {
    const q = (seed ?? query).trim();
    if (!q || asking) return;
    setQuery(q);
    setAnswer('');
    setAsking(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      const profile = await loadMemberProfile();
      const truth = buildPersonalTruth(profile);
      await streamClaude({
        system: `You are The Equalizer — AA2's immune system and gate intelligence. Calm, protective, exact. Answer the member's question directly and briefly. Never name internal databases.${truth ? `\n\n${truth}` : ''}`,
        content: q,
        max_tokens: 700,
        onPartial: (acc) => setAnswer(acc),
      });
    } catch (e: any) {
      setAnswer(`The Equalizer couldn't reach the intelligence right now. ${e?.message ?? ''}`.trim());
    } finally {
      setAsking(false);
    }
  }, [query, asking]);

  // No dead ends: a row routes to its screen, or seeds the ask bar and answers live.
  const openRow = (g: GateRow) => {
    if (g.route) { router.push(g.route as any); return; }
    if (g.seed) {
      runQuery(g.seed);
      logMembraneEvent({ eventType: 'equalizer_function_run', sourceScreen: 'equalizer', subject: g.title });
      return;
    }
  };

  // Arming a restricted layer is a real membrane write, and it persists.
  const armLayer = (g: GateRow) => {
    Alert.alert(
      g.title,
      'Arm this restricted layer?',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'YES', onPress: async () => {
            setArmedLayers(prev => ({ ...prev, [g.title]: true }));
            await logMembraneEvent({ eventType: 'restricted_layer_armed', sourceScreen: 'equalizer', subject: g.title, value: { armed: true } });
            if (g.route) router.push(g.route as any);
          } },
      ],
    );
  };

  const renderGate = (g: GateRow, i: number, onPress: () => void) => (
    <TouchableOpacity key={i} activeOpacity={0.7} onPress={onPress} style={st.gate}>
      <View style={st.gateIcon}><Text style={st.gateIconTxt}>{g.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={st.gateName}>{g.title}</Text>
        <Text style={st.gateDesc}>{g.desc}</Text>
      </View>
      {g.chip ? (
        <View style={[st.gateChip, { backgroundColor: (g.chipColor ?? CYAN) + '1F' }]}>
          <Text style={[st.gateChipTxt, { color: g.chipColor ?? CYAN }]}>{g.chip}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const anyBlocked = scans.some(r => clearanceOf(r).tag === 'BLOCKED');
  const heroState = anyBlocked ? 'CLEARANCES LOGGED' : 'ALL CLEAR · STANDBY';
  const heroColor = anyBlocked ? AMBER : GREEN;

  return (
    <ScrollView
      ref={scrollRef}
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
    >
      <View style={st.hero}>
        <Image source={require('../../assets/doors/door-equalizer.jpg')} resizeMode="cover" style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: CYAN }]}>INTELLIGENCE 0X05 · DOOR OPENED</Text>
          <Text style={st.title}>The Equalizer</Text>
        </View>
      </View>

      <View style={st.band}>
        <Text style={[st.bandLine, { color: heroColor }]}>{heroState}</Text>
        <Text style={st.bandSub}>Speaks only in emergencies. Nothing passes without clearance.</Text>
      </View>

      <View style={st.ask}>
        <TextInput
          style={st.askInput}
          value={query}
          onChangeText={setQuery}
          placeholder="How can I help you?"
          placeholderTextColor="#8fd6ff"
          returnKeyType="send"
          onSubmitEditing={() => runQuery()}
          editable={!asking}
        />
        <Text style={st.askH}>ask · type · speak  🎤</Text>
        {(asking || answer) ? (
          <View style={st.answerBox}>
            <Text style={st.answerLabel}>THE EQUALIZER</Text>
            {answer ? <Text style={st.answerTxt}>{answer}</Text> : null}
            {asking ? <ActivityIndicator color={CYAN} style={{ marginTop: 8, alignSelf: 'flex-start' }} /> : null}
          </View>
        ) : null}
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>HUMAN FUNCTIONS</Text>
        {HUMAN.map((g, i) => renderGate(g, i, () => openRow(g)))}
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>SPECIES SAFETY</Text>
        {SPECIES.map((g, i) => renderGate(g, i, () => openRow(g)))}
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>RESTRICTED LAYERS · ARM TO ENABLE</Text>
        {RESTRICTED.map((g, i) => {
          const armed = !!armedLayers[g.title];
          const row = armed ? { ...g, chip: 'ARMED', chipColor: GREEN } : g;
          return renderGate(row, i, () => armLayer(g));
        })}
      </View>

      <Text style={st.foot}>Nothing passes without clearance.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  hero: { height: 230, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.5)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  ask: { margin: 14, borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, padding: 15 },
  askInput: { fontSize: 19, fontWeight: '800', color: '#8fd6ff', padding: 0 },
  askQ: { fontSize: 19, fontWeight: '800', color: '#8fd6ff' },
  askH: { fontSize: 11.5, color: MUT, marginTop: 4 },
  answerBox: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.10)', paddingTop: 12 },
  answerLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '700', color: CYAN, marginBottom: 6 },
  answerTxt: { fontSize: 13.5, color: INK, lineHeight: 20 },
  band: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE, alignItems: 'center' },
  bandLine: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  bandSub: { fontSize: 12, color: MUT, marginTop: 7, textAlign: 'center', lineHeight: 17 },
  section: { paddingHorizontal: 14, paddingTop: 16 },
  sectionH: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: FAINT, marginBottom: 11, marginLeft: 2 },
  empty: { fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  logBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.05)' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  logName: { fontSize: 13.5, fontWeight: '700', color: INK },
  logMeta: { fontSize: 10.5, color: FAINT, marginTop: 2 },
  logChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  logChipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  gate: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 10 },
  gateIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: 'rgba(27,184,255,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(27,184,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  gateIconTxt: { fontSize: 17, color: CYAN },
  gateName: { fontSize: 14, fontWeight: '700', color: INK },
  gateDesc: { fontSize: 11, color: MUT, marginTop: 2, lineHeight: 15 },
  gateChip: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6 },
  gateChipTxt: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, color: CYAN, marginTop: 18 },
});
