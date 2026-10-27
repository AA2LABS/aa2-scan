// ─── components/StoryRoom.tsx ────────────────────────────────────────────────
// THE SEVEN ROOMS · built 2026-10-27
//
// WHY THIS FILE EXISTS. `app/stories.tsx` has shipped seven doors pointing at
// `/story-aa2`, `/story-scanner`, `/story-concierge`, `/story-equalizer`,
// `/story-chauffeur`, `/story-chef` and `/story-cookbook`. None of those
// screens existed. Seven pressables that went nowhere, inside a repository
// whose own dead-end sweep reported "Broken routes (a door leading nowhere):
// 0". Canon recorded it — "an unreachable room with broken doors inside it" —
// and left the ruling open.
//
// NOTHING HERE IS INVENTED. Every room is assembled from sealed canon: the
// Minus7 genealogy, S.C.A.N., the Chemical Doctrine, the Floor and Ceiling
// Law, the Dossier's eight mandatory sections, the Chef Output Law, the
// Cookbook doctrine. Where a line is the founder's, it is in his words and
// marked as his. A story room that made something up would be the one place
// in AA2 where the receipt did not travel with the claim.

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { dl, useTheme, type Tokens } from '@/lib/theme-mode';

export type StoryBlock =
  | { kind: 'lede'; text: string }
  | { kind: 'body'; text: string }
  | { kind: 'law'; label: string; text: string }
  | { kind: 'founder'; text: string }
  | { kind: 'list'; label: string; items: string[] };

export type StoryContent = {
  number: string;
  title: string;
  subtitle: string;
  accent: string;
  blocks: StoryBlock[];
  /** The line the room closes on. */
  seal: string;
};

const pal = (T: Tokens) => ({
  BG:    dl(T, '#080808', '#F0EEE8'),
  CARD:  dl(T, 'rgba(255,255,255,0.05)', '#FFFFFF'),
  INK:   dl(T, '#FFFFFF', '#1a1a1a'),
  MUT:   dl(T, 'rgba(255,255,255,0.62)', 'rgba(0,0,0,0.58)'),
  FAINT: dl(T, 'rgba(255,255,255,0.32)', 'rgba(0,0,0,0.38)'),
  LINE:  dl(T, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.10)'),
  GOLD:  dl(T, '#D4A847', '#b8861e'),
});

export function StoryRoom({ story }: { story: StoryContent }) {
  const TH = useTheme();
  const C = pal(TH);
  const accent = dl(TH, story.accent, story.accent);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.BG }} contentContainerStyle={{ padding: 18, paddingBottom: 56 }}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={[s.back, { color: C.FAINT }]}>← BACK</Text>
      </Pressable>

      <View style={s.head}>
        <Text style={[s.num, { color: accent }]}>{story.number}</Text>
        <View style={[s.rule, { backgroundColor: accent }]} />
      </View>
      <Text style={[s.title, { color: C.INK }]}>{story.title}</Text>
      <Text style={[s.sub, { color: accent }]}>{story.subtitle}</Text>

      {story.blocks.map((b, i) => {
        if (b.kind === 'lede') {
          return <Text key={i} style={[s.lede, { color: C.INK }]}>{b.text}</Text>;
        }
        if (b.kind === 'body') {
          return <Text key={i} style={[s.body, { color: C.MUT }]}>{b.text}</Text>;
        }
        if (b.kind === 'founder') {
          // THE FOUNDER'S OWN WORDS, marked as his. Never paraphrased.
          return (
            <View key={i} style={[s.quote, { borderLeftColor: accent }]}>
              <Text style={[s.quoteText, { color: C.INK }]}>{b.text}</Text>
              <Text style={[s.quoteAttr, { color: C.FAINT }]}>— THE FOUNDER</Text>
            </View>
          );
        }
        if (b.kind === 'law') {
          return (
            <View key={i} style={[s.card, { borderColor: C.LINE, backgroundColor: C.CARD }]}>
              <Text style={[s.lbl, { color: accent }]}>{b.label}</Text>
              <Text style={[s.cardBody, { color: C.MUT }]}>{b.text}</Text>
            </View>
          );
        }
        return (
          <View key={i} style={[s.card, { borderColor: C.LINE, backgroundColor: C.CARD }]}>
            <Text style={[s.lbl, { color: accent }]}>{b.label}</Text>
            {b.items.map((it, j) => (
              <View key={j} style={s.liRow}>
                <Text style={[s.liDot, { color: accent }]}>◆</Text>
                <Text style={[s.li, { color: C.MUT }]}>{it}</Text>
              </View>
            ))}
          </View>
        );
      })}

      <View style={[s.seal, { borderTopColor: C.LINE }]}>
        <Text style={[s.sealText, { color: C.MUT }]}>{story.seal}</Text>
        <Text style={[s.sig, { color: C.FAINT }]}>
          <Text style={{ color: C.GOLD }}>◆</Text>  AA2 · I AM THE RECEIPT · N=1
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  back:      { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, marginBottom: 20 },
  head:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  num:       { fontFamily: 'BebasNeue-Regular', fontSize: 15, letterSpacing: 3 },
  rule:      { flex: 1, height: 1, opacity: 0.5 },
  title:     { fontFamily: 'BebasNeue-Regular', fontSize: 38, letterSpacing: 2.6, marginTop: 10 },
  sub:       { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 1.6, marginTop: 4 },
  lede:      { fontFamily: 'CormorantGaramond-Italic', fontSize: 20, lineHeight: 29, marginTop: 22 },
  body:      { fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22, marginTop: 15 },
  card:      { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 16 },
  lbl:       { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.6 },
  cardBody:  { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 20, marginTop: 8 },
  liRow:     { flexDirection: 'row', gap: 9, marginTop: 9 },
  liDot:     { fontSize: 9, lineHeight: 19 },
  li:        { fontFamily: 'DMSans-Regular', fontSize: 13, lineHeight: 19, flex: 1 },
  quote:     { borderLeftWidth: 3, paddingLeft: 13, marginTop: 20 },
  quoteText: { fontFamily: 'CormorantGaramond-Italic', fontSize: 17, lineHeight: 26 },
  quoteAttr: { fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1.6, marginTop: 7 },
  seal:      { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 30, paddingTop: 16, alignItems: 'center' },
  sealText:  { fontFamily: 'CormorantGaramond-Italic', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  sig:       { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.6, marginTop: 12 },
});

export default StoryRoom;
