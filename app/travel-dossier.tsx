import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTheme, dl, type Tokens } from '@/lib/theme-mode';

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 09 — THE TRAVEL DOSSIER — wired 2026-09-19.
// PANEL 11 — THE CANNABIS DATA LAYER — compiled here as module 05.
//
// Built to the investor-brief panels, not summarised from them:
//   ~/AA2/AA2 Panama QR CODES canibus panel/aa2_panel_09_travel_dossier.html
//   ~/AA2/AA2 Panama QR CODES canibus panel/aa2_panel_11_cannabis_layer.html
//
// Section 05 of the Business Position Brief: "Compiled before departure.
// Carried on the trip. Annotated on return… It prints, and it works with the
// phone off."
//
// PANEL 11'S LAW, VERBATIM FROM THE PANEL: "Legality is one input among many.
// The membrane reports facts. The member decides." Nothing on the cannabis
// module advocates, recommends or discourages. It states the law, applies the
// Commander filter on top where the member is subject to one, and stops.
// ─────────────────────────────────────────────────────────────────────────────

const ORANGE = '#E08A3C';
const GREEN  = '#34D399';
const AMBER  = '#E0A04A';
const RED    = '#E24B4A';

type Mod = { n: string; label: string; body: string[]; tone?: string };

const MODULES: Mod[] = [
  { n: '01', label: 'SAFETY', tone: AMBER, body: [
    'Mexico City sits at US Level 2 · Exercise Increased Caution. AA2 cross-references US State Dept, UK FCDO and OSAC threat reports.',
    'Polanco · SECURE · TOURIST. Roma Norte · SECURE · NIGHTLIFE. Condesa · SECURE · WALKABLE. Centro Histórico · DAY ONLY.',
    'Avoid Tepito and Iztapalapa after dark. Registered taxis or Uber, never street-hails. Carry a copy of the passport; leave the original at the hotel.',
  ]},
  { n: '02', label: 'ALLERGEN', tone: RED, body: [
    'Lily · tree nuts · SEVERE · onset ~15 min · 2.0× pediatric multiplier active.',
    'Local dishes that carry it: mole poblano (almond, sesame), rompope, chiles en nogada (walnut), pan de muerto (almond).',
    'Card phrase, printed and offline: “Mi hija es alérgica a los frutos secos. Es grave.”',
  ]},
  { n: '03', label: 'MEDICAL', tone: GREEN, body: [
    'Hospitals ranked by distance and by whether anyone there speaks the member’s language.',
    'Hospital ABC Observatorio · English spoken · 6.2 km. Médica Sur · English spoken · 11.4 km. Hospital Español · 4.8 km.',
    'Medication list travels border-ready with generic names and dosages.',
  ]},
  { n: '04', label: 'EMERGENCY', tone: RED, body: [
    'Emergency numbers for the country actually being visited, not the one the phone was bought in.',
    '911 · national emergency. 55 5346 3600 · Locatel. +52 55 5080 2000 · US Embassy CDMX.',
  ]},
  { n: '05', label: 'CANNABIS', tone: AMBER, body: [
    'MEXICO · VERIFIED 02 MAY 2026. Recreational LEGAL · Medical LEGAL · state variation applies.',
    'Personal possession 28g / 1oz — ALLOWED. Adults 18+. Above 5g and under 28g recognised as personal use under the SCJN ruling.',
    'Home cultivation up to 6 plants — ALLOWED with COFEPRIS permit; plants remain on private property.',
    'Public consumption — RESTRICTED. Prohibited in public spaces, parks, restaurants and plazas under federal anti-smoking law. Private residence only.',
    'Driving while impaired — PROHIBITED. Zero tolerance. Roadside testing in CDMX, Jalisco, Nuevo León.',
    'Cross-border transport — PROHIBITED. Federal trafficking offence regardless of destination legality.',
    'COMMANDER LAYER · ACTIVE — THC is WADA-prohibited in-competition. Filter: WADA + USADA. CBD with verified 0% THC may be permitted; verify chain of custody.',
    'Legality stops at the border. AA2 reports; the member decides.',
  ]},
  { n: '06', label: 'LANGUAGE', tone: GREEN, body: [
    'Spanish module compiled because the destination requires it, not because a menu offered it.',
    'The phrases a mother needs at the moment she will need them — allergen, pharmacy, emergency, taxi, altitude.',
  ]},
  { n: '07', label: 'ALTITUDE', tone: AMBER, body: [
    '2,240 m. Acclimation guidance keyed to the member’s own instruments, not to a population average.',
    'Expect elevated resting heart rate and depressed HRV for 48–72 h. That is altitude, not distress — the Clarifier will ask.',
  ]},
  { n: '08', label: 'BORDER', tone: AMBER, body: [
    'Declarable items, medication documentation, and what may not cross in either direction.',
  ]},
  { n: '09', label: 'DISPENSARY', tone: AMBER, body: [
    '142 dispensaries · 18 lounges recorded for the metro area. Listed as fact, filtered by the Commander Layer where one applies.',
  ]},
  { n: '10', label: 'ROUTES', tone: GREEN, body: [
    'One-way-in / one-way-out flagged. Peak-hour metro flagged. Route safety rated alongside destination safety.',
  ]},
  { n: '11', label: 'COMPETITION', tone: RED, body: [
    'WADA · USADA lists applied on top of local law for every compiled module. Where the two disagree, the stricter is reported.',
  ]},
];

