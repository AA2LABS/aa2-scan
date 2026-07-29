import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Pressable,
  TouchableOpacity, TextInput, Switch,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useFocusEffect, useLocalSearchParams, router, type Href } from 'expo-router';
import DoorCover from '@/components/DoorCover';
import {
  loadMemberProfile, saveOnboardingField, saveAnimals, getAnimals,
  getVaultLedgerTotal, logMembraneEvent, getMembraneEvents,
  type FullMemberProfile, type AnimalRow,
} from '../../lib/db';

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

const ACTIVITY_CHIPS = ['Hiking', 'Strength', 'Backcountry Ski', 'Trail Run', 'Cycling', 'Yoga', 'Fly Fishing', 'Ranch Work'];
const HOBBY_CHIPS    = ['Woodworking', 'Sound Engineering', 'Cooking', 'Photography'];
const DIET_CHIPS     = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean', 'Halal', 'Kosher', 'Gluten-Free'];
const ALLERGY_CHIPS  = ['Tree Nuts', 'Sesame', 'Sulfites', 'Shellfish', 'Gluten', 'Dairy'];
const TACTICAL_ORGS  = ['WADA', 'FEI', 'DoD', 'USADA'];

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function deviceName(key: string): string {
  const hit = DEVICES.find(d => d.key === norm(key));
  return hit ? hit.name : String(key);
}
function deviceDot(key: string): string {
  const hit = DEVICES.find(d => d.key === norm(key));
  return hit ? hit.dot : CYAN;
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
  const [cannabisOn, setCannabisOn] = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]         = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [addInput, setAddInput] = useState<{ section: string; value: string } | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const jumped = useRef(false);

  const load = useCallback(async () => {
    const [p, an, v, events] = await Promise.all([
      loadMemberProfile(), getAnimals(), getVaultLedgerTotal(), getMembraneEvents(50),
    ]);
    setProfile(p); setAnimals(an); setVault(v);
    const cannabisEvent = events.find(e => e.event_type === 'cannabis_layer_toggle');
    setCannabisOn(cannabisEvent ? !!cannabisEvent.value?.on : false);
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

  const toggleCannabis = async (on: boolean) => {
    setCannabisOn(on);
    setSaveState('saving');
    const ok = await logMembraneEvent({
      eventType: 'cannabis_layer_toggle', sourceScreen: 'biobuddy',
      subject: 'Cannabis Layer (member-level)', value: { on },
    });
    setSaveState(ok ? 'saved' : 'failed');
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
              openLabel="◆ OPEN THE DOOR"
              accent={CYAN}
              onOpen={() => goPage(1)}
            />
          </ScrollView>
        </View>

        {/* ══ STEP 2 · CONTROL PANEL · FLOOD ══ */}
        <View key="flood" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={refresh}>

            <View style={st.subhead}>
              <Text style={st.subheadL}>◆ BIO BUDDY · CONTROL PANEL</Text>
              <Text style={st.subheadR}>MEMBRANE LIVE</Text>
            </View>

            <Pressable style={st.ask} onPress={() => router.push('/(tabs)/concierge' as Href)}>
              <Text style={st.askQ}>HOW CAN I HELP YOU?</Text>
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
                <Text style={st.memberPct}>{acc}%</Text>
                <Text style={st.memberPctL}>MEMBRANE ACCURACY</Text>
              </View>
            </View>

            {/* LIVE READOUT · FULL STACK */}
            <View style={st.section}>
              <Text style={st.seclabel}>LIVE READOUT · FULL STACK</Text>
              {!loaded ? (
                <Text style={st.empty}>Reading your stack…</Text>
              ) : hardware.length === 0 ? (
                <Pressable onPress={() => goPage(2)}>
                  <Text style={st.empty}>No devices connected. Open the Membrane — add your stack and it reads here live.</Text>
                </Pressable>
              ) : hardware.map((key, i) => (
                <View key={i} style={st.readoutRow}>
                  <View style={[st.readoutDot, { backgroundColor: deviceDot(key) }]} />
                  <Text style={st.readoutName}>{deviceName(key)}</Text>
                  <View style={[st.readoutWave, { backgroundColor: deviceDot(key) + '55' }]} />
                  <Text style={[st.readoutVal, { color: deviceDot(key) }]}>AWAITING SIGNAL</Text>
                </View>
              ))}
            </View>

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

            {/* ACTIVITIES */}
            <View style={st.section}>
              <Text style={st.seclabel}>ACTIVITIES</Text>
              <View style={st.chipRow}>
                {activities.filter(a => !HOBBY_CHIPS.some(h => norm(h) === norm(a))).length === 0
                  ? <Text style={st.empty}>None yet — set them on the Membrane.</Text>
                  : activities.filter(a => !HOBBY_CHIPS.some(h => norm(h) === norm(a))).map((a, i) => (
                    <Chip key={i} label={a} sel />
                  ))}
              </View>
            </View>

            {/* HOBBIES */}
            <View style={st.section}>
              <Text style={st.seclabel}>HOBBIES</Text>
              <View style={st.chipRow}>
                {activities.filter(a => HOBBY_CHIPS.some(h => norm(h) === norm(a))).length === 0
                  ? <Text style={st.empty}>None yet — set them on the Membrane.</Text>
                  : activities.filter(a => HOBBY_CHIPS.some(h => norm(h) === norm(a))).map((a, i) => (
                    <Chip key={i} label={a} sel />
                  ))}
              </View>
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

            {/* MEDICATIONS · HEALTH & GOALS */}
            <View style={st.section}>
              <Text style={st.seclabel}>MEDICATIONS · HEALTH & GOALS</Text>
              <View style={st.kvRow}>
                <View style={st.kv}>
                  <Text style={st.k}>MEDICATIONS</Text>
                  <Text style={[st.v, { color: meds ? INK : GREEN }]}>{meds || 'No Current Medications'}</Text>
                </View>
                <View style={st.kv}>
                  <Text style={st.k}>30 / 60 / 90 TRAJECTORY</Text>
                  <Text style={st.v}>{goals.length ? goals.join(' · ') : 'Not set'}</Text>
                </View>
              </View>
            </View>

            {/* CANNABIS LAYER */}
            <View style={st.section}>
              <View style={st.toggleRow}>
                <Text style={st.toggleLbl}>Cannabis Layer</Text>
                <Switch
                  value={cannabisOn}
                  onValueChange={toggleCannabis}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(52,211,153,0.5)' }}
                  thumbColor={cannabisOn ? GREEN : '#888'}
                />
              </View>
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

            {/* CONTROL PANEL DOORS — reached via control panel scroll */}
            <View style={st.section}>
              <Text style={st.seclabel}>DOORS · REACHED FROM THIS PANEL</Text>
              <View style={st.doorGrid}>
                {([
                  ['THE CHEF', '/(tabs)/chef'], ['K9 / FELINE', '/k9'], ['EQUINE', '/equine'],
                  ['AGRICULTURAL', '/agricultural'], ['VISION BOARD', '/vision-board'],
                  ['AFICIONADO', '/aficionado'], ['TRAVEL', '/travel'],
                  ['THE VAULT', '/vision-board'], ['LEARNING CENTER', '/depth-on-demand'],
                ] as [string, string][]).map(([label, route], i) => (
                  <Pressable key={i} style={st.doorChip} onPress={() => router.push(route as Href)}>
                    <Text style={st.doorChipTxt}>{label}</Text>
                    <Text style={st.doorChipArr}>›</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={st.note}>
              THE EVERYTHING-HUB. SENSING FACE — LIVE. EVERY LIFE, EVERY SIGNAL, ON ONE SCREEN. TAP MEMBRANE TO CHANGE IT.
            </Text>
          </ScrollView>
        </View>

        {/* ══ STEP 3 · THE MEMBRANE · EDIT ══ */}
        <View key="edit" style={{ flex: 1 }}>
          <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={refresh}>

            <View style={st.subhead}>
              <Text style={st.subheadL}>◆ MEMBRANE · ADD / SUBTRACT</Text>
              <Pressable onPress={() => goPage(1)} hitSlop={8}>
                <Text style={st.subheadR}>← BACK TO PANEL</Text>
              </Pressable>
            </View>

            <Pressable style={st.change} onPress={() => router.push('/(tabs)/onboarding?mode=edit' as Href)}>
              <View style={{ flex: 1 }}>
                <Text style={st.changeQ}>Change anything.</Text>
                <Text style={st.changeSub}>add a life, a device, a goal…</Text>
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

            {/* HOBBIES */}
            <View style={st.section}>
              <Text style={st.seclabel}>HOBBIES</Text>
              <View style={st.chipRow}>
                {HOBBY_CHIPS.map((a, i) => (
                  <Chip
                    key={i} label={a} sel={activitySel.has(norm(a))}
                    onPress={() => write('activities', toggleArr(activities, a), `hobby:${a}`)}
                  />
                ))}
                <Chip label="+ Add" add onPress={() => setAddInput({ section: 'hobby', value: '' })} />
              </View>
              <AddInline section="hobby" field="activities" current={activities} subject="hobby:add" />
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

            {/* TACTICAL · COMMANDER LAYER */}
            <View style={st.section}>
              <Text style={st.seclabel}>TACTICAL · COMMANDER LAYER</Text>
              <View style={st.chipRow}>
                <Chip
                  label="+ Tactical Unit" add
                  onPress={() => write('commander_layer_active', !commander, 'commander_layer')}
                />
                {TACTICAL_ORGS.map((o, i) => (
                  <Chip
                    key={i} label={o} sel={commander}
                    onPress={() => write('commander_layer_active', !commander, `commander:${o}`)}
                  />
                ))}
              </View>
            </View>

            {/* MEDICATIONS · HEALTH RECORDS */}
            <View style={st.section}>
              <Text style={st.seclabel}>MEDICATIONS · HEALTH RECORDS</Text>
              <View style={st.kvRow}>
                <Pressable style={st.kv} onPress={() => setAddInput({ section: 'meds', value: meds ?? '' })}>
                  <Text style={st.k}>MEDICATIONS</Text>
                  <Text style={[st.v, { color: meds ? INK : GREEN }]}>{meds || 'No Current Medications'}</Text>
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
              <View style={st.kvRow}>
                <Pressable style={st.kv} onPress={() => setAddInput({ section: 'ns30', value: profile?.northStar30d ?? '' })}>
                  <Text style={st.k}>NORTH STAR · 30D</Text>
                  <Text style={st.v}>{profile?.northStar30d ?? 'Not set'}</Text>
                </Pressable>
                <Pressable style={st.kv} onPress={() => setAddInput({ section: 'ns90', value: profile?.northStar90d ?? '' })}>
                  <Text style={st.k}>NORTH STAR · 90D</Text>
                  <Text style={st.v}>{profile?.northStar90d ?? 'Not set'}</Text>
                </Pressable>
              </View>
              {(addInput?.section === 'ns30' || addInput?.section === 'ns90') && (
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput} value={addInput.value}
                    onChangeText={v => setAddInput({ section: addInput.section, value: v })}
                    placeholder={addInput.section === 'ns30' ? '30-day north star…' : '90-day north star…'}
                    placeholderTextColor={FAINT} autoFocus
                  />
                  <Pressable
                    style={st.addSave}
                    onPress={() => {
                      write(addInput.section === 'ns30' ? 'north_star_30d' : 'north_star_90d', addInput.value.trim(), addInput.section);
                      setAddInput(null);
                    }}
                  >
                    <Text style={{ color: CYAN, fontFamily: 'DMMono-Medium', fontSize: 11 }}>SAVE</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* CANNABIS LAYER (member-level) */}
            <View style={st.section}>
              <View style={st.toggleRow}>
                <Text style={st.toggleLbl}>Cannabis Layer (member-level)</Text>
                <Switch
                  value={cannabisOn}
                  onValueChange={toggleCannabis}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(52,211,153,0.5)' }}
                  thumbColor={cannabisOn ? GREEN : '#888'}
                />
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
              ACTING FACE. EVERY CHANGE WRITES THE SAME TABLES THE CONTROL PANEL READS — CHANGE HERE, THE PANEL UPDATES INSTANTLY. THE NERVOUS SYSTEM.
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
  readoutName: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, width: 118 },
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
  tagTxt: { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipSel: { borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.10)' },
  chipAdd: { borderStyle: 'dashed', borderColor: 'rgba(27,184,255,0.35)' },
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
});
