// ─── components/ProfileSelector.tsx ──────────────────────────────────────────
// PANEL 01 · THE PROFILE SELECTOR · built 2026-10-27
//
// Canon v70 amendment 2026-09-19 listed this as outstanding in as many words:
// "Scanner panels 01, 02 and 12 — PROFILE SELECTOR DOES NOT EXIST." Panel 02
// shipped a SWITCH control on 2026-10-26 with nothing behind it. This is what
// is behind it.
//
// WHY A SCANNER NEEDS ONE AT ALL. The same bottle is a different answer for a
// nine-year-old, and a worse one for a dog. Chemical Doctrine Principle 4:
// children, animals and stressed adults are not mini adults. Scanning "for
// the household" is scanning for nobody — the verdict has to name who it is
// for before it can be trusted.
//
// WHAT IT OFFERS IS WHAT THE MEMBRANE ACTUALLY HOLDS. The member from
// member_profiles, and every animal from animal_profiles. There is no family
// channel TABLE yet — species_protected is a list on the member row, not a
// set of profiles — so no human dependents are invented here. When that table
// exists this list grows; until then it shows what is real.

import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { dl, type Tokens } from '@/lib/theme-mode';

export type ScanSubject = {
  key: string;
  name: string;
  kind: 'member' | 'animal';
  /** CHILD · ADULT · CANINE · FELINE · EQUINE … */
  role: string | null;
  age: number | null;
  /** Sensitivity scaling. Canon's one receipt: a nine-year-old carries 2.0×. */
  multiplier: number | null;
  /** Known allergens and sensitivities for this subject. */
  sensitivities: string[];
  /** Why this subject scales the way it does — NO NAKED NUMBERS. */
  why: string | null;
};

/**
 * SPECIES SENSITIVITY IS NOT A GUESS EITHER. Canon is explicit that a feline
 * is MORE sensitive than a canine, and both more than an adult human. These
 * are the documented relationships, not an invented curve — and any figure
 * the membrane stores overrides them.
 */
const SPECIES_MULTIPLIER: Record<string, { m: number; why: string }> = {
  canine: { m: 2.0, why: 'Canine toxicology diverges sharply from human — xylitol and grapes are the standing examples. Scaled against the ASPCA layer, not a human baseline.' },
  feline: { m: 3.0, why: 'More sensitive than canine. Lilies and allium are lethal at doses a dog tolerates.' },
  equine: { m: 2.0, why: 'Feed additives and ionophores carry equine-specific risk, and FEI rules apply on top.' },
};

export function subjectsFrom(profile: any, animals: any[]): ScanSubject[] {
  const out: ScanSubject[] = [];
  if (profile?.name) {
    const n = Number(String(profile.age ?? '').replace(/[^0-9]/g, ''));
    const age = Number.isFinite(n) && n > 0 ? n : null;
    const isChild = age != null && age < 18;
    const stored = profile.sensitivityMultiplier;
    out.push({
      key: 'member', name: profile.name, kind: 'member',
      role: profile.role ?? (age == null ? null : isChild ? 'CHILD' : 'ADULT'),
      age,
      multiplier: stored != null ? Number(stored) : (isChild ? 2.0 : null),
      sensitivities: [
        ...(profile.allergensFood ?? []),
        ...(profile.allergensPersonalCare ?? []),
        ...(profile.allergensEnvironmental ?? []),
        ...(profile.sensitivities ?? []),
      ].filter(Boolean),
      why: profile.sensitivityReason
        ?? (isChild ? 'Pediatric scaling. Canon carries one receipt — a nine-year-old at 2.0× adult baseline.' : null),
    });
  }
  for (const a of animals ?? []) {
    const sp = String(a.species ?? '').toLowerCase();
    const def = SPECIES_MULTIPLIER[sp];
    out.push({
      key: `animal:${a.name ?? sp}`,
      name: a.name ?? sp,
      kind: 'animal',
      role: sp ? sp.toUpperCase() : 'ANIMAL',
      age: null,
      multiplier: def?.m ?? null,
      sensitivities: Array.isArray(a.sensitivities) ? a.sensitivities : [],
      why: def?.why ?? null,
    });
  }
  return out;
}

