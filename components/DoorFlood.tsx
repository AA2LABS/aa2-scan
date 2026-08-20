import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { loadMemberProfile, type FullMemberProfile } from '@/lib/db';

export const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80';
export const LINE = 'rgba(255,255,255,0.15)', GOLD = '#D4A847', CYAN = '#1BB8FF';
export const GREEN = '#34D399', AMBER = '#E0A04A', RED = '#E24B4A';

export type Row = {
  icon: string; title: string; desc: string; chip?: string; chipColor?: string;
  /** Optional destination. Rows without one stay exactly as they were. */
  route?: string;
};

export function DoorFlood(props: {
  art: ImageSourcePropType; eyebrow: string; title: string; accent: string;
  /** Focal point for the art crop — founder bug 2026-08-01: the K9/Feline
      photo was beheading the dog and erasing the cat. 'top' keeps heads in
      frame; default 'center' preserves every other door unchanged. */
  artPosition?: 'center' | 'top' | 'top center' | 'left' | 'right' | 'top right' | 'top left';
  /** Founder bug 2026-08-19: the Vision Board art is a 1024x1024 collage whose
      SUBJECT IS ITS OWN LETTERING. Forced through contentFit="cover" into the
      210px hero strip it zooms until the width fills and crops away everything
      but a band of giant letter fragments — the words "AA2 Vision Board" are
      unreadable. Art whose subject is the whole frame needs 'contain' and room
      to breathe. Both props default to the existing behaviour, so every other
      door renders byte-identical. Never change a wire screen that was right. */
  artFit?: 'cover' | 'contain';
  heroHeight?: number;
  heroLine: string; heroSub: string; rows: Row[]; foot: string;
}) {
  const [open, setOpen] = useState(false);
  const { art, eyebrow, title, accent, heroLine, heroSub, rows, foot } = props;
  const artFit = props.artFit ?? 'cover';
  const heroH  = props.heroHeight ?? 210;

  if (!open) {
    return (
      <View style={st.doorRoot}>
        <Image source={art} contentFit="cover" contentPosition={props.artPosition ?? 'center'} style={st.doorImg} />
        <View style={st.doorScrim} />
        <View style={st.doorContent}>
          <Text style={[st.eyebrow, { color: accent }]}>{eyebrow}</Text>
          <Text style={st.doorTitle}>{title}</Text>
          <Pressable style={[st.knob, { backgroundColor: accent }]} onPress={() => setOpen(true)}>
            <Text style={st.knobTxt}>Continue →</Text>
          </Pressable>
        </View>
        <Pressable style={st.back} onPress={() => router.back()}>
          <Text style={st.backTxt}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={st.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[st.hero, { height: heroH }]}>
        <Image source={art} contentFit={artFit} contentPosition={props.artPosition ?? 'center'} style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: accent }]}>{eyebrow}</Text>
          <Text style={st.title}>{title}</Text>
        </View>
        <Pressable style={st.back} onPress={() => router.back()}>
          <Text style={st.backTxt}>← BACK</Text>
        </Pressable>
      </View>
      <View style={st.band}>
        <Text style={[st.bandLine, { color: accent }]}>{heroLine}</Text>
        <Text style={st.bandSub}>{heroSub}</Text>
      </View>
      <View style={st.section}>
        {rows.map((r, i) => (
          // A row with a route is tappable; a row without one renders exactly
          // as it always has. Founder law 2026-08-19: a screen nobody can reach
          // is not a screen — the Vault row had no way out of the Vision Board.
          <Pressable
            key={i}
            style={st.row}
            disabled={!r.route}
            onPress={() => { if (r.route) router.push(r.route as Href); }}
          >
            <View style={[st.rowIcon, { borderColor: accent + '40', backgroundColor: accent + '14' }]}>
              <Text style={[st.rowIconTxt, { color: accent }]}>{r.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.rowName}>{r.title}</Text>
              <Text style={st.rowDesc}>{r.desc}</Text>
            </View>
            {r.chip ? (
              <View style={[st.chip, { backgroundColor: (r.chipColor ?? accent) + '1F' }]}>
                <Text style={[st.chipTxt, { color: r.chipColor ?? accent }]}>{r.chip}</Text>
              </View>
            ) : null}
            {r.route ? <Text style={[st.rowGo, { color: accent }]}>›</Text> : null}
          </Pressable>
        ))}
      </View>
      <Text style={[st.foot, { color: accent }]}>{foot}</Text>
    </ScrollView>
  );
}

export function useProfile(): { p: FullMemberProfile | null; loaded: boolean } {
  const [p, setP] = useState<FullMemberProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { loadMemberProfile().then((r) => { setP(r); setLoaded(true); }); }, []);
  return { p, loaded };
}

const st = StyleSheet.create({
  doorRoot: { flex: 1, backgroundColor: NAVY, justifyContent: 'flex-end' },
  doorImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  doorScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.45)' },
  doorContent: { padding: 22, paddingBottom: 40 },
  doorTitle: { fontSize: 40, fontWeight: '800', color: '#fff', marginTop: 4, marginBottom: 20 },
  knob: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  knobTxt: { color: '#08111f', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  back: { position: 'absolute', top: 46, left: 16, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.45)' },
  backTxt: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  root: { flex: 1, backgroundColor: NAVY },
  hero: { height: 210, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.5)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  band: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE, alignItems: 'center' },
  bandLine: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  bandSub: { fontSize: 12, color: MUT, marginTop: 7, textAlign: 'center', lineHeight: 17 },
  section: { paddingHorizontal: 14, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  rowIconTxt: { fontSize: 17 },
  rowName: { fontSize: 14, fontWeight: '700', color: INK },
  rowDesc: { fontSize: 11.5, color: MUT, marginTop: 2, lineHeight: 16 },
  rowGo:   { fontSize: 20, marginLeft: 8, opacity: 0.7 },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  chipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, marginTop: 18 },
});
