import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router, type Href } from 'expo-router';
import DoorCover from '@/components/DoorCover';
import { loadMemberProfile, buildPersonalTruth, getCookbookRecipes, getScanHistory, logMembraneEvent } from '../../lib/db';
import { streamClaude } from '../../lib/claude-stream';
import { CHEF_VOICE, VOICE_MODEL } from '../../lib/voices';

// ─────────────────────────────────────────────────────────────────────────────
// THE CHEF — Intelligence 0X02 · Temporal Lobe · Food Culture Intelligence
// Door first, then the function list — every string from the approved door HTML.
// The Chef speaks live: rows seed the ask, SPEAK TO THE CHEF answers on-screen.
// Aficionado does NOT live here. Cannabis does NOT live here.
// ─────────────────────────────────────────────────────────────────────────────

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = 'rgba(255,255,255,0.55)', FAINT = 'rgba(255,255,255,0.32)';
const LINE = 'rgba(255,255,255,0.10)', GOLD = '#D4A847', GREEN = '#34D399';

type FnRow = { icon: string; title: string; sub: string; seed?: string; route?: Href; cookbook?: boolean };

// WHAT THE CHEF DOES — verbatim from the wire. Seven functions. No eighth.
const FUNCTIONS: FnRow[] = [
  { icon: '🍳', title: 'Build a recipe to your profile',
    sub: "Allergies · goals · household · what's already in your pantry",
    seed: 'Build me a recipe from my profile — allergies, goals, household, and what I usually have in the pantry.' },
  { icon: '🍷', title: 'Pair wine, spirit & beer',
    sub: 'The Sommelier read — knows the $12 bottle that beats the $90 one',
    seed: 'Pair a wine, spirit, or beer for my next meal — the honest value read.' },
  { icon: '🛡️', title: 'Allergen guard on every dish',
    sub: 'Silent sulfite · histamine · gluten · tree-nut check beneath each pairing',
    seed: 'Run the allergen guard on my usual dishes — sulfites, histamine, gluten, tree nuts.' },
  { icon: '🌍', title: 'International cooking',
    sub: 'Mirror of your food culture · regional naming · preparation context',
    seed: 'Teach me an international dish through the mirror of my own food culture — regional naming and preparation context included.' },
  { icon: '📖', title: 'Save to your cookbook',
    sub: 'Full ingredient list · method · cook times — printable Paper Layer',
    cookbook: true },
  { icon: '🔁', title: 'Cross-tab with the Scanner',
    sub: 'Scan an item → the Chef turns it into a meal aligned to your biology',
    route: '/' as Href },
  { icon: '🎯', title: 'Align meals to your trajectory',
    sub: '30/60/90 goals · weight · recovery · focus · longevity',
    seed: 'Align this week’s meals to my 30/60/90 trajectory.' },
];

