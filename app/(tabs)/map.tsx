import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, SafeAreaView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import Anthropic from '@anthropic-ai/sdk';

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

type Waypoint    = { id: string; name: string; };
type StoreResult = { name: string; vicinity: string; placeId: string; };

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
  const [mode, setMode]                   = useState<'on' | 'off'>('on');
  const [userLocation, setUserLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [loading, setLoading]             = useState(false);

  // ON GRID
  const [stores, setStores]               = useState<StoreResult[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreResult | null>(null);
  const [scannedItem, setScannedItem]     = useState('');
  const [retailResult, setRetailResult]   = useState<any>(null);
  const [storesLoaded, setStoresLoaded]   = useState(false);
  const [manualStore, setManualStore]     = useState('');

  // OFF GRID
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
    setLoading(true);
    const results = await fetchNearbyStores(userLocation.latitude, userLocation.longitude);
    setStores(results);
    setStoresLoaded(true);
    setLoading(false);
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

  const runRetailLoop = async () => {
    if (!scannedItem.trim()) { Alert.alert('Missing Item', 'Enter what you picked up.'); return; }
    if (!selectedStore) { Alert.alert('No Store Selected', 'Select or enter a store first.'); return; }
    setLoading(true);
    setRetailResult(null);
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are The Chauffeur — AA2's retail intelligence engine. You fire INSIDE the store. Find what is better in this exact building right now. Cheaper. Better ingredients. Better nutrition. Calm, specific, never preachy. Return ONLY valid JSON — no markdown, no backticks: {"verdict":"string","betterOptions":[{"name":"string","why":"string","savings":"string or null"}],"chefNote":"string","storeSection":"string","actRightDollars":"string","equalizerNote":"string"}`,
        messages: [{ role: 'user', content: `I am inside ${selectedStore.name} at ${selectedStore.vicinity}. I picked up: ${scannedItem}. What else in this store is cheaper, better ingredients, or better nutrition?` }],
      });
      const raw = (response.content[0] as any).text || '';
      setRetailResult(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch {
      Alert.alert('Retail Loop Error', 'The Chauffeur could not complete analysis. Try again.');
    } finally { setLoading(false); }
  };

  const addWaypoint = () => {
    if (!waypointInput.trim()) return;
    setWaypoints(prev => [...prev, { id: Date.now().toString(), name: waypointInput.trim() }]);
    setWaypointInput('');
  };

  const buildSafeRoute = async () => {
    if (!origin.trim() || !destination.trim()) { Alert.alert('Missing Info', 'Enter both origin and destination.'); return; }
    setLoading(true);
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
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are The Chauffeur — AA2's safety travel intelligence. Pre-program the safest route before the user ever leaves. Domestic and international. Identify safe waypoints, rest stops, fuel points, emergency services, border crossing notes, areas to avoid, best travel times, weather context. Be specific, practical, calm. Best private driver energy.`,
        messages: [{ role: 'user', content: `Route: ${fullRoute}. Give a complete safety brief before I leave.` }],
      });
      setTravelResult((response.content[0] as any).text || '');
    } catch {
      Alert.alert('Route Error', 'The Chauffeur could not build the route. Try again.');
    } finally { setLoading(false); }
  };

  const hasOnResult  = !!retailResult;
  const hasOffResult = travelResult !== '';
  const accentColor  = mode === 'on' ? GRID.on : GRID.off;

  return (
    <SafeAreaView style={s.root}>

      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.headerDna}>🧬</Text>
        <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit>I AM THE RECEIPT</Text>
        <Text style={s.headerSub}>CHAUFFEUR</Text>
      </View>

      {/* COMPACT MODE TOGGLE */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, mode === 'on' && { borderColor: GRID.on, backgroundColor: 'rgba(245,146,42,0.12)' }]}
          onPress={() => { setMode('on'); setRetailResult(null); }}
        >
          <Text style={s.toggleIcon}>🏪</Text>
          <View>
            <Text style={[s.toggleLabel, mode === 'on' && { color: GRID.on }]}>ON GRID</Text>
            <Text style={s.toggleSub}>Retail Intelligence</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.toggleBtn, mode === 'off' && { borderColor: GRID.off, backgroundColor: 'rgba(46,207,179,0.12)' }]}
          onPress={() => { setMode('off'); setTravelResult(''); }}
        >
          <Text style={s.toggleIcon}>🛡️</Text>
          <View>
            <Text style={[s.toggleLabel, mode === 'off' && { color: GRID.off }]}>OFF GRID</Text>
            <Text style={s.toggleSub}>Safety Travel</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* LOCATION BADGE */}
      <View style={[s.locationBadge, { borderColor: locationReady ? C.teal : C.gold }]}>
        <Text style={[s.locationText, { color: locationReady ? C.teal : C.gold }]}>
          {locationReady
            ? `📍 Location active — ${userLocation?.latitude.toFixed(4)}, ${userLocation?.longitude.toFixed(4)}`
            : '📍 Acquiring location...'}
        </Text>
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── ON GRID ── */}
        {mode === 'on' && (
          <>
            {/* Input card — collapses when result is showing */}
            {hasOnResult && !loading ? (
              <TouchableOpacity
                style={[s.scanAgainBar, { borderColor: GRID.on }]}
                onPress={() => setRetailResult(null)}
              >
                <Text style={[s.scanAgainBarText, { color: GRID.on }]}>⚡ SCAN ANOTHER ITEM</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.card}>
                <View style={s.cardTitleRow}>
                  <Text style={[s.gridBadge, { backgroundColor: GRID.on + '22', color: GRID.on, borderColor: GRID.on }]}>ON GRID</Text>
                  <Text style={s.cardTitle}>RETAIL INTELLIGENCE LOOP</Text>
                </View>
                <Text style={s.cardDesc}>Fires inside the store. Finds what else in this building is cheaper, cleaner, or better nutrition.</Text>

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

                <Text style={s.sectionLabel}>WHAT DID YOU PICK UP?</Text>
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

            {loading && (
              <View style={s.loadingCard}>
                <ActivityIndicator size="large" color={GRID.on} />
                <Text style={[s.loadingLabel, { color: GRID.on }]}>THE CHAUFFEUR IS SCANNING THE STORE</Text>
              </View>
            )}

            {retailResult && !loading && (
              <View style={s.card}>
                <View style={[s.intelCard, { borderLeftColor: GRID.on }]}>
                  <Text style={[s.intelHeader, { color: GRID.on }]}>🗺️ THE CHAUFFEUR</Text>
                  <Text style={s.intelBody}>{retailResult.verdict}</Text>
                </View>

                {retailResult.betterOptions?.length > 0 && (
                  <>
                    <Text style={s.sectionLabel}>BETTER OPTIONS IN THIS STORE NOW</Text>
                    {retailResult.betterOptions.map((opt: any, i: number) => (
                      <View key={i} style={s.optionCard}>
                        <Text style={s.optionName}>{opt.name}</Text>
                        <Text style={s.optionWhy}>{opt.why}</Text>
                        {opt.savings && <Text style={s.optionSavings}>💰 {opt.savings}</Text>}
                      </View>
                    ))}
                  </>
                )}

                {retailResult.storeSection && <Text style={s.storeSection}>📍 Find it: {retailResult.storeSection}</Text>}

                {retailResult.equalizerNote && (
                  <View style={s.intelCard}>
                    <Text style={s.intelHeader}>🛡️ THE EQUALIZER</Text>
                    <Text style={s.intelBody}>{retailResult.equalizerNote}</Text>
                  </View>
                )}

                {retailResult.chefNote && (
                  <View style={[s.intelCard, { borderLeftColor: C.gold }]}>
                    <Text style={[s.intelHeader, { color: C.gold }]}>🍽️ THE CHEF</Text>
                    <Text style={s.intelBody}>{retailResult.chefNote}</Text>
                  </View>
                )}

                {retailResult.actRightDollars && (
                  <View style={s.vaultCard}>
                    <Text style={s.vaultLabel}>💰 ACT RIGHT DOLLARS</Text>
                    <Text style={s.vaultBody}>{retailResult.actRightDollars}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ── OFF GRID ── */}
        {mode === 'off' && (
          <>
            {hasOffResult && !loading ? (
              <TouchableOpacity
                style={[s.scanAgainBar, { borderColor: GRID.off }]}
                onPress={() => { setTravelResult(''); setRouteStats(null); setOrigin(''); setDestination(''); setWaypoints([]); }}
              >
                <Text style={[s.scanAgainBarText, { color: GRID.off }]}>🛡️ PLAN ANOTHER ROUTE</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.card}>
                <View style={s.cardTitleRow}>
                  <Text style={[s.gridBadge, { backgroundColor: GRID.off + '22', color: GRID.off, borderColor: GRID.off }]}>OFF GRID</Text>
                  <Text style={s.cardTitle}>SAFETY TRAVEL ENGINE</Text>
                </View>
                <Text style={s.cardDesc}>Pre-program your route before you leave. The Chauffeur briefs you — safe routes, exits, weather, news, emergency services, border notes.</Text>

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
                  <TouchableOpacity style={[s.addBtn, { backgroundColor: GRID.off }]} onPress={addWaypoint}>
                    <Text style={[s.addBtnText, { color: C.nearBlack }]}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: GRID.off, marginTop: 14 }]} onPress={buildSafeRoute}>
                  <Text style={[s.primaryBtnText, { color: C.nearBlack }]}>🛡️ BUILD SAFE ROUTE</Text>
                </TouchableOpacity>
              </View>
            )}

            {loading && (
              <View style={s.loadingCard}>
                <ActivityIndicator size="large" color={GRID.off} />
                <Text style={[s.loadingLabel, { color: GRID.off }]}>THE CHAUFFEUR IS PLANNING YOUR ROUTE</Text>
                <Text style={s.loadingSubLabel}>Domestic + International Safety Intelligence Active</Text>
              </View>
            )}

            {routeStats && !loading && (
              <View style={s.card}>
                <View style={s.cardTitleRow}>
                  <Text style={[s.gridBadge, { backgroundColor: GRID.off + '22', color: GRID.off, borderColor: GRID.off }]}>OFF GRID</Text>
                  <Text style={s.cardTitle}>ROUTE LOCKED</Text>
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

            {travelResult !== '' && !loading && (
              <View style={s.card}>
                <View style={[s.intelCard, { borderLeftColor: GRID.off }]}>
                  <Text style={[s.intelHeader, { color: GRID.off }]}>🗺️ THE CHAUFFEUR — SAFETY BRIEF</Text>
                  <Text style={s.intelBody}>{travelResult}</Text>
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.nearBlack },
  header:          { alignItems: 'center', paddingTop: 8, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  headerDna:       { fontSize: 22, marginBottom: 2 },
  headerTitle:     { fontSize: 17, fontWeight: '800', color: C.white, letterSpacing: 2 },
  headerSub:       { fontSize: 9, color: C.gold, letterSpacing: 2, marginTop: 2 },

  // Compact horizontal toggle
  toggleRow:       { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glass },
  toggleIcon:      { fontSize: 20 },
  toggleLabel:     { color: C.dimWhite, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  toggleSub:       { color: C.dimWhite, fontSize: 9, opacity: 0.7, marginTop: 1 },

  locationBadge:   { marginHorizontal: 12, marginBottom: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  locationText:    { fontSize: 10, fontWeight: '600' },
  body:            { flex: 1 },

  // Collapsed bar when result is showing
  scanAgainBar:    { marginHorizontal: 12, marginTop: 8, marginBottom: 4, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  scanAgainBarText:{ fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },

  card:            { marginHorizontal: 12, marginTop: 8, marginBottom: 8, padding: 16, backgroundColor: C.glass, borderRadius: 14, borderWidth: 1, borderColor: C.glassBorder },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  gridBadge:       { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  cardTitle:       { color: C.white, fontSize: 13, fontWeight: '900', letterSpacing: 1, flex: 1 },
  cardDesc:        { color: C.dimWhite, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  sectionLabel:    { color: C.dimWhite, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 6, marginTop: 10 },
  input:           { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 8, color: C.white, padding: 11, fontSize: 13, marginBottom: 10 },
  primaryBtn:      { paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  primaryBtnText:  { fontWeight: '900', fontSize: 12, letterSpacing: 1.5, color: C.white },
  rowInput:        { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  addBtn:          { backgroundColor: C.electricBlue, width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtnText:      { color: C.nearBlack, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  storeRow:        { padding: 11, borderRadius: 8, borderWidth: 1, borderColor: C.glassBorder, marginBottom: 6 },
  storeName:       { color: C.white, fontWeight: '700', fontSize: 13 },
  storeVicinity:   { color: C.dimWhite, fontSize: 11, marginTop: 2 },
  optionCard:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 11, marginBottom: 8 },
  optionName:      { color: C.white, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  optionWhy:       { color: C.dimWhite, fontSize: 12, lineHeight: 18 },
  optionSavings:   { color: C.gold, fontWeight: '700', fontSize: 12, marginTop: 4 },
  storeSection:    { color: C.teal, fontSize: 12, fontWeight: '600', marginVertical: 8 },
  intelCard:       { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.electricBlue, borderWidth: 1, borderColor: C.glassBorder, padding: 13, marginBottom: 10 },
  intelHeader:     { color: C.electricBlue, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  intelBody:       { color: C.white, fontSize: 13, lineHeight: 21 },
  vaultCard:       { backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10, borderWidth: 1, borderColor: C.gold, padding: 13, marginBottom: 10 },
  vaultLabel:      { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  vaultBody:       { color: C.white, fontSize: 13, lineHeight: 20 },
  waypointRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10, marginBottom: 6 },
  waypointLetter:  { color: C.teal, fontWeight: '900', fontSize: 14, width: 24 },
  waypointName:    { color: C.white, flex: 1, fontSize: 13 },
  removeWp:        { color: C.red, fontWeight: '800', fontSize: 16, paddingLeft: 8 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  statItem:        { alignItems: 'center' },
  statValue:       { color: C.white, fontSize: 20, fontWeight: '900' },
  statLabel:       { color: C.dimWhite, fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  loadingCard:     { marginHorizontal: 12, marginVertical: 8, padding: 28, backgroundColor: C.glass, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.glassBorder },
  loadingLabel:    { fontWeight: '900', fontSize: 11, letterSpacing: 2, marginTop: 14, textAlign: 'center' },
  loadingSubLabel: { color: C.dimWhite, fontSize: 9, letterSpacing: 1, marginTop: 6, textAlign: 'center' },
});
