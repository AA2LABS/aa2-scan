import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useProfile } from '@/components/DoorFlood';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', LINE = 'rgba(255,255,255,0.15)', GOLD = '#D4A847';

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
  // The Vault had the Vision Board's art and the Vision Board's route — which
  // is why opening the Vault landed you on the Vision Board. It has its own
  // door art and its own screen now.
  { title: 'Vault / Aware Dollars', art: require('../../assets/doors/door-vault.jpg'),     route: '/vault' as Href },
];

export default function AA2DoorHall() {
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

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  content: { padding: 14, paddingBottom: 40 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: GOLD, marginTop: 8, marginLeft: 2 },
  title: { fontSize: 24, fontWeight: '800', color: INK, marginTop: 6, marginLeft: 2 },
  sub: { fontSize: 12.5, color: MUT, marginTop: 8, marginBottom: 16, marginLeft: 2, lineHeight: 18 },
  cta: { borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.06)', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 18 },
  ctaTxt: { color: '#8fd6ff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48.5%', height: 190, borderRadius: 14, overflow: 'hidden', marginBottom: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, justifyContent: 'flex-end' },
  cardImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  cardScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.42)' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', padding: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
});
