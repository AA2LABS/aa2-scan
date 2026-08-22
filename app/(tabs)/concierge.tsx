import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, RefreshControl,
  Image, Alert, Share,
} from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DoorCover from '@/components/DoorCover';
import { loadMemberProfile, buildPersonalTruth, logMembraneEvent, getMembraneEvents, type FullMemberProfile } from '../../lib/db';
import { streamClaude } from '../../lib/claude-stream';
import { conciergeVoice, VOICE_MODEL } from '../../lib/voices';

import { dl, useTheme, type Tokens } from '@/lib/theme-mode';
// ─────────────────────────────────────────────────────────────────────────────
// THE CONCIERGE — Intelligence 0X01 · The Voice · Broca's Area
// Door first, then the function list — every string from the approved door HTML.
// Javier speaks live. Rows seed the ask. No dead ends.
// ─────────────────────────────────────────────────────────────────────────────

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
  MUT: dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)'),
  FAINT: dl(T, 'rgba(255,255,255,0.32)', 'rgba(0,0,0,0.38)'),
  LINE: dl(T, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
  GOLD: dl(T, '#D4A847', '#b8861e'),
});

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

// ── VISION BOARD · Surface 3 (wire law: FLAG-TILES · SHARE · UPLOAD) ─────────
// Type a country → its flag tile becomes the cover. Tiles persist as
// membrane_events — the board rebuilds from the member's own event stream.
const COUNTRY_ISO: Record<string, string> = {
  'panama': 'PA', 'costa rica': 'CR', 'mexico': 'MX', 'canada': 'CA',
  'united states': 'US', 'usa': 'US', 'brazil': 'BR', 'argentina': 'AR',
  'colombia': 'CO', 'peru': 'PE', 'chile': 'CL', 'ecuador': 'EC',
  'guatemala': 'GT', 'belize': 'BZ', 'honduras': 'HN', 'nicaragua': 'NI',
  'el salvador': 'SV', 'dominican republic': 'DO', 'jamaica': 'JM',
  'bahamas': 'BS', 'cuba': 'CU', 'france': 'FR', 'spain': 'ES',
  'portugal': 'PT', 'italy': 'IT', 'germany': 'DE', 'switzerland': 'CH',
  'austria': 'AT', 'netherlands': 'NL', 'belgium': 'BE',
  'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'scotland': 'GB',
  'ireland': 'IE', 'iceland': 'IS', 'norway': 'NO', 'sweden': 'SE',
  'denmark': 'DK', 'finland': 'FI', 'poland': 'PL', 'czech republic': 'CZ',
  'greece': 'GR', 'croatia': 'HR', 'turkey': 'TR', 'morocco': 'MA',
  'egypt': 'EG', 'south africa': 'ZA', 'kenya': 'KE', 'tanzania': 'TZ',
  'nigeria': 'NG', 'ghana': 'GH', 'israel': 'IL', 'united arab emirates': 'AE',
  'uae': 'AE', 'saudi arabia': 'SA', 'qatar': 'QA', 'india': 'IN',
  'nepal': 'NP', 'thailand': 'TH', 'vietnam': 'VN', 'cambodia': 'KH',
  'philippines': 'PH', 'indonesia': 'ID', 'malaysia': 'MY', 'singapore': 'SG',
  'japan': 'JP', 'south korea': 'KR', 'china': 'CN', 'taiwan': 'TW',
  'hong kong': 'HK', 'australia': 'AU', 'new zealand': 'NZ', 'fiji': 'FJ',
  'monaco': 'MC', 'luxembourg': 'LU', 'hungary': 'HU', 'romania': 'RO',
  'ukraine': 'UA', 'russia': 'RU',
};
const LANG_ISO: Record<string, string> = {
  'spanish': 'ES', 'french': 'FR', 'italian': 'IT', 'german': 'DE',
  'portuguese': 'PT', 'japanese': 'JP', 'mandarin': 'CN', 'chinese': 'CN',
  'korean': 'KR', 'arabic': 'SA', 'hebrew': 'IL', 'russian': 'RU',
  'hindi': 'IN', 'thai': 'TH', 'vietnamese': 'VN', 'dutch': 'NL',
  'greek': 'GR', 'turkish': 'TR', 'polish': 'PL', 'swedish': 'SE',
  'norwegian': 'NO', 'danish': 'DK', 'tagalog': 'PH', 'swahili': 'KE',
  'english': 'GB',
};
function isoFlag(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}
function countryFlag(name: string): string {
  const k = name.trim().toLowerCase();
  const iso = COUNTRY_ISO[k] ?? (/^[a-z]{2}$/i.test(k) ? k.toUpperCase() : null);
  return iso ? isoFlag(iso) : '🏳️';
}
function langFlag(name: string): string {
  const iso = LANG_ISO[name.trim().toLowerCase()];
  return iso ? isoFlag(iso) : '🏳️';
}
type TripTile = { name: string; flag: string; cover?: string };
type LangTile = { name: string; flag: string };
function deriveBoard(events: any[]): { trips: TripTile[]; langs: LangTile[] } {
  const trips = new Map<string, TripTile>();
  const langs = new Map<string, LangTile>();
  // events arrive newest-first — fold oldest-first so removals land correctly
  for (const e of [...events].reverse()) {
    const s = String(e?.subject ?? '').trim();
    if (!s) continue;
    const key = s.toLowerCase();
    switch (e?.event_type) {
      case 'vision_trip_added':   trips.set(key, { name: s, flag: countryFlag(s) }); break;
      case 'vision_trip_removed': trips.delete(key); break;
      case 'vision_trip_cover': {
        const t = trips.get(key);
        const uri = e?.value?.uri ?? e?.value?.coverUri;
        if (t && uri) trips.set(key, { ...t, cover: String(uri) });
        break;
      }
      case 'vision_lang_added':   langs.set(key, { name: s, flag: langFlag(s) }); break;
      case 'vision_lang_removed': langs.delete(key); break;
    }
  }
  return { trips: [...trips.values()], langs: [...langs.values()] };
}

