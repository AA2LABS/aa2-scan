import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useProfile } from '@/components/DoorFlood';
import { ModeToggle } from '@/components/ModeToggle';
import { dl, useTheme, type Tokens } from '@/lib/theme-mode';

// FOCAL POINT — founder bugs 2026-08-01 and 2026-08-19. React Native's own
// Image has no focal control, so cover-cropping these tiles cut the dog's head
// off, took the horses' heads, and clipped the lead cow's horns. expo-image
// carries contentPosition, the same mechanism that fixed the K9 door hero.
// Subject at the top of the frame → 'top'. Everything else stays 'center'.
type Door = {
  title: string; art: ImageSourcePropType; route: Href;
  pos?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top right' | 'top left';
};

const DOORS: Door[] = [
  { title: 'Bio Buddy',       art: require('../../assets/doors/door-biobuddy.jpg'),        route: '/(tabs)/biobuddy' as Href },
  { title: 'Concierge',       art: require('../../assets/doors/door-concierge.jpg'),       route: '/(tabs)/concierge' as Href },
  { title: 'Equalizer',       art: require('../../assets/doors/door-equalizer.jpg'),       route: '/(tabs)/equalizer' as Href },
  { title: 'Chauffeur',       art: require('../../assets/doors/door-chauffeur.webp'),      route: '/(tabs)/chauffeur' as Href },
  { title: 'Chef',            art: require('../../assets/doors/door-chef.jpg'),            route: '/(tabs)/chef' as Href },
  { title: 'Travel',          art: require('../../assets/doors/door-travel.png'),          route: '/travel' as Href },
  { title: 'Vision Board',    art: require('../../assets/doors/door-vision-board.png'),    route: '/vision-board' as Href },
  { title: 'Depth-On-Demand', art: require('../../assets/doors/door-depth-on-demand.png'), route: '/depth-on-demand' as Href },
  { title: 'K9 / Feline',     art: require('../../assets/doors/door-k9-feline.jpg'),       route: '/k9' as Href,           pos: 'top' },
  { title: 'Equine',          art: require('../../assets/doors/door-equine.jpg'),          route: '/equine' as Href,       pos: 'top' },
  { title: 'Agricultural',    art: require('../../assets/doors/door-agricultural.jpg'),    route: '/agricultural' as Href, pos: 'top' },
  { title: 'Aficionado',      art: require('../../assets/doors/door-aficionado.png'),      route: '/aficionado' as Href },
  // THE CLARIFIER ROUTING RULE — route 3 of 3: the button. Routes 1 and 2 are
  // Depth-On-Demand -> the Curator, and asking the Concierge. Placeholder art
  // until a door-clarifier render exists; the screen is real either way.
  { title: 'The Clarifier',   art: require('../../assets/doors/door-depth-on-demand.png'), route: '/clarifier' as Href },
  // Wired 2026-09-12 from _MANIFEST.txt "STAGED, NOT WIRED ... ask for the wire".
  { title: 'The Cookbook',    art: require('../../assets/doors/door-cookbook.jpg'),        route: '/cookbook' as Href },
  // The Vault had the Vision Board's art and the Vision Board's route — which
  // is why opening the Vault landed you on the Vision Board. It has its own
  // door art and its own screen now.
  { title: 'Vault / Aware Dollars', art: require('../../assets/doors/door-vault.jpg'),     route: '/vault' as Href },
];