export default function ChefScreen() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cookbookOpen, setCookbookOpen] = useState(false);
  const [cookbook, setCookbook] = useState<any[]>([]);
  const [scanMeals, setScanMeals] = useState<{ name: string; meta: string; from: string }[]>([]);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    const [recipes, scans] = await Promise.all([getCookbookRecipes(30), getScanHistory(12)]);
    setCookbook(recipes);
    const meals: { name: string; meta: string; from: string }[] = [];
    for (const row of scans) {
      const notes = Array.isArray(row?.full_analysis_json?.chefNote) ? row.full_analysis_json.chefNote : [];
      for (const n of notes) {
        if (n?.recipeName) {
          meals.push({
            name: String(n.recipeName),
            meta: [n.cookTime, n.ingredientCount ? `${n.ingredientCount} ingredients` : ''].filter(Boolean).join(' · '),
            from: row?.product_name || row?.barcode || 'a scan',
          });
        }
      }
      if (meals.length >= 9) break;
    }
    setScanMeals(meals.slice(0, 9));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const runQuery = useCallback(async (seed?: string) => {
    const q = (seed ?? query).trim();
    if (!q || asking) return;
    setQuery(q); setAnswer(''); setAsking(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      const profile = await loadMemberProfile();
      const truth = buildPersonalTruth(profile);
      await streamClaude({
        system: `${CHEF_VOICE}${truth ? `\n\n${truth}` : ''}`,
        content: q,
        max_tokens: 900,
        model: VOICE_MODEL,
        onPartial: acc => setAnswer(acc),
      });
    } catch (e: any) {
      setAnswer(`The Chef couldn't reach the kitchen right now. ${e?.message ?? ''}`.trim());
    } finally {
      setAsking(false);
    }
  }, [query, asking]);

  const openRow = (r: FnRow) => {
    if (r.cookbook) { setCookbookOpen(v => !v); return; }
    if (r.route) { router.push(r.route); return; }
    if (r.seed) {
      runQuery(r.seed);
      logMembraneEvent({ eventType: 'chef_function_run', sourceScreen: 'chef', subject: r.title });
    }
  };

  if (!doorOpen) {
    return (
      <ScrollView style={st.root} contentContainerStyle={{ flexGrow: 1 }}>
        <DoorCover
          art={require('../../assets/doors/door-chef.jpg')}
          intelChip="INTELLIGENCE 0X02"
          skip
          roleLine="NUTRITION INTELLIGENCE · MEAL DESIGN · BIOLOGY-FIRST"
          titleLines={['THE', 'CHEF']}
          desc="Mirror of your food culture. Knows the $12 bottle that beats the $90 one. Recipes, pairings, ingredient truth — cross-tab, always on."
          withLabel="WITH THE CHEF"
          withText="Every meal aligned to your biology, your goals, your life."
          withoutLabel="WITHOUT"
          withoutText="Generic recipes. Wrong pairings. Nutrition with no context."
          openLabel="Continue →"
          accent={GOLD}
          onOpen={() => setDoorOpen(true)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
    >
      <View style={st.subhead}>
        <Text style={st.subheadL}>◆ THE CHEF</Text>
        <Pressable onPress={() => setDoorOpen(false)} hitSlop={8}>
          <Text style={st.subheadR}>← BACK</Text>
        </Pressable>
      </View>

      {/* HOW CAN I HELP YOU? — live ask */}
      <View style={st.ask}>
        <Text style={st.askQ}>HOW CAN I HELP YOU?</Text>
        <View style={st.askRow}>
          <TextInput
            style={st.askInput}
            value={query}
            onChangeText={setQuery}
            placeholder="speak or type anything…"
            placeholderTextColor={FAINT}
            onSubmitEditing={() => runQuery()}
            returnKeyType="send"
          />
          <Pressable onPress={() => runQuery()} hitSlop={8}>
            <Text style={{ fontSize: 16 }}>🎤</Text>
          </Pressable>
        </View>
      </View>

      {(asking || answer) ? (
        <View style={st.answer}>
          {asking && !answer ? <ActivityIndicator color={GOLD} /> : null}
          {answer ? <Text style={st.answerTxt}>{answer}</Text> : null}
        </View>
      ) : null}

      {/* WHAT THE CHEF DOES */}
      <View style={st.section}>
        <Text style={st.fntitle}>WHAT THE CHEF DOES</Text>
        {FUNCTIONS.map((r, i) => (
          <View key={i}>
            <Pressable style={st.fnrow} onPress={() => openRow(r)}>
              <Text style={st.ico}>{r.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.txt}>{r.title}</Text>
                <Text style={st.sub}>{r.sub}</Text>
              </View>
              <Text style={st.arr}>{r.cookbook && cookbookOpen ? '⌄' : '›'}</Text>
            </Pressable>

            {/* Save to your cookbook — the cookbook lives right here. Never a dead end. */}
            {r.cookbook && cookbookOpen && (
              <View style={st.cookbook}>
                {cookbook.length === 0 && scanMeals.length === 0 ? (
                  <Text style={st.empty}>
                    Your cookbook is empty. Scan food or ask The Chef for a recipe — save it and it lives here.
                  </Text>
                ) : (
                  <>
                    {cookbook.map((c, j) => (
                      <View key={`c${j}`} style={st.recipeRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={st.recipeName}>{c.recipe_name}</Text>
                          <Text style={st.recipeMeta}>
                            {[c.cuisine, c.cook_time_minutes ? `${c.cook_time_minutes} min` : null, c.servings ? `serves ${c.servings}` : null]
                              .filter(Boolean).join(' · ') || 'saved recipe'}
                          </Text>
                        </View>
                        <View style={st.savedChip}><Text style={st.savedChipTxt}>COOKBOOK</Text></View>
                      </View>
                    ))}
                    {scanMeals.map((m, j) => (
                      <View key={`m${j}`} style={st.recipeRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={st.recipeName}>{m.name}</Text>
                          <Text style={st.recipeMeta}>{[m.meta, `from ${m.from}`].filter(Boolean).join(' · ')}</Text>
                        </View>
                        <View style={[st.savedChip, { borderColor: 'rgba(52,211,153,0.4)' }]}>
                          <Text style={[st.savedChipTxt, { color: GREEN }]}>FROM SCAN</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={st.section}>
        <Pressable style={st.action} onPress={() => runQuery(query || 'What should I cook tonight?')}>
          <Text style={st.actionTxt}>◆ SPEAK TO THE CHEF</Text>
          <Text style={[st.actionTxt, { marginLeft: 8 }]}>→</Text>
        </Pressable>
      </View>

      <Text style={st.note}>
        EVERY MEAL ALIGNED TO YOUR BIOLOGY, YOUR GOALS, YOUR LIFE. GENERIC RECIPES ARE A FAIL.
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  subhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 4 },
  subheadL: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 1.5, color: GOLD },
  subheadR: { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.5, color: MUT },

  ask: {
    margin: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(212,168,71,0.5)',
    backgroundColor: 'rgba(212,168,71,0.06)', borderRadius: 12, padding: 15,
  },
  askQ: { fontFamily: 'DMMono-Medium', fontSize: 14, letterSpacing: 1, color: '#e8c887' },
  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  askInput: { flex: 1, color: INK, fontFamily: 'DMSans-Regular', fontSize: 13, paddingVertical: 4 },

  answer: {
    marginHorizontal: 14, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 14,
  },
  answerTxt: { fontFamily: 'DMSans-Regular', fontSize: 13, color: INK, lineHeight: 19 },

  section: { paddingHorizontal: 14, paddingTop: 14 },
  fntitle: { fontFamily: 'DMMono-Regular', fontSize: 10, letterSpacing: 2, color: GOLD, marginBottom: 10 },
  fnrow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE,
    borderRadius: 12, padding: 13, marginBottom: 9,
  },
  ico: { fontSize: 16 },
  txt: { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700', color: INK },
  sub: { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 0.3, color: MUT, marginTop: 3, lineHeight: 14 },
  arr: { color: FAINT, fontSize: 17 },

  cookbook: { marginLeft: 12, marginBottom: 9, borderLeftWidth: 2, borderLeftColor: 'rgba(212,168,71,0.4)', paddingLeft: 10 },
  empty: { fontFamily: 'DMSans-Regular', fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 8, lineHeight: 17 },
  recipeRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 10, padding: 11, marginBottom: 7,
  },
  recipeName: { fontFamily: 'DMSans-Regular', fontSize: 13, fontWeight: '700', color: INK },
  recipeMeta: { fontFamily: 'DMMono-Regular', fontSize: 9, color: MUT, marginTop: 3 },
  savedChip: { borderWidth: 0.5, borderColor: 'rgba(212,168,71,0.4)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  savedChipTxt: { fontFamily: 'DMMono-Regular', fontSize: 7.5, letterSpacing: 1, color: GOLD },

  action: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,168,71,0.5)', backgroundColor: 'rgba(212,168,71,0.08)',
    borderRadius: 12, paddingVertical: 15,
  },
  actionTxt: { fontFamily: 'DMMono-Medium', fontSize: 12.5, letterSpacing: 1.5, color: '#e8c887' },

  note: {
    fontFamily: 'DMMono-Regular', fontSize: 8.5, letterSpacing: 1, color: FAINT,
    textAlign: 'center', marginTop: 20, marginHorizontal: 24, lineHeight: 14,
  },
});