export default function ConciergeScreen() {
  const T = useTheme();
  const st = useMemo(() => makeSt(T), [T]);
  const C = pal(T);

  const [doorOpen, setDoorOpen] = useState(false);
  const [profile, setProfile] = useState<FullMemberProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [surface, setSurface] = useState<'hub' | 'vision'>('hub');
  const [trips, setTrips] = useState<TripTile[]>([]);
  const [langs, setLangs] = useState<LangTile[]>([]);
  const [tripInput, setTripInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    setProfile(await loadMemberProfile());
    const board = deriveBoard(await getMembraneEvents(300));
    setTrips(board.trips); setLangs(board.langs);
  }, []);
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
        system: `${conciergeVoice(profile?.conciergePersonality)}${truth ? `\n\n${truth}` : ''}`,
        content: q,
        max_tokens: 700,
        model: VOICE_MODEL,
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

  // ── VISION BOARD actions — type a country → flag tile populates ────────────
  const addTrip = () => {
    const name = tripInput.trim();
    if (!name) return;
    if (trips.some(t => t.name.toLowerCase() === name.toLowerCase())) { setTripInput(''); return; }
    setTrips(t => [...t, { name, flag: countryFlag(name) }]);
    setTripInput('');
    logMembraneEvent({ eventType: 'vision_trip_added', sourceScreen: 'concierge_vision_board', subject: name });
  };
  const removeTrip = (name: string) => {
    Alert.alert(name, 'Remove this trip tile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setTrips(t => t.filter(x => x.name !== name));
        logMembraneEvent({ eventType: 'vision_trip_removed', sourceScreen: 'concierge_vision_board', subject: name });
      } },
    ]);
  };
  const addLang = () => {
    const name = langInput.trim();
    if (!name) return;
    if (langs.some(l => l.name.toLowerCase() === name.toLowerCase())) { setLangInput(''); return; }
    setLangs(l => [...l, { name, flag: langFlag(name) }]);
    setLangInput('');
    logMembraneEvent({ eventType: 'vision_lang_added', sourceScreen: 'concierge_vision_board', subject: name });
  };
  const removeLang = (name: string) => {
    Alert.alert(name, 'Remove this language tile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setLangs(l => l.filter(x => x.name !== name));
        logMembraneEvent({ eventType: 'vision_lang_removed', sourceScreen: 'concierge_vision_board', subject: name });
      } },
    ]);
  };
  const shareBoard = async () => {
    const msg = [
      'MY AA2 VISION BOARD',
      trips.length ? `TRIPS · ${trips.map(t => `${t.flag} ${t.name}`).join(' · ')}` : null,
      langs.length ? `LANGUAGES · ${langs.map(l => `${l.flag} ${l.name}`).join(' · ')}` : null,
    ].filter(Boolean).join('\n');
    try { await Share.share({ message: msg }); } catch { /* member closed the sheet */ }
    logMembraneEvent({ eventType: 'vision_board_shared', sourceScreen: 'concierge_vision_board' });
  };
  const uploadCover = async () => {
    if (trips.length === 0) {
      Alert.alert('Vision Board', 'Add a trip first — its flag carries the tile until you upload a cover.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    const uri = res.assets[0].uri;
    const target = trips[trips.length - 1];
    setTrips(t => t.map(x => x.name === target.name ? { ...x, cover: uri } : x));
    logMembraneEvent({ eventType: 'vision_trip_cover', sourceScreen: 'concierge_vision_board', subject: target.name, value: { uri } });
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
          accent={C.GOLD}
          onOpen={() => setDoorOpen(true)}
        />
      </ScrollView>
    );
  }

  // ── SURFACE 3 · VISION BOARD · FLAG-TILES · SHARE · UPLOAD (wire law) ──────
  if (surface === 'vision') {
    return (
      <ScrollView
        style={st.root}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.GOLD} />}
      >
        <View style={st.subhead}>
          <Pressable onPress={() => setSurface('hub')} hitSlop={8}>
            <Text style={st.subheadR}>← BACK</Text>
          </Pressable>
          <Text style={st.subheadL}>VISION BOARD</Text>
        </View>

        <View style={st.vbTop}>
          <Text style={st.vbTopLbl}>GOALS · TRIPS · LANGUAGE</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={st.vbBtn} onPress={shareBoard}><Text style={st.vbBtnTxt}>⚲ SHARE</Text></Pressable>
            <Pressable style={st.vbBtn} onPress={uploadCover}><Text style={st.vbBtnTxt}>↑ UPLOAD</Text></Pressable>
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.fntitle}>TRIPS & TRAVEL   · type a country → flag tile populates</Text>
          <View style={st.tileGrid}>
            {trips.map((t, i) => (
              <Pressable
                key={i}
                style={st.tile}
                onPress={() => router.push('/(tabs)/chauffeur' as Href)}
                onLongPress={() => removeTrip(t.name)}
              >
                {t.cover
                  ? <Image source={{ uri: t.cover }} style={st.tileCover} resizeMode="cover" />
                  : <View style={st.tileFlagBox}><Text style={st.tileFlag}>{t.flag}</Text></View>}
                <Text style={st.tileName}>{t.name}</Text>
                <Text style={st.tileSub}>{t.flag} PLAN DOSSIER →</Text>
              </Pressable>
            ))}
            <View style={[st.tile, st.tileDashed]}>
              <Text style={st.tileAddPlus}>+</Text>
              <TextInput
                style={st.tileInput}
                value={tripInput}
                onChangeText={setTripInput}
                placeholder="ADD A TRIP"
                placeholderTextColor={C.FAINT}
                onSubmitEditing={addTrip}
                returnKeyType="done"
              />
              <Text style={st.tileSubFaint}>→ TRAVEL ENGINE</Text>
            </View>
          </View>
          <Text style={st.vbNote}>
            Type the country → its flag tile becomes the cover → "Let's plan your Dossier" → hands to the
            white-labeled Travel engine → completed Dossier reflects back into goals every time you open the board.
          </Text>
        </View>

        <View style={st.section}>
          <Text style={st.fntitle}>ADD LANGUAGE TO LEARN   · flag = tile cover</Text>
          <View style={st.tileGrid}>
            {langs.map((l, i) => (
              <Pressable
                key={i}
                style={st.tile}
                onPress={() => {
                  setSurface('hub');
                  runQuery(`Start my ${l.name} learning path — survival relevance first: labels, menus, allergen words, safety phrases.`);
                }}
                onLongPress={() => removeLang(l.name)}
              >
                <View style={st.tileFlagBox}><Text style={st.tileFlag}>{l.flag}</Text></View>
                <Text style={st.tileName}>{l.name}</Text>
                <Text style={st.tileSub}>→ LEARNING CENTER</Text>
              </Pressable>
            ))}
            <View style={[st.tile, st.tileDashed]}>
              <Text style={st.tileAddPlus}>+</Text>
              <TextInput
                style={st.tileInput}
                value={langInput}
                onChangeText={setLangInput}
                placeholder="ADD LANGUAGE"
                placeholderTextColor={C.FAINT}
                onSubmitEditing={addLang}
                returnKeyType="done"
              />
              <Text style={st.tileSubFaint}>(flag tile)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.GOLD} />}
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
            placeholderTextColor={C.FAINT}
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
          {asking && !answer ? <ActivityIndicator color={C.GOLD} /> : null}
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
        <Text style={st.fntitle}>SURFACES · HELD BY THE CONCIERGE</Text>
        <Pressable style={st.fnrow} onPress={() => setSurface('vision')}>
          <Text style={st.ico}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.txt}>Vision Board</Text>
            <Text style={st.sub}>GOALS · TRIPS · LANGUAGE · flag-tiles · share · upload</Text>
          </View>
          <Text style={st.arr}>›</Text>
        </Pressable>
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

