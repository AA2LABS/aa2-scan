import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTheme, dl, type Tokens } from '@/lib/theme-mode';
import { useProfile } from '@/components/DoorFlood';

// ─────────────────────────────────────────────────────────────────────────────
// PANEL 08 — TRAVEL DOSSIER BUILDER — wired 2026-09-19.
//
// Built to the investor-brief panel, not summarised from it:
//   ~/AA2/AA2 Panama QR CODES canibus panel/aa2_panel_08_dossier_builder.html
//
// Section 05 of the Business Position Brief states the law this screen obeys:
// "Six questions asked before a trip decide which of eleven modules compile…
//  Nothing compiles that is not needed."
//
// Q1 WHERE · Q2 WHEN · Q3 ACTIVITIES · Q4 WHO · Q5 INSTRUMENTS · Q6 FILTERS.
// Q1–Q4 are named in the panel. Q5 and Q6 are not drawn in Panel 08 — they are
// taken from Panel 09's own compiled header, which carries STACK & FILTERS ·
// DEVICES + COMMANDER. They are inferred from the dossier, not invented.
//
// SERVE THE TABLE: nothing here grades the member. "Pick truth, not
// aspiration" is an instruction to the member about their own trip, never a
// judgement of the answer they give.
// ─────────────────────────────────────────────────────────────────────────────

const ORANGE = '#E08A3C';

const ACTIVITIES = [
  'HIKING', 'CYCLING', 'URBAN', 'HUNTING', 'FISHING',
  'DIVE / WATER', 'BUSINESS', 'WELLNESS', 'BACKCOUNTRY', 'COASTAL',
] as const;

const INSTRUMENTS = [
  'GARMIN TACTIX 8', 'OURA RING 4', 'BEATS PRO 2', 'OAKLEY META', 'MUSE S ATHENA',
] as const;

const FILTERS = ['WADA', 'USADA', 'NCAA', 'NONE'] as const;

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_TITLE: Record<Step, [string, string]> = {
  1: ['WHERE ARE YOU', 'GOING?'],
  2: ['WHEN ARE YOU', 'TRAVELLING?'],
  3: ['WHAT WILL YOU', 'BE DOING?'],
  4: ["WHO'S", 'GOING?'],
  5: ['WHAT ARE YOU', 'CARRYING?'],
  6: ['WHAT ARE YOU', 'SUBJECT TO?'],
};

const STEP_SUB: Record<Step, string> = {
  1: 'Destination drives every module below it. A dossier for the wrong city is a dossier for nobody.',
  2: 'Dates set the compile window. Seasonal advisories, altitude acclimation and medication windows all key off this.',
  3: 'Activities drive module compilation. Pick truth, not aspiration. The Dossier compiles only what you actually need.',
  4: 'Every traveller carries their own sensitivity. A child is not a small adult, and the dog is a member.',
  5: 'Instruments determine depth, not access. The dossier compiles with whatever you bring.',
  6: 'If you are subject to a competition authority, the Commander Layer applies its list on top of the law.',
};

