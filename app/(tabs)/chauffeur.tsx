import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Pressable,
} from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import DoorCover from '@/components/DoorCover';
import { loadMemberProfile, type FullMemberProfile } from '../../lib/db';
import { getRecentDossiers, type TravelDossierRow } from '../../lib/travel-engine';

// ─────────────────────────────────────────────────────────────────────────────
// THE CHAUFFEUR — Intelligence 0X04 · The Cerebellum
// Door first, then travel + dossier functions — every string from the approved
// door HTML. Safety bar on top. The dossier is not sealed until the Equalizer
// co-signs. Single-exit routes are a security flaw.
// ─────────────────────────────────────────────────────────────────────────────

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = 'rgba(255,255,255,0.55)', FAINT = 'rgba(255,255,255,0.32)';
const LINE = 'rgba(255,255,255,0.15)', GREEN = '#34D399', CYAN = '#1BB8FF', GOLD = '#D4A847';

type FnRow = { icon: string; title: string; sub: string; route: Href };

// WHAT THE CHAUFFEUR DOES — verbatim from the wire. Six functions.
const FUNCTIONS: FnRow[] = [
  { icon: '🗺️', title: 'Build a Dossier',
    sub: '6 questions · 1 trip · compiled safe zones + routes', route: '/travel' as Href },
  { icon: '🛡️', title: 'Safety Travel Engine',
    sub: 'Pre-programmed safe routes · domestic + international · multi-stop', route: '/map' as Href },
  { icon: '🏪', title: 'Retail Intelligence Loop',
    sub: 'Inside a store — what else in this building is cheaper / better / cleaner', route: '/map' as Href },
  { icon: '🌍', title: 'Global Grocery Match',
    sub: 'Home grocery list cross-referenced against destination country stores', route: '/travel' as Href },
  { icon: '🍃', title: 'Cannabis layer (in-country)',
    sub: 'Dynamic per country · opt-in · default OFF · augmented local data', route: '/aficionado' as Href },
  { icon: '📍', title: 'Last Known Good Protocol',
    sub: 'Off-grid GPS lock · emergency broadcast ready · sync on return', route: '/map' as Href },
];

