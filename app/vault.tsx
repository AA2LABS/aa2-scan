// ─── app/vault.tsx ───────────────────────────────────────────────────────────
// THE VAULT — built to the founder's approved mock:
//   AA2_Mockups_March31_2026/02_vault_mobile_light.html
//
// Section order is the mock's order, unchanged:
//   THE VAULT header → VISION BOARD (Zone 01 Declaration · Zone 02 Evidence ·
//   Zone 03 Horizon) → TRAVEL MY PLANET → LIVE COOKING → AA2 DEBIT CARD.
//
// PALETTE NOTE: the mock is "mobile light" from March. The shipped app is the
// membrane in motion — navy. The LAYOUT here is the founder's, exactly; the
// colours are the app's live CARD LAW so this screen does not arrive as a
// white flash inside a dark membrane. Light mode remains an open item
// (Canon v25 §9/§20) and this screen will follow the selector when it lands.
//
// NO FAKE DATA. Real values come from vault_ledger and the member's profile.
// The mock shows a destination, a ticket price, a day streak and a block count
// that have NO column in the schema yet — those render as honest empty states,
// never as invented numbers. The debit card shows the real ACT RIGHT balance
// and is plainly marked NOT ISSUED, because no card exists.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { loadMemberProfile, getVaultLedgerTotal, type FullMemberProfile } from '@/lib/db';
import { PALETTE, TYPE } from '@/lib/theme';

const NAVY  = PALETTE.navy;
const INK   = PALETTE.ink;
const GOLD  = PALETTE.gold;
const MUT   = 'rgba(255,255,255,0.55)';
const FAINT = 'rgba(255,255,255,0.32)';
const LINE  = 'rgba(255,255,255,0.12)';

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

