import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Pressable,
  TouchableOpacity, TextInput, Alert,
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
import { SLEEP_AID_OPTIONS } from '../../lib/device-catalog';
import { WASTE_CATALOG, reclaimTotal } from '../../lib/waste-audit';
import {
  getLiveReadout, getOuraToken, saveOuraToken, syncOura,
  importGarminExport, importStravaExport, getStackConsensus, getCoverage,
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

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = 'rgba(255,255,255,0.55)', FAINT = 'rgba(255,255,255,0.32)';
const LINE = 'rgba(255,255,255,0.10)', CYAN = '#1BB8FF', GREEN = '#34D399', GOLD = '#D4A847';
const RED = '#E24B4A', PINK = '#F472B6', YELLOW = '#F5C84B', PURPLE = '#AA44FF';

const PAGES = ['STEP 1 · THE DOOR', 'STEP 2 · CONTROL PANEL · FLOOD', 'STEP 3 · THE MEMBRANE · EDIT'];

// The known hardware stack — wire order. Key = normalized device id in
// device_connections.hardware. Dot colors follow the wire's live readout.
const DEVICES: { key: string; name: string; dot: string }[] = [
  { key: 'garmin_tactix_8', name: 'Garmin Tactix 8', dot: CYAN },
  { key: 'oura_ring_4',     name: 'Oura Ring 4',     dot: GREEN },
  { key: 'whoop_5_0',       name: 'WHOOP 5.0',       dot: '#7CE7C4' },
  { key: 'beats_pro_2',     name: 'Beats Pro 2',     dot: GOLD },
  { key: 'oakley_meta',     name: 'Oakley Meta',     dot: PURPLE },
  { key: 'muse_s_athena',   name: 'Muse S Athena',   dot: '#8fd6ff' },
  { key: 'strava',          name: 'Strava',          dot: '#5CD65C' },
];

const ACTIVITY_CHIPS = ['Hiking', 'Strength', 'Backcountry Ski', 'Trail Run', 'Cycling', 'Fly Fishing', 'Ranch Work'];
const HOBBY_CHIPS    = ['Woodworking', 'Sound Engineering', 'Cooking', 'Photography'];
const DIET_CHIPS     = ['Omnivore', 'Mediterranean', 'Keto', 'Paleo', 'Vegan'];
const ALLERGY_CHIPS  = ['Tree Nuts', 'Sesame', 'Sulfites', 'Shellfish'];
const TACTICAL_ORGS  = ['WADA', 'FEI', 'DoD', 'USADA'];

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function deviceName(key: string): string {
  const hit = DEVICES.find(d => d.key === norm(key));
  return hit ? hit.name : String(key);
}
const SOURCE_DOT: Record<string, string> = {
  garmin: CYAN, oura: GREEN, strava: '#5CD65C', whoop: '#7CE7C4', beats: GOLD, manual: '#8fd6ff',
};

function deviceDot(key: string): string {
  const hit = DEVICES.find(d => d.key === norm(key));
  return hit ? hit.dot : SOURCE_DOT[norm(key)] ?? CYAN;
}

// Device → biosignal source. The wire's metric per row comes from real rows
// in biosignal_readings — never staged numbers.
const DEVICE_SOURCE: Record<string, BiosignalSource> = {
  garmin_tactix_8: 'garmin', oura_ring_4: 'oura', strava: 'strava',
  whoop_5_0: 'whoop', beats_pro_2: 'beats',
};

function deviceMetric(key: string, readout: LiveReadout | null): string | null {
  const src = DEVICE_SOURCE[norm(key)];
  if (!src || !readout) return null;
  const r = readout.latest[src];
  if (!r) return null;
  if (src === 'garmin')  return r.hrv != null ? `${Math.round(Number(r.hrv))} HRV` : r.sleep != null ? `SLEEP ${Math.round(Number(r.sleep))}` : null;
  if (src === 'oura')    return r.readiness != null ? `${Math.round(Number(r.readiness))} RDY` : r.hrv != null ? `${Math.round(Number(r.hrv))} HRV` : null;
  if (src === 'strava')  return r.activity != null ? `${r.activity} mi` : null;
  if (src === 'whoop')   return r.readiness != null ? `RECOV ${Math.round(Number(r.readiness))}%` : null;
  if (src === 'beats')   return r.hrv != null ? `${Math.round(Number(r.hrv))}ms` : null;
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

const CHANNEL_COLORS = [CYAN, PINK, YELLOW, GREEN, PURPLE, GOLD];

export default function BioBuddyScreen() {
  const params = useLocalSearchParams<{ page?: string }>();
  const [profile, setProfile]   = useState<FullMemberProfile | null>(null);
  const [animals, setAnimals]   = useState<AnimalRow[]>([]);
  const [vault, setVault]       = useState<{ total: number } | null>(null);
  const [readout, setReadout]   = useState<LiveReadout | null>(null);
  const [consensus, setConsensus] = useState<StackConsensus | null>(null);
  const [coverage, setCoverage] = useState<Partial<Record<BiosignalSource, SourceCoverage>>>({});
  const [hasOuraToken, setHasOuraToken] = useState(false);
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

  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />;

  // ── SHARED SMALL RENDERERS ──────────────────────────────────────────────────
  const Chip = ({ label, sel, onPress, add }: { label: string; sel?: boolean; onPress?: () => void; add?: boolean }) => (
    <Pressable onPress={onPress} style={[st.chip, sel && st.chipSel, add && st.chipAdd]}>
      <Text style={[st.chipTxt, sel && { color: CYAN }, add && { color: MUT }]}>{label}</Text>
    </Pressable>
  );

  const AddInline = ({ section, field, current, subject }: { section: string; field: string; current: string[]; subject: string }) =>
    addInput?.section === section ? (
      <View style={st.addRow}>
        <TextInput
          style={st.addInput}
          value={addInput.value}
          onChangeText={v => setAddInput({ section, value: v })}
          placeholder="type and save…"
          placeholderTextColor={FAINT}
          autoFocus
        />
        <Pressable
          style={st.addSave}
          onPress={() => {
            const v = addInput.value.trim();
            if (v) write(field, [...current, v], subject);
            setAddInput(null);
          }}
        >
          <Text style={{ color: CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <View style={st.root}>
      <View style={st.pagerNav}>
        <View style={st.dotsRow}>
          {[0, 1, 2].map(i => (
            <TouchableOpacity key={i} onPress={() => goPage(i)}>
              <View style={[st.dot, page === i && [st.dotActive, { backgroundColor: CYAN }]]} />
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
              accent={CYAN}
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
                const connected = new Set(hardware.map(h => norm(h)));
                const extras = hardware.filter(h => !DEVICES.some(d => d.key === norm(h)));
                const rows = [
                  ...DEVICES.map(d => ({ key: d.key, on: connected.has(d.key) })),
                  ...extras.map(h => ({ key: h, on: true })),
                ];
                return rows.map(({ key, on }, i) => {
                  const metric = on ? deviceMetric(key, readout) : null;
                  const src = on ? DEVICE_SOURCE[norm(key)] : undefined;
                  return (
                    <Pressable key={i} onPress={on ? undefined : () => goPage(2)} style={st.readoutRow}>
                      <View style={[st.readoutDot, { backgroundColor: deviceDot(key), opacity: on ? 1 : 0.5 }]} />
                      <Text style={[st.readoutName, !on && { color: MUT }]}>{deviceName(key)}</Text>
                      <Sparkline values={on && src ? readout?.series[src] : undefined} color={deviceDot(key)} />
                      <Text style={[st.readoutVal, { color: on ? deviceDot(key) : FAINT }]}>
                        {on ? (metric ?? 'AWAITING SIGNAL') : 'CONNECT →'}
                      </Text>
                    </Pressable>
                  );
                });
              })()}
              {/* STACK COVERAGE — the anti-FOMO cross-reference (founder law
                  2026-08-03): an UPPER, not a downer. Whatever you own already
                  covers you; overlap is consensus, never waste. */}
              <Pressable
                onPress={() => router.push('/stack-coverage' as Href)}
                style={{ marginTop: 10, borderWidth: 1, borderColor: 'rgba(27,184,255,0.35)', backgroundColor: 'rgba(27,184,255,0.08)', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
              >
                <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
                  YOUR STACK HAS YOU COVERED →
                </Text>
              </Pressable>
            </View>

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
                          <View style={[st.readoutDot, { backgroundColor: deviceDot(v.source) }]} />
                          <Text style={st.consensusSrc}>{v.source.toUpperCase()}</Text>
                          <Text style={[st.consensusNum, { color: deviceDot(v.source) }]}>{v.label}</Text>
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

              <View style={[st.lifeCard, { borderLeftColor: CYAN }]}>
                <View style={st.lifeHead}>
                  <Text style={st.lifeName}>{profile?.name ?? 'You'}</Text>
                  <Text style={st.lifeRole}>SUBSCRIBER · BLUE</Text>
                </View>
                <View style={[st.lifeWave, { backgroundColor: CYAN + '55' }]} />
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
                    ? <View style={[st.tag, st.tagGreen]}><Text style={[st.tagTxt, { color: GREEN }]}>NO ALLERGIES</Text></View>
                    : allergens.map((a, i) => (
                      <View key={i} style={[st.tag, st.tagRed]}><Text style={[st.tagTxt, { color: RED }]}>{a.toUpperCase()}</Text></View>
                    ))}
                  {goals.length > 0 && (
                    <View style={[st.tag, st.tagCyan]}><Text style={[st.tagTxt, { color: CYAN }]}>GOAL · {goals[0].toUpperCase()}</Text></View>
                  )}
                  <View style={[st.tag, st.tagGold]}>
                    <Text style={[st.tagTxt, { color: GOLD }]}>COMMANDER · {commander ? 'ON' : 'OFF'}</Text>
                  </View>
                </View>
              </View>

              {protectees.map((who, i) => {
                const c = CHANNEL_COLORS[(i + 1) % CHANNEL_COLORS.length];
                return (
                  <View key={i} style={[st.lifeCard, { borderLeftColor: c }]}>
                    <View style={st.lifeHead}>
                      <Text style={st.lifeName}>{who}</Text>
                      <Text style={st.lifeRole}>
                        CHANNEL · {c === PINK ? 'PINK' : c === YELLOW ? 'YELLOW' : c === GREEN ? 'GREEN' : c === PURPLE ? 'PURPLE' : 'GOLD'}
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
                const c = CHANNEL_COLORS[(i + 3) % CHANNEL_COLORS.length];
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
                          <View key={j} style={[st.tag, st.tagRed]}><Text style={[st.tagTxt, { color: RED }]}>{s2.toUpperCase()}</Text></View>
                        ))
                        : <View style={[st.tag, st.tagGreen]}><Text style={[st.tagTxt, { color: GREEN }]}>FEED · CLEAR</Text></View>}
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
                <View key={i} style={[st.lifeCard, { borderLeftColor: GOLD }]}>
                  <View style={st.lifeHead}>
                    <Text style={st.lifeName}>{a.name ?? a.species}</Text>
                    <Text style={st.lifeRole}>{[a.species.toUpperCase(), a.breed?.toUpperCase()].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Text style={st.lifeMeta}>{a.ageNotes ?? 'herd baseline'}</Text>
                  <View style={st.tagRow}>
                    {a.sensitivities
                      ? <View style={[st.tag, st.tagRed]}><Text style={[st.tagTxt, { color: RED }]}>{a.sensitivities.toUpperCase()}</Text></View>
                      : <View style={[st.tag, st.tagGreen]}><Text style={[st.tagTxt, { color: GREEN }]}>FEED BATCH · CLEAR</Text></View>}
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
                  <Text style={[st.v, allergens.length ? { color: RED } : null]}>
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
                  <Text style={[st.tagTxt, { color: GOLD }]}>{aficionadoArmed ? 'OPT-IN · ARMED' : 'OPT-IN · OFF'}</Text>
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
                  const sel = hardware.some(h => norm(h) === d.key);
                  return (
                    <Chip
                      key={i} label={d.name} sel={sel}
                      onPress={() => write('wearables', toggleArr(hardware, d.name), `device:${d.name}`)}
                    />
                  );
                })}
                <Chip label="+ Add device" add onPress={() => setAddInput({ section: 'device', value: '' })} />
              </View>
              <AddInline section="device" field="wearables" current={hardware} subject="device:add" />
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

              {/* OURA — cloud API */}
              <View style={st.kvRow}>
                <Pressable
                  style={st.kv}
                  onPress={() => setAddInput({ section: 'oura_token', value: '' })}
                >
                  <Text style={st.k}>OURA RING 4 · CLOUD API</Text>
                  <Text style={[st.v, { color: hasOuraToken ? GREEN : CYAN }]}>
                    {hasOuraToken ? 'TOKEN ON THE MEMBRANE ✓ · tap to replace' : 'Paste personal token → nightly feed'}
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
                  <Text style={[st.v, { color: CYAN }]}>{syncing === 'oura' ? 'Syncing…' : 'Pull last 30 days →'}</Text>
                </Pressable>
              </View>
              {addInput?.section === 'oura_token' && (
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput}
                    value={addInput.value}
                    onChangeText={v => setAddInput({ section: 'oura_token', value: v })}
                    placeholder="paste your Oura personal access token…"
                    placeholderTextColor={FAINT}
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
                    <Text style={{ color: CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
                  </Pressable>
                </View>
              )}

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
                  <Text style={[st.v, { color: CYAN }]}>{syncing === 'garmin' ? 'Reading…' : 'Import export JSON →'}</Text>
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
                  <Text style={[st.v, { color: CYAN }]}>{syncing === 'strava' ? 'Reading…' : 'Import activities.csv →'}</Text>
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
                  <Text style={[st.scopenote, { color: GOLD }]}>
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
                    style={{ marginTop: 10, borderWidth: 1, borderColor: GOLD, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: wasteRerouted ? 0.55 : 1 }}>
                    <Text style={{ fontFamily: 'DMMono-Medium', fontSize: 11, letterSpacing: 1.5, color: GOLD }}>
                      {rerouting ? 'REROUTING…' : wasteRerouted ? `✓ REROUTED · $${reclaimTotal(wasteSel).toFixed(2)}/MO IN THE VAULT` : `REROUTE $${reclaimTotal(wasteSel).toFixed(2)}/MO → VAULT`}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* DIETARY APPROACH */}
            <View style={st.section}>
              <Text style={st.seclabel}>DIETARY APPROACH · single select</Text>
              <View style={st.chipRow}>
                {DIET_CHIPS.map((d, i) => {
                  const sel = diet.some(x => norm(x) === norm(d));
                  return (
                    <Chip
                      key={i} label={d} sel={sel}
                      onPress={() => write('dietary_approach', sel ? [] : [d], `diet:${d}`)}
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
                    placeholderTextColor={FAINT}
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
                    <Text style={{ color: CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
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
                  <Text style={[st.v, { color: meds ? INK : GREEN }]}>{meds || 'No Current Meds'}</Text>
                </Pressable>
                <Pressable style={st.kv} onPress={() => router.push('/biomarkers' as Href)}>
                  <Text style={st.k}>BYAR PRINTABLES</Text>
                  <Text style={[st.v, { color: CYAN }]}>Manage →</Text>
                </Pressable>
              </View>
              {addInput?.section === 'meds' && (
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput} value={addInput.value}
                    onChangeText={v => setAddInput({ section: 'meds', value: v })}
                    placeholder="current medications…" placeholderTextColor={FAINT} autoFocus
                  />
                  <Pressable style={st.addSave} onPress={() => { write('medications', addInput.value.trim(), 'medications'); setAddInput(null); }}>
                    <Text style={{ color: CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* RESTRICTED LAYERS · ARM TO ENABLE — law: deliberate action required */}
            <View style={st.section}>
              <Text style={[st.seclabel, { color: GOLD }]}>RESTRICTED LAYERS · ARM TO ENABLE</Text>

              {/* AFICIONADO */}
              <Pressable
                style={st.toggleRow}
                onPress={() => aficionadoArmed ? router.push('/aficionado' as Href) : armLayer('Aficionado')}
              >
                <Text style={st.toggleLbl}>Aficionado</Text>
                <View style={[st.tag, aficionadoArmed ? st.tagGold : st.tagGoldDim]}>
                  <Text style={[st.tagTxt, { color: GOLD }]}>{aficionadoArmed ? 'OPT-IN · ARMED' : 'OPT-IN · OFF'}</Text>
                </View>
              </Pressable>
              <View style={st.lockedBox}>
                <Text style={st.lockedLbl}>🔒 AFICIONADO · {aficionadoArmed ? 'ARMED' : 'LOCKED UNTIL ARMED'}</Text>
                <View style={st.chipRow}>
                  {['Strain & Leaf', 'Contaminant Screen', 'Dose', 'Interaction Check', 'Cigar Page'].map((c, i) => (
                    <View key={i} style={[st.chip, aficionadoArmed ? st.chipSel : st.chipLocked]}>
                      <Text style={[st.chipTxt, !aficionadoArmed && { color: FAINT }]}>{c}</Text>
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
                  <Text style={[st.tagTxt, { color: GOLD }]}>{commander ? 'ARMED' : 'OFF'}</Text>
                </View>
              </Pressable>
              <View style={st.lockedBox}>
                <Text style={st.lockedLbl}>🔒 TACTICAL · COMMANDER LAYER · {commander ? 'ARMED' : 'LOCKED'}</Text>
                <View style={st.chipRow}>
                  {['+ Tactical Unit', 'WADA', 'FEI', 'DoD', 'USADA', 'K9 ONLY'].map((c, i) => (
                    <View key={i} style={[st.chip, commander ? st.chipSel : st.chipLocked]}>
                      <Text style={[st.chipTxt, !commander && { color: FAINT }]}>{c}</Text>
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
              <View style={[st.saved, saveState === 'failed' && { borderColor: 'rgba(226,75,74,0.5)' }]}>
                <Text style={[
                  st.savedTxt,
                  saveState === 'failed' && { color: RED },
                  saveState === 'saving' && { color: MUT },
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

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  body: { flex: 1 },
  pagerNav: { paddingTop: 44, paddingBottom: 8, alignItems: 'center', backgroundColor: NAVY },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 18 },
  caption: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: CYAN },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)',
    borderRadius: 12, padding: 15,
  },
  askQ: { flex: 1, fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: '#8fd6ff' },
  askMic: { fontSize: 16, marginLeft: 8 },

  memberCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
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
  readoutName: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, flexBasis: 112, flexShrink: 1, minWidth: 74, marginRight: 4 },
  readoutWave: { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 10 },
  readoutVal: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 0.5 },

  lifeCard: {
    borderLeftWidth: 3, backgroundColor: 'rgba(255,255,255,0.04)',
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
  tagRed:   { backgroundColor: 'rgba(226,75,74,0.10)',  borderColor: 'rgba(226,75,74,0.45)' },
  tagGreen: { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.35)' },
  tagCyan:  { backgroundColor: 'rgba(27,184,255,0.10)', borderColor: 'rgba(27,184,255,0.35)' },
  tagGold:  { backgroundColor: 'rgba(212,168,71,0.10)', borderColor: 'rgba(212,168,71,0.40)' },
  tagGoldDim: { backgroundColor: 'rgba(212,168,71,0.05)', borderColor: 'rgba(212,168,71,0.25)' },
  tagTxt: { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipSel: { borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.10)' },
  chipAdd: { borderStyle: 'dashed', borderColor: 'rgba(27,184,255,0.35)' },
  chipLocked: { opacity: 0.45 },
  chipTxt: { fontFamily: 'DMSans-Regular', fontSize: 12.5, color: INK },

  addRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  addInput: {
    flex: 1, borderWidth: 0.5, borderColor: 'rgba(27,184,255,0.4)', borderRadius: 9,
    color: INK, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'DMSans-Regular', fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  addSave: { borderWidth: 0.5, borderColor: 'rgba(27,184,255,0.5)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },

  kvRow: { flexDirection: 'row', gap: 9, marginBottom: 9 },
  kv: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE, borderRadius: 12, padding: 13,
  },
  k: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1.3, color: FAINT },
  v: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, marginTop: 5, lineHeight: 18 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13,
  },
  toggleLbl: { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700', color: INK },

  aware: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(212,168,71,0.4)', backgroundColor: 'rgba(212,168,71,0.06)',
    borderRadius: 12, padding: 15,
  },
  awareLbl: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 2, color: GOLD },
  awareSub: { fontFamily: 'DMMono-Regular', fontSize: 7.5, letterSpacing: 1.5, color: FAINT, marginTop: 4 },
  awareVal: { fontFamily: 'BebasNeue-Regular', fontSize: 32, color: GOLD },

  action: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)',
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: '#8fd6ff' },

  doorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9,
  },
  doorChipTxt: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 1.5, color: INK },
  doorChipArr: { color: FAINT, fontSize: 13 },

  change: {
    flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)',
    borderRadius: 12, padding: 15,
  },
  changeQ: { fontFamily: 'DMSans-Regular', fontSize: 19, fontWeight: '800', color: '#8fd6ff', letterSpacing: 0.3 },
  changeSub: { fontFamily: 'DMSans-Regular', fontSize: 11.5, color: MUT, marginTop: 4 },

  saved: {
    borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)',
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  savedTxt: { fontFamily: 'DMMono-Medium', fontSize: 12, letterSpacing: 1.5, color: CYAN },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },

  lockedBox: {
    marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(212,168,71,0.25)',
    borderRadius: 12, padding: 12, backgroundColor: 'rgba(212,168,71,0.04)',
  },
  lockedLbl: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1.5, color: GOLD, marginBottom: 9 },
  scopenote: {
    fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 0.5, color: FAINT,
    lineHeight: 13, marginTop: 9,
  },

  consensusRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
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