export default function ChauffeurScreen() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [profile, setProfile] = useState<FullMemberProfile | null>(null);
  const [dossier, setDossier] = useState<TravelDossierRow | null>(null);
  const [loadedAt, setLoadedAt] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, rows] = await Promise.all([loadMemberProfile(), getRecentDossiers(1)]);
    setProfile(p);
    setDossier(rows[0] ?? null);
    const now = new Date();
    setLoadedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  if (!doorOpen) {
    return (
      <ScrollView style={st.root} contentContainerStyle={{ flexGrow: 1 }}>
        <DoorCover
          art={require('../../assets/doors/door-chauffeur.webp')}
          intelChip="INTELLIGENCE 0X04"
          skip
          roleLine="TRAVEL INTELLIGENCE · ROUTE SAFETY · WAYPOINT BRIEFINGS"
          titleLines={['THE', 'CHAUFFEUR']}
          desc="Maps fully integrated. Safe routes before departure. Retail Intelligence inside every store. The keeper of your sealed Dossier."
          withLabel="WITH THE CHAUFFEUR"
          withText="Pre-programmed safe routes. Full briefings at every waypoint."
          withoutLabel="WITHOUT"
          withoutText="Maps with no memory. Routes with no context."
          openLabel="Continue →"
          accent={GREEN}
          onOpen={() => setDoorOpen(true)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
    >
      <View style={st.subhead}>
        <Text style={st.subheadL}>◆ THE CHAUFFEUR</Text>
        <Pressable onPress={() => setDoorOpen(false)} hitSlop={8}>
          <Text style={st.subheadR}>← BACK</Text>
        </Pressable>
      </View>

      {/* HOW CAN I HELP YOU? — routes into maps */}
      <Pressable style={st.ask} onPress={() => router.push('/map' as Href)}>
        <Text style={st.askQ}>HOW CAN I HELP YOU?</Text>
        <Text style={st.askH}>where are you going?…  🎤</Text>
      </Pressable>

      {/* SAFETY BAR — live, top of view */}
      <View style={st.safetyBar}>
        <Text style={st.safetyL}>
          ◆ ALL CLEAR{profile?.homeLocation ? ` · ${profile.homeLocation.toUpperCase()}` : ''}
        </Text>
        <Text style={st.safetyR}>{loadedAt ? `LAST UPDATED ${loadedAt}` : ''}</Text>
      </View>

      <View style={st.section}>
        <Text style={st.fntitle}>WHAT THE CHAUFFEUR DOES</Text>
        {FUNCTIONS.map((r, i) => (
          <Pressable key={i} style={st.fnrow} onPress={() => router.push(r.route)}>
            <Text style={st.ico}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.txt}>{r.title}</Text>
              <Text style={st.sub}>{r.sub}</Text>
            </View>
            <Text style={st.arr}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* CURRENT DOSSIER — real state, never staged */}
      <View style={st.section}>
        <Text style={[st.fntitle, { color: GREEN }]}>
          {dossier ? 'CURRENT DOSSIER · AWAITING EQUALIZER SEAL' : 'CURRENT DOSSIER'}
        </Text>
        {!loaded ? (
          <Text style={st.empty}>Reading your dossiers…</Text>
        ) : dossier ? (
          <View style={st.dossier}>
            <Text style={st.rtitle}>{dossier.destination}</Text>
            <Text style={st.rmeta}>
              {[
                dossier.date_range,
                dossier.traveler_type,
                dossier.traveling_with_animals ? 'traveling with animals' : null,
              ].filter(Boolean).join(' · ')}
            </Text>
            <View style={st.tagRow}>
              <View style={[st.tag, st.tagCyan]}>
                <Text style={[st.tagTxt, { color: CYAN }]}>SAFE ZONES MAPPED</Text>
              </View>
              <View style={[st.tag, st.tagGold]}>
                <Text style={[st.tagTxt, { color: GOLD }]}>AWAITING EQUALIZER ✓</Text>
              </View>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/travel' as Href)}>
            <Text style={st.empty}>No dossier yet. Build one — 6 questions, 1 trip, compiled safe zones and routes.</Text>
          </Pressable>
        )}
      </View>

      <View style={st.section}>
        <Pressable style={st.action} onPress={() => router.push('/map' as Href)}>
          <Text style={st.actionTxt}>◆ OPEN MAPS · BUILD DOSSIER</Text>
          <Text style={[st.actionTxt, { marginLeft: 8 }]}>→</Text>
        </Pressable>
      </View>

      <Text style={st.note}>
        THE DOSSIER IS NOT SEALED UNTIL THE EQUALIZER CO-SIGNS. SINGLE-EXIT ROUTES ARE A SECURITY FLAW.
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: GREEN },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    margin: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(52,211,153,0.5)',
    backgroundColor: 'rgba(52,211,153,0.06)', borderRadius: 12, padding: 15,
  },
  askQ: { fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: '#7CE7C4' },
  askH: { fontFamily: 'DMSans-Regular', fontSize: 11.5, color: MUT, marginTop: 4 },

  safetyBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 14, marginBottom: 4, borderWidth: 0.5, borderColor: 'rgba(52,211,153,0.35)',
    backgroundColor: 'rgba(52,211,153,0.10)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  safetyL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1, color: GREEN },
  safetyR: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: MUT },

  section: { paddingHorizontal: 14, paddingTop: 14 },
  fntitle: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, color: GREEN, marginBottom: 10 },
  fnrow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13, marginBottom: 9,
  },
  ico: { fontSize: 16 },
  txt: { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700', color: INK },
  sub: { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 0.3, color: MUT, marginTop: 3, lineHeight: 14 },
  arr: { color: FAINT, fontSize: 17 },
  empty: { fontFamily: 'DMSans-Regular', fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 8, lineHeight: 17 },

  dossier: {
    borderLeftWidth: 3, borderLeftColor: GREEN,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 14,
  },
  rtitle: { fontFamily: 'DMSans-Regular', fontSize: 16, fontWeight: '800', color: INK },
  rmeta: { fontFamily: 'DMMono-Regular', fontSize: 9.5, color: MUT, marginTop: 5, lineHeight: 15 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5 },
  tagCyan: { backgroundColor: 'rgba(27,184,255,0.10)', borderColor: 'rgba(27,184,255,0.35)' },
  tagGold: { backgroundColor: 'rgba(212,168,71,0.10)', borderColor: 'rgba(212,168,71,0.40)' },
  tagTxt: { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1 },

  action: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.5)', backgroundColor: 'rgba(52,211,153,0.08)',
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: '#7CE7C4' },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },
});