export default function VaultScreen() {
  const [p, setP] = useState<FullMemberProfile | null>(null);
  const [vault, setVault] = useState({ total: 0, thisMonth: 0, entries: 0 });

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      const [prof, led] = await Promise.all([loadMemberProfile(), getVaultLedgerTotal()]);
      if (!alive) return;
      setP(prof);
      setVault(led);
    })();
    return () => { alive = false; };
  }, []));

  const name        = p?.name ?? 'Member';
  const declarations = [p?.visionText, p?.northStar90d, p?.northStar30d].filter(Boolean) as string[];
  const goals       = p?.primaryGoal ?? [];
  const targetDate  = p?.targetDate ?? null;
  const home        = p?.homeLocation ?? null;

  return (
    <ScrollView style={st.page} contentContainerStyle={{ paddingBottom: 50 }}>

      {/* ── HERO — the vault door art, finally used ─────────────────── */}
      <ImageBackground
        source={require('@/assets/doors/door-vault.jpg')}
        style={st.hero}
        imageStyle={{ opacity: 0.5 }}
        resizeMode="cover"
      >
        <View style={st.heroScrim} />
        <Pressable style={st.back} onPress={() => router.back()}>
          <Text style={st.backTxt}>← BACK</Text>
        </Pressable>
        <View style={st.heroContent}>
          <Text style={st.eyebrow}>THE VAULT</Text>
          <Text style={st.heroName}>{name}</Text>
          <Text style={st.heroSub}>Private · Choose what to share</Text>
        </View>
      </ImageBackground>

      {/* ── VISION BOARD ────────────────────────────────────────────── */}
      <Text style={st.sectionLabel}>VISION BOARD</Text>
      <View style={st.card}>

        <View style={st.zone}>
          <Text style={st.zoneTag}>ZONE 01 · THE DECLARATION</Text>
          {declarations.length ? (
            declarations.map((d, i) => (
              <Text key={i} style={st.declaration}>“{d}”</Text>
            ))
          ) : (
            <Text style={st.empty}>
              Nothing declared yet. What you say you want lives here — and every scan
              filters against it.
            </Text>
          )}
        </View>

        <View style={st.zone}>
          <Text style={st.zoneTag}>ZONE 02 · THE EVIDENCE</Text>
          <View style={st.evRow}>
            <View style={st.ev}>
              <Text style={st.evNum}>{money(vault.total)}</Text>
              <Text style={st.evLabel}>act right</Text>
            </View>
            <View style={st.ev}>
              <Text style={st.evNum}>{vault.entries}</Text>
              <Text style={st.evLabel}>followed</Text>
            </View>
            <View style={st.ev}>
              <Text style={st.evNum}>{money(vault.thisMonth)}</Text>
              <Text style={st.evLabel}>this month</Text>
            </View>
            <View style={st.ev}>
              <Text style={[st.evNum, { color: FAINT }]}>—</Text>
              <Text style={st.evLabel}>day streak</Text>
            </View>
          </View>
          {vault.entries === 0 && (
            <Text style={st.empty}>
              Follow a scanner recommendation and the first receipt lands here.
            </Text>
          )}
        </View>

        <View style={[st.zone, st.zoneLast]}>
          <Text style={st.zoneTag}>ZONE 03 · THE HORIZON</Text>
          <View style={st.horizonRow}>
            {goals.slice(0, 3).map((g, i) => (
              <View key={i} style={[st.tile, st.tileFilled]}>
                <Text style={st.tileText} numberOfLines={3}>{g}</Text>
              </View>
            ))}
            {Array.from({ length: Math.max(0, 3 - goals.length) }).map((_, i) => (
              <Pressable
                key={`e${i}`}
                style={[st.tile, st.tileEmpty]}
                onPress={() => router.push('/vision-board' as Href)}
              >
                <Text style={st.tilePlus}>+</Text>
              </Pressable>
            ))}
          </View>
          {targetDate ? <Text style={st.tinyNote}>Target on file · {targetDate}</Text> : null}
        </View>
      </View>

      {/* ── TRAVEL MY PLANET ────────────────────────────────────────── */}
      <Text style={st.sectionLabel}>TRAVEL MY PLANET</Text>
      <View style={st.card}>
        <View style={st.zone}>
          <Text style={st.zoneTag}>DESTINATION · DRAGGED FROM TRAVEL ENGINE</Text>
          <Text style={st.empty}>
            No destination pinned yet. The Chauffeur routes one in here, and every
            Aware Dollar you reclaim starts filling it. {home ? `Departing ${home}.` : ''}
          </Text>
          <Pressable style={st.ghostBtn} onPress={() => router.push('/travel' as Href)}>
            <Text style={st.ghostTxt}>OPEN THE CHAUFFEUR →</Text>
          </Pressable>
        </View>
        <View style={[st.zone, st.zoneLast]}>
          <View style={st.pbLabel}>
            <Text style={st.pbText}>{money(vault.total)} reclaimed</Text>
            <Text style={[st.pbText, { color: GOLD }]}>NO TICKET PRICE SET</Text>
          </View>
          <View style={st.pbTrack}>
            <View style={[st.pbFill, { width: '0%' }]} />
          </View>
          <Text style={st.tinyNote}>
            The bar fills against a real ticket price. It will not draw a percentage of a number nobody entered.
          </Text>
        </View>
      </View>

      {/* ── LIVE COOKING ────────────────────────────────────────────── */}
      <Text style={st.sectionLabel}>LIVE COOKING</Text>
      <View style={st.card}>
        <View style={st.lcHeader}>
          <Text style={st.lcTitle}>Start a live session</Text>
          <View style={st.lcPts}><Text style={st.lcPtsTxt}>+50 PTS · FULL STACK</Text></View>
        </View>
        <View style={st.lcModes}>
          <View style={[st.lcMode, st.lcModePrimary]}>
            <Text style={st.lcIcon}>👓</Text>
            <Text style={[st.lcModeLabel, { color: '#8FB6E8' }]}>Meta glasses + WhatsApp</Text>
          </View>
          <View style={st.lcMode}>
            <Text style={st.lcIcon}>📷</Text>
            <Text style={st.lcModeLabel}>Phone camera direct</Text>
          </View>
        </View>
        <Text style={[st.tinyNote, { paddingHorizontal: 14, paddingBottom: 12 }]}>
          Live sessions need the Meta Wearables toolkit and a native build. No history yet — your first cook writes the first chip.
        </Text>
      </View>

      {/* ── AA2 DEBIT CARD ──────────────────────────────────────────── */}
      <Text style={st.sectionLabel}>AA2 DEBIT CARD</Text>
      <View style={st.debit}>
        <View style={st.dcTop}>
          <Text style={st.dcBrand}>AA2 · ACT RIGHT</Text>
          <View style={st.dcChip} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Text style={st.dcBalLabel}>ACT RIGHT BALANCE</Text>
          <Text style={st.dcBalAmt}>{money(vault.total)}</Text>
        </View>
        <Text style={st.dcNum}>•••• •••• •••• ••••</Text>
        <View style={st.dcBottom}>
          <Text style={st.dcFoot}>{name.toUpperCase()}</Text>
          <Text style={st.dcFoot}>STRIPE · WHITE LABELED</Text>
        </View>
        <View style={st.dcBadge}>
          <Text style={st.dcBadgeTxt}>NOT ISSUED · BALANCE IS REAL</Text>
        </View>
      </View>

      <Text style={st.foot}>
        The Vault is private. Nothing here leaves without you saying so.
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page:        { flex: 1, backgroundColor: NAVY },

  hero:        { height: 210, justifyContent: 'flex-end', backgroundColor: '#000' },
  heroScrim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,27,51,0.55)' },
  heroContent: { padding: 20 },
  eyebrow:     { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 2.5, color: GOLD, marginBottom: 5 },
  heroName:    { color: INK, fontSize: 24, fontWeight: '700' },
  heroSub:     { color: MUT, fontSize: TYPE.detail, marginTop: 4 },
  back:        { position: 'absolute', top: 44, left: 16, paddingHorizontal: 10, paddingVertical: 6 },
  backTxt:     { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.7)' },

  sectionLabel:{ fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 2, color: GOLD, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 7 },

  card:        { marginHorizontal: 12, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  zone:        { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  zoneLast:    { borderBottomWidth: 0 },
  zoneTag:     { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: FAINT, marginBottom: 6 },

  declaration: { color: GOLD, fontSize: 14, fontStyle: 'italic', lineHeight: 21, marginTop: 4 },
  empty:       { color: MUT, fontSize: TYPE.detail, lineHeight: 19, marginTop: 4 },
  tinyNote:    { color: FAINT, fontSize: 10.5, lineHeight: 17, marginTop: 8 },

  evRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  ev:          { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, minWidth: 74 },
  evNum:       { color: GOLD, fontSize: 14, fontFamily: 'DMMono-Regular' },
  evLabel:     { color: FAINT, fontSize: 9, fontFamily: 'DMMono-Regular', marginTop: 1 },

  horizonRow:  { flexDirection: 'row', gap: 6, marginTop: 6 },
  tile:        { flex: 1, minHeight: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tileFilled:  { backgroundColor: 'rgba(52,211,153,0.10)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.42)' },
  tileEmpty:   { borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)' },
  tileText:    { color: PALETTE.green, fontSize: 10.5, textAlign: 'center', lineHeight: 15 },
  tilePlus:    { color: FAINT, fontSize: 20 },

  ghostBtn:    { marginTop: 11, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(212,168,71,0.4)', backgroundColor: 'rgba(212,168,71,0.08)', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  ghostTxt:    { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 1.6, color: GOLD },

  pbLabel:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pbText:      { fontFamily: 'DMMono-Regular', fontSize: 9.5, color: FAINT },
  pbTrack:     { height: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.10)' },
  pbFill:      { height: 5, borderRadius: 4, backgroundColor: GOLD },

  lcHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  lcTitle:     { color: INK, fontSize: 13.5, fontWeight: '600' },
  lcPts:       { backgroundColor: 'rgba(52,211,153,0.10)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.42)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  lcPtsTxt:    { color: PALETTE.green, fontSize: 9, fontFamily: 'DMMono-Regular', letterSpacing: 1 },
  lcModes:     { flexDirection: 'row', gap: 6, padding: 14 },
  lcMode:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 12, alignItems: 'center' },
  lcModePrimary:{ backgroundColor: 'rgba(78,150,200,0.12)', borderColor: 'rgba(78,150,200,0.45)' },
  lcIcon:      { fontSize: 20, marginBottom: 6 },
  lcModeLabel: { color: MUT, fontSize: 10, fontFamily: 'DMMono-Regular', textAlign: 'center', lineHeight: 15 },

  debit:       { marginHorizontal: 12, marginBottom: 14, backgroundColor: '#1A1A0A', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(184,134,11,0.75)', padding: 16 },
  dcTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dcBrand:     { color: '#B8860B', fontSize: 10, fontFamily: 'DMMono-Regular', letterSpacing: 2 },
  dcChip:      { width: 24, height: 17, borderRadius: 3, backgroundColor: '#B8860B', opacity: 0.7 },
  dcBalLabel:  { color: '#7A6A3A', fontSize: 9, fontFamily: 'DMMono-Regular', letterSpacing: 1 },
  dcBalAmt:    { color: '#B8860B', fontSize: 24, fontFamily: 'DMMono-Regular', marginTop: 2 },
  dcNum:       { color: '#5A5238', fontSize: 12, fontFamily: 'DMMono-Regular', letterSpacing: 2, marginTop: 10 },
  dcBottom:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  dcFoot:      { color: '#6A6046', fontSize: 9, fontFamily: 'DMMono-Regular' },
  dcBadge:     { marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(184,134,11,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dcBadgeTxt:  { color: '#B8860B', fontSize: 8.5, fontFamily: 'DMMono-Regular', letterSpacing: 1.4 },

  foot:        { color: FAINT, fontSize: 11, textAlign: 'center', marginTop: 14, paddingHorizontal: 24, lineHeight: 18 },
});
