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
    return (data.results || []).slice(0, 6).map((r: any) => ({ name: r.name, vicinity: r.vicinity, placeId: r.place_id }));
  } catch { return []; }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPS_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.results?.[0]) { const loc = data.results[0].geometry.location; return { lat: loc.lat, lng: loc.lng }; }
  } catch {}
  return null;
}

export default function MapScreen() {
  const [mode, setMode]                   = useState<'retail' | 'travel'>('retail');
  const [userLocation, setUserLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [loading, setLoading]             = useState(false);

  const [stores, setStores]               = useState<StoreResult[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreResult | null>(null);
  const [scannedItem, setScannedItem]     = useState('');
  const [retailResult, setRetailResult]   = useState<any>(null);
  const [storesLoaded, setStoresLoaded]   = useState(false);
  const [manualStore, setManualStore]     = useState('');

  const [origin, setOrigin]               = useState('');
  const [destination, setDestination]     = useState('');
  const [waypoints, setWaypoints]         = useState<Waypoint[]>([]);
  const [waypointInput, setWaypointInput] = useState('');
  const [travelResult, setTravelResult]   = useState<string>('');
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
        system: `You are The Chauffeur — AA2's retail intelligence engine and The Chef's in-store partner. You fire INSIDE the store. Find what is better in this exact building right now. Cheaper. Better ingredients. Better nutrition. Calm, specific, never preachy. Return ONLY valid JSON — no markdown, no backticks: {"verdict":"string","betterOptions":[{"name":"string","why":"string","savings":"string or null"}],"chefNote":"string","storeSection":"string","actRightDollars":"string","equalizerNote":"string"}`,
        messages: [{ role: 'user', content: `I am inside ${selectedStore.name} at ${selectedStore.vicinity}. I picked up: ${scannedItem}. What else in this store is cheaper, better ingredients, or better nutrition?` }],
      });
      const raw = (response.content[0] as any).text || '';
      setRetailResult(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch { Alert.alert('Retail Loop Error', 'The Chauffeur could not complete analysis. Try again.'); }
    finally { setLoading(false); }
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
        const distKm = Math.round(Math.sqrt(Math.pow((dCoords.lat - oCoords.lat) * 111, 2) + Math.pow((dCoords.lng - oCoords.lng) * 111, 2)));
        setRouteStats({ distance: `~${distKm} km`, stops: waypoints.length + 2 });
      }
      const fullRoute = [origin, ...waypoints.map(w => w.name), destination].join(' → ');
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are The Chauffeur — AA2's safety travel intelligence. Pre-program the safest route before the user ever leaves. Domestic and international. Identify safe waypoints, rest stops, fuel points, emergency services, border crossing notes, areas to avoid, best travel times. Be specific, practical, calm. Best private driver energy. Plain text — not JSON.`,
        messages: [{ role: 'user', content: `Route: ${fullRoute}. Give a complete safety brief before I leave.` }],
      });
      setTravelResult((response.content[0] as any).text || '');
    } catch { Alert.alert('Route Error', 'The Chauffeur could not build the route. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.receipt}>I AM THE RECEIPT</Text>
        <Text style={styles.logo}>∞</Text>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeBtn, mode === 'retail' && { borderColor: C.orange, backgroundColor: 'rgba(245,146,42,0.1)' }]} onPress={() => { setMode('retail'); setRetailResult(null); }}>
          <Text style={styles.modeIcon}>🏪</Text>
          <Text style={[styles.modeLabel, mode === 'retail' && { color: C.orange }]}>RETAIL LOOP</Text>
          <Text style={styles.modeDesc}>Inside the store</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === 'travel' && { borderColor: C.teal, backgroundColor: 'rgba(46,207,179,0.1)' }]} onPress={() => { setMode('travel'); setTravelResult(''); }}>
          <Text style={styles.modeIcon}>🛡</Text>
          <Text style={[styles.modeLabel, mode === 'travel' && { color: C.teal }]}>TRAVEL ENGINE</Text>
          <Text style={styles.modeDesc}>Before you leave</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.locationBadge, { borderColor: locationReady ? C.teal : C.gold }]}>
        <Text style={[styles.locationText, { color: locationReady ? C.teal : C.gold }]}>
          {locationReady ? `📍 Location active — ${userLocation?.latitude.toFixed(4)}, ${userLocation?.longitude.toFixed(4)}` : '📍 Acquiring location...'}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>
        {mode === 'retail' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏪 RETAIL INTELLIGENCE LOOP</Text>
              <Text style={styles.cardDesc}>Fires inside the store. Finds what else in this building is cheaper, cleaner, or better.</Text>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.electricBlue }]} onPress={findNearbyStores}>
                <Text style={styles.primaryBtnText}>📍 FIND STORES NEAR ME</Text>
              </TouchableOpacity>
              <Text style={styles.sectionLabel}>OR ENTER STORE NAME MANUALLY</Text>
              <View style={styles.rowInput}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="e.g. Walmart, Kroger, Whole Foods..." placeholderTextColor={C.dimWhite} value={manualStore} onChangeText={setManualStore} onSubmitEditing={addManualStore} />
                <TouchableOpacity style={styles.addBtn} onPress={addManualStore}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
              </View>
              {storesLoaded && stores.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>SELECT YOUR STORE</Text>
                  {stores.map((store, i) => (
                    <TouchableOpacity key={i} style={[styles.storeRow, selectedStore?.name === store.name && { borderColor: C.orange, backgroundColor: 'rgba(245,146,42,0.08)' }]} onPress={() => setSelectedStore(store)}>
                      <Text style={styles.storeName}>{store.name}</Text>
                      <Text style={styles.storeVicinity}>{store.vicinity}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              <Text style={styles.sectionLabel}>WHAT DID YOU PICK UP?</Text>
              <TextInput style={styles.input} placeholder="e.g. Tropicana OJ, Kraft Mac & Cheese..." placeholderTextColor={C.dimWhite} value={scannedItem} onChangeText={setScannedItem} />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.orange }]} onPress={runRetailLoop}>
                <Text style={[styles.primaryBtnText, { color: C.nearBlack }]}>⚡ RUN RETAIL LOOP</Text>
              </TouchableOpacity>
            </View>

            {loading && <View style={styles.loadingCard}><ActivityIndicator size="large" color={C.orange} /><Text style={[styles.loadingLabel, { color: C.orange }]}>THE CHAUFFEUR IS SCANNING THE STORE</Text></View>}

            {retailResult && !loading && (
              <View style={styles.card}>
                <View style={[styles.intelCard, { borderLeftColor: C.orange }]}>
                  <Text style={[styles.intelHeader, { color: C.orange }]}>🚗 THE CHAUFFEUR</Text>
                  <Text style={styles.intelBody}>{retailResult.verdict}</Text>
                </View>
                {retailResult.betterOptions?.length > 0 && (
                  <>{<Text style={styles.sectionLabel}>BETTER OPTIONS IN THIS STORE NOW</Text>}
                  {retailResult.betterOptions.map((opt: any, i: number) => (
                    <View key={i} style={styles.optionCard}>
                      <Text style={styles.optionName}>{opt.name}</Text>
                      <Text style={styles.optionWhy}>{opt.why}</Text>
                      {opt.savings && <Text style={styles.optionSavings}>💰 {opt.savings}</Text>}
                    </View>
                  ))}</>
                )}
                {retailResult.storeSection && <Text style={styles.storeSection}>📍 Find it: {retailResult.storeSection}</Text>}
                {retailResult.equalizerNote && <View style={styles.intelCard}><Text style={styles.intelHeader}>⚖ THE EQUALIZER</Text><Text style={styles.intelBody}>{retailResult.equalizerNote}</Text></View>}
                {retailResult.chefNote && <View style={[styles.intelCard, { borderLeftColor: C.gold }]}><Text style={[styles.intelHeader, { color: C.gold }]}>👨‍🍳 THE CHEF</Text><Text style={styles.intelBody}>{retailResult.chefNote}</Text></View>}
                {retailResult.actRightDollars && <View style={styles.vaultCard}><Text style={styles.vaultLabel}>💎 ACT RIGHT DOLLARS — THE VAULT</Text><Text style={styles.vaultBody}>{retailResult.actRightDollars}</Text></View>}
                <TouchableOpacity style={[styles.primaryBtn, { borderWidth: 1, borderColor: C.orange, backgroundColor: 'transparent', marginTop: 8 }]} onPress={() => setRetailResult(null)}>
                  <Text style={[styles.primaryBtnText, { color: C.orange }]}>SCAN ANOTHER ITEM</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {mode === 'travel' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛡 SAFETY TRAVEL ENGINE</Text>
              <Text style={styles.cardDesc}>Pre-program your route before you leave. Domestic and international. The Chauffeur briefs you on every leg.</Text>
              <Text style={styles.sectionLabel}>ORIGIN</Text>
              <TextInput style={styles.input} placeholder="e.g. Bozeman, Montana" placeholderTextColor={C.dimWhite} value={origin} onChangeText={setOrigin} />
              <Text style={styles.sectionLabel}>DESTINATION</Text>
              <TextInput style={styles.input} placeholder="e.g. Panama City, Panama" placeholderTextColor={C.dimWhite} value={destination} onChangeText={setDestination} />
              {waypoints.length > 0 && (
                <>{<Text style={styles.sectionLabel}>STOPS ALONG THE WAY</Text>}
                {waypoints.map((wp, i) => (
                  <View key={wp.id} style={styles.waypointRow}>
                    <Text style={styles.waypointLetter}>{String.fromCharCode(66 + i)}</Text>
                    <Text style={styles.waypointName}>{wp.name}</Text>
                    <TouchableOpacity onPress={() => setWaypoints(prev => prev.filter(w => w.id !== wp.id))}><Text style={styles.removeWp}>✕</Text></TouchableOpacity>
                  </View>
                ))}</>
              )}
              <Text style={styles.sectionLabel}>ADD A STOP</Text>
              <View style={styles.rowInput}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="City, address, or landmark" placeholderTextColor={C.dimWhite} value={waypointInput} onChangeText={setWaypointInput} onSubmitEditing={addWaypoint} />
                <TouchableOpacity style={styles.addBtn} onPress={addWaypoint}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.teal, marginTop: 14 }]} onPress={buildSafeRoute}>
                <Text style={[styles.primaryBtnText, { color: C.nearBlack }]}>🛡 BUILD SAFE ROUTE</Text>
              </TouchableOpacity>
            </View>

            {loading && <View style={styles.loadingCard}><ActivityIndicator size="large" color={C.teal} /><Text style={[styles.loadingLabel, { color: C.teal }]}>THE CHAUFFEUR IS PLANNING YOUR ROUTE</Text><Text style={styles.loadingSubLabel}>Domestic + International Safety Intelligence Active</Text></View>}

            {routeStats && !loading && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📍 ROUTE LOCKED</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}><Text style={styles.statValue}>{routeStats.distance}</Text><Text style={styles.statLabel}>DISTANCE</Text></View>
                  <View style={styles.statItem}><Text style={styles.statValue}>{routeStats.stops}</Text><Text style={styles.statLabel}>TOTAL STOPS</Text></View>
                </View>
              </View>
            )}

            {travelResult !== '' && !loading && (
              <View style={styles.card}>
                <View style={[styles.intelCard, { borderLeftColor: C.teal }]}>
                  <Text style={[styles.intelHeader, { color: C.teal }]}>🚗 THE CHAUFFEUR — SAFETY BRIEF</Text>
                  <Text style={styles.intelBody}>{travelResult}</Text>
                </View>
                <TouchableOpacity style={[styles.primaryBtn, { borderWidth: 1, borderColor: C.teal, backgroundColor: 'transparent', marginTop: 8 }]} onPress={() => { setTravelResult(''); setRouteStats(null); setOrigin(''); setDestination(''); setWaypoints([]); }}>
                  <Text style={[styles.primaryBtnText, { color: C.teal }]}>PLAN ANOTHER ROUTE</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.nearBlack },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  receipt:        { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 9, color: C.dimWhite, letterSpacing: 2 },
  logo:           { fontSize: 20, color: C.electricBlue },
  modeRow:        { flexDirection: 'row', padding: 12, gap: 10 },
  modeBtn:        { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glass },
  modeIcon:       { fontSize: 20, marginBottom: 4 },
  modeLabel:      { color: C.dimWhite, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  modeDesc:       { color: C.dimWhite, fontSize: 9, marginTop: 2, opacity: 0.7 },
  locationBadge:  { marginHorizontal: 12, marginBottom: 8, padding: 8, borderRadius: 8, borderWidth: 1 },
  locationText:   { fontSize: 10, fontWeight: '600' },
  body:           { flex: 1 },
  card:           { margin: 12, marginTop: 8, padding: 16, backgroundColor: C.glass, borderRadius: 12, borderWidth: 1, borderColor: C.glassBorder },
  cardTitle:      { color: C.white, fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  cardDesc:       { color: C.dimWhite, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  sectionLabel:   { color: C.dimWhite, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 6, marginTop: 10 },
  input:          { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 8, color: C.white, padding: 11, fontSize: 13, marginBottom: 10 },
  primaryBtn:     { paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 1.5, color: C.white },
  rowInput:       { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  addBtn:         { backgroundColor: C.electricBlue, width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtnText:     { color: C.nearBlack, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  storeRow:       { padding: 11, borderRadius: 8, borderWidth: 1, borderColor: C.glassBorder, marginBottom: 6 },
  storeName:      { color: C.white, fontWeight: '700', fontSize: 13 },
  storeVicinity:  { color: C.dimWhite, fontSize: 11, marginTop: 2 },
  optionCard:     { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 11, marginBottom: 8 },
  optionName:     { color: C.white, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  optionWhy:      { color: C.dimWhite, fontSize: 12, lineHeight: 18 },
  optionSavings:  { color: C.gold, fontWeight: '700', fontSize: 12, marginTop: 4 },
  storeSection:   { color: C.teal, fontSize: 12, fontWeight: '600', marginVertical: 8 },
  intelCard:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.electricBlue, borderWidth: 1, borderColor: C.glassBorder, padding: 13, marginBottom: 10 },
  intelHeader:    { color: C.electricBlue, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  intelBody:      { color: C.white, fontSize: 13, lineHeight: 21 },
  vaultCard:      { backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10, borderWidth: 1, borderColor: C.gold, padding: 13, marginBottom: 10 },
  vaultLabel:     { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  vaultBody:      { color: C.white, fontSize: 13, lineHeight: 20 },
  waypointRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10, marginBottom: 6 },
  waypointLetter: { color: C.teal, fontWeight: '900', fontSize: 14, width: 24 },
  waypointName:   { color: C.white, flex: 1, fontSize: 13 },
  removeWp:       { color: C.red, fontWeight: '800', fontSize: 16, paddingLeft: 8 },
  statsRow:       { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  statItem:       { alignItems: 'center' },
  statValue:      { color: C.white, fontSize: 20, fontWeight: '900' },
  statLabel:      { color: C.dimWhite, fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
  loadingCard:    { margin: 12, padding: 28, backgroundColor: C.glass, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.glassBorder },
  loadingLabel:   { fontWeight: '900', fontSize: 11, letterSpacing: 2, marginTop: 14, textAlign: 'center' },
  loadingSubLabel:{ color: C.dimWhite, fontSize: 9, letterSpacing: 1, marginTop: 6, textAlign: 'center' },
});
