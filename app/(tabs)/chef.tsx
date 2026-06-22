import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getScanHistory } from '../../lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80', LINE = 'rgba(255,255,255,0.10)';
const GOLD = '#E0A04A', GREEN = '#34D399';

type Meal = { recipeName: string; cookTime: string; ingredientCount: number; from: string };

function extractMeals(rows: any[]): Meal[] {
  const meals: Meal[] = [];
  for (const row of rows) {
    const fa = row?.full_analysis_json;
    const notes = Array.isArray(fa?.chefNote) ? fa.chefNote : [];
    const from = row?.product_name || row?.barcode || 'a scan';
    for (const n of notes) {
      if (n?.recipeName) {
        meals.push({
          recipeName: String(n.recipeName),
          cookTime: n.cookTime ? String(n.cookTime) : '',
          ingredientCount: typeof n.ingredientCount === 'number' ? n.ingredientCount : 0,
          from,
        });
      }
    }
    if (meals.length >= 9) break;
  }
  return meals.slice(0, 9);
}

export default function ChefScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [lastBasket, setLastBasket] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await getScanHistory(12);
    setMeals(extractMeals(rows));
    setLastBasket(rows[0]?.product_name || rows[0]?.barcode || null);
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const hasMeals = meals.length > 0;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
    >
      <View style={st.hero}>
        <Image source={require('../../assets/doors/door-chef.jpg')} resizeMode="cover" style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: GOLD }]}>INTELLIGENCE · KITCHEN</Text>
          <Text style={st.title}>The Chef</Text>
        </View>
      </View>

      <View style={st.band}>
        <Text style={st.bandLine}>
          {hasMeals ? 'Biology-first meals from what you actually scanned.' : 'Scan something and your meals build here.'}
        </Text>
        <Text style={st.bandSub}>
          {lastBasket ? `Last in your basket: ${lastBasket}` : 'All allergen-cleared against your profile.'}
        </Text>
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>MEALS FROM YOUR BASKET</Text>
        {!loaded ? (
          <Text style={st.empty}>Reading your scans…</Text>
        ) : !hasMeals ? (
          <Text style={st.empty}>No meals yet. Scan a food product — The Chef builds meals from it here.</Text>
        ) : meals.map((m, i) => (
          <View key={i} style={st.meal}>
            <View style={st.mealIcon}><Text style={st.mealIconTxt}>{'\u2728'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.mealName}>{m.recipeName}</Text>
              <Text style={st.mealMeta}>
                {[m.cookTime, m.ingredientCount ? `${m.ingredientCount} ingredients` : ''].filter(Boolean).join(' \u00B7 ')}
              </Text>
              <Text style={st.mealFrom}>from {m.from}</Text>
            </View>
            <View style={[st.chip, { backgroundColor: GREEN + '1F' }]}>
              <Text style={[st.chipTxt, { color: GREEN }]}>CLEARED</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={st.foot}>Meals that work with the body, not against it.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  hero: { height: 230, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.5)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  band: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE },
  bandLine: { fontSize: 17, fontWeight: '800', color: INK, lineHeight: 23 },
  bandSub: { fontSize: 12, color: MUT, marginTop: 7, lineHeight: 17 },
  section: { paddingHorizontal: 14, paddingTop: 16 },
  sectionH: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: FAINT, marginBottom: 11, marginLeft: 2 },
  empty: { fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 8, lineHeight: 17 },
  meal: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 10 },
  mealIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: 'rgba(224,160,74,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(224,160,74,0.30)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  mealIconTxt: { fontSize: 16 },
  mealName: { fontSize: 14, fontWeight: '700', color: INK },
  mealMeta: { fontSize: 11, color: MUT, marginTop: 2 },
  mealFrom: { fontSize: 10, color: FAINT, marginTop: 2, fontStyle: 'italic' },
  chip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  chipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, color: GOLD, marginTop: 18 },
});
