import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Pressable,
  TouchableOpacity, TextInput, Alert, Image,
} from 'react-native';
import PagerView, { type PagerRef } from '@/components/Pager';
import Svg, { Polyline } from 'react-native-svg';
import { useFocusEffect, useLocalSearchParams, router, type Href } from 'expo-router';
import DoorCover from '@/components/DoorCover';
import {
  loadMemberProfile, saveOnboardingField, saveAnimals, getAnimals,
  getVaultLedgerTotal, logMembraneEvent, getMembraneEvents,
  saveSleepAids, getSleepAids, logAwareDollarsFollowed,
  type FullMemberProfile, type AnimalRow,
} from '../../lib/db';
import { SLEEP_AID_OPTIONS, deviceKey as catalogDeviceKey, brandMarkFor } from '../../lib/device-catalog';
import { connectOura, disconnectOura } from '../../lib/ouraAuth';
import { connectProvider, disconnectProvider, connectionFor, type Connection, type ProviderKey } from '../../lib/oauth';
import { DIET_OPTIONS, toggleDietValue } from '../../lib/diet';
import { WASTE_CATALOG, reclaimTotal } from '../../lib/waste-audit';
import { TheRoom } from '@/components/TheRoom';
import { dl, lc, useTheme, type Tokens } from '@/lib/theme-mode';
import {
  getLiveReadout, getOuraToken, saveOuraToken, syncOura, syncWhoop, syncStrava,
  importGarminExport, importStravaExport, importOuraExport, importWhoopExport, getStackConsensus, getCoverage,
  type LiveReadout, type BiosignalSource, type StackConsensus, type SourceCoverage,
} from '../../lib/biosignals';

// ─────────────────────────────────────────────────────────────────────────────
// BIO BUDDY — Spoke 5 · The Nervous System · Intelligence 0X03
// Three faces, straight from the approved door HTML:
//   STEP 1 · THE DOOR              — vertical full-bleed cover
//   STEP 2 · CONTROL PANEL · FLOOD — sensing face, live, every life every signal
//   STEP 3 · THE MEMBRANE · EDIT   — acting face, every modifiable option
// Every string on these pages is the wire's string. Data is the member's own.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const pal = (T: Tokens) => ({
  NAVY: dl(T, '#0E1B33', '#F0EEE8'),
  INK: dl(T, '#E8EEF5', '#1a1a1a'),
  MUT: dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)'),
  FAINT: dl(T, 'rgba(255,255,255,0.32)', 'rgba(0,0,0,0.38)'),
  LINE: dl(T, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
  CYAN: dl(T, '#1BB8FF', '#2a7faa'),
  GREEN: dl(T, '#34D399', '#12795A'),
  GOLD: dl(T, '#D4A847', '#b8861e'),
  RED: dl(T, '#E24B4A', '#C0392B'),
  PINK: '#F472B6',
  YELLOW: '#F5C84B',
  PURPLE: '#AA44FF',
});

const PAGES = ['STEP 1 · THE DOOR', 'STEP 2 · CONTROL PANEL · FLOOD', 'STEP 3 · THE MEMBRANE · EDIT'];

// FULL STACK LAW (founder order 2026-08-14): the stack displays as a
// hierarchy of signal. THE PORT sits on top — the phone is a member of the
// chain, always shown, always active; on the web version it still shows,
// because off-grid the phone is the last node standing and the member must
// have always seen it as part of the stack. Below it the SIGNAL TIER in rank
// order: Crown → Tactix → WHOOP MG → Oura. Below them the PERIPHERAL TIER,
// ordered by body placement, never by price: Manta, then OZLO — which outranks
// the Beats because it reads EARS AND ROOM where the Beats read ears only —
// then Beats, the Metas apart (the Equalizer's eyes — ICE,
// silent rideshare escalation, live camera out), the Index BPM on the arm.
// Strava rides last — the software link. Medical-grade devices are the only
// tier above this stack — enterprise, parked. This is the skeleton.
// Key = normalized device id in device_connections.hardware.
const DEVICES: { key: string; name: string; dot: string; alt?: string; port?: boolean; condition?: boolean }[] = [
  // THE PORT
  { key: 'z_fold',           name: 'Samsung Z Fold · THE PORT',    dot: '#FFFFFF', port: true },
  // SIGNAL TIER — rank order
  { key: 'muse_s_athena',    name: 'Muse S Athena · THE CROWN',    dot: '#8fd6ff' },
  { key: 'garmin_tactix_8',  name: 'Garmin Tactix 8',              dot: '#1BB8FF' },
  { key: 'whoop_mg',         name: 'WHOOP MG 5.0',                 dot: '#7CE7C4', alt: 'whoop_5_0' },
  { key: 'oura_ring_4',      name: 'Oura Ring 4',                  dot: '#34D399' },
  // PERIPHERAL TIER — by body placement
  { key: 'manta_sound',      name: 'Manta Sound Sleep Mask',       dot: '#C9A0FF', condition: true },
  // OZLO SITS ABOVE THE BEATS. Founder order 2026-08-21: "the beats are just a
  // sponsor for ears — vs ears AND room." The Ozlo Smart Case is the only
  // instrument in the entire stack that reads the ROOM instead of the body:
  // temperature, light and noise, named by the manufacturer in its own guide.
  // Everything else here reads James. This one reads where James is.
  { key: 'ozlo_sleepbuds',   name: 'Ozlo Sleepbuds + Mask · ENVIRONMENT +', dot: '#4E96C8' },
  { key: 'beats_pro_2',      name: 'Beats Pro 2',                  dot: '#D4A847' },
  { key: 'oakley_meta',      name: 'Meta Oakley HSTN · THE EYES',  dot: '#AA44FF' },
  { key: 'garmin_index_bpm', name: 'Garmin Index BPM',             dot: '#57B8FF' },
  // SOFTWARE LINK
  { key: 'strava',           name: 'Strava',                       dot: '#5CD65C' },
];

const ACTIVITY_CHIPS = ['Hiking', 'Strength', 'Backcountry Ski', 'Trail Run', 'Cycling', 'Fly Fishing', 'Ranch Work'];
const HOBBY_CHIPS    = ['Woodworking', 'Sound Engineering', 'Cooking', 'Photography'];
const DIET_CHIPS     = DIET_OPTIONS;   // one source of truth — lib/diet.ts
const ALLERGY_CHIPS  = ['Tree Nuts', 'Sesame', 'Sulfites', 'Shellfish'];
const TACTICAL_ORGS  = ['WADA', 'FEI', 'DoD', 'USADA'];

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function deviceName(key: string): string {
  const hit = DEVICES.find(d => d.key === norm(key));
  return hit ? hit.name : String(key);
}

// CANON STORAGE LAW — see lib/device-catalog.ts. hardware[] holds KEYS; the
// name is only ever the label. This stack list carries its own display names
// ("WHOOP MG 5.0" where the catalog says "WHOOP MG"), so a stored value
// resolves against THIS list first — by key, by alt spelling, by normalized
// display name — and falls through to the catalog for everything else. Legacy
// rows that were written as names land on the device they always meant.
function deviceKeyOf(stored: string): string {
  const n = norm(stored);
  const local = DEVICES.find(d => d.key === n || d.alt === n || norm(d.name) === n);
  return local ? local.key : catalogDeviceKey(stored);
}
const SOURCE_DOT: Record<string, string> = {
  garmin: '#1BB8FF', oura: '#34D399', strava: '#5CD65C', whoop: '#7CE7C4', beats: '#D4A847', manual: '#8fd6ff',
};

/** The instrument's colour, resolved for the panel the member picked.
 *  ORIGIN_SOURCE: one instrument, one colour, both modes. */
function deviceDot(T: Tokens, key: string): string {
  const hit = DEVICES.find(d => d.key === norm(key));
  return lc(T, hit ? hit.dot : SOURCE_DOT[norm(key)] ?? '#1BB8FF');
}

// Device → biosignal source. The wire's metric per row comes from real rows
// in biosignal_readings — never staged numbers.
const DEVICE_SOURCE: Record<string, BiosignalSource> = {
  garmin_tactix_8: 'garmin', oura_ring_4: 'oura', strava: 'strava',
  whoop_5_0: 'whoop', whoop_mg: 'whoop', beats_pro_2: 'beats',
  // THE ROOM. Everything else in this map reads JAMES. This one reads WHERE
  // JAMES IS — and it does it whatever mask is on his face, because the buds go
  // under the Manta as readily as under the Ozlo. Founder, 2026-08-22:
  // "i will know room temp and my temp even if i wear the manta i use the OZLO
  //  to still read the room."
  ozlo_sleepbuds: 'ozlo',
};