export default function AA2DoorHall() {
  const T = useTheme();
  const st = useMemo(() => makeSt(T), [T]);
  const { p, loaded } = useProfile();
  const sealed = !!p?.onboardingComplete;
  const name = p?.name ?? null;

  return (
    <ScrollView style={st.root} contentContainerStyle={st.content}>
      <Text style={st.eyebrow}>AA2 · DOOR HALL</Text>
      <Text style={st.title}>Every door, one place.</Text>
      <Text style={st.sub}>
        {!loaded
          ? 'Reading the membrane…'
          : sealed
          ? `Every door reads your membrane${name ? `, ${name}` : ''}. One truth, twelve lenses.`
          : 'Build your membrane and every door behind this wall speaks to your body, not a generic one.'}
      </Text>

      {/* I AM THE RECEIPT — the founder's poster, wired 2026-09-12 as the
          door-hall hero exactly as _MANIFEST.txt specified. Not a grid card:
          the hall has an identity before it has a list. */}
      <View style={st.hero}>
        <Image source={require('../../assets/doors/door-receipt.jpg')} contentFit="cover" contentPosition="center" style={st.heroImg} />
        <View style={st.heroScrim} />
        <Text style={st.heroTxt}>I AM THE RECEIPT</Text>
        <Text style={st.heroSub}>N=1</Text>
      </View>

      {/* THE BUTTON. The Door Hall is where every door lives, so it is where
          the decision that repaints all of them belongs. Founder 2026-08-22:
          "The member still picks because they are able to click the button." */}
      <ModeToggle />

      {loaded ? (
        // CHANGE ANYTHING law: sealed members go straight to THE MEMBRANE · EDIT
        // (Bio Buddy page 3) — never back into the flipbook. Unsealed members
        // enter the onboarding click-through, where the flipbook lives.
        <Pressable
          style={st.cta}
          onPress={() =>
            router.push((sealed ? '/(tabs)/biobuddy?page=2' : '/(tabs)/onboarding') as Href)
          }
        >
          <Text style={st.ctaTxt}>CHANGE ANYTHING →</Text>
        </Pressable>
      ) : null}

      <View style={st.grid}>
        {DOORS.map((d, i) => (
          <Pressable key={i} style={st.card} onPress={() => router.push(d.route)}>
            <Image source={d.art} contentFit="cover" contentPosition={d.pos ?? 'center'} style={st.cardImg} />
            <View style={st.cardScrim} />
            <Text style={st.cardTitle}>{d.title}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * you can still read #0E1B33 and #D4A847 in this file, which is how LAW 1 is
 * proved rather than promised. Every LIGHT value comes from the founder's own
 * year-old two-mode file, where all ten surfaces sat on one cream ground and
 * were told apart by the colour of the type, not the colour of the room.
 *
 * The SCRIM and the CARD TITLE do not switch. They sit on photographs, and a
 * photograph is the same brightness in both modes — white type on a dark scrim
 * is the only thing that reads over every one of these fourteen doors.
 */
const makeSt = (T: Tokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: dl(T, '#0E1B33', T.bg) },
  content: { padding: 14, paddingBottom: 40 },
  eyebrow: { fontSize: 10.5, letterSpacing: 2, fontWeight: '700', color: dl(T, '#D4A847', T.gold), marginTop: 8, marginLeft: 2 },
  title: { fontSize: 24, fontWeight: '800', color: dl(T, '#E8EEF5', T.ink), marginTop: 6, marginLeft: 2 },
  sub: { fontSize: 13, color: dl(T, '#8A99AD', T.mut), marginTop: 8, marginBottom: 16, marginLeft: 2, lineHeight: 19 },
  cta: {
    borderWidth: 1,
    borderColor:     dl(T, 'rgba(27,184,255,0.5)',  'rgba(42,127,170,0.55)'),
    backgroundColor: dl(T, 'rgba(27,184,255,0.06)', 'rgba(42,127,170,0.08)'),
    borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 18,
  },
  ctaTxt: { color: dl(T, '#8fd6ff', '#1f6a90'), fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  hero: { height: 168, borderRadius: 14, overflow: 'hidden', marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: dl(T, 'rgba(255,255,255,0.15)', T.line), justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.38)' },
  heroTxt: { color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 14, textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 10 },
  heroSub: { color: '#fff', fontSize: 10.5, fontWeight: '700', letterSpacing: 3, opacity: 0.85, paddingHorizontal: 14, paddingBottom: 13, paddingTop: 3, textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48.5%', height: 190, borderRadius: 14, overflow: 'hidden', marginBottom: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: dl(T, 'rgba(255,255,255,0.15)', T.line), justifyContent: 'flex-end' },
  cardImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  cardScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.42)' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', padding: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
});