export default function TravelDossierBuilder() {
  const T = useTheme();
  const s = useMemo(() => make(T), [T]);
  const { p } = useProfile();

  const [step, setStep] = useState<Step>(1);
  const [where, setWhere] = useState('Mexico City, MX');
  const [when, setWhen] = useState('03 → 10 May · 7 nts');
  const [acts, setActs] = useState<string[]>(['URBAN', 'HIKING', 'WELLNESS']);
  const [who, setWho] = useState<string[]>([]);
  const [kit, setKit] = useState<string[]>([...INSTRUMENTS]);
  const [filt, setFilt] = useState<string>('WADA');

  const household = useMemo(() => {
    const name = p?.name ?? 'You';
    return [name, 'Sara', 'Lily', 'Buddy'];
  }, [p]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  // DESTINATION-AWARE — modules offered because of WHERE, not because of a menu.
  const destinationModules = [
    { label: 'SPANISH MODULE', on: /mexico|spain|costa rica|panam/i.test(where) },
    { label: 'ALTITUDE · 2240M', on: /mexico city/i.test(where) },
    { label: 'CANNABIS LAYER', on: /mexico|canada|thailand/i.test(where) },
    { label: `${filt} · ${filt === 'NONE' ? 'OFF' : 'ON'}`, on: filt !== 'NONE' },
  ];

  const chips = (list: readonly string[], sel: string[], set: (v: string[]) => void) => (
    <View style={s.chipWrap}>
      {list.map(v => {
        const on = sel.includes(v);
        return (
          <TouchableOpacity key={v} onPress={() => toggle(sel, set, v)}
            style={[s.chip, on && s.chipOn]} activeOpacity={0.8}>
            <Text style={[s.chipTxt, on && s.chipTxtOn]}>{v}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const [l1, l2] = STEP_TITLE[step];

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        <View style={s.brandRow}>
          <Text style={s.brand}>AA2 PANAMA</Text>
          <Text style={s.brandSub}>AWARE · ADAPT · ADVANCE</Text>
        </View>

        <View style={s.crumbRow}>
          <Text style={s.crumb}>TRAVEL · DOSSIER BUILDER</Text>
          <Text style={s.stepPill}>Q{step} OF 6</Text>
        </View>

        <Text style={s.h1}>{l1}</Text>
        <Text style={[s.h1, s.h1b]}>{l2}</Text>
        <Text style={s.sub}>{STEP_SUB[step]}</Text>

        {step === 1 && (
          <>
            <Text style={s.legend}>DESTINATION</Text>
            <View style={s.field}><Text style={s.fieldTxt}>{where}</Text></View>
            {chips(['Mexico City, MX', 'San José, CR', 'Bogotá, CO', 'Lisbon, PT'], [where], v => setWhere(v[0] ?? where))}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={s.legend}>DATES</Text>
            <View style={s.field}><Text style={s.fieldTxt}>{when}</Text></View>
            {chips(['03 → 10 May · 7 nts', '10 → 14 May · 4 nts', '01 → 21 Jun · 20 nts'], [when], v => setWhen(v[0] ?? when))}
          </>
        )}

        {step === 3 && (
          <>
            <View style={s.legendRow}>
              <Text style={s.legend}>SELECT ALL THAT APPLY</Text>
              <Text style={s.count}>{acts.length} SELECTED</Text>
            </View>
            {chips(ACTIVITIES, acts, setActs)}
          </>
        )}

        {step === 4 && (
          <>
            <View style={s.legendRow}>
              <Text style={s.legend}>THE HOUSEHOLD</Text>
              <Text style={s.count}>{who.length} GOING</Text>
            </View>
            {chips(household, who, setWho)}
          </>
        )}

        {step === 5 && (
          <>
            <View style={s.legendRow}>
              <Text style={s.legend}>INSTRUMENTS TRAVELLING</Text>
              <Text style={s.count}>{kit.length} ON</Text>
            </View>
            {chips(INSTRUMENTS, kit, setKit)}
          </>
        )}

        {step === 6 && (
          <>
            <Text style={s.legend}>COMMANDER LAYER</Text>
            {chips(FILTERS, [filt], v => setFilt(v[0] ?? 'NONE'))}
            {filt !== 'NONE' && (
              <View style={s.warn}>
                <Text style={s.warnTxt}>
                  {filt} list applies on top of local law. Where the two disagree, the stricter one is reported —
                  and AA2 reports. The member decides.
                </Text>
              </View>
            )}
          </>
        )}

        {/* AVAILABLE FOR <DESTINATION> — destination-aware, per the panel */}
        <Text style={s.legendTop}>AVAILABLE FOR {where.split(',')[0].toUpperCase()}</Text>
        <Text style={s.legendFaint}>DESTINATION-AWARE</Text>
        <View style={s.chipWrap}>
          {destinationModules.map(m => (
            <View key={m.label} style={[s.modChip, m.on && s.modChipOn]}>
              <Text style={[s.modTxt, m.on && s.modTxtOn]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* DOSSIER SO FAR */}
        <Text style={s.legendTop}>DOSSIER SO FAR</Text>
        <View style={s.card}>
          <SoFar s={s} n="Q1 · WHERE" v={where} onEdit={() => setStep(1)} done={step > 1} />
          <SoFar s={s} n="Q2 · WHEN" v={when} onEdit={() => setStep(2)} done={step > 2} />
          <SoFar s={s} n="Q3 · ACTIVITIES" v={acts.length ? acts.join(' · ') : '—'} onEdit={() => setStep(3)} done={step > 3} />
          <SoFar s={s} n="Q4 · WHO" v={who.length ? who.join(' · ') : '—'} onEdit={() => setStep(4)} done={step > 4} />
          <SoFar s={s} n="Q5 · INSTRUMENTS" v={kit.length ? `${kit.length} carried` : '—'} onEdit={() => setStep(5)} done={step > 5} />
          <SoFar s={s} n="Q6 · FILTERS" v={filt} onEdit={() => setStep(6)} done={step > 6} last />
        </View>

        {step < 6 ? (
          <TouchableOpacity style={s.cta} activeOpacity={0.85}
            onPress={() => setStep((step + 1) as Step)}>
            <Text style={s.ctaTxt}>Continue → Q{step + 1}</Text>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.cta} activeOpacity={0.85}
            onPress={() => router.push('/travel-dossier' as Href)}>
            <Text style={s.ctaTxt}>Compile the dossier</Text>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.back} activeOpacity={0.7}
          onPress={() => (step > 1 ? setStep((step - 1) as Step) : router.back())}>
          <Text style={s.backTxt}>{step > 1 ? `← BACK TO Q${step - 1}` : '← BACK TO TRAVEL'}</Text>
        </TouchableOpacity>

        <Text style={s.foot}>Nothing compiles that is not needed.</Text>
      </ScrollView>
    </View>
  );
}

function SoFar({ s, n, v, onEdit, done, last }: {
  s: any; n: string; v: string; onEdit: () => void; done: boolean; last?: boolean;
}) {
  return (
    <View style={[s.soRow, last && s.soRowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={s.soName}>{n}</Text>
        <Text style={[s.soVal, !done && s.soValPending]} numberOfLines={2}>{v}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={s.soEdit}>EDIT</Text>
      </TouchableOpacity>
    </View>
  );
}

const make = (T: Tokens) => {
  const BG     = dl(T, '#0A0804', '#FAF7F2');
  const CARD   = dl(T, '#150F0A', '#FFFFFF');
  const LINE   = dl(T, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.10)');
  const INK    = dl(T, '#FFFFFF', '#141414');
  const MUT    = dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)');
  const FAINT  = dl(T, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    pad: { padding: 20, paddingBottom: 56 },
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    brand: { color: ORANGE, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
    brandSub: { color: FAINT, fontSize: 9, letterSpacing: 1.6 },
    crumbRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    crumb: { color: MUT, fontSize: 10, letterSpacing: 1.8 },
    stepPill: { color: ORANGE, fontSize: 10, letterSpacing: 1.6, fontWeight: '700',
      borderWidth: 1, borderColor: ORANGE, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
    h1: { color: INK, fontSize: 34, lineHeight: 37, fontWeight: '300', letterSpacing: -0.5 },
    h1b: { fontWeight: '700', marginBottom: 12 },
    sub: { color: MUT, fontSize: 13, lineHeight: 20, marginBottom: 26 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    legend: { color: FAINT, fontSize: 10, letterSpacing: 1.8, marginBottom: 10 },
    legendTop: { color: FAINT, fontSize: 10, letterSpacing: 1.8, marginTop: 30, marginBottom: 4 },
    legendFaint: { color: ORANGE, fontSize: 9, letterSpacing: 1.4, marginBottom: 10 },
    count: { color: ORANGE, fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginBottom: 10 },
    field: { borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 14, marginBottom: 14, backgroundColor: CARD },
    fieldTxt: { color: INK, fontSize: 15 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: LINE, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 9 },
    chipOn: { borderColor: ORANGE, backgroundColor: 'rgba(224,138,60,0.14)' },
    chipTxt: { color: MUT, fontSize: 11, letterSpacing: 1.1 },
    chipTxtOn: { color: ORANGE, fontWeight: '700' },
    modChip: { borderWidth: 1, borderColor: LINE, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 7, opacity: 0.4 },
    modChipOn: { borderColor: ORANGE, opacity: 1 },
    modTxt: { color: MUT, fontSize: 10, letterSpacing: 1.1 },
    modTxtOn: { color: ORANGE, fontWeight: '700' },
    warn: { marginTop: 14, borderLeftWidth: 2, borderLeftColor: ORANGE, paddingLeft: 12, paddingVertical: 4 },
    warnTxt: { color: MUT, fontSize: 12, lineHeight: 18 },
    card: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 6 },
    soRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: LINE },
    soRowLast: { borderBottomWidth: 0 },
    soName: { color: FAINT, fontSize: 9, letterSpacing: 1.6, marginBottom: 3 },
    soVal: { color: INK, fontSize: 13 },
    soValPending: { color: FAINT },
    soEdit: { color: ORANGE, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
    cta: { marginTop: 26, backgroundColor: ORANGE, borderRadius: 4, padding: 16,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ctaTxt: { color: '#0A0804', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
    ctaArrow: { color: '#0A0804', fontSize: 16, fontWeight: '700' },
    back: { marginTop: 16, alignItems: 'center' },
    backTxt: { color: FAINT, fontSize: 10, letterSpacing: 1.6 },
    foot: { color: FAINT, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
  });
};