const TRAVELERS = [
  { init: 'J', name: 'James',  meta: 'ADULT · 58' },
  { init: 'S', name: 'Sara',   meta: 'ADULT' },
  { init: 'L', name: 'Lily',   meta: 'CHILD · 9 · 2.0×', hot: true },
  { init: 'B', name: 'Buddy',  meta: 'STAYING · BOQUETE', dim: true },
];

const STACK = ['GARMIN TACTIX 8', 'OURA RING 4', 'BEATS PRO 2', 'OAKLEY META', 'MUSE S ATHENA'];

export default function TravelDossier() {
  const T = useTheme();
  const s = useMemo(() => make(T), [T]);
  const [open, setOpen] = useState<string | null>('01');

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        <View style={s.brandRow}>
          <Text style={s.brand}>AA2 PANAMA</Text>
          <Text style={s.brandSub}>AWARE · ADAPT · ADVANCE</Text>
        </View>

        <View style={s.notice}>
          <Text style={s.noticeTag}>TAKE NOTICE</Text>
          <Text style={s.noticeTxt}>Mexico City · Tourist zones secure</Text>
          <Text style={s.noticeMeta}>US LEVEL 2 · 3 SOURCES · UPDATED 02 MAY</Text>
        </View>

        <Text style={s.crumb}>TRAVEL / DOSSIER / MEXICO CITY</Text>

        <Text style={s.kicker}>AA2 TRAVEL DOSSIER · COMPILED 02·MAY·26</Text>
        <Text style={s.h1}>MEXICO</Text>
        <Text style={[s.h1, s.h1b]}>CITY.</Text>
        <Text style={s.dates}>03 → 10 MAY · 7 NIGHTS</Text>
        <Text style={s.sub}>
          Compiled before departure. Read on the way out. Carried on the trip. Annotated on return.
        </Text>

        <View style={s.stats}>
          <Stat s={s} v="7"    l="NIGHTS" />
          <Stat s={s} v="3"    l="TRAVELERS" />
          <Stat s={s} v="2240" l="ALTITUDE · M" />
          <Stat s={s} v="ES"   l="LANGUAGE" />
        </View>

        <Text style={s.legend}>TRAVELERS · WHO IS GOING</Text>
        <View style={s.card}>
          {TRAVELERS.map((t, i) => (
            <View key={t.name} style={[s.tRow, i === TRAVELERS.length - 1 && s.last, t.dim && s.dim]}>
              <View style={[s.avatar, t.hot && s.avatarHot]}>
                <Text style={[s.avatarTxt, t.hot && s.avatarTxtHot]}>{t.init}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tName}>{t.name}</Text>
                <Text style={s.tMeta}>{t.meta}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.legend}>STACK &amp; FILTERS · DEVICES + COMMANDER</Text>
        <View style={s.chipWrap}>
          {STACK.map(d => <View key={d} style={s.chip}><Text style={s.chipTxt}>{d}</Text></View>)}
        </View>
        <View style={s.cmdr}>
          <Text style={s.cmdrTxt}>COMMANDER LAYER · ON</Text>
          <View style={s.chipWrap}>
            <View style={s.chipHot}><Text style={s.chipHotTxt}>WADA</Text></View>
            <View style={s.chipHot}><Text style={s.chipHotTxt}>USADA</Text></View>
          </View>
        </View>

        <View style={s.legendRow}>
          <Text style={s.legend}>AT A GLANCE · MODULES COMPILED</Text>
          <Text style={s.count}>11 SECTIONS</Text>
        </View>

        <View style={s.card}>
          {MODULES.map((m, i) => {
            const isOpen = open === m.n;
            return (
              <View key={m.n} style={[s.mRow, i === MODULES.length - 1 && s.last]}>
                <TouchableOpacity activeOpacity={0.75} style={s.mHead}
                  onPress={() => setOpen(isOpen ? null : m.n)}>
                  <Text style={[s.mNum, { color: m.tone ?? ORANGE }]}>{m.n}</Text>
                  <Text style={s.mLabel}>{m.label}</Text>
                  <Text style={[s.mArrow, isOpen && s.mArrowOpen]}>→</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={s.mBody}>
                    {m.body.map((b, k) => (
                      <Text key={k} style={s.mTxt}>{b}</Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={s.lawBox}>
          <Text style={s.lawTxt}>
            Legality is one input among many. The membrane reports facts. The member decides.
          </Text>
        </View>

        <TouchableOpacity style={s.cta} activeOpacity={0.85}
          onPress={() => router.push('/travel-dossier-builder' as Href)}>
          <Text style={s.ctaTxt}>Recompile · change the answers</Text>
          <Text style={s.ctaArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.back} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={s.backTxt}>← BACK TO TRAVEL</Text>
        </TouchableOpacity>

        <Text style={s.foot}>It prints, and it works with the phone off.</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ s, v, l }: { s: any; v: string; l: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statV}>{v}</Text>
      <Text style={s.statL}>{l}</Text>
    </View>
  );
}

const make = (T: Tokens) => {
  const BG    = dl(T, '#0A0804', '#FAF7F2');
  const CARD  = dl(T, '#150F0A', '#FFFFFF');
  const LINE  = dl(T, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.10)');
  const INK   = dl(T, '#FFFFFF', '#141414');
  const MUT   = dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)');
  const FAINT = dl(T, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    pad: { padding: 20, paddingBottom: 56 },
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    brand: { color: ORANGE, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
    brandSub: { color: FAINT, fontSize: 9, letterSpacing: 1.6 },
    notice: { borderWidth: 1, borderColor: AMBER, borderRadius: 4, padding: 12, marginBottom: 18 },
    noticeTag: { color: AMBER, fontSize: 9, letterSpacing: 1.8, fontWeight: '700', marginBottom: 4 },
    noticeTxt: { color: INK, fontSize: 14, marginBottom: 3 },
    noticeMeta: { color: FAINT, fontSize: 9, letterSpacing: 1.2 },
    crumb: { color: MUT, fontSize: 10, letterSpacing: 1.8, marginBottom: 22 },
    kicker: { color: ORANGE, fontSize: 9, letterSpacing: 1.8, marginBottom: 8 },
    h1: { color: INK, fontSize: 40, lineHeight: 42, fontWeight: '300', letterSpacing: -1 },
    h1b: { fontWeight: '700', marginBottom: 8 },
    dates: { color: ORANGE, fontSize: 11, letterSpacing: 1.8, marginBottom: 12 },
    sub: { color: MUT, fontSize: 13, lineHeight: 20, marginBottom: 24 },
    stats: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    stat: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
    statV: { color: INK, fontSize: 20, fontWeight: '700' },
    statL: { color: FAINT, fontSize: 8, letterSpacing: 1.2, marginTop: 3, textAlign: 'center' },
    legend: { color: FAINT, fontSize: 10, letterSpacing: 1.8, marginTop: 8, marginBottom: 10 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
    count: { color: ORANGE, fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginBottom: 10 },
    card: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 6, marginBottom: 12 },
    tRow: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: 1, borderBottomColor: LINE, gap: 12 },
    last: { borderBottomWidth: 0 },
    dim: { opacity: 0.45 },
    avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: LINE,
      alignItems: 'center', justifyContent: 'center' },
    avatarHot: { borderColor: RED },
    avatarTxt: { color: MUT, fontSize: 13, fontWeight: '700' },
    avatarTxtHot: { color: RED },
    tName: { color: INK, fontSize: 14 },
    tMeta: { color: FAINT, fontSize: 9, letterSpacing: 1.2, marginTop: 2 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: { borderWidth: 1, borderColor: LINE, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 6 },
    chipTxt: { color: MUT, fontSize: 9, letterSpacing: 1.1 },
    chipHot: { borderWidth: 1, borderColor: RED, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 6 },
    chipHotTxt: { color: RED, fontSize: 9, letterSpacing: 1.1, fontWeight: '700' },
    cmdr: { marginTop: 14, borderLeftWidth: 2, borderLeftColor: RED, paddingLeft: 12, paddingVertical: 4, gap: 8 },
    cmdrTxt: { color: RED, fontSize: 9, letterSpacing: 1.6, fontWeight: '700' },
    mRow: { borderBottomWidth: 1, borderBottomColor: LINE },
    mHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    mNum: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    mLabel: { color: INK, fontSize: 13, letterSpacing: 1.4, flex: 1 },
    mArrow: { color: FAINT, fontSize: 13 },
    mArrowOpen: { color: ORANGE, transform: [{ rotate: '90deg' }] },
    mBody: { paddingHorizontal: 14, paddingBottom: 16, gap: 9 },
    mTxt: { color: MUT, fontSize: 12, lineHeight: 19 },
    lawBox: { marginTop: 18, borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 14 },
    lawTxt: { color: INK, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
    cta: { marginTop: 24, backgroundColor: ORANGE, borderRadius: 4, padding: 16,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ctaTxt: { color: '#0A0804', fontSize: 14, fontWeight: '700' },
    ctaArrow: { color: '#0A0804', fontSize: 16, fontWeight: '700' },
    back: { marginTop: 16, alignItems: 'center' },
    backTxt: { color: FAINT, fontSize: 10, letterSpacing: 1.6 },
    foot: { color: FAINT, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: 28, fontStyle: 'italic' },
  });
};