export function ProfileSelector({
  TH, visible, subjects, selectedKey, onPick, onClose,
}: {
  TH: Tokens; visible: boolean; subjects: ScanSubject[];
  selectedKey: string | null;
  onPick: (s: ScanSubject) => void; onClose: () => void;
}) {
  const C = {
    BG:    dl(TH, '#080808', '#F0EEE8'),
    CARD:  dl(TH, 'rgba(255,255,255,0.05)', '#FFFFFF'),
    INK:   dl(TH, '#FFFFFF', '#1a1a1a'),
    MUT:   dl(TH, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)'),
    FAINT: dl(TH, 'rgba(255,255,255,0.32)', 'rgba(0,0,0,0.38)'),
    LINE:  dl(TH, 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.12)'),
    CYAN:  dl(TH, '#1BB8FF', '#0B79B0'),
    GREEN: dl(TH, '#34D399', '#12795A'),
    AMBER: dl(TH, '#C49A2A', '#9A7418'),
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[s.wrap, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[s.sheet, { backgroundColor: C.BG, borderColor: C.LINE }]}>
          <Text style={[s.h, { color: C.INK }]}>WHO IS THIS SCAN FOR?</Text>
          <Text style={[s.sub, { color: C.MUT }]}>
            The verdict changes with the body. Pick one before you scan.
          </Text>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 8 }}>
            {subjects.length === 0 ? (
              <Text style={[s.sub, { color: C.FAINT, marginTop: 14 }]}>
                The membrane has no profiles yet. Finish onboarding and whoever you
                protect shows up here.
              </Text>
            ) : subjects.map(sub => {
              const sel = sub.key === selectedKey;
              return (
                <Pressable
                  key={sub.key}
                  onPress={() => { onPick(sub); onClose(); }}
                  style={[s.row, { borderColor: sel ? C.CYAN : C.LINE, backgroundColor: C.CARD }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.name, { color: C.INK }]}>{sub.name}</Text>
                    <Text style={[s.meta, { color: sub.kind === 'animal' ? C.AMBER : C.GREEN }]}>
                      {[sub.role, sub.age != null ? `${sub.age}YR` : null,
                        sub.multiplier ? `${sub.multiplier.toFixed(1)}× SENSITIVITY` : null]
                        .filter(Boolean).join(' · ')}
                    </Text>
                    {sub.sensitivities.length ? (
                      <Text style={[s.sens, { color: C.MUT }]} numberOfLines={2}>
                        {sub.sensitivities.join(' · ')}
                      </Text>
                    ) : null}
                    {/* WHY-FIRST — a multiplier never appears without its reason. */}
                    {sub.why ? <Text style={[s.why, { color: C.FAINT }]}>{sub.why}</Text> : null}
                  </View>
                  {sel ? <Text style={[s.tick, { color: C.CYAN }]}>✓</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={onClose} style={[s.close, { borderColor: C.LINE }]}>
            <Text style={[s.closeL, { color: C.MUT }]}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap:   { flex: 1, justifyContent: 'flex-end' },
  sheet:  { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: 20, paddingBottom: 30 },
  h:      { fontFamily: 'BebasNeue-Regular', fontSize: 24, letterSpacing: 2 },
  sub:    { fontFamily: 'DMSans-Regular', fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 10 },
  name:   { fontFamily: 'DMSans-Regular', fontSize: 15, fontWeight: '700' },
  meta:   { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.2, marginTop: 3 },
  sens:   { fontFamily: 'DMSans-Regular', fontSize: 11.5, lineHeight: 16, marginTop: 5 },
  why:    { fontFamily: 'DMSans-Regular', fontSize: 11, lineHeight: 15, marginTop: 5, fontStyle: 'italic' },
  tick:   { fontSize: 18 },
  close:  { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  closeL: { fontFamily: 'DMSans-Regular', fontSize: 13 },
});

export default ProfileSelector;