const makeSt = (T: Tokens) => {
  const { NAVY, INK, MUT, FAINT, LINE, GOLD } = pal(T);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: GOLD },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    margin: 14, marginBottom: 6, borderWidth: 1, borderColor: dl(T, 'rgba(212,168,71,0.5)', 'rgba(184,134,30,0.5)'),
    backgroundColor: dl(T, 'rgba(212,168,71,0.06)', 'rgba(184,134,30,0.06)'), borderRadius: 12, padding: 15,
  },
  askQ: { fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: dl(T, '#e8c887', '#8A6410') },
  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  askInput: { flex: 1, color: INK, fontFamily: 'DMSans-Regular', fontSize: 13, paddingVertical: 4 },

  answer: {
    marginHorizontal: 14, marginBottom: 4, backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),
    borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 14,
  },
  answerTxt: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, lineHeight: 19 },

  section: { paddingHorizontal: 14, paddingTop: 14 },
  fntitle: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, color: GOLD, marginBottom: 10 },
  fnrow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13, marginBottom: 9,
  },
  ico: { fontSize: 16 },
  txt: { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700', color: INK },
  sub: { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 0.3, color: MUT, marginTop: 3, lineHeight: 14 },
  arr: { color: FAINT, fontSize: 17 },

  action: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: dl(T, 'rgba(212,168,71,0.5)', 'rgba(184,134,30,0.5)'), backgroundColor: dl(T, 'rgba(212,168,71,0.08)', 'rgba(184,134,30,0.08)'),
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: dl(T, '#e8c887', '#8A6410') },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },

  // ── VISION BOARD · flag tiles ──────────────────────────────────────────────
  vbTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12,
  },
  vbTopLbl: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 1.5, color: MUT },
  vbBtn: {
    borderWidth: 1, borderColor: dl(T, 'rgba(212,168,71,0.5)', 'rgba(184,134,30,0.5)'), backgroundColor: dl(T, 'rgba(212,168,71,0.08)', 'rgba(184,134,30,0.08)'),
    borderRadius: 9, paddingVertical: 7, paddingHorizontal: 12,
  },
  vbBtnTxt: { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.2, color: dl(T, '#e8c887', '#8A6410') },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '47.5%', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderRadius: 12, padding: 10, overflow: 'hidden',
  },
  tileDashed: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: dl(T, 'rgba(27,184,255,0.45)', 'rgba(42,127,170,0.45)'),
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', minHeight: 132,
  },
  tileCover: { width: '100%', height: 76, borderRadius: 8, marginBottom: 8 },
  tileFlagBox: {
    width: '100%', height: 76, borderRadius: 8, marginBottom: 8,
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), alignItems: 'center', justifyContent: 'center',
  },
  tileFlag: { fontSize: 40 },
  tileName: { fontFamily: 'DMSans-Regular', fontSize: 13.5, fontWeight: '700', color: INK },
  tileSub: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: dl(T, '#e8c887', '#8A6410'), marginTop: 4 },
  tileSubFaint: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT, marginTop: 4 },
  tileAddPlus: { fontSize: 26, color: dl(T, '#1BB8FF', '#2a7faa'), marginBottom: 2 },
  tileInput: {
    fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 1, color: INK,
    textAlign: 'center', paddingVertical: 4, minWidth: 110,
  },
  vbNote: {
    fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 0.5, color: FAINT,
    lineHeight: 15, marginTop: 12,
  },
});
};
