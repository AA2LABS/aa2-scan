import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme,
  TextInput, ActivityIndicator, Alert, SafeAreaView, Platform,
} from 'react-native';
import PagerView, { type PagerRef } from '@/components/Pager';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import Anthropic from '@anthropic-ai/sdk';
import { buildPersonalTruth, loadMemberProfile, logAwareDollarsFollowed, logMembraneEvent } from '../../lib/db';
import { getCannabisProfile, getDispensariesByCity } from '../../lib/cannabis-layer';

const C = {
  nearBlack:    '#03050a',
  electricBlue: '#4a9eff',
  teal:         '#2ecfb3',
  orange:       '#f5922a',
  gold:         '#c9a84c',
  red:          '#e05252',
  white:        '#ffffff',
  dimWhite:     'rgba(255,255,255,0.65)',
  glass:        'rgba(255,255,255,0.06)',
  glassBorder:  'rgba(255,255,255,0.11)',
};

const GRID = { on: C.orange, off: C.teal };

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const getTheme = (isDark: boolean) => ({
  bg:     isDark ? '#0D0A04' : '#FAF7F2',
  card:   isDark ? '#1A1408' : '#FFFDF9',
  border: isDark ? '#2E2208' : '#E8DFD0',
  text:   isDark ? '#FFFFFF' : '#2A1E10',
  muted:  isDark ? 'rgba(255,255,255,0.60)' : '#8a7a6a',
});

type Waypoint    = { id: string; name: string; };
type StoreResult = { name: string; vicinity: string; placeId: string; };
type OffRow      = { title: string; chip?: string; route?: string };

// OFF GRID — pre-synced, downloaded before signal was lost. Not a route planner.
const LOCAL_VENDORS: OffRow[] = [
  { title: 'Farmers markets',    chip: 'SYNCED' },
  { title: 'Mom-and-pop',        chip: 'SYNCED' },
  { title: 'Off-Grid Dispensary', chip: 'SYNCED' },
  { title: 'Forager',            chip: 'SYNCED' },
  { title: 'Apothecary',         chip: 'SYNCED', route: '/apothecary' },
  { title: 'off-grid',           chip: 'SYNCED' },
];
const CARRIED: OffRow[] = [
  { title: 'Last compiled Dossier', chip: 'OFFLINE' },
  { title: 'Paper Layer' },
  { title: 'In Case of Emergency',  chip: 'READY' },
];

function parseDollars(text?: string | null): number | null {
  if (!text) return null;
  const m = String(text).match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
}

async function fetchNearbyStores(lat: number, lng: number): Promise<StoreResult[]> {
  if (!MAPS_KEY) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=grocery_or_supermarket&key=${MAPS_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    return (data.results || []).slice(0, 6).map((r: any) => ({
      name: r.name, vicinity: r.vicinity, placeId: r.place_id,
    }));
  } catch { return []; }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPS_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {}
  return null;
}

