import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

type ScanResult = {
  productName: string;
  verdict: string;
  verdictLevel: 'clear' | 'caution' | 'alert';
  topAlerts: string[];
  watchList: string[];
  insight: string;
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const resetScan = () => {
    setScanned(false);
    setResult(null);
    setError(null);
    fadeAnim.setValue(0);
  };

  const fetchProductData = async (barcode: string) => {
    // Primary: Open Food Facts
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const offData = await offRes.json();

    let ingredients = '';
    let productName = 'Unknown Product';

    if (offData?.status === 1 && offData?.product) {
      productName = offData.product.product_name || 'Unknown Product';
      ingredients =
        offData.product.ingredients_text ||
        offData.product.ingredients_text_en ||
        '';
    }

    // Secondary: USDA FoodData Central (search by barcode/name)
    let usdaInfo = '';
    try {
      const usdaRes = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
          productName
        )}&pageSize=1&api_key=DEMO_KEY`
      );
      const usdaData = await usdaRes.json();
      if (usdaData?.foods?.[0]) {
        const food = usdaData.foods[0];
        usdaInfo = `USDA data: ${food.description}. Nutrients: ${
          food.foodNutrients
            ?.slice(0, 5)
            .map((n: any) => `${n.nutrientName}: ${n.value}${n.unitName}`)
            .join(', ') || 'N/A'
        }`;
      }
    } catch (_) {
      // USDA optional — don't block on failure
    }

    return { productName, ingredients, usdaInfo };
  };

  const analyzeWithClaude = async (
    productName: string,
    ingredients: string,
    usdaInfo: string
  ): Promise<ScanResult> => {
    const prompt = `You are AA2 SCAN — the intelligence layer of AA2 Adaptive Advantage. You are calm, precise, and speak plain human language. You are NOT a warning system. You are a clarity system.

Analyze this product:
Product: ${productName}
Ingredients: ${ingredients || 'Not available'}
${usdaInfo ? `USDA Data: ${usdaInfo}` : ''}

Respond ONLY with this exact JSON structure, no markdown, no extra text:
{
  "productName": "${productName}",
  "verdict": "one sentence verdict — calm, direct, human",
  "verdictLevel": "clear" | "caution" | "alert",
  "topAlerts": ["ingredient name — plain language reason", "..."],
  "watchList": ["ingredient name — context", "..."],
  "insight": "one insight about how this product fits into daily life, performance, or long-term health — speak like a trusted advisor, not a warning label"
}

Rules:
- verdictLevel "clear" = generally safe for most people
- verdictLevel "caution" = fine for most, worth knowing about
- verdictLevel "alert" = real concern for specific groups
- topAlerts = max 3, only real concerns
- watchList = max 4, worth monitoring
- insight = the thing a doctor friend would tell you over coffee
- NEVER use fear language. NEVER be preachy. Speak with quiet authority.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    return JSON.parse(text);
  };

  const handleBarCodeScanned = async ({ data: barcode }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);

    try {
      const { productName, ingredients, usdaInfo } = await fetchProductData(barcode);
      const scanResult = await analyzeWithClaude(productName, ingredients, usdaInfo);
      setResult(scanResult);
      fadeIn();
    } catch (e) {
      setError("Couldn't read that one. Try again.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>AA2 needs camera access to scan.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const verdictColors = {
    clear: '#00E5A0',
    caution: '#F5C842',
    alert: '#FF6B4A',
  };

  const verdictLabels = {
    clear: 'ALL CLEAR',
    caution: 'HEADS UP',
    alert: 'PAY ATTENTION',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>AA2</Text>
        <Text style={styles.headerSub}>SCAN</Text>
      </View>

      {/* Camera */}
      {!result && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          />
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#00E5A0" />
              <Text style={styles.loadingText}>Reading it now...</Text>
            </View>
          )}
        </View>
      )}

      {!result && !loading && (
        <Text style={styles.scanPrompt}>Point at any barcode</Text>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Result */}
      {result && (
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Product name */}
            <Text style={styles.productName}>{result.productName}</Text>

            {/* Verdict badge */}
            <View style={[styles.verdictBadge, { borderColor: verdictColors[result.verdictLevel] }]}>
              <Text style={[styles.verdictLevel, { color: verdictColors[result.verdictLevel] }]}>
                {verdictLabels[result.verdictLevel]}
              </Text>
              <Text style={styles.verdictText}>{result.verdict}</Text>
            </View>

            {/* Insight */}
            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>AA2 INSIGHT</Text>
              <Text style={styles.insightText}>{result.insight}</Text>
            </View>

            {/* Top Alerts */}
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

            {/* Watch List */}
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

            {/* Scan again */}
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
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00E5A0',
    letterSpacing: 6,
  },
  cameraContainer: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
    position: 'relative',
    backgroundColor: '#111118',
  },
  camera: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#00E5A0',
    zIndex: 10,
  },
  cornerTL: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#00E5A0',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  scanPrompt: {
    textAlign: 'center',
    color: '#444455',
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    color: '#FF6B4A',
    fontSize: 14,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#00E5A0',
    marginHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0A0A0F',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  verdictBadge: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  verdictLevel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 6,
  },
  verdictText: {
    color: '#CCCCDD',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  insightBox: {
    backgroundColor: 'rgba(0,229,160,0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#00E5A0',
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5A0',
    letterSpacing: 4,
    marginBottom: 8,
  },
  insightText: {
    color: '#AAAACC',
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#555566',
    letterSpacing: 4,
    marginBottom: 10,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  alertText: {
    color: '#AAAACC',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  scanAgainBtn: {
    borderWidth: 1,
    borderColor: '#00E5A0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  scanAgainText: {
    color: '#00E5A0',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 4,
  },
});