function deviceMetric(key: string, readout: LiveReadout | null): string | null {
  // THE PORT: the phone is running this screen — active by definition, honest by definition.
  if (norm(key) === 'z_fold') return 'ACTIVE · PORT';
  // Manta adds no signal — it adds a CONDITION the membrane measures against (founder law 2026-08-01).
  if (norm(key) === 'manta_sound') return 'CONDITION ARMED';
  const src = DEVICE_SOURCE[norm(key)];
  if (!src || !readout) return null;
  const r = readout.latest[src];
  if (!r) return null;
  if (src === 'garmin')  return r.hrv != null ? `${Math.round(Number(r.hrv))} HRV` : r.sleep != null ? `SLEEP ${Math.round(Number(r.sleep))}` : null;
  if (src === 'oura')    return r.readiness != null ? `${Math.round(Number(r.readiness))} RDY` : r.hrv != null ? `${Math.round(Number(r.hrv))} HRV` : null;
  if (src === 'strava')  return r.activity != null ? `${r.activity} mi` : null;
  if (src === 'whoop')   return r.readiness != null ? `RECOV ${Math.round(Number(r.readiness))}%` : null;
  if (src === 'beats')   return r.hrv != null ? `${Math.round(Number(r.hrv))}ms` : null;
  // THE ROOM, in the member's own degrees. Absolute — it is a fact about the
  // room, not a deviation from him.
  if (src === 'ozlo')    return r.roomTempC != null ? `ROOM ${Number(r.roomTempC).toFixed(1)}°C` : null;
  return null;
}