export default function MapScreen() {
  const scheme = useColorScheme();
  const T = useMemo(() => getTheme(scheme === 'dark'), [scheme]);
  const [mode, setMode]                   = useState<'on' | 'off'>('on');
  const [page, setPage]                   = useState(0); // ON GRID pager: 0 = nav/dossier, 1 = retail
  const pagerRef = useRef<PagerRef>(null);
  const [userLocation, setUserLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationReady, setLocationReady] = useState(false);

  // ON GRID · PAGE 2 — RETAIL LOCATOR
  const [retailLoading, setRetailLoading] = useState(false);
  const [stores, setStores]               = useState<StoreResult[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreResult | null>(null);
  const [scannedItem, setScannedItem]     = useState('');
  const [retailResult, setRetailResult]   = useState<any>(null);
  const [storesLoaded, setStoresLoaded]   = useState(false);
  const [manualStore, setManualStore]     = useState('');
  const [retailLog, setRetailLog]         = useState<'idle' | 'logged' | 'failed'>('idle');

  // ON GRID · PAGE 1 — NAVIGATION & DOSSIER
  const [dossierLoading, setDossierLoading] = useState(false);
  const [origin, setOrigin]               = useState('');
  const [destination, setDestination]     = useState('');
  const [waypoints, setWaypoints]         = useState<Waypoint[]>([]);
  const [waypointInput, setWaypointInput] = useState('');
  const [travelResult, setTravelResult]   = useState('');
  const [routeStats, setRouteStats]       = useState<{ distance: string; stops: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationReady(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocationReady(true);
    })();
  }, []);

  const findNearbyStores = async () => {
    if (!userLocation) { Alert.alert('Location Not Ready', 'Wait for location to load.'); return; }
    setRetailLoading(true);
    const results = await fetchNearbyStores(userLocation.latitude, userLocation.longitude);
    setStores(results);
    setStoresLoaded(true);
    setRetailLoading(false);
    if (results.length === 0) Alert.alert('No Stores Found', 'Enter your store name manually below.');
  };

  const addManualStore = () => {
    if (!manualStore.trim()) return;
    const manual: StoreResult = { name: manualStore.trim(), vicinity: 'Manually entered', placeId: 'manual' };
    setStores(prev => [manual, ...prev]);
    setSelectedStore(manual);
    setManualStore('');
    setStoresLoaded(true);
  };

  // RETAIL LOCATOR — the Chauffeur (cerebellum · routing). Answers WHERE, not what's in it.
  const runRetailLoop = async () => {
    if (!scannedItem.trim()) { Alert.alert('Missing Item', 'Enter what you are looking for.'); return; }
    if (!selectedStore) { Alert.alert('No Store Selected', 'Select or enter a store first.'); return; }
    setRetailLoading(true);
    setRetailResult(null);
    setRetailLog('idle');
    try {
      const profile = await loadMemberProfile();
      const personalTruth = buildPersonalTruth(profile);
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1200,
        system: `You are The Chauffeur — AA2's retail LOCATOR. You are the cerebellum: routing, not chemistry. You answer WHERE a product is inside a specific named store, and what is better on the same shelf. You NEVER judge ingredients and NEVER give a safety or chemical verdict — that is the Scanner's job.

MEMBER MEMBRANE (filter every better option against this, never restate it):
${personalTruth}

Infer the aisle and section from the standard retail layout of the named chain. Return ONLY valid JSON — no markdown, no backticks: {"aisleLocation":{"aisle":"e.g. Aisle 7","section":"e.g. Refrigerated juices, left-hand side"},"chauffeurLine":"one or two sentences naming exactly where it is and whether something better sits in the same aisle","betterOptions":[{"name":"string","aisle":"aisle/section position in THIS store","price":"approx shelf price","why":"why it fits the member — value, cleaner, better nutrition; never a moral judgment"}],"awareDollars":"the dollar difference vs. the pick, ending with: That goes directly into your AA2 Vault as AWARE DOLLARS."}`,
        messages: [{ role: 'user', content: `I am inside ${selectedStore.name} at ${selectedStore.vicinity}. I'm looking for: ${scannedItem}. Tell me the exact aisle and section for it in this store, and what's better in the same building right now.` }],
      });
      const raw = (response.content[0] as any).text || '';
      setRetailResult(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch {
      Alert.alert('Retail Loop Error', 'The Chauffeur could not complete analysis. Try again.');
    } finally { setRetailLoading(false); }
  };

  const followRetail = async () => {
    const amt = parseDollars(retailResult?.awareDollars);
    if (amt == null) return;
    const ok = await logAwareDollarsFollowed({
      productName:     scannedItem,
      recommendation:  retailResult?.awareDollars,
      alternativeName: Array.isArray(retailResult?.betterOptions) ? retailResult.betterOptions[0]?.name : undefined,
      amountSaved:     amt,
      scanResult:      retailResult,
    });
    setRetailLog(ok ? 'logged' : 'failed');
  };

  const addWaypoint = () => {
    if (!waypointInput.trim()) return;
    setWaypoints(prev => [...prev, { id: Date.now().toString(), name: waypointInput.trim() }]);
    setWaypointInput('');
  };

  const buildSafeRoute = async () => {
    if (!origin.trim() || !destination.trim()) { Alert.alert('Missing Info', 'Enter both origin and destination.'); return; }
    setDossierLoading(true);
    setTravelResult('');
    setRouteStats(null);
    try {
      const [oCoords, dCoords] = await Promise.all([geocodeAddress(origin), geocodeAddress(destination)]);
      if (oCoords && dCoords) {
        const distKm = Math.round(Math.sqrt(
          Math.pow((dCoords.lat - oCoords.lat) * 111, 2) +
          Math.pow((dCoords.lng - oCoords.lng) * 111, 2)
        ));
        setRouteStats({ distance: `~${distKm} km`, stops: waypoints.length + 2 });
      }
      const fullRoute = [origin, ...waypoints.map(w => w.name), destination].join(' → ');
      const profile = await loadMemberProfile();
      const personalTruth = buildPersonalTruth(profile);
      const cannabis = getCannabisProfile(destination);
      const dispensaries = getDispensariesByCity(destination);
      const cannabisIntel = cannabis
        ? `Country: ${cannabis.countryName}. Status: ${cannabis.topLevelStatus}. Age minimum: ${cannabis.ageMinimum ?? 'n/a'}. Personal limit: ${cannabis.personalLimitGrams ?? 'n/a'}g. Public consumption: ${cannabis.publicConsumption}. Lounges on file: ${cannabis.loungeCount}. Border warnings: ${cannabis.borderWarnings.map(b => `${b.borderName} — ${b.note}`).join(' | ') || 'none on file'}. Rules of the road: ${cannabis.rulesOfTheRoad.join(' | ')}`
        : 'LEGAL STATUS: not verified for this destination — state that plainly and tell the member to confirm locally.';
      const dispensaryIntel = dispensaries.length
        ? dispensaries.map(d => `${d.name} — ${d.address}, ${d.city} (${d.hoursLine})${d.recreational ? ' · rec' : ''}${d.medical ? ' · med' : ''}${d.delivery ? ' · delivery' : ''}`).join('; ')
        : 'No verified dispensary records on file for this destination.';
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 3000,
        system: `You are The Chauffeur — AA2's safety travel intelligence. Pre-program the safest route before the member ever leaves. Domestic and international. Calm, specific, never alarmist. Best private driver energy.

MEMBER MEMBRANE (filter every recommendation against this):
${personalTruth}

VERIFIED CANNABIS LAYER FOR DESTINATION:
${cannabisIntel}
Dispensary records on file: ${dispensaryIntel}

You MUST return ALL sections below, in this order, every time. Never omit one. If you lack data, say exactly what is unknown and what to verify on arrival — never leave it blank.

1. ROUTE & WAYPOINTS — safe stops, fuel, rest, timing, weather context.
2. ONE WAY IN / ONE WAY OUT — egress risk. Flag any leg, town, canyon, island, peninsula, or venue with a single access route. State the alternate exit, or say there is none.
3. ENVIRONMENTAL INTELLIGENCE ENGINE — report every one: real-time news signals and local danger reports; political gatherings and civil unrest indicators; construction disruptions; high-density events and party clusters; traffic anomalies and crime heat patterns; route deviation thresholds; rideshare deviation risk; border crossing notes.
4. AVOIDANCES — named areas, roads, and times to avoid.
5. EMERGENCY SERVICES — nearest hospital, urgent care, pharmacy, emergency number per leg.
6. AFICIONADO — cigar lounges and premium venues: name, district, indoor/outdoor, smoking legality.
7. DISPENSARIES — use ONLY the verified cannabis layer above. Never invent a dispensary or a legal status.
8. RETAIL LOOP — cleared grocery, market, and pharmacy options that fit the member's membrane.

End with the EQUALIZER CO-SIGN: per AA2 law the Chauffeur compiles this Dossier but holds it until the Equalizer clears it. State one line — CO-SIGNED · CLEARED, or HELD · ONE WAY IN / ONE WAY OUT ON [leg] — and never mark it cleared if any single-egress leg is unresolved.`,
        messages: [{ role: 'user', content: `Route: ${fullRoute}. Destination: ${destination}. Give the complete pre-departure dossier.` }],
      });
      setTravelResult((response.content[0] as any).text || '');
    } catch {
      Alert.alert('Route Error', 'The Chauffeur could not build the route. Try again.');
    } finally { setDossierLoading(false); }
  };

  const openOffRow = (row: OffRow) => {
    if (row.route) { router.push(row.route as any); return; }
    logMembraneEvent({ eventType: 'offgrid_open', sourceScreen: 'map', subject: row.title });
  };

  const hasRetailResult = !!retailResult;
  const hasDossier      = travelResult !== '';

  // ── ON GRID · PAGE 1 — NAVIGATION & DOSSIER ──────────────────────────────────
  const renderDossierPage = () => (
    <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 60 }}>
      {hasDossier && !dossierLoading ? (
        <TouchableOpacity
          style={[s.scanAgainBar, { borderColor: GRID.on }]}
          onPress={() => { setTravelResult(''); setRouteStats(null); setOrigin(''); setDestination(''); setWaypoints([]); }}
        >
          <Text style={[s.scanAgainBarText, { color: GRID.on }]}>⚡ COMPILE ANOTHER DOSSIER</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={[s.gridBadge, { backgroundColor: GRID.on + '22', color: GRID.on, borderColor: GRID.on }]}>ON GRID</Text>
            <Text style={s.cardTitle}>NAVIGATION & DOSSIER</Text>
          </View>
          <Text style={s.cardDesc}>Google Maps with the Dossier attached. One way in. One way out.</Text>

          <Text style={s.sectionLabel}>ORIGIN</Text>
          <TextInput style={s.input} placeholder="e.g. Bozeman, Montana" placeholderTextColor={C.dimWhite} value={origin} onChangeText={setOrigin} />

          <Text style={s.sectionLabel}>DESTINATION</Text>
          <TextInput style={s.input} placeholder="e.g. Panama City, Panama" placeholderTextColor={C.dimWhite} value={destination} onChangeText={setDestination} />

          {waypoints.length > 0 && (
            <>
              <Text style={s.sectionLabel}>STOPS ALONG THE WAY</Text>
              {waypoints.map((wp, i) => (
                <View key={wp.id} style={s.waypointRow}>
                  <Text style={s.waypointLetter}>{String.fromCharCode(66 + i)}</Text>
                  <Text style={s.waypointName}>{wp.name}</Text>
                  <TouchableOpacity onPress={() => setWaypoints(prev => prev.filter(w => w.id !== wp.id))}>
                    <Text style={s.removeWp}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <Text style={s.sectionLabel}>ADD A STOP</Text>
          <View style={s.rowInput}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="City, address, or landmark"
              placeholderTextColor={C.dimWhite}
              value={waypointInput}
              onChangeText={setWaypointInput}
              onSubmitEditing={addWaypoint}
            />
            <TouchableOpacity style={[s.addBtn, { backgroundColor: GRID.on }]} onPress={addWaypoint}>
              <Text style={[s.addBtnText, { color: C.nearBlack }]}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: GRID.on, marginTop: 14 }]} onPress={buildSafeRoute}>
            <Text style={[s.primaryBtnText, { color: C.nearBlack }]}>⚡ COMPILE THE DOSSIER</Text>
          </TouchableOpacity>
        </View>
      )}

      {dossierLoading && (
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={GRID.on} />
          <Text style={[s.loadingLabel, { color: GRID.on }]}>THE CHAUFFEUR IS COMPILING YOUR DOSSIER</Text>
          <Text style={s.loadingSubLabel}>Domestic + International Safety Intelligence Active</Text>
        </View>
      )}

      {routeStats && !dossierLoading && (
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={[s.gridBadge, { backgroundColor: GRID.on + '22', color: GRID.on, borderColor: GRID.on }]}>ON GRID</Text>
            <Text style={s.cardTitle}>DOSSIER LOCKED</Text>
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{routeStats.distance}</Text>
              <Text style={s.statLabel}>DISTANCE</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{routeStats.stops}</Text>
              <Text style={s.statLabel}>TOTAL STOPS</Text>
            </View>
          </View>
        </View>
      )}

      {travelResult !== '' && !dossierLoading && (
        <View style={s.card}>
          <View style={[s.intelCard, { borderLeftColor: GRID.on }]}>
            <Text style={[s.intelHeader, { color: GRID.on }]}>🗺️ THE CHAUFFEUR — SAFETY BRIEF</Text>
            <Text style={s.intelBody}>{travelResult}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  // ── ON GRID · PAGE 2 — RETAIL LOCATOR ────────────────────────────────────────
  const renderRetailPage = () => (
    <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 60 }}>
      {hasRetailResult && !retailLoading ? (
        <TouchableOpacity
          style={[s.scanAgainBar, { borderColor: GRID.on }]}
          onPress={() => { setRetailResult(null); setRetailLog('idle'); }}
        >
          <Text style={[s.scanAgainBarText, { color: GRID.on }]}>⚡ FIND ANOTHER ITEM</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={[s.gridBadge, { backgroundColor: GRID.on + '22', color: GRID.on, borderColor: GRID.on }]}>ON GRID</Text>
            <Text style={s.cardTitle}>RETAIL INTELLIGENCE LOOP</Text>
          </View>
          <Text style={s.cardDesc}>Inside the store. Where it is — and what's better on this shelf.</Text>

          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.electricBlue }]} onPress={findNearbyStores}>
            <Text style={s.primaryBtnText}>📍 FIND STORES NEAR ME</Text>
          </TouchableOpacity>

          <Text style={s.sectionLabel}>OR ENTER STORE NAME MANUALLY</Text>
          <View style={s.rowInput}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="e.g. Walmart, Kroger, Whole Foods..."
              placeholderTextColor={C.dimWhite}
              value={manualStore}
              onChangeText={setManualStore}
              onSubmitEditing={addManualStore}
            />
            <TouchableOpacity style={s.addBtn} onPress={addManualStore}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {storesLoaded && stores.length > 0 && (
            <>
              <Text style={s.sectionLabel}>SELECT YOUR STORE</Text>
              {stores.map((store, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.storeRow, selectedStore?.name === store.name && { borderColor: GRID.on, backgroundColor: 'rgba(245,146,42,0.08)' }]}
                  onPress={() => setSelectedStore(store)}
                >
                  <Text style={s.storeName}>{store.name}</Text>
                  <Text style={s.storeVicinity}>{store.vicinity}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <Text style={s.sectionLabel}>WHAT ARE YOU LOOKING FOR?</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Tropicana OJ, Kraft Mac & Cheese..."
            placeholderTextColor={C.dimWhite}
            value={scannedItem}
            onChangeText={setScannedItem}
          />
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: GRID.on }]} onPress={runRetailLoop}>
            <Text style={[s.primaryBtnText, { color: C.nearBlack }]}>⚡ RUN RETAIL LOOP</Text>
          </TouchableOpacity>
        </View>
      )}

      {retailLoading && (
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={GRID.on} />
          <Text style={[s.loadingLabel, { color: GRID.on }]}>THE CHAUFFEUR IS LOCATING IT IN THE STORE</Text>
        </View>
      )}

      {retailResult && !retailLoading && (
        <View style={s.card}>
          {retailResult.aisleLocation && (
            <View style={[s.aisleBlock, { borderColor: GRID.on }]}>
              <Text style={s.aisleLabel}>AISLE LOCATION</Text>
              <Text style={[s.aisleHeadline, { color: GRID.on }]}>{retailResult.aisleLocation.aisle}</Text>
              <Text style={s.aisleSection}>{retailResult.aisleLocation.section}</Text>
            </View>
          )}

          {retailResult.chauffeurLine && (
            <View style={[s.intelCard, { borderLeftColor: GRID.on }]}>
              <Text style={[s.intelHeader, { color: GRID.on }]}>🗺️ THE CHAUFFEUR</Text>
              <Text style={s.intelBody}>{retailResult.chauffeurLine}</Text>
            </View>
          )}

          {retailResult.betterOptions?.length > 0 && (
            <>
              <Text style={s.sectionLabel}>BETTER OPTIONS IN THIS STORE NOW</Text>
              {retailResult.betterOptions.map((opt: any, i: number) => (
                <View key={i} style={s.optionCard}>
                  <Text style={s.optionName}>{opt.name}</Text>
                  {opt.aisle ? <Text style={s.optionAisle}>📍 {opt.aisle}</Text> : null}
                  {opt.why ? <Text style={s.optionWhy}>{opt.why}</Text> : null}
                  {opt.price ? <Text style={s.optionSavings}>💰 {opt.price}</Text> : null}
                </View>
              ))}
            </>
          )}

          {retailResult.awareDollars && (
            <View style={s.vaultCard}>
              <Text style={s.vaultLabel}>💰 AWARE DOLLARS</Text>
              <Text style={s.vaultBody}>{retailResult.awareDollars}</Text>
              {retailLog === 'logged' ? (
                <View style={[s.followBtn, { borderColor: '#8fd6ff' }]}>
                  <Text style={[s.followTxt, { color: '#8fd6ff' }]}>✓ LOGGED TO VAULT</Text>
                </View>
              ) : retailLog === 'failed' ? (
                <TouchableOpacity style={[s.followBtn, { borderColor: C.orange }]} onPress={followRetail} activeOpacity={0.7}>
                  <Text style={[s.followTxt, { color: C.orange }]}>⚠ NOT SAVED — RETRY</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[s.followBtn, { borderColor: C.gold, opacity: parseDollars(retailResult.awareDollars) == null ? 0.4 : 1 }]}
                  onPress={followRetail}
                  disabled={parseDollars(retailResult.awareDollars) == null}
                  activeOpacity={0.7}
                >
                  <Text style={[s.followTxt, { color: C.gold }]}>◆ I FOLLOWED THIS →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.root}>

      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.headerDna}>🧬</Text>
        <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit>I AM THE RECEIPT</Text>
        <Text style={s.headerSub}>THE CHAUFFEUR</Text>
      </View>

      {/* COMPACT MODE TOGGLE */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, mode === 'on' && { borderColor: GRID.on, backgroundColor: 'rgba(245,146,42,0.12)' }]}
          onPress={() => setMode('on')}
        >
          <Text style={s.toggleIcon}>🏪</Text>
          <View>
            <Text style={[s.toggleLabel, mode === 'on' && { color: GRID.on }]}>ON GRID</Text>
            <Text style={s.toggleSub}>CONNECTED</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.toggleBtn, mode === 'off' && { borderColor: GRID.off, backgroundColor: 'rgba(46,207,179,0.12)' }]}
          onPress={() => setMode('off')}
        >
          <Text style={s.toggleIcon}>🛡️</Text>
          <View>
            <Text style={[s.toggleLabel, mode === 'off' && { color: GRID.off }]}>OFF GRID</Text>
            <Text style={s.toggleSub}>PRE-SYNCED</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* SAFETY / LOCATION BAR */}
      <View style={[s.locationBadge, { borderColor: locationReady ? C.teal : C.gold }]}>
        <Text style={[s.locationText, { color: locationReady ? C.teal : C.gold }]}>
          {locationReady
            ? `📍 Location active — ${userLocation?.latitude.toFixed(4)}, ${userLocation?.longitude.toFixed(4)}`
            : '📍 Acquiring location...'}
        </Text>
      </View>

      {mode === 'on' ? (
        <>
          {/* PAGE DOTS + CAPTION */}
          <View style={s.pagerNav}>
            <View style={s.dotsRow}>
              {[0, 1].map(i => (
                <TouchableOpacity key={i} onPress={() => pagerRef.current?.setPage(i)}>
                  <View style={[s.dot, page === i && [s.dotActive, { backgroundColor: GRID.on }]]} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.pagerCaption}>
              {page === 0
                ? 'PAGE 1 · NAVIGATION & DOSSIER   ·   SWIPE LEFT → RETAIL'
                : '← SWIPE RIGHT · NAVIGATION   ·   PAGE 2 · RETAIL LOCATOR'}
            </Text>
          </View>

          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={e => setPage(e.nativeEvent.position)}
          >
            <View key="nav" style={{ flex: 1 }}>{renderDossierPage()}</View>
            <View key="retail" style={{ flex: 1 }}>{renderRetailPage()}</View>
          </PagerView>
        </>
      ) : (
        /* ── OFF GRID — pre-synced, no signal required ── */
        <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Text style={[s.gridBadge, { backgroundColor: GRID.off + '22', color: GRID.off, borderColor: GRID.off }]}>OFF GRID</Text>
              <Text style={s.cardTitle}>NO SIGNAL REQUIRED</Text>
            </View>
            <Text style={s.cardDesc}>Everything below was downloaded before you lost service. Nothing here needs a connection.</Text>
          </View>

          <Text style={[s.sectionLabel, { marginHorizontal: 12 }]}>LOCAL & SMALL VENDOR · NEVER BIG BOX</Text>
          {LOCAL_VENDORS.map((row, i) => (
            <TouchableOpacity key={i} style={s.offRow} onPress={() => openOffRow(row)} activeOpacity={0.7}>
              <Text style={s.offRowTitle}>{row.title}</Text>
              {row.chip ? (
                <View style={[s.offChip, { borderColor: GRID.off, backgroundColor: GRID.off + '1A' }]}>
                  <Text style={[s.offChipTxt, { color: GRID.off }]}>{row.chip}</Text>
                </View>
              ) : <Text style={s.offChev}>›</Text>}
            </TouchableOpacity>
          ))}

          <Text style={[s.sectionLabel, { marginHorizontal: 12, marginTop: 16 }]}>CARRIED WITH YOU</Text>
          {CARRIED.map((row, i) => (
            <TouchableOpacity key={i} style={s.offRow} onPress={() => openOffRow(row)} activeOpacity={0.7}>
              <Text style={s.offRowTitle}>{row.title}</Text>
              {row.chip ? (
                <View style={[s.offChip, { borderColor: GRID.off, backgroundColor: GRID.off + '1A' }]}>
                  <Text style={[s.offChipTxt, { color: GRID.off }]}>{row.chip}</Text>
                </View>
              ) : <Text style={s.offChev}>›</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#0D0A04' },
  header:          { alignItems: 'center', paddingTop: 8, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  headerDna:       { fontSize: 22, marginBottom: 2 },
  headerTitle:     { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  headerSub:       { fontSize: 9, color: C.gold, letterSpacing: 2, marginTop: 2 },

  // Compact horizontal toggle
  toggleRow:       { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2E2208', backgroundColor: '#1A1408' },
  toggleIcon:      { fontSize: 20 },
  toggleLabel:     { color: 'rgba(255,255,255,0.60)', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  toggleSub:       { color: 'rgba(255,255,255,0.60)', fontSize: 9, opacity: 0.7, marginTop: 1 },

  locationBadge:   { marginHorizontal: 12, marginBottom: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  locationText:    { fontSize: 10, fontWeight: '600' },
  body:            { flex: 1 },

  // Pager nav (dots + caption)
  pagerNav:        { paddingHorizontal: 12, paddingBottom: 8, alignItems: 'center' },
  dotsRow:         { flexDirection: 'row', gap: 6, marginBottom: 6 },
  dot:             { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive:       { width: 18 },
  pagerCaption:    { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  // Collapsed bar when result is showing
  scanAgainBar:    { marginHorizontal: 12, marginTop: 8, marginBottom: 4, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  scanAgainBarText:{ fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },

  card:            { marginHorizontal: 12, marginTop: 8, marginBottom: 8, padding: 16, backgroundColor: '#1A1408', borderRadius: 14, borderWidth: 1, borderColor: '#2E2208' },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  gridBadge:       { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  cardTitle:       { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 1, flex: 1 },
  cardDesc:        { color: 'rgba(255,255,255,0.60)', fontSize: 11, lineHeight: 17, marginBottom: 14 },
  sectionLabel:    { color: 'rgba(255,255,255,0.60)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 6, marginTop: 10 },
  input:           { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: '#2E2208', borderRadius: 8, color: '#FFFFFF', padding: 11, fontSize: 13, marginBottom: 10 },
  primaryBtn:      { paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  primaryBtnText:  { fontWeight: '900', fontSize: 12, letterSpacing: 1.5, color: '#FFFFFF' },
  rowInput:        { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  addBtn:          { backgroundColor: C.electricBlue, width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtnText:      { color: C.nearBlack, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  storeRow:        { padding: 11, borderRadius: 8, borderWidth: 1, borderColor: '#2E2208', marginBottom: 6 },
  storeName:       { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  storeVicinity:   { color: 'rgba(255,255,255,0.60)', fontSize: 11, marginTop: 2 },

  // Retail locator — aisle guidance
  aisleBlock:      { borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', backgroundColor: 'rgba(245,146,42,0.06)' },
  aisleLabel:      { color: 'rgba(255,255,255,0.60)', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  aisleHeadline:   { fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 4, textAlign: 'center' },
  aisleSection:    { color: '#FFFFFF', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  optionCard:      { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: 11, marginBottom: 8 },
  optionName:      { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  optionAisle:     { color: C.orange, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  optionWhy:       { color: 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 18 },
  optionSavings:   { color: C.gold, fontWeight: '700', fontSize: 12, marginTop: 4 },
  intelCard:       { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.electricBlue, borderWidth: 1, borderColor: '#2E2208', padding: 13, marginBottom: 10 },
  intelHeader:     { color: C.electricBlue, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  intelBody:       { color: '#FFFFFF', fontSize: 13, lineHeight: 21 },
  vaultCard:       { backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10, borderWidth: 1, borderColor: C.gold, padding: 13, marginBottom: 10 },
  vaultLabel:      { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  vaultBody:       { color: '#FFFFFF', fontSize: 13, lineHeight: 20 },
  followBtn:       { marginTop: 12, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  followTxt:       { fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },
  waypointRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: 10, marginBottom: 6 },
  waypointLetter:  { color: C.orange, fontWeight: '900', fontSize: 14, width: 24 },
  waypointName:    { color: '#FFFFFF', flex: 1, fontSize: 13 },
  removeWp:        { color: C.red, fontWeight: '800', fontSize: 16, paddingLeft: 8 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  statItem:        { alignItems: 'center' },
  statValue:       { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  statLabel:       { color: 'rgba(255,255,255,0.60)', fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  loadingCard:     { marginHorizontal: 12, marginVertical: 8, padding: 28, backgroundColor: '#1A1408', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2E2208' },
  loadingLabel:    { fontWeight: '900', fontSize: 11, letterSpacing: 2, marginTop: 14, textAlign: 'center' },
  loadingSubLabel: { color: 'rgba(255,255,255,0.60)', fontSize: 9, letterSpacing: 1, marginTop: 6, textAlign: 'center' },

  // OFF GRID rows
  offRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 12, marginBottom: 6, padding: 14, backgroundColor: '#1A1408', borderRadius: 10, borderWidth: 1, borderColor: '#2E2208' },
  offRowTitle:     { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1 },
  offChip:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  offChipTxt:      { fontSize: 8.5, fontWeight: '900', letterSpacing: 1 },
  offChev:         { color: 'rgba(255,255,255,0.35)', fontSize: 18 },
});
