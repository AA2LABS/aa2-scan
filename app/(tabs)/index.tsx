import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView,
  ActivityIndicator, Animated, StatusBar, ImageBackground,
} from 'react-native';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;

// Place chef-bg.png inside your assets/ folder
const CHEF_BG = require('../../assets/chef-bg.png');

type Recipe = {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
};

type ScanResult = {
  productName: string;
  verdict: string;
  verdictLevel: 'clear' | 'caution' | 'alert';
  topAlerts: string[];
  watchList: string[];
  insight: string;
  macros: { protein: string; carbs: string; fat: string; fiber: string; sodium: string };
  ingredientBreakdown: string[];
  recipes: Recipe[];
  chefNote: string;
};

// ─── DATABASE LAYER ───────────────────────────────────────────────

const fetchOpenFoodFacts = async (barcode: string) => {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,ingredients_text,allergens_tags,additives_tags,nutriscore_grade,labels,nutriments,nova_group`
    );
    const data = await res.json();
    if (data?.product) {
      const n = data.product.nutriments || {};
      return {
        productName: data.product.product_name || '',
        ingredients: data.product.ingredients_text || '',
        allergens: data.product.allergens_tags?.map((a: string) => a.replace('en:', '')).join(', ') || '',
        additives: data.product.additives_tags?.map((a: string) => a.replace('en:', '')).join(', ') || '',
        nutriScore: data.product.nutriscore_grade || '',
        novaGroup: data.product.nova_group || '',
        sodium: n['sodium_100g'] ? `${(n['sodium_100g'] * 1000).toFixed(0)}mg per 100g` : '',
        sugar: n['sugars_100g'] ? `${n['sugars_100g']}g per 100g` : '',
        saturatedFat: n['saturated-fat_100g'] ? `${n['saturated-fat_100g']}g per 100g` : '',
        fiber: n['fiber_100g'] ? `${n['fiber_100g']}g per 100g` : '',
        protein: n['proteins_100g'] ? `${n['proteins_100g']}g per 100g` : '',
        carbs: n['carbohydrates_100g'] ? `${n['carbohydrates_100g']}g per 100g` : '',
        labels: data.product.labels || '',
      };
    }
  } catch (_) {}
  return null;
};

const fetchUSDA = async (productName: string) => {
  if (!productName || productName === 'Unknown Product') return null;
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(productName)}&pageSize=1&api_key=${USDA_API_KEY}`
    );
    const data = await res.json();
    if (data?.foods?.[0]) {
      const food = data.foods[0];
      const nutrients = food.foodNutrients?.slice(0, 8)
        .map((n: any) => `${n.nutrientName}: ${n.value}${n.unitName}`)
        .join(', ') || '';
      return {
        description: food.description,
        nutrients,
        ingredients: food.ingredients || '',
        brandOwner: food.brandOwner || '',
      };
    }
  } catch (_) {}
  return null;
};

const fetchFDARecalls = async (productName: string) => {
  if (!productName || productName === 'Unknown Product') return null;
  try {
    const res = await fetch(
      `https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(productName)}"&limit=1`
    );
    const data = await res.json();
    if (data?.results?.[0]) {
      return {
        recall: data.results[0].reason_for_recall || '',
        status: data.results[0].status || '',
        date: data.results[0].recall_initiation_date || '',
      };
    }
  } catch (_) {}
  return null;
};

const fetchAllProductData = async (barcode: string) => {
  const off = await fetchOpenFoodFacts(barcode);
  const productName = off?.productName || 'Unknown Product';
  const [usda, fda] = await Promise.all([fetchUSDA(productName), fetchFDARecalls(productName)]);
  return { productName, off, usda, fda };
};

// ─── CLAUDE + THE CHEF ────────────────────────────────────────────