function Sparkline({ values, color }: { values: number[] | undefined; color: string }) {
  const W = 120, H = 14;
  if (!values || values.length < 2) {
    return <View style={{ flex: 1, height: 2, borderRadius: 1, marginHorizontal: 10, backgroundColor: color + '55' }} />;
  }
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * W},${H - 2 - ((v - min) / span) * (H - 4)}`
  ).join(' ');
  return (
    <View style={{ flex: 1, marginHorizontal: 10 }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

// Membrane accuracy — how much of the membrane the member has filled in.
// Same fields the control panel renders. No mystery number.
function membraneAccuracy(p: FullMemberProfile | null, animals: AnimalRow[]): number {
  if (!p) return 0;
  const checks: boolean[] = [
    !!p.name, !!p.age, !!p.homeLocation,
    (p.hardware ?? []).length > 0,
    (p.activities ?? []).length > 0,
    (p.dietTypes ?? []).length > 0,
    (p.foodAllergens ?? []).length > 0 || (p.suspectedSensitivities ?? []).length > 0,
    p.medications !== undefined,
    p.sleepScore != null, !!p.stressLevel,
    (p.primaryGoal ?? []).length > 0,
    !!p.northStar30d, !!p.northStar90d,
    (p.speciesProtected ?? []).length > 0,
    animals.length > 0,
    (p.travelFrequency ?? []).length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

const CHANNEL_COLORS = ['#1BB8FF', '#F472B6', '#F5C84B', '#34D399', '#AA44FF', '#D4A847'];

export default function BioBuddyScreen() {
  const TH = useTheme();
  const st = useMemo(() => make_st(TH), [TH]);
  const C = pal(TH);

  const params = useLocalSearchParams<{ page?: string }>();
  const [profile, setProfile]   = useState<FullMemberProfile | null>(null);
  const [animals, setAnimals]   = useState<AnimalRow[]>([]);
  const [vault, setVault]       = useState<{ total: number } | null>(null);
  const [readout, setReadout]   = useState<LiveReadout | null>(null);
  const [consensus, setConsensus] = useState<StackConsensus | null>(null);
  const [coverage, setCoverage] = useState<Partial<Record<BiosignalSource, SourceCoverage>>>({});
  const [hasOuraToken, setHasOuraToken] = useState(false);
  // THE OURA PIPE — OAuth. Founder order 2026-08-21: "MAKE A PIPE."
  const [conns, setConns] = useState<Partial<Record<ProviderKey, Connection>>>({});
  const ouraConn = conns.oura ?? null;
  const [syncing, setSyncing]   = useState<string | null>(null);
  const [syncMsg, setSyncMsg]   = useState<string | null>(null);
  const [aficionadoArmed, setAficionadoArmed] = useState(false);
  const [sleepAids, setSleepAids] = useState<string[]>([]);
  const [wasteSel, setWasteSel] = useState<string[]>([]);
  const [wasteRerouted, setWasteRerouted] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]         = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [addInput, setAddInput] = useState<{ section: string; value: string } | null>(null);
  const pagerRef = useRef<PagerRef>(null);
  const jumped = useRef(false);

  const load = useCallback(async () => {
    const [p, an, v, events, live, tok, cons, covO, covG, covS, aids] = await Promise.all([
      loadMemberProfile(), getAnimals(), getVaultLedgerTotal(), getMembraneEvents(50),
      getLiveReadout(), getOuraToken(), getStackConsensus(),
      getCoverage('oura'), getCoverage('garmin'), getCoverage('strava'), getSleepAids(),
    ]);
    const [cO, cW, cS] = await Promise.all([
      connectionFor('oura'), connectionFor('whoop'), connectionFor('strava'),
    ]);
    setConns({ oura: cO, whoop: cW, strava: cS });
    setSleepAids(aids);
    setProfile(p); setAnimals(an); setVault(v);
    setReadout(live); setHasOuraToken(!!tok); setConsensus(cons);
    setCoverage({ oura: covO, garmin: covG, strava: covS });
    const afEvent = events.find(e => e.event_type === 'restricted_layer_armed' && e.subject === 'Aficionado');
    setAficionadoArmed(afEvent ? !!(afEvent.value?.armed ?? true) : false);
    const wasteEvent = events.find(e => e.event_type === 'waste_audit');
    if (wasteEvent?.value) {
      setWasteSel(Array.isArray(wasteEvent.value.selected) ? wasteEvent.value.selected : []);
      setWasteRerouted(!!wasteEvent.value.rerouted);
    }
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Deep link: /biobuddy?page=2 lands directly on THE MEMBRANE · EDIT.
    if (!jumped.current && params.page) {
      const target = parseInt(String(params.page), 10);
      if (!isNaN(target) && target >= 0 && target <= 2) {
        jumped.current = true;
        setTimeout(() => pagerRef.current?.setPage(target), 50);
      }
    }
  }, [load, params.page]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const goPage = (i: number) => pagerRef.current?.setPage(i);

  // ── WRITE PATH — every chip writes the same tables the panel reads ──────────
  const write = useCallback(async (field: string, value: any, subject: string) => {
    setSaveState('saving');
    const ok = await saveOnboardingField(field, value);
    logMembraneEvent({ eventType: 'membrane_edit', sourceScreen: 'biobuddy', subject, value: { field, value } });
    setSaveState(ok ? 'saved' : 'failed');
    if (ok) await load();
  }, [load]);

  const hardware   = profile?.hardware ?? [];
  const activities = profile?.activities ?? [];
  const diet       = profile?.dietTypes ?? [];
  const allergens  = profile?.foodAllergens ?? [];
  const meds       = profile?.medications ?? null;
  const goals      = profile?.primaryGoal ?? [];
  const protectees = profile?.speciesProtected ?? [];
  const commander  = !!profile?.commanderLayerActive;
  const acc        = membraneAccuracy(profile, animals);

  const activitySel = new Set(activities.map(norm));
  const toggleArr = (arr: string[], item: string) => {
    const present = arr.some(a => norm(a) === norm(item));
    return present ? arr.filter(a => norm(a) !== norm(item)) : [...arr, item];
  };

  // CANON STORAGE LAW: the stack writes KEYS. It also canonicalizes the whole
  // array on the way out, so any legacy name row already in the record heals
  // the next time the member touches a chip — no migration, no lost device.
  const canonHW = (list: string[]) => {
    const out: string[] = [];
    for (const h of list) { const k = deviceKeyOf(h); if (k && !out.includes(k)) out.push(k); }
    return out;
  };
  const toggleDevice = (key: string) =>
    write('wearables', toggleArr(canonHW(hardware), key), `device:${key}`);

  const pets = animals.filter(a => !/(horse|equine|cattle|cow|livestock|goat|sheep|pig)/i.test(a.species));
  const herd = animals.filter(a =>  /(horse|equine|cattle|cow|livestock|goat|sheep|pig)/i.test(a.species));

  // ARM TO ENABLE — restricted layers require deliberate action (law copy).
  const armLayer = (layer: string) => {
    Alert.alert(
      layer === 'Aficionado' ? 'ARM AFICIONADO?' : 'ARM TACTICAL · COMMANDER LAYER?',
      'This unlocks a restricted command system. Deliberate action required — it will not activate by accident.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'YES · ARM',
          onPress: async () => {
            setSaveState('saving');
            if (layer === 'Aficionado') {
              setAficionadoArmed(true);
              const ok = await logMembraneEvent({
                eventType: 'restricted_layer_armed', sourceScreen: 'biobuddy',
                subject: 'Aficionado', value: { armed: true },
              });
              setSaveState(ok ? 'saved' : 'failed');
            } else {
              const ok = await saveOnboardingField('commander_layer_active', true);
              logMembraneEvent({
                eventType: 'restricted_layer_armed', sourceScreen: 'biobuddy',
                subject: 'Tactical · Commander Layer', value: { armed: true },
              });
              setSaveState(ok ? 'saved' : 'failed');
              if (ok) await load();
            }
          },
        },
      ],
    );
  };

  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.CYAN} />;

  // ── SHARED SMALL RENDERERS ──────────────────────────────────────────────────
  const Chip = ({ label, sel, onPress, add }: { label: string; sel?: boolean; onPress?: () => void; add?: boolean }) => (
    <Pressable onPress={onPress} style={[st.chip, sel && st.chipSel, add && st.chipAdd]}>
      <Text style={[st.chipTxt, sel && { color: C.CYAN }, add && { color: C.MUT }]}>{label}</Text>
    </Pressable>
  );

  // `canon` — supplied only by the hardware stack, where the record stores keys
  // rather than the words the member typed (CANON STORAGE LAW).
  const AddInline = ({ section, field, current, subject, canon }: { section: string; field: string; current: string[]; subject: string; canon?: (list: string[]) => string[] }) =>
    addInput?.section === section ? (
      <View style={st.addRow}>
        <TextInput
          style={st.addInput}
          value={addInput.value}
          onChangeText={v => setAddInput({ section, value: v })}
          placeholder="type and save…"
          placeholderTextColor={C.FAINT}
          autoFocus
        />
        <Pressable
          style={st.addSave}
          onPress={() => {
            const v = addInput.value.trim();
            if (v) write(field, canon ? canon([...current, v]) : [...current, v], subject);
            setAddInput(null);
          }}
        >
          <Text style={{ color: C.CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <View style={st.root}>
      <View style={st.pagerNav}>
        <View style={st.dotsRow}>
          {[0, 1, 2].map(i => (
            <TouchableOpacity key={i} onPress={() => goPage(i)}>
              <View style={[st.dot, page === i && [st.dotActive, { backgroundColor: C.CYAN }]]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={st.caption}>{PAGES[page]}</Text>
      </View>

      <PagerView ref={pagerRef} style={{ flex: 1 }} initialPage={0} onPageSelected={e => setPage(e.nativeEvent.position)}>

        {/* ══ STEP 1 · THE DOOR ══ */}
        <View key="door" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ flexGrow: 1 }}>
            <DoorCover
              art={require('../../assets/doors/door-biobuddy.jpg')}
              intelChip="INTELLIGENCE 0X03"
              freeChip="FREE"
              roleLine="BIOMETRIC INTELLIGENCE · SIGNAL READER · THRESHOLD GUARD"
              titleLines={['BIO', 'BUDDY']}
              desc="The nervous system. The door to your Membrane — the one screen that holds every life, every signal, every truth under your care."
              withLabel="WITH BIO BUDDY"
              withText="Every scan reads YOUR baseline, family, pets, herd."
              withoutLabel="WITHOUT"
              withoutText="Generic truth. A blank chart."
              openLabel="Continue →"
              accent={C.CYAN}
              onOpen={() => goPage(1)}
            />
          </ScrollView>
        </View>

        {/* ══ STEP 2 · CONTROL PANEL · FLOOD ══ */}
        <View key="flood" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={refresh}>

            <View style={st.subhead}>
              <Pressable onPress={() => goPage(0)} hitSlop={8}>
                <Text style={st.subheadR}>← BACK</Text>
              </Pressable>
              <Text style={st.subheadL}>MEMBRANE LIVE</Text>
            </View>

            <Pressable style={st.ask} onPress={() => router.push('/(tabs)/concierge' as Href)}>
              <Text style={st.askQ}>How can I help you?</Text>
              <Text style={st.askMic}>🎤</Text>
            </Pressable>

            <View style={st.memberCard}>
              <View style={{ flex: 1 }}>
                <Text style={st.memberName}>{profile?.name ?? 'Your membrane'}</Text>
                <Text style={st.memberLoc}>
                  {[
                    profile?.homeLocation ? `📍 ${profile.homeLocation.toUpperCase()}` : null,
                    profile?.name === 'James Pitts' ? 'FOUNDER · CUSTOMER #1' : null,
                  ].filter(Boolean).join(' · ') || 'BUILD THE MEMBRANE TO FILL THIS CARD'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={st.memberPctL}>{acc}% ACCURACY</Text>
              </View>
            </View>

            {/* LIVE READOUT · FULL STACK */}
            <View style={st.section}>
              <Text style={st.seclabel}>LIVE READOUT · FULL STACK</Text>
              {!loaded ? (
                <Text style={st.empty}>Reading your stack…</Text>
              ) : (() => {
                // FOUNDER LAW (2026-08-01): the full stack ALWAYS shows.
                // Straight colored line when not connected · live waveform when
                // connected · NO BLANK STATE — that is not how you sell a product.
                // CANON STORAGE LAW: resolve every stored value to its key
                // before matching. Legacy name rows ("Muse S Athena · THE
                // CROWN") light their own device instead of rendering a second
                // time as an extra with nothing behind it.
                const connected = new Set(hardware.map(deviceKeyOf));
                const mantaOn = sleepAids.some(a => norm(a).includes('manta'));
                const extras = hardware.filter(h => !DEVICES.some(d => d.key === deviceKeyOf(h)));
                const rows = [
                  ...DEVICES.map(d => ({
                    key: d.key,
                    // FULL STACK LAW: THE PORT is always on (you are holding it);
                    // Manta arms as a condition via sleep aids; alt keys honor
                    // prior onboarding spellings (WHOOP 5.0 → WHOOP MG 5.0 row).
                    on: d.port
                      ? true
                      : d.condition
                        ? mantaOn
                        : connected.has(d.key) || (d.alt ? connected.has(d.alt) : false),
                  })),
                  ...extras.map(h => ({ key: h, on: true })),
                ];
                return rows.map(({ key, on }, i) => {
                  const metric = on ? deviceMetric(key, readout) : null;
                  const src = on ? DEVICE_SOURCE[norm(key)] : undefined;
                  // THE MARK (2026-09-03): the vendor's own mark beside the ORIGIN_SOURCE
                  // dot. The dot stays — one instrument, one colour, both modes. A brand
                  // whose file has not landed renders no mark, never a placeholder.
                  const mark = brandMarkFor(key);
                  return (
                    <Pressable key={i} onPress={on ? undefined : () => goPage(2)} style={st.readoutRow}>
                      <View style={[st.readoutDot, { backgroundColor: deviceDot(TH, key), opacity: on ? 1 : 0.5 }]} />
                      {mark ? <Image source={mark} style={[st.readoutMark, !on && { opacity: 0.5 }]} resizeMode="contain" /> : null}
                      <Text style={[st.readoutName, !on && { color: C.MUT }]}>{deviceName(key)}</Text>
                      <Sparkline values={on && src ? readout?.series[src] : undefined} color={deviceDot(TH, key)} />
                      <Text style={[st.readoutVal, { color: on ? deviceDot(TH, key) : C.FAINT }]}>
                        {on ? (metric ?? 'AWAITING SIGNAL') : 'CONNECT →'}
                      </Text>
                    </Pressable>
                  );
                });
              })()}
              {/* YOUR OWN RECORD — the baseline engine's face. Founder order
                  2026-08-21. The readout above is tonight. This is tonight
                  measured against every night you have ever recorded, in the
                  same part of the year, on the same instrument. */}
              <Pressable
                hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
                onPress={() => router.push('/baseline' as Href)}
                style={{ marginTop: 10, borderWidth: 2, borderColor: lc(TH, 'rgba(212,168,71,0.55)'), backgroundColor: lc(TH, 'rgba(212,168,71,0.14)'), borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
              >
                <Text style={{ color: C.GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
                  YOUR OWN RECORD · RANK TONIGHT →
                </Text>
              </Pressable>

              {/* STACK COVERAGE — the anti-FOMO cross-reference (founder law
                  2026-08-03): an UPPER, not a downer. Whatever you own already
                  covers you; overlap is consensus, never waste. */}
              <Pressable
                hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
                onPress={() => router.push('/stack-coverage' as Href)}
                style={{ marginTop: 10, borderWidth: 1, borderColor: lc(TH, 'rgba(27,184,255,0.35)'), backgroundColor: lc(TH, 'rgba(27,184,255,0.08)'), borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
              >
                <Text style={{ color: C.CYAN, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
                  YOUR STACK HAS YOU COVERED →
                </Text>
              </Pressable>

              {/* THE MEMBRANE — Biometric Resonant Mirroring (founder law
                  2026-08-19). The readout above is the numbers; this is the
                  same signal moving. The Crown lands here when the SDK does. */}
              <Pressable
                hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
                onPress={() => router.push('/membrane' as Href)}
                style={{ marginTop: 8, borderWidth: 1, borderColor: 'rgba(170,68,255,0.35)', backgroundColor: 'rgba(170,68,255,0.08)', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
              >
                <Text style={{ color: C.PURPLE, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
                  SEE IT MOVE · THE MEMBRANE →
                </Text>
              </Pressable>
            </View>

            {/* THE ROOM — the only card in Bio Buddy that measures the PLACE
                rather than the person. Founder order 2026-08-22: "you get the
                ozlo wired right so the temp can be shown that it comes up
                with." Added beside the stack, changing nothing above it. */}
            <TheRoom />

            {/* STACK CONSENSUS — same day · every device · one assessment */}
            {consensus?.day ? (
              <View style={st.section}>
                <Text style={st.seclabel}>STACK CONSENSUS · {consensus.day} · EVERY DEVICE</Text>
                {consensus.rows.map((row, i) => (
                  <View key={i} style={st.consensusRow}>
                    <Text style={st.consensusMetric}>{row.metric}</Text>
                    <View style={st.consensusVals}>
                      {row.values.map((v, j) => (
                        <View key={j} style={st.consensusVal}>
                          <View style={[st.readoutDot, { backgroundColor: deviceDot(TH, v.source) }]} />
                          <Text style={st.consensusSrc}>{v.source.toUpperCase()}</Text>
                          <Text style={[st.consensusNum, { color: deviceDot(TH, v.source) }]}>{v.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                {consensus.notes.map((n, i) => (
                  <Text key={i} style={st.consensusNote}>{n}</Text>
                ))}
              </View>
            ) : null}

            {/* FAMILY CHANNELS */}
            <View style={st.section}>
              <Text style={st.seclabel}>
                FAMILY CHANNELS{protectees.length > 0 ? ` · ${protectees.length + 1} LIVES` : ''}
              </Text>

              <View style={[st.lifeCard, { borderLeftColor: C.CYAN }]}>
                <View style={st.lifeHead}>
                  <Text style={st.lifeName}>{profile?.name ?? 'You'}</Text>
                  <Text style={st.lifeRole}>SUBSCRIBER · BLUE</Text>
                </View>
                <View style={[st.lifeWave, { backgroundColor: C.CYAN + '55' }]} />
                <Text style={st.lifeMeta}>
                  {[
                    profile?.age ? `${profile.age}` : null,
                    profile?.biologicalSex ? `${profile.biologicalSex.charAt(0).toUpperCase()}` : null,
                    profile?.sleepScore != null ? `sleep ${profile.sleepScore}/5` : null,
                    diet.length ? `dietary ${diet.join(' · ')}` : null,
                  ].filter(Boolean).join(' · ') || 'baseline forming'}
                </Text>
                <View style={st.tagRow}>
                  {allergens.length === 0
                    ? <View style={[st.tag, st.tagGreen]}><Text style={[st.tagTxt, { color: C.GREEN }]}>NO ALLERGIES</Text></View>
                    : allergens.map((a, i) => (
                      <View key={i} style={[st.tag, st.tagRed]}><Text style={[st.tagTxt, { color: C.RED }]}>{a.toUpperCase()}</Text></View>
                    ))}
                  {goals.length > 0 && (
                    <View style={[st.tag, st.tagCyan]}><Text style={[st.tagTxt, { color: C.CYAN }]}>GOAL · {goals[0].toUpperCase()}</Text></View>
                  )}
                  <View style={[st.tag, st.tagGold]}>
                    <Text style={[st.tagTxt, { color: C.GOLD }]}>COMMANDER · {commander ? 'ON' : 'OFF'}</Text>
                  </View>
                </View>
              </View>

              {protectees.map((who, i) => {
                const c = lc(TH, CHANNEL_COLORS[(i + 1) % CHANNEL_COLORS.length]);
                return (
                  <View key={i} style={[st.lifeCard, { borderLeftColor: c }]}>
                    <View style={st.lifeHead}>
                      <Text style={st.lifeName}>{who}</Text>
                      <Text style={st.lifeRole}>
                        CHANNEL · {c === C.PINK ? 'C.PINK' : c === C.YELLOW ? 'C.YELLOW' : c === C.GREEN ? 'C.GREEN' : c === C.PURPLE ? 'C.PURPLE' : 'C.GOLD'}
                      </Text>
                    </View>
                    <View style={[st.lifeWave, { backgroundColor: c + '55' }]} />
                    <Text style={st.lifeMeta}>awaiting baseline — add via Membrane</Text>
                  </View>
                );
              })}
              {protectees.length === 0 && loaded && (
                <Pressable onPress={() => goPage(2)}>
                  <Text style={st.empty}>One life on the channel. Add family via the Membrane — every life gets its own color.</Text>
                </Pressable>
              )}
            </View>

            {/* PETS · K9 / FELINE */}
            <View style={st.section}>
              <Text style={st.seclabel}>PETS · K9 / FELINE{pets.length ? ` · ${pets.length}` : ''}</Text>
              {pets.length === 0 ? (
                <Pressable onPress={() => goPage(2)}>
                  <Text style={st.empty}>No pets on the membrane. Add via + Pet — species toxicology arms the moment they land.</Text>
                </Pressable>
              ) : pets.map((a, i) => {
                const c = lc(TH, CHANNEL_COLORS[(i + 3) % CHANNEL_COLORS.length]);
                return (
                  <View key={i} style={[st.lifeCard, { borderLeftColor: c }]}>
                    <View style={st.lifeHead}>
                      <Text style={st.lifeName}>{a.name ?? a.species}</Text>
                      <Text style={st.lifeRole}>{[a.species.toUpperCase(), a.breed?.toUpperCase()].filter(Boolean).join(' · ')}</Text>
                    </View>
                    <Text style={st.lifeMeta}>{a.ageNotes ?? 'profile on file'}</Text>
                    <View style={st.tagRow}>
                      {a.sensitivities
                        ? a.sensitivities.split(/[,·]/).map(s2 => s2.trim()).filter(Boolean).map((s2, j) => (
                          <View key={j} style={[st.tag, st.tagRed]}><Text style={[st.tagTxt, { color: C.RED }]}>{s2.toUpperCase()}</Text></View>
                        ))
                        : <View style={[st.tag, st.tagGreen]}><Text style={[st.tagTxt, { color: C.GREEN }]}>FEED · CLEAR</Text></View>}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* AGRICULTURE · LIVESTOCK */}
            <View style={st.section}>
              <Text style={st.seclabel}>AGRICULTURE · LIVESTOCK{herd.length ? ' · HERD' : ''}</Text>
              {herd.length === 0 ? (
                <Pressable onPress={() => goPage(2)}>
                  <Text style={st.empty}>No herd on file. + Livestock opens herd baseline, feed safety, and mycotoxin watch.</Text>
                </Pressable>
              ) : herd.map((a, i) => (
                <View key={i} style={[st.lifeCard, { borderLeftColor: C.GOLD }]}>
                  <View style={st.lifeHead}>
                    <Text style={st.lifeName}>{a.name ?? a.species}</Text>
                    <Text style={st.lifeRole}>{[a.species.toUpperCase(), a.breed?.toUpperCase()].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Text style={st.lifeMeta}>{a.ageNotes ?? 'herd baseline'}</Text>
                  <View style={st.tagRow}>
                    {a.sensitivities
                      ? <View style={[st.tag, st.tagRed]}><Text style={[st.tagTxt, { color: C.RED }]}>{a.sensitivities.toUpperCase()}</Text></View>
                      : <View style={[st.tag, st.tagGreen]}><Text style={[st.tagTxt, { color: C.GREEN }]}>FEED BATCH · CLEAR</Text></View>}
                  </View>
                </View>
              ))}
            </View>

            {/* DIETARY · ALLERGIES */}
            <View style={st.section}>
              <Text style={st.seclabel}>DIETARY · ALLERGIES</Text>
              <View style={st.kvRow}>
                <View style={st.kv}>
                  <Text style={st.k}>DIETARY APPROACH</Text>
                  <Text style={st.v}>{diet.length ? diet.join(' · ') : 'Not set'}</Text>
                </View>
                <View style={st.kv}>
                  <Text style={st.k}>HOUSEHOLD ALLERGENS</Text>
                  <Text style={[st.v, allergens.length ? { color: C.RED } : null]}>
                    {allergens.length ? allergens.join(' · ') : 'None declared'}
                  </Text>
                </View>
              </View>
            </View>

            {/* AFICIONADO — opt-in, default OFF (law: restricted layer) */}
            <View style={st.section}>
              <Pressable style={st.toggleRow} onPress={() => router.push('/aficionado' as Href)}>
                <Text style={st.toggleLbl}>Aficionado</Text>
                <View style={[st.tag, aficionadoArmed ? st.tagGold : st.tagGoldDim]}>
                  <Text style={[st.tagTxt, { color: C.GOLD }]}>{aficionadoArmed ? 'OPT-IN · ARMED' : 'OPT-IN · OFF'}</Text>
                </View>
              </Pressable>
            </View>

            {/* AWARE DOLLARS */}
            <View style={st.section}>
              <View style={st.aware}>
                <View>
                  <Text style={st.awareLbl}>AWARE DOLLARS</Text>
                  <Text style={st.awareSub}>WHAT YOU SAVED</Text>
                </View>
                <Text style={st.awareVal}>${(vault?.total ?? 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={st.section}>
              <Pressable style={st.action} onPress={() => goPage(2)}>
                <Text style={st.actionTxt}>◆ OPEN MEMBRANE · EDIT EVERYTHING</Text>
                <Text style={[st.actionTxt, { marginLeft: 8 }]}>→</Text>
              </Pressable>
            </View>

            <Text style={st.note}>
              THE EVERYTHING-HUB. SENSING FACE — LIVE. TAP MEMBRANE TO CHANGE IT.
            </Text>
          </ScrollView>
        </View>

        {/* ══ STEP 3 · THE MEMBRANE · EDIT ══ */}
        <View key="edit" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={refresh}>

            <View style={st.subhead}>
              <Pressable onPress={() => goPage(1)} hitSlop={8}>
                <Text style={st.subheadR}>← BACK TO PANEL</Text>
              </Pressable>
              <Text style={st.subheadL}>ADD / SUBTRACT</Text>
            </View>

            <Pressable style={st.change} onPress={() => router.push('/(tabs)/onboarding?mode=edit' as Href)}>
              <View style={{ flex: 1 }}>
                <Text style={st.changeQ}>Change anything.</Text>
                <Text style={st.changeSub}>add a life, device, goal…</Text>
              </View>
              <Text style={st.askMic}>🎤</Text>
            </Pressable>

            {/* HARDWARE STACK */}
            <View style={st.section}>
              <View style={st.secHeadRow}>
                <Text style={st.seclabel}>HARDWARE STACK</Text>
                <Text style={st.secAdd}>+ ADD DEVICE</Text>
              </View>
              <View style={st.chipRow}>
                {DEVICES.map((d, i) => {
                  const sel = hardware.some(h => deviceKeyOf(h) === d.key);
                  return (
                    <Chip
                      key={i} label={d.name} sel={sel}
                      onPress={() => toggleDevice(d.key)}
                    />
                  );
                })}
                <Chip label="+ Add device" add onPress={() => setAddInput({ section: 'device', value: '' })} />
              </View>
              <AddInline section="device" field="wearables" current={hardware} subject="device:add" canon={canonHW} />
            </View>

            {/* CONNECT & SYNC — the device wire. Real feeds, honest states. */}
            <View style={st.section}>
              <Text style={st.seclabel}>CONNECT & SYNC · DEVICE WIRE</Text>
              {(['oura', 'garmin', 'strava'] as BiosignalSource[]).some(k => (coverage[k]?.days ?? 0) > 0) && (
                <Text style={st.empty}>
                  {(['oura', 'garmin', 'strava'] as BiosignalSource[])
                    .filter(k => (coverage[k]?.days ?? 0) > 0)
                    .map(k => `${k.toUpperCase()} · ${coverage[k]!.days} days on the membrane (${coverage[k]!.firstDate} → ${coverage[k]!.lastDate})`)
                    .join('\n')}
                  {'\n'}Re-imports never overlap — days already held are refreshed in place, never double-counted.
                </Text>
              )}

              {/* OURA — OAUTH. THE PIPE. Founder order 2026-08-21: "USE OURA'S
                  PIPE." The member taps CONNECT, Oura's own sign-in opens, the
                  member approves the scopes. No token is typed, none is stored
                  in a database column, and access is revocable from Oura's own
                  connected-applications page without touching AA2. */}
              <View style={st.kvRow}>
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('oura_oauth'); setSyncMsg(null);
                    const r = ouraConn?.connected
                      ? await disconnectOura()
                      : await connectOura();
                    setSyncMsg(`OURA — ${r.message}`);
                    setSyncing(null);
                    await load();
                  }}
                >
                  <Text style={st.k}>OURA RING 4 · CONNECT</Text>
                  <Text style={[st.v, { color: ouraConn?.connected ? C.GREEN : C.CYAN }]}>
                    {syncing === 'oura_oauth'
                      ? 'Opening Oura…'
                      : ouraConn?.connected
                        ? (ouraConn.canRefresh
                            ? 'Connected ✓ · renews itself · tap to disconnect'
                            : 'Connected ✓ · no refresh issued · tap to disconnect')
                        : 'Sign in with Oura → the ring feeds AA2'}
                  </Text>
                </Pressable>
              </View>

              {/* WHOOP — OAUTH + LIVE SYNC. Founder order 2026-08-21: "dont stop
                  until finished." WHOOP was archive-only until tonight — request
                  an export, wait for an email, download a zip. It is the only
                  instrument in this stack that ships SKIN TEMPERATURE and BLOOD
                  OXYGEN beside the sleep architecture, and now it ships them
                  nightly instead of on request. */}
              <View style={st.kvRow}>
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('whoop_oauth'); setSyncMsg(null);
                    const r = conns.whoop?.connected
                      ? await disconnectProvider('whoop')
                      : await connectProvider('whoop');
                    setSyncMsg(`WHOOP — ${r.message}`);
                    setSyncing(null);
                    await load();
                  }}
                >
                  <Text style={st.k}>WHOOP MG · CONNECT</Text>
                  <Text style={[st.v, { color: conns.whoop?.connected ? C.GREEN : C.CYAN }]}>
                    {syncing === 'whoop_oauth'
                      ? 'Opening WHOOP…'
                      : conns.whoop?.connected
                        ? (conns.whoop.canRefresh
                            ? 'Connected ✓ · renews itself · tap to disconnect'
                            : 'Connected ✓ · no refresh issued · tap to disconnect')
                        : 'Sign in with WHOOP → the strap feeds AA2'}
                  </Text>
                </Pressable>
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('whoop'); setSyncMsg(null);
                    const r = await syncWhoop();
                    setSyncMsg(`WHOOP — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>SYNC NOW</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>
                    {syncing === 'whoop' ? 'Syncing…' : 'Pull the missing nights →'}
                  </Text>
                </Pressable>
              </View>

              {/* STRAVA — OAUTH + LIVE SYNC. The catalog claimed "Strava API +
                  activities.csv (wired in-app)". The audit found only the CSV
                  half existed. This is the other half. Both lanes land on MILES
                  so they can be compared honestly instead of by accident. */}
              <View style={st.kvRow}>
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('strava_oauth'); setSyncMsg(null);
                    const r = conns.strava?.connected
                      ? await disconnectProvider('strava')
                      : await connectProvider('strava');
                    setSyncMsg(`STRAVA — ${r.message}`);
                    setSyncing(null);
                    await load();
                  }}
                >
                  <Text style={st.k}>STRAVA · CONNECT</Text>
                  <Text style={[st.v, { color: conns.strava?.connected ? C.GREEN : C.CYAN }]}>
                    {syncing === 'strava_oauth'
                      ? 'Opening Strava…'
                      : conns.strava?.connected
                        ? 'Connected ✓ · renews itself · tap to disconnect'
                        : 'Sign in with Strava → activities feed AA2'}
                  </Text>
                </Pressable>
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('strava'); setSyncMsg(null);
                    const r = await syncStrava();
                    setSyncMsg(`STRAVA — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>SYNC NOW</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>
                    {syncing === 'strava' ? 'Syncing…' : 'Pull the missing days →'}
                  </Text>
                </Pressable>
              </View>

              {/* OURA — cloud API */}
              <View style={st.kvRow}>
                <Pressable
                  style={st.kv}
                  onPress={() => setAddInput({ section: 'oura_token', value: '' })}
                >
                  <Text style={st.k}>OURA RING 4 · PASTED TOKEN</Text>
                  <Text style={[st.v, { color: hasOuraToken ? C.GREEN : C.FAINT }]}>
                    {hasOuraToken
                      ? 'Legacy token on the membrane ✓ · tap to replace'
                      : 'Legacy lane — Oura no longer issues these. Use CONNECT.'}
                  </Text>
                </Pressable>
                <Pressable
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('oura'); setSyncMsg(null);
                    const r = await syncOura();
                    setSyncMsg(`OURA — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>SYNC NOW</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>{syncing === 'oura' ? 'Syncing…' : 'Pull last 30 days →'}</Text>
                </Pressable>
              </View>
              {addInput?.section === 'oura_token' && (
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput}
                    value={addInput.value}
                    onChangeText={v => setAddInput({ section: 'oura_token', value: v })}
                    placeholder="paste your Oura personal access token…"
                    placeholderTextColor={C.FAINT}
                    autoFocus
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={st.addSave}
                    onPress={async () => {
                      const tok = addInput.value.trim();
                      setAddInput(null);
                      if (!tok) return;
                      setSyncing('oura'); setSyncMsg(null); setSaveState('saving');
                      const ok = await saveOuraToken(tok);
                      if (!ok) {
                        setSaveState('failed');
                        setSyncMsg('OURA — token rejected by Oura. Check it at cloud.ouraring.com → personal access tokens.');
                        setSyncing(null);
                        return;
                      }
                      setHasOuraToken(true); setSaveState('saved');
                      const r = await syncOura();
                      setSyncMsg(`OURA — ${r.message}`);
                      setSyncing(null);
                      if (r.ok) await load();
                    }}
                  >
                    <Text style={{ color: C.CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
                  </Pressable>
                </View>
              )}

              {/* OURA ACCOUNT EXPORT — THE ARCHIVE LANE.
                  The cloud API needs a token Oura no longer issues. The export
                  carries the SAME field names, so the full night arrives either
                  way and the junk drawer is the onramp. */}
              <View style={st.kvRow}>
                <Pressable
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('oura_export'); setSyncMsg(null);
                    const r = await importOuraExport();
                    setSyncMsg(`OURA EXPORT — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>OURA ACCOUNT EXPORT</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>
                    {syncing === 'oura_export' ? 'Reading…' : 'Import App Data CSVs →'}
                  </Text>
                </Pressable>
              </View>

              {/* WHOOP ACCOUNT EXPORT — physiological_cycles.csv is the one
                  row in the stack carrying skin temp AND blood oxygen beside
                  the sleep architecture. */}
              <View style={st.kvRow}>
                <Pressable
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('whoop_export'); setSyncMsg(null);
                    const r = await importWhoopExport();
                    setSyncMsg(`WHOOP EXPORT — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>WHOOP ACCOUNT EXPORT</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>
                    {syncing === 'whoop_export' ? 'Reading…' : 'Import cycles CSV →'}
                  </Text>
                </Pressable>
              </View>

              {/* GARMIN + STRAVA — official account exports */}
              <View style={st.kvRow}>
                <Pressable
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('garmin'); setSyncMsg(null);
                    const r = await importGarminExport();
                    setSyncMsg(`GARMIN — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>GARMIN TACTIX 8</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>{syncing === 'garmin' ? 'Reading…' : 'Import export JSON →'}</Text>
                </Pressable>
                <Pressable
                  style={st.kv}
                  onPress={async () => {
                    if (syncing) return;
                    setSyncing('strava'); setSyncMsg(null);
                    const r = await importStravaExport();
                    setSyncMsg(`STRAVA — ${r.message}`);
                    setSyncing(null);
                    if (r.ok) await load();
                  }}
                >
                  <Text style={st.k}>STRAVA</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>{syncing === 'strava' ? 'Reading…' : 'Import activities.csv →'}</Text>
                </Pressable>
              </View>

              {syncMsg ? <Text style={st.empty}>{syncMsg}</Text> : null}
            </View>

            {/* ACTIVITIES */}
            <View style={st.section}>
              <Text style={st.seclabel}>ACTIVITIES · tap to add / remove</Text>
              <View style={st.chipRow}>
                {ACTIVITY_CHIPS.map((a, i) => (
                  <Chip
                    key={i} label={a} sel={activitySel.has(norm(a))}
                    onPress={() => write('activities', toggleArr(activities, a), `activity:${a}`)}
                  />
                ))}
                <Chip label="+ Add" add onPress={() => setAddInput({ section: 'activity', value: '' })} />
              </View>
              <AddInline section="activity" field="activities" current={activities} subject="activity:add" />
            </View>

            {/* SLEEP AIDS · PASSIVE GEAR (founder law 2026-08-01) — a passive
                aid adds no signal, it adds a CONDITION: the ring and strap
                measure every night; the mask splits the member's own history
                into mask nights and bare nights. No medical claims — the only
                claim carried is the verified one: blocking light during sleep
                supports deeper, more restorative sleep. */}
            <View style={st.section}>
              <Text style={st.seclabel}>SLEEP AIDS · tap to add / remove</Text>
              <View style={st.chipRow}>
                {SLEEP_AID_OPTIONS.filter(s => s !== 'None').map((s, i) => {
                  const sel = sleepAids.some(x => norm(x) === norm(s));
                  return (
                    <Chip
                      key={i} label={s} sel={sel}
                      onPress={async () => {
                        setSaveState('saving');
                        const next = sel ? sleepAids.filter(x => norm(x) !== norm(s)) : [...sleepAids, s];
                        setSleepAids(next);
                        const ok = await saveSleepAids(next);
                        setSaveState(ok ? 'saved' : 'failed');
                      }}
                    />
                  );
                })}
              </View>
              <Text style={st.scopenote}>
                Adds no signal — adds a condition. Your devices measure every night; the mask splits your history into mask nights and bare nights, and the membrane shows the difference with receipts.
              </Text>
            </View>

            {/* SPENDING LOAD · WASTE AUDIT — Waste-to-Dreams doctrine (locked
                2026-08-01). Canon v17: the Equalizer owns subscription waste
                identification; the Chauffeur owns savings rerouting. Version
                One: no bank permissions — the member declares, the Equalizer
                names the overlap, the reroute writes REAL vault_ledger rows.
                The redirect earns the discount. */}
            <View style={st.section}>
              <Text style={st.seclabel}>SPENDING LOAD · WASTE AUDIT</Text>
              <View style={st.chipRow}>
                {WASTE_CATALOG.map((w, i) => {
                  const sel = wasteSel.includes(w.key);
                  return (
                    <Chip
                      key={i} label={`${w.name} · $${w.monthly.toFixed(2)}`} sel={sel}
                      onPress={() => {
                        const next = sel ? wasteSel.filter(k => k !== w.key) : [...wasteSel, w.key];
                        setWasteSel(next); setWasteRerouted(false);
                        logMembraneEvent({ eventType: 'waste_audit', sourceScreen: 'biobuddy', subject: 'waste_audit:select', value: { selected: next, rerouted: false } });
                      }}
                    />
                  );
                })}
              </View>
              {wasteSel.length > 0 && (
                <>
                  <Text style={[st.scopenote, { color: C.GOLD }]}>
                    RECLAIMABLE · ${reclaimTotal(wasteSel).toFixed(2)}/MO — the membrane already does these jobs, personally. Cancel them, and this exact spend flows to your Vision Board instead.
                  </Text>
                  <Pressable
                    disabled={rerouting || wasteRerouted}
                    onPress={async () => {
                      setRerouting(true);
                      let ok = true;
                      for (const k of wasteSel) {
                        const w = WASTE_CATALOG.find(x => x.key === k);
                        if (!w) continue;
                        const r = await logAwareDollarsFollowed({
                          productName: w.name,
                          recommendation: w.replacedBy,
                          amountSaved: w.monthly,
                          source: 'waste_audit',
                        });
                        ok = ok && r;
                      }
                      await logMembraneEvent({ eventType: 'waste_audit', sourceScreen: 'biobuddy', subject: 'waste_audit:reroute', value: { selected: wasteSel, rerouted: ok, monthly: reclaimTotal(wasteSel) } });
                      setWasteRerouted(ok);
                      setRerouting(false);
                      if (ok) await load();
                    }}
                    style={{ marginTop: 10, borderWidth: 1, borderColor: C.GOLD, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: wasteRerouted ? 0.55 : 1 }}>
                    <Text style={{ fontFamily: 'DMMono-Medium', fontSize: 11, letterSpacing: 1.5, color: C.GOLD }}>
                      {rerouting ? 'REROUTING…' : wasteRerouted ? `✓ REROUTED · $${reclaimTotal(wasteSel).toFixed(2)}/MO IN THE VAULT` : `REROUTE $${reclaimTotal(wasteSel).toFixed(2)}/MO → VAULT`}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* DIETARY APPROACH */}
            <View style={st.section}>
              <Text style={st.seclabel}>DIETARY APPROACH · tap to add / remove</Text>
              <View style={st.chipRow}>
                {DIET_CHIPS.map((d, i) => {
                  const sel = diet.some(x => norm(x) === norm(d));
                  return (
                    <Chip
                      key={i} label={d} sel={sel}
                      // Multi-select, and never destructive: tapping one diet used
                      // to REPLACE the whole array, silently wiping every other
                      // answer the member gave at the door. Halal and Mediterranean
                      // are not mutually exclusive — lib/diet.ts holds the rule.
                      onPress={() => write('dietary_approach', toggleDietValue(diet, d), `diet:${d}`)}
                    />
                  );
                })}
              </View>
            </View>

            {/* ALLERGIES & SENSITIVITIES */}
            <View style={st.section}>
              <Text style={st.seclabel}>ALLERGIES & SENSITIVITIES</Text>
              <View style={st.chipRow}>
                {ALLERGY_CHIPS.map((a, i) => {
                  const sel = allergens.some(x => norm(x) === norm(a));
                  return (
                    <Chip
                      key={i} label={a} sel={sel}
                      onPress={() => write('food_allergies', toggleArr(allergens, a), `allergen:${a}`)}
                    />
                  );
                })}
                <Chip label="+ Add" add onPress={() => setAddInput({ section: 'allergen', value: '' })} />
              </View>
              <AddInline section="allergen" field="food_allergies" current={allergens} subject="allergen:add" />
            </View>

            {/* FAMILY · PETS · LIVESTOCK */}
            <View style={st.section}>
              <Text style={st.seclabel}>FAMILY · PETS · LIVESTOCK</Text>
              <View style={st.chipRow}>
                {protectees.map((f, i) => (
                  <Chip key={`f${i}`} label={f} sel onPress={() => write('species_protected', toggleArr(protectees, f), `family:${f}`)} />
                ))}
                {animals.map((a, i) => (
                  <Chip
                    key={`a${i}`}
                    label={[a.name ?? a.species, a.breed].filter(Boolean).join(' · ')}
                    sel
                    onPress={async () => {
                      setSaveState('saving');
                      const remaining = animals.filter((_, j) => j !== i)
                        .map(x => ({ species: x.species, name: x.name ?? undefined, breed: x.breed ?? undefined, ageNotes: x.ageNotes ?? undefined }));
                      const ok = await saveAnimals(remaining);
                      logMembraneEvent({ eventType: 'membrane_edit', sourceScreen: 'biobuddy', subject: `animal:remove:${a.name ?? a.species}` });
                      setSaveState(ok ? 'saved' : 'failed');
                      if (ok) await load();
                    }}
                  />
                ))}
                <Chip label="+ Family" add onPress={() => setAddInput({ section: 'family', value: '' })} />
                <Chip label="+ Pet" add onPress={() => setAddInput({ section: 'pet', value: '' })} />
                <Chip label="+ Livestock" add onPress={() => setAddInput({ section: 'livestock', value: '' })} />
              </View>
              <AddInline section="family" field="species_protected" current={protectees} subject="family:add" />
              {(addInput?.section === 'pet' || addInput?.section === 'livestock') && (
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput}
                    value={addInput.value}
                    onChangeText={v => setAddInput({ section: addInput.section, value: v })}
                    placeholder={addInput.section === 'pet' ? 'name · species · breed  (e.g. Bear · canine · lab)' : 'name · species · head count'}
                    placeholderTextColor={C.FAINT}
                    autoFocus
                  />
                  <Pressable
                    style={st.addSave}
                    onPress={async () => {
                      const parts = addInput.value.split('·').map(s => s.trim()).filter(Boolean);
                      if (parts.length) {
                        setSaveState('saving');
                        const next = [
                          ...animals.map(x => ({ species: x.species, name: x.name ?? undefined, breed: x.breed ?? undefined, ageNotes: x.ageNotes ?? undefined })),
                          {
                            species: parts[1] ?? (addInput.section === 'pet' ? 'canine' : 'livestock'),
                            name: parts[0], breed: parts[2] ?? undefined,
                          },
                        ];
                        const ok = await saveAnimals(next);
                        logMembraneEvent({ eventType: 'membrane_edit', sourceScreen: 'biobuddy', subject: `animal:add:${parts[0]}` });
                        setSaveState(ok ? 'saved' : 'failed');
                        if (ok) await load();
                      }
                      setAddInput(null);
                    }}
                  >
                    <Text style={{ color: C.CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* MEDICATIONS · HEALTH RECORDS */}
            <View style={st.section}>
              <Text style={st.seclabel}>MEDICATIONS · HEALTH RECORDS</Text>
              <View style={st.kvRow}>
                <Pressable style={st.kv} onPress={() => setAddInput({ section: 'meds', value: meds ?? '' })}>
                  <Text style={st.k}>MEDICATIONS</Text>
                  <Text style={[st.v, { color: meds ? C.INK : C.GREEN }]}>{meds || 'No Current Meds'}</Text>
                </Pressable>
                <Pressable style={st.kv} onPress={() => router.push('/biomarkers' as Href)}>
                  <Text style={st.k}>BYAR PRINTABLES</Text>
                  <Text style={[st.v, { color: C.CYAN }]}>Manage →</Text>
                </Pressable>
              </View>
              {addInput?.section === 'meds' && (
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput} value={addInput.value}
                    onChangeText={v => setAddInput({ section: 'meds', value: v })}
                    placeholder="current medications…" placeholderTextColor={C.FAINT} autoFocus
                  />
                  <Pressable style={st.addSave} onPress={() => { write('medications', addInput.value.trim(), 'medications'); setAddInput(null); }}>
                    <Text style={{ color: C.CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* RESTRICTED LAYERS · ARM TO ENABLE — law: deliberate action required */}
            <View style={st.section}>
              <Text style={[st.seclabel, { color: C.GOLD }]}>RESTRICTED LAYERS · ARM TO ENABLE</Text>

              {/* AFICIONADO */}
              <Pressable
                style={st.toggleRow}
                onPress={() => aficionadoArmed ? router.push('/aficionado' as Href) : armLayer('Aficionado')}
              >
                <Text style={st.toggleLbl}>Aficionado</Text>
                <View style={[st.tag, aficionadoArmed ? st.tagGold : st.tagGoldDim]}>
                  <Text style={[st.tagTxt, { color: C.GOLD }]}>{aficionadoArmed ? 'OPT-IN · ARMED' : 'OPT-IN · OFF'}</Text>
                </View>
              </Pressable>
              <View style={st.lockedBox}>
                <Text style={st.lockedLbl}>🔒 AFICIONADO · {aficionadoArmed ? 'ARMED' : 'LOCKED UNTIL ARMED'}</Text>
                <View style={st.chipRow}>
                  {['Strain & Leaf', 'Contaminant Screen', 'Dose', 'Interaction Check', 'Cigar Page'].map((c, i) => (
                    <View key={i} style={[st.chip, aficionadoArmed ? st.chipSel : st.chipLocked]}>
                      <Text style={[st.chipTxt, !aficionadoArmed && { color: C.FAINT }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* TACTICAL · COMMANDER LAYER */}
              <Pressable
                style={[st.toggleRow, { marginTop: 10 }]}
                onPress={() => commander ? write('commander_layer_active', false, 'commander_layer:disarm') : armLayer('Tactical · Commander Layer')}
              >
                <Text style={st.toggleLbl}>Tactical · Commander Layer</Text>
                <View style={[st.tag, commander ? st.tagGold : st.tagGoldDim]}>
                  <Text style={[st.tagTxt, { color: C.GOLD }]}>{commander ? 'ARMED' : 'OFF'}</Text>
                </View>
              </Pressable>
              <View style={st.lockedBox}>
                <Text style={st.lockedLbl}>🔒 TACTICAL · COMMANDER LAYER · {commander ? 'ARMED' : 'LOCKED'}</Text>
                <View style={st.chipRow}>
                  {['+ Tactical Unit', 'WADA', 'FEI', 'DoD', 'USADA', 'K9 ONLY'].map((c, i) => (
                    <View key={i} style={[st.chip, commander ? st.chipSel : st.chipLocked]}>
                      <Text style={[st.chipTxt, !commander && { color: C.FAINT }]}>{c}</Text>
                    </View>
                  ))}
                </View>
                <Text style={st.scopenote}>
                  SEPARATE PANEL SET · DISTINCT LOOK. HAS THE FULL SYSTEM EXCEPT species / ag / Chef / Chauffeur / Equine. Within species: K9 ONLY. Built after everything else is wired.
                </Text>
              </View>
            </View>

            {/* SAVE CONFIRMATION — real state, never decoration */}
            <View style={st.section}>
              <View style={[st.saved, saveState === 'failed' && { borderColor: lc(TH, 'rgba(226,75,74,0.5)') }]}>
                <Text style={[
                  st.savedTxt,
                  saveState === 'failed' && { color: C.RED },
                  saveState === 'saving' && { color: C.MUT },
                ]}>
                  {saveState === 'failed'
                    ? '◆ NOT SAVED — THE MEMBRANE DID NOT HOLD'
                    : saveState === 'saving'
                    ? '◆ WRITING TO THE MEMBRANE…'
                    : '◆ THE MEMBRANE HOLDS · SAVED LIVE ✓'}
                </Text>
              </View>
            </View>

            <Text style={st.note}>
              ACTING FACE. EVERY CHANGE WRITES THE SAME TABLES THE PANEL READS. THE NERVOUS SYSTEM.
            </Text>
          </ScrollView>
        </View>
      </PagerView>
    </View>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_st = (T: Tokens) => {
  const { NAVY, INK, MUT, FAINT, LINE, CYAN, GREEN, GOLD, RED, PINK, YELLOW, PURPLE } = pal(T);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  body: { flex: 1 },
  pagerNav: { paddingTop: 44, paddingBottom: 8, alignItems: 'center', backgroundColor: NAVY },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: dl(T, 'rgba(255,255,255,0.25)', 'rgba(0,0,0,0.18)') },
  dotActive: { width: 18 },
  caption: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: CYAN },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 6,
    borderWidth: 1, borderColor: dl(T, 'rgba(27,184,255,0.5)', 'rgba(42,127,170,0.5)'), backgroundColor: dl(T, 'rgba(27,184,255,0.06)', 'rgba(42,127,170,0.06)'),
    borderRadius: 12, padding: 15,
  },
  askQ: { flex: 1, fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: dl(T, '#8fd6ff', '#1f6a90') },
  askMic: { fontSize: 16, marginLeft: 8 },

  memberCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 6,
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 14,
  },
  memberName: { fontFamily: 'DMSans-Regular', fontSize: 19, fontWeight: '800', color: INK },
  memberLoc: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: MUT, marginTop: 5 },
  memberPct: { fontFamily: 'BebasNeue-Regular', fontSize: 30, color: CYAN },
  memberPctL: { fontFamily: 'DMMono-Regular', fontSize: 7.5, letterSpacing: 1, color: FAINT },

  section: { paddingHorizontal: 14, paddingTop: 16 },
  secHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seclabel: { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 2, color: FAINT, marginBottom: 10, textTransform: 'uppercase' },
  secAdd: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: CYAN, marginBottom: 10 },
  empty: { fontFamily: 'DMSans-Regular', fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 6, lineHeight: 17 },

  readoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE },
  readoutDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  readoutMark: { width: 20, height: 20, borderRadius: 4, marginRight: 8 },
  readoutName: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, flexBasis: 112, flexShrink: 1, minWidth: 74, marginRight: 4 },
  readoutWave: { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 10 },
  readoutVal: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 0.5 },

  lifeCard: {
    borderLeftWidth: 3, backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),
    borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13, marginBottom: 10,
  },
  lifeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lifeName: { fontFamily: 'DMSans-Regular', fontSize: 15, fontWeight: '800', color: INK },
  lifeRole: { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1.5, color: MUT },
  lifeWave: { height: 2, borderRadius: 1, marginVertical: 9 },
  lifeMeta: { fontFamily: 'DMSans-Regular', fontSize: 11.5, color: MUT, lineHeight: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  tag: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5 },
  tagRed:   { backgroundColor: dl(T, 'rgba(226,75,74,0.10)', 'rgba(192,57,43,0.10)'),  borderColor: dl(T, 'rgba(226,75,74,0.45)', 'rgba(192,57,43,0.45)') },
  tagGreen: { backgroundColor: dl(T, 'rgba(52,211,153,0.12)', 'rgba(18,121,90,0.12)'), borderColor: dl(T, 'rgba(52,211,153,0.35)', 'rgba(18,121,90,0.35)') },
  tagCyan:  { backgroundColor: dl(T, 'rgba(27,184,255,0.10)', 'rgba(42,127,170,0.10)'), borderColor: dl(T, 'rgba(27,184,255,0.35)', 'rgba(42,127,170,0.35)') },
  tagGold:  { backgroundColor: dl(T, 'rgba(212,168,71,0.10)', 'rgba(184,134,30,0.10)'), borderColor: dl(T, 'rgba(212,168,71,0.40)', 'rgba(184,134,30,0.40)') },
  tagGoldDim: { backgroundColor: dl(T, 'rgba(212,168,71,0.05)', 'rgba(184,134,30,0.05)'), borderColor: dl(T, 'rgba(212,168,71,0.25)', 'rgba(184,134,30,0.25)') },
  tagTxt: { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
    borderWidth: 0.5, borderColor: dl(T, 'rgba(255,255,255,0.16)', 'rgba(0,0,0,0.12)'), backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),
  },
  chipSel: { borderColor: dl(T, 'rgba(27,184,255,0.5)', 'rgba(42,127,170,0.5)'), backgroundColor: dl(T, 'rgba(27,184,255,0.10)', 'rgba(42,127,170,0.10)') },
  chipAdd: { borderStyle: 'dashed', borderColor: dl(T, 'rgba(27,184,255,0.35)', 'rgba(42,127,170,0.35)') },
  chipLocked: { opacity: 0.45 },
  chipTxt: { fontFamily: 'DMSans-Regular', fontSize: 12.5, color: INK },

  addRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  addInput: {
    flex: 1, borderWidth: 0.5, borderColor: dl(T, 'rgba(27,184,255,0.4)', 'rgba(42,127,170,0.4)'), borderRadius: 9,
    color: INK, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'DMSans-Regular', fontSize: 13,
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),
  },
  addSave: { borderWidth: 0.5, borderColor: dl(T, 'rgba(27,184,255,0.5)', 'rgba(42,127,170,0.5)'), borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },

  kvRow: { flexDirection: 'row', gap: 9, marginBottom: 9 },
  kv: {
    flex: 1, backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE, borderRadius: 12, padding: 13,
  },
  k: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1.3, color: FAINT },
  v: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, marginTop: 5, lineHeight: 18 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13,
  },
  toggleLbl: { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700', color: INK },

  aware: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: dl(T, 'rgba(212,168,71,0.4)', 'rgba(184,134,30,0.4)'), backgroundColor: dl(T, 'rgba(212,168,71,0.06)', 'rgba(184,134,30,0.06)'),
    borderRadius: 12, padding: 15,
  },
  awareLbl: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 2, color: GOLD },
  awareSub: { fontFamily: 'DMMono-Regular', fontSize: 7.5, letterSpacing: 1.5, color: FAINT, marginTop: 4 },
  awareVal: { fontFamily: 'BebasNeue-Regular', fontSize: 32, color: GOLD },

  action: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: dl(T, 'rgba(27,184,255,0.5)', 'rgba(42,127,170,0.5)'), backgroundColor: dl(T, 'rgba(27,184,255,0.06)', 'rgba(42,127,170,0.06)'),
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: dl(T, '#8fd6ff', '#1f6a90') },

  doorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 0.5, borderColor: dl(T, 'rgba(255,255,255,0.16)', 'rgba(0,0,0,0.12)'), backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),
    borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9,
  },
  doorChipTxt: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 1.5, color: INK },
  doorChipArr: { color: FAINT, fontSize: 13 },

  change: {
    flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 4,
    borderWidth: 1, borderColor: dl(T, 'rgba(27,184,255,0.5)', 'rgba(42,127,170,0.5)'), backgroundColor: dl(T, 'rgba(27,184,255,0.06)', 'rgba(42,127,170,0.06)'),
    borderRadius: 12, padding: 15,
  },
  changeQ: { fontFamily: 'DMSans-Regular', fontSize: 19, fontWeight: '800', color: dl(T, '#8fd6ff', '#1f6a90'), letterSpacing: 0.3 },
  changeSub: { fontFamily: 'DMSans-Regular', fontSize: 11.5, color: MUT, marginTop: 4 },

  saved: {
    borderWidth: 1, borderColor: dl(T, 'rgba(27,184,255,0.5)', 'rgba(42,127,170,0.5)'), backgroundColor: dl(T, 'rgba(27,184,255,0.06)', 'rgba(42,127,170,0.06)'),
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  savedTxt: { fontFamily: 'DMMono-Medium', fontSize: 12, letterSpacing: 1.5, color: CYAN },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },

  lockedBox: {
    marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: dl(T, 'rgba(212,168,71,0.25)', 'rgba(184,134,30,0.25)'),
    borderRadius: 12, padding: 12, backgroundColor: dl(T, 'rgba(212,168,71,0.04)', 'rgba(184,134,30,0.04)'),
  },
  lockedLbl: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1.5, color: GOLD, marginBottom: 9 },
  scopenote: {
    fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 0.5, color: FAINT,
    lineHeight: 13, marginTop: 9,
  },

  consensusRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'), borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  consensusMetric: { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.5, color: MUT, width: 78 },
  consensusVals: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' },
  consensusVal: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  consensusSrc: { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1, color: FAINT },
  consensusNum: { fontFamily: 'BebasNeue-Regular', fontSize: 19 },
  consensusNote: {
    fontFamily: 'CormorantGaramond-Italic', fontStyle: 'italic', fontSize: 13.5,
    color: MUT, lineHeight: 19, marginTop: 6, paddingHorizontal: 2,
  },
});
};

