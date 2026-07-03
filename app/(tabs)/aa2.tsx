import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { router, type Href } from 'expo-router';

const NAVY = '#0E1B33', INK = '#E8EEF5', FAINT = '#5C6B80', LINE = 'rgba(255,255,255,0.10)', GOLD = '#D4A847';

type Door = { title: string; art: ImageSourcePropType; route: Href | null };

const DOORS: Door[] = [
  { title: 'Bio Buddy',    art: require('../../assets/doors/door-biobuddy.jpg'),       route: '/(tabs)/biobuddy' as Href },
  { title: 'Concierge',    art: require('../../assets/doors/door-concierge.jpg'),      route: '/(tabs)/concierge' as Href },
  { title: 'Equalizer',    art: require('../../assets/doors/door-equalizer.jpg'),      route: '/(tabs)/equalizer' as Href },
  { title: 'Chauffeur',    art: require('../../assets/doors/door-chauffeur.webp'),     route: '/(tabs)/chauffeur' as Href },
  { title: 'Chef',         art: require('../../assets/doors/door-chef.jpg'),           route: '/(tabs)/chef' as Href },
  { title: 'Travel',       art: require('../../assets/doors/door-travel.png'),         route: null },
  { title: 'Vision Board', art: require('../../assets/doors/door-vision-board.png'),   route: null },
  { title: 'Depth-On-Demand', art: require('../../assets/doors/door-depth-on-demand.png'), route: null },
  { title: 'K9 / Feline',  art: require('../../assets/doors/door-k9-feline.jpg'),      route: null },
  { title: 'Equine',       art: require('../../assets/doors/door-equine.jpg'),         route: null },
  { title: 'Agricultural', art: require('../../assets/doors/door-agricultural.jpg'),   route: null },
  { title: 'Aficionado',   art: require('../../assets/doors/door-aficionado.png'),     route: null },
];

export default function AA2DoorHall() {
  return (
    <ScrollView style={st.root} contentContainerStyle={st.content}>
      <Text style={st.eyebrow}>AA2 · DOOR HALL</Text>
      <Text style={st.title}>Every door, one place.</Text>
      <View style={st.grid}>
        {DOORS.map((d, i) => (
          <Pressable
            key={i}
            style={st.card}
            onPress={() => { if (d.route) router.push(d.route); }}
          >
            <Image source={d.art} resizeMode="cover" style={st.cardImg} />
            <View style={st.cardScrim} />
            <Text style={st.cardTitle}>{d.title}</Text>
            {!d.route ? <Text style={st.soon}>WIRING NEXT</Text> : null}
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
  title: { fontSize: 24, fontWeight: '800', color: INK, marginTop: 6, marginBottom: 16, marginLeft: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48.5%', height: 190, borderRadius: 14, overflow: 'hidden', marginBottom: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, justifyContent: 'flex-end' },
  cardImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  cardScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.42)' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', padding: 12, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  soon: { position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: '700', letterSpacing: 0.5, color: '#15110a', backgroundColor: GOLD, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 5 },
});