const analyzeWithClaude = async (
  productName: string, off: any, usda: any, fda: any
): Promise<ScanResult> => {

  const context = `
PRODUCT: ${productName}
INGREDIENTS: ${off?.ingredients || 'Not available'}
ALLERGENS: ${off?.allergens || 'None detected'}
ADDITIVES: ${off?.additives || 'None listed'}
NUTRI-SCORE: ${off?.nutriScore?.toUpperCase() || 'Not rated'}
NOVA PROCESSING GROUP: ${off?.novaGroup || 'Unknown'} (1=whole food, 4=ultra-processed)
NUTRIENTS PER 100G:
- Protein: ${off?.protein || 'Unknown'}
- Carbs: ${off?.carbs || 'Unknown'}
- Fat: ${off?.saturatedFat || 'Unknown'}
- Fiber: ${off?.fiber || 'Unknown'}
- Sodium: ${off?.sodium || 'Unknown'}
- Sugar: ${off?.sugar || 'Unknown'}
USDA: ${usda?.description || 'Not found'} | Brand: ${usda?.brandOwner || 'Unknown'}
FDA RECALL: ${fda ? `RECALL: ${fda.recall} (${fda.status}, ${fda.date})` : 'No active recalls'}
`.trim();

  const prompt = `You are AA2 SCAN — two voices in one response.

VOICE 1 — THE EQUALIZER: Calm biosignal intelligence. Plain language. No fear. Just truth.
VOICE 2 — THE CHEF: Culturally aware culinary guide. Warm, knowledgeable, food-positive. Gives 3 practical recipes using or healthily swapping this product. Default to the user's cultural food style — if unknown, use American home cooking.

${context}

Respond ONLY with this exact JSON, no markdown, no extra text:
{
  "productName": "${productName}",
  "verdict": "one honest sentence about what this product really is",
  "verdictLevel": "clear",
  "topAlerts": ["specific issue and why it matters in plain language"],
  "watchList": ["ingredient or nutrient and what it does in your body"],
  "insight": "2-3 sentences of real talk about daily use of this product",
  "macros": {
    "protein": "value from data",
    "carbs": "value from data",
    "fat": "value from data",
    "fiber": "value from data",
    "sodium": "value from data"
  },
  "ingredientBreakdown": ["ingredient name — what it is and what it does in plain language"],
  "recipes": [
    {
      "name": "Recipe name",
      "description": "One sentence description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "chefNote": "The Chef warm one sentence about this product and how to use it well"
}

verdictLevel: clear = clean minimal processing. caution = some additives or moderate sodium. alert = high sodium or preservatives or ultra-processed or recall.
topAlerts max 3. watchList max 4. ingredientBreakdown max 5. recipes exactly 3. steps max 4 per recipe.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data?.content?.[0]?.text || '';

  try {
    return JSON.parse(text);
  } catch (_) {
    return {
      productName,
      verdict: 'Scan complete — review details below.',
      verdictLevel: 'caution',
      topAlerts: [],
      watchList: [],
      insight: text,
      macros: { protein: '-', carbs: '-', fat: '-', fiber: '-', sodium: '-' },
      ingredientBreakdown: [],
      recipes: [],
      chefNote: '',
    };
  }
};

// ─── UI ───────────────────────────────────────────────────────────

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  const resetScan = () => {
    setScanned(false);
    setResult(null);
    setError(null);
    setLoadingStep('');
    setShowRecipes(false);
    fadeAnim.setValue(0);
  };

  const handleBarCodeScanned = async ({ data: barcode }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);
    try {
      setLoadingStep('Pulling product data...');
      const { productName, off, usda, fda } = await fetchAllProductData(barcode);
      setLoadingStep('Running AA2 analysis...');
      const scanResult = await analyzeWithClaude(productName, off, usda, fda);
      setResult(scanResult);
      fadeIn();
    } catch (e) {
      setError("Couldn't read that one. Try again.");
      setScanned(false);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <ImageBackground source={CHEF_BG} style={styles.container} imageStyle={styles.bgImage}>
        <View style={styles.overlay}>
          <Text style={styles.permissionText}>AA2 needs camera access to scan.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  const verdictColors = { clear: '#00E5A0', caution: '#F5C842', alert: '#FF6B4A' };
  const verdictLabels = { clear: 'ALL CLEAR', caution: 'HEADS UP', alert: 'PAY ATTENTION' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>AA2</Text>
        <Text style={styles.headerSub}>SCAN</Text>
      </View>

      {/* CAMERA OR BACKGROUND */}
      {!result && (
        <ImageBackground source={CHEF_BG} style={styles.heroContainer} imageStyle={styles.bgImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
              />
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#00E5A0" />
                  <Text style={styles.loadingText}>{loadingStep}</Text>
                </View>
              )}
            </View>
            {!loading && (
              <View style={styles.chefPromptBox}>
                <Text style={styles.chefPromptIcon}>👨🏾‍🍳</Text>
                <Text style={styles.chefPromptText}>Point at any barcode</Text>
                <Text style={styles.chefPromptSub}>The Chef is ready</Text>
              </View>
            )}
          </View>
        </ImageBackground>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* RESULTS */}
      {result && (
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.productName}>{result.productName}</Text>

            <View style={[styles.verdictBadge, { borderColor: verdictColors[result.verdictLevel] }]}>
              <Text style={[styles.verdictLevel, { color: verdictColors[result.verdictLevel] }]}>
                {verdictLabels[result.verdictLevel]}
              </Text>
              <Text style={styles.verdictText}>{result.verdict}</Text>
            </View>

            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>AA2 INSIGHT</Text>
              <Text style={styles.insightText}>{result.insight}</Text>
            </View>

            {/* MACROS */}
            {result.macros && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>MACROS</Text>
                <View style={styles.macroRow}>
                  {Object.entries(result.macros).map(([key, val]) => (
                    <View key={key} style={styles.macroBox}>
                      <Text style={styles.macroValue}>{val}</Text>
                      <Text style={styles.macroKey}>{key.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {result.topAlerts?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>WATCH THESE</Text>
                {result.topAlerts.map((alert, i) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={[styles.dot, { backgroundColor: '#FF6B4A' }]} />
                    <Text style={styles.alertText}>{alert}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.watchList?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>GOOD TO KNOW</Text>
                {result.watchList.map((item, i) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={[styles.dot, { backgroundColor: '#F5C842' }]} />
                    <Text style={styles.alertText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.ingredientBreakdown?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>INGREDIENT BREAKDOWN</Text>
                {result.ingredientBreakdown.map((item, i) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={[styles.dot, { backgroundColor: '#00E5A0' }]} />
                    <Text style={styles.alertText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* THE CHEF */}
            {result.chefNote && (
              <View style={styles.chefBox}>
                <Text style={styles.chefLabel}>👨🏾‍🍳 THE CHEF</Text>
                <Text style={styles.chefNote}>{result.chefNote}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.recipeToggle} onPress={() => setShowRecipes(!showRecipes)}>
              <Text style={styles.recipeToggleText}>{showRecipes ? 'HIDE RECIPES' : '👨🏾‍🍳 SEE 3 RECIPES'}</Text>
            </TouchableOpacity>

            {showRecipes && result.recipes?.map((recipe, i) => (
              <View key={i} style={styles.recipeCard}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeDesc}>{recipe.description}</Text>
                <Text style={styles.recipeSubLabel}>INGREDIENTS</Text>
                {recipe.ingredients.map((ing, j) => (
                  <Text key={j} style={styles.recipeItem}>• {ing}</Text>
                ))}
                <Text style={styles.recipeSubLabel}>STEPS</Text>
                {recipe.steps.map((step, j) => (
                  <Text key={j} style={styles.recipeItem}>{j + 1}. {step}</Text>
                ))}
              </View>
            ))}

            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
              <Text style={styles.scanAgainText}>SCAN ANOTHER</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', paddingTop: 60 },
  bgImage: { opacity: 0.35 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 24, marginBottom: 16, gap: 8 },
  headerLogo: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 4 },
  headerSub: { fontSize: 13, fontWeight: '600', color: '#00E5A0', letterSpacing: 6 },
  heroContainer: { marginHorizontal: 0, overflow: 'hidden', flex: 0.55 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(10,10,15,0.55)', padding: 24, justifyContent: 'center', gap: 16 },
  cameraContainer: { borderRadius: 16, overflow: 'hidden', height: 240, position: 'relative', backgroundColor: '#111118' },
  camera: { flex: 1 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#00E5A0', zIndex: 10 },
  cornerTL: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.85)', justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#00E5A0', fontSize: 14, fontWeight: '600', letterSpacing: 2 },
  chefPromptBox: { alignItems: 'center', gap: 4 },
  chefPromptIcon: { fontSize: 28 },
  chefPromptText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 2 },
  chefPromptSub: { color: '#00E5A0', fontSize: 11, fontWeight: '600', letterSpacing: 3 },
  errorText: { textAlign: 'center', color: '#FF6B4A', fontSize: 14, marginTop: 16, paddingHorizontal: 24 },
  permissionText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', paddingHorizontal: 32, marginBottom: 24 },
  primaryBtn: { backgroundColor: '#00E5A0', marginHorizontal: 48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#0A0A0F', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  resultContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  productName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 16, letterSpacing: 0.5 },
  verdictBadge: { borderWidth: 1, borderRadius: 14, padding: 18, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  verdictLevel: { fontSize: 11, fontWeight: '800', letterSpacing: 4, marginBottom: 6 },
  verdictText: { color: '#CCCCDD', fontSize: 16, lineHeight: 24, fontWeight: '400' },
  insightBox: { backgroundColor: 'rgba(0,229,160,0.06)', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 2, borderLeftColor: '#00E5A0' },
  insightLabel: { fontSize: 10, fontWeight: '800', color: '#00E5A0', letterSpacing: 4, marginBottom: 8 },
  insightText: { color: '#AAAACC', fontSize: 14, lineHeight: 22 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#555566', letterSpacing: 4, marginBottom: 10 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  alertText: { color: '#AAAACC', fontSize: 14, lineHeight: 22, flex: 1 },
  macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 60 },
  macroValue: { color: '#00E5A0', fontSize: 13, fontWeight: '700' },
  macroKey: { color: '#555566', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  chefBox: { backgroundColor: 'rgba(245,200,66,0.06)', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 2, borderLeftColor: '#F5C842' },
  chefLabel: { fontSize: 10, fontWeight: '800', color: '#F5C842', letterSpacing: 4, marginBottom: 8 },
  chefNote: { color: '#AAAACC', fontSize: 14, lineHeight: 22 },
  recipeToggle: { borderWidth: 1, borderColor: '#F5C842', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  recipeToggleText: { color: '#F5C842', fontWeight: '700', fontSize: 13, letterSpacing: 3 },
  recipeCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 12 },
  recipeName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  recipeDesc: { color: '#AAAACC', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  recipeSubLabel: { fontSize: 9, fontWeight: '800', color: '#555566', letterSpacing: 3, marginBottom: 6, marginTop: 8 },
  recipeItem: { color: '#AAAACC', fontSize: 13, lineHeight: 22 },
  scanAgainBtn: { borderWidth: 1, borderColor: '#00E5A0', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  scanAgainText: { color: '#00E5A0', fontWeight: '700', fontSize: 13, letterSpacing: 4 },
});
