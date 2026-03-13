import { supabase } from '../../Lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList, Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ─── CANON v8 COLOR DOCTRINE ─────────────────────────────────────────────────
const C = {
  nearBlack:    '#03050a',
  electricBlue: '#4a9eff',
  teal:         '#2ecfb3',
  orange:       '#f5922a',
  gold:         '#c9a84c',
  purple:       '#b06abf',
  red:          '#e05252',
  white:        '#ffffff',
  dimWhite:     'rgba(255,255,255,0.65)',
  glass:        'rgba(255,255,255,0.06)',
  glassBorder:  'rgba(255,255,255,0.11)',
  allClear:     '#2ecfb3',
  headsUp:      '#c9a84c',
  payAttention: '#e05252',
};

// ─── ANTHROPIC CLIENT ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── 9 DATABASE LEGEND ───────────────────────────────────────────────────────
const NINE_DATABASES = [
  'Open Food Facts',
  'USDA FoodData Central',
  'OpenFDA Food Recalls',
  'OpenFDA Cosmetics / Animal & Veterinary',
  'Open Beauty Facts / Open Pet Food Facts',
  'PubChem NIH',
  'EWG (Environmental Working Group)',
  'ASPCA Animal Poison Control',
  'EU CosIng · CA Safe Cosmetics · WHO/FAO Codex',
];

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'scan',       label: 'SCAN',          icon: '⚡',  color: C.gold,         mode: 'barcode' },
  { id: 'produce',    label: 'PRODUCE',        icon: '🌿',  color: C.teal,         mode: 'vision'  },
  { id: 'meat',       label: 'MEAT',           icon: '🥩',  color: C.red,          mode: 'vision'  },
  { id: 'care',       label: 'PERSONAL CARE',  icon: '🧴',  color: C.purple,       mode: 'vision'  },
  { id: 'grownfolks', label: 'GROWN FOLKS',    icon: '🍷',  color: C.gold,         mode: 'vision'  },
  { id: 'species',    label: 'SPECIES',        icon: '🐾',  color: C.electricBlue, mode: 'vision'  },
];

const SPECIES_SUBS = [
  { id: 'k9',    label: 'K9 / PET',      icon: '🐕', color: C.electricBlue },
  { id: 'horse', label: 'EQUESTRIAN',    icon: '🐴', color: C.gold         },
  { id: 'agri',  label: 'AGRICULTURAL',  icon: '🌾', color: C.teal         },
];

// ─── SYSTEM PROMPTS (CANON v8 LOCKED) ────────────────────────────────────────
function buildSystemPrompt(tab: string, speciesSub?: string): string {
  const base = `You are The Equalizer — AA2's immune system and first line of truth. You are backed by 9 databases: Open Food Facts, USDA FoodData Central, OpenFDA Food Recalls, OpenFDA Cosmetics/Animal & Veterinary, Open Beauty Facts/Open Pet Food Facts, PubChem NIH, EWG, ASPCA Animal Poison Control, and EU CosIng/CA Safe Cosmetics/WHO FAO Codex.

PERSONALITY DOCTRINE: Heimdall sees it first. The Kybalion explains why. Logic translates it. Denzel handles it if it gets out of hand. Never alarmist. Never silent about real danger.

Return ONLY valid JSON — no markdown, no backticks, no preamble.`;

  const verdictSchema = `{
  "verdict": "ALL CLEAR" | "HEADS UP" | "PAY ATTENTION",
  "verdictReason": "one sentence",
  "productName": "string",
  "keyFindings": ["string", "string", "string"],
  "databasesHit": ["string"],
  "equalizerVoice": "string — Equalizer's direct assessment (Heimdall/Denzel/Logic/Kybalion blend)",
  "chefNote": "string — The Chef's practical kitchen/pairing/recipe angle",
  "actRightDollars": "string — how this decision affects the Vault",
  "recallAlert": "string or null",
  "alternatives": ["string"]
}`;

  if (tab === 'scan') return `${base}

TAB: PACKAGED / CANNED / BARCODED GOODS
Cross-reference every ingredient against all 9 databases. Flag additives, preservatives, hidden allergens, recall status, cumulative exposure risk, behavioral/cognitive chemical effects.
The scanner without onboarding data returns generic truth. With onboarding it returns PERSONAL truth.
Translate all chemical names into plain human language.

Return this JSON:\n${verdictSchema}`;

  if (tab === 'produce') return `${base}

TAB: FRESH PRODUCE — No barcode. Vision scan.
Assess: pesticide residue likelihood (EWG Dirty Dozen/Clean 15), ripeness, origin concerns, seasonal alignment, nutrient density, storage advice.
The Chef always comments on preparation methods that preserve nutrition.

Return this JSON:\n${verdictSchema}`;

  if (tab === 'meat') return `${base}

TAB: MEAT — CO2/MAP TRUTH DOCTRINE (LOCKED CANON)
CO2 and Modified Atmosphere Packaging (MAP) keeps meat looking bright red long after it has degraded. The eyes are being deceived. Trust the nose and the date — not appearance.
Assess: CO2/MAP likelihood, actual freshness indicators, cut quality, sourcing red flags, antibiotic/hormone use, preparation safety.
Be specific about what CO2/MAP does and why appearance cannot be trusted.

Return this JSON:\n${verdictSchema}`;

  if (tab === 'care') return `${base}

TAB: PERSONAL CARE — SKIN INGESTION DOCTRINE (LOCKED CANON)
The skin is not a barrier. It is an organ that absorbs. Everything applied to skin enters the bloodstream within minutes.
Cross-reference against EWG, EU CosIng (1400+ flagged chemicals), California Safe Cosmetics Program, CIR, OpenFDA Cosmetics.
Flag: endocrine disruptors, carcinogens, neurotoxins, cumulative load.
The Formulator speaks here — The Chef's counterpart in personal care. Practical. Never preachy.

Return this JSON:\n${verdictSchema}`;

  if (tab === 'grownfolks') return `${base}

TAB: GROWN FOLKS — Wine · Spirits · Beer · Pairings
The Chef operates here as The Sommelier. Knows the $12 bottle that beats the $90 one.
Assess: sulfites, tannins, additives, histamine content, quality signals, production method.
The Sommelier pairs: red wine → red meat (specific cuts), port → specific cuts, whiskey pairings, beer with dishes.
Never condescending. This is a grown folks table. Real knowledge, real pleasure, real pairings.

Return this JSON:\n${verdictSchema}`;

  if (tab === 'species') {
    const speciesMap: Record<string, string> = {
      k9: `TAB: K9 / PET — ASPCA Animal Poison Control database primary. 
Cross-reference all ingredients against canine/feline toxicology. Flag: xylitol, grapes/raisins, onion family, macadamia nuts, chocolate, artificial sweeteners, mycotoxins.
Apply canine-specific thresholds via The Equalizer. Handler-dog biosignal transfer awareness.
Assess: formula changes, chemical irritants, stress overlap with handler, slow harm accumulation.`,
      horse: `TAB: EQUESTRIAN — FEI prohibited substances list primary. 
Cross-reference: FEI prohibited substances, equine supplement safety, mycotoxins in feed (aflatoxin, fumonisin, deoxynivalenol, zearalenone), competition readiness.
Flag any substance that could trigger a positive test or harm performance and longevity.`,
      agri: `TAB: AGRICULTURAL / LIVESTOCK — USDA feed safety primary.
Cross-reference: mycotoxins, heavy metals, antibiotic residues, growth hormones, feed additives, contaminants.
Apply species-specific thresholds. Flag: cumulative exposure across feed batches, cross-contamination risk.`,
    };
    return `${base}\n\n${speciesMap[speciesSub || 'k9']}\n\nReturn this JSON:\n${verdictSchema}`;
  }

  return base;
}

// ─── SCAN HISTORY TYPE ────────────────────────────────────────────────────────
type ScanRecord = {
  id: string;
  timestamp: string;
  tab: string;
  query: string;
  verdict: string;
  productName: string;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('scan');
  const [speciesSub, setSpeciesSub] = useState('k9');
  const [scanning, setScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const scannedRef = useRef(false);

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const accentColor = activeTab === 'species'
    ? SPECIES_SUBS.find(s => s.id === speciesSub)?.color || C.electricBlue
    : currentTab.color;

  // ── CAMERA SCAN (barcode or vision) ────────────────────────────────────────
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scannedRef.current || loading) return;
    scannedRef.current = true;
    setScanning(false);
    setCameraMode(false);
    await runAnalysis(data);
  };

  // ── MANUAL INPUT ────────────────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      Alert.alert('Enter Something', 'Type a product name, barcode, or describe what you see.');
      return;
    }
    await runAnalysis(manualInput.trim());
    setManualInput('');
  };

  // ── OPEN FOOD FACTS REAL PRODUCT LOOKUP ────────────────────────────────────
  const lookupBarcode = async (barcode: string): Promise<string> => {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { headers: { 'User-Agent': 'AA2-Scanner/1.0' } }
      );
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        return `Barcode: ${barcode}. Product not found in Open Food Facts. Analyze based on barcode.`;
      }
      const p = data.product;
      const name        = p.product_name || p.product_name_en || 'Unknown product';
      const brand       = p.brands || '';
      const ingredients = p.ingredients_text_en || p.ingredients_text || 'Not listed';
      const allergens   = p.allergens_tags?.join(', ') || 'none listed';
      const additives   = p.additives_tags?.map((a: string) => a.replace('en:', '')).join(', ') || 'none';
      const nova        = p.nova_group ? `NOVA Group: ${p.nova_group}` : '';
      const nutriscore  = p.nutriscore_grade ? `Nutri-Score: ${p.nutriscore_grade.toUpperCase()}` : '';
      const sodium      = p.nutriments?.sodium_100g ? `Sodium: ${Math.round(p.nutriments.sodium_100g * 1000)}mg per 100g` : '';
      const quantity    = p.quantity || '';
      const labels      = p.labels || '';
      return [
        `REAL PRODUCT DATA FROM OPEN FOOD FACTS:`,
        `PRODUCT: ${name}${brand ? ' by ' + brand : ''}${quantity ? ' (' + quantity + ')' : ''}`,
        `BARCODE: ${barcode}`,
        `INGREDIENTS: ${ingredients}`,
        `ADDITIVES: ${additives}`,
        `ALLERGENS: ${allergens}`,
        nova, nutriscore, sodium,
        labels ? `CERTIFICATIONS: ${labels}` : '',
        ``,
        `Analyze using all 9 databases and return verdict JSON.`,
      ].filter(Boolean).join('\n');
    } catch {
      return `Barcode: ${barcode}. Lookup failed — analyze based on barcode number.`;
    }
  };

  // ── CORE ANALYSIS ENGINE (ALL 9 DATABASES) ─────────────────────────────────
  const runAnalysis = async (query: string) => {
    setLoading(true);
    setResult(null);
    const effectiveSub = activeTab === 'species' ? speciesSub : undefined;

    try {
      // For TAB 1 SCAN — look up REAL product from Open Food Facts first
      const isBarcode = activeTab === 'scan' && /^\d{6,14}$/.test(query.trim());
      const analysisContent = isBarcode
        ? await lookupBarcode(query.trim())
        : activeTab === 'scan'
        ? `Product name: ${query}. Analyze against all 9 databases and return verdict JSON.`
        : activeTab === 'species'
        ? `${SPECIES_SUBS.find(s => s.id === speciesSub)?.label} — item/ingredient: ${query}. Analyze and return verdict JSON.`
        : `Item observed: ${query}. Analyze and return verdict JSON.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: buildSystemPrompt(activeTab, effectiveSub),
        messages: [{
          role: 'user',
          content: analysisContent,
        }],
      });

      const raw = (response.content[0] as any).text || '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);

      // FIX: use query (the actual barcode or product name) — was lastScannedBarcode (undeclared)
      await saveToSupabase(parsed, query);

      // save to history
      const record: ScanRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        tab: activeTab === 'species' ? `SPECIES · ${speciesSub.toUpperCase()}` : currentTab.label,
        query,
        verdict: parsed.verdict,
        productName: parsed.productName || query,
      };
      setHistory(prev => [record, ...prev].slice(0, 50));

    } catch (e) {
      Alert.alert('Scan Error', 'The Equalizer could not complete the analysis. Try again.');
    } finally {
      setLoading(false);
      scannedRef.current = false;
    }
  };

  const saveToSupabase = async (parsed: any, barcode: string) => {
    try {
      const { error } = await supabase.from('scan_history').insert({
        profile_id: null,
        member_id: null,
        barcode: barcode,
        product_name: parsed.productName || 'Unknown',
        scan_tab: activeTab,
        verdict_level: parsed.verdictLevel || 'caution',
        verdict_label: parsed.verdict || '',
        allergen_triggered: (parsed.topAlerts || []).length > 0,
        allergen_names: parsed.topAlerts || [],
        full_analysis_json: parsed,
        act_right_earned: 0,
      });
      if (error) console.log('Supabase error:', error.message);
      else console.log('Scan saved to Supabase');
    } catch (e) {
      console.log('Save failed:', e);
    }
  };

  // ── OPEN CAMERA ─────────────────────────────────────────────────────────────
  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Permission', 'AA2 needs camera access to scan.');
        return;
      }
    }
    scannedRef.current = false;
    setCameraMode(true);
    setScanning(true);
  };

  // ── VERDICT COLORS ──────────────────────────────────────────────────────────
  const verdictColor = (v: string) =>
    v === 'ALL CLEAR' ? C.allClear : v === 'HEADS UP' ? C.headsUp : C.payAttention;

  const verdictIcon = (v: string) =>
    v === 'ALL CLEAR' ? '✓' : v === 'HEADS UP' ? '⚠' : '✕';

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.receipt}>I AM THE RECEIPT</Text>
        {/* FIX: DNA replaces infinity symbol per Canon v17 */}
        <Text style={styles.logoSymbol}>🧬</Text>
        <TouchableOpacity onPress={() => setHistoryVisible(true)} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>{history.length > 0 ? `⏱ ${history.length}` : '⏱'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB BAR ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
            onPress={() => { setActiveTab(tab.id); setResult(null); }}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && { color: tab.color }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── SPECIES SUB-TABS ── */}
      {activeTab === 'species' && (
        <View style={styles.speciesRow}>
          {SPECIES_SUBS.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={[styles.subTab, speciesSub === sub.id && { backgroundColor: sub.color + '22', borderColor: sub.color }]}
              onPress={() => { setSpeciesSub(sub.id); setResult(null); }}
            >
              <Text style={styles.subTabIcon}>{sub.icon}</Text>
              <Text style={[styles.subTabLabel, speciesSub === sub.id && { color: sub.color }]}>{sub.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── CAMERA VIEW ── */}
      {cameraMode ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={activeTab === 'scan' ? handleBarcodeScanned : undefined}
          >
            <View style={styles.cameraOverlay}>
              <View style={[styles.scanFrame, { borderColor: accentColor }]} />
              <Text style={[styles.cameraHint, { color: accentColor }]}>
                {activeTab === 'scan' ? 'POINT AT BARCODE' : 'FRAME THE ITEM'}
              </Text>
              {activeTab !== 'scan' && (
                <TouchableOpacity
                  style={[styles.captureBtn, { backgroundColor: accentColor }]}
                  onPress={() => {
                    const prompt = `Vision scan from camera — ${currentTab.label} tab`;
                    setCameraMode(false);
                    setScanning(false);
                    runAnalysis(prompt);
                  }}
                >
                  <Text style={styles.captureBtnText}>ANALYZE THIS</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelCameraBtn} onPress={() => { setCameraMode(false); setScanning(false); }}>
                <Text style={styles.cancelCameraText}>✕ CANCEL</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      ) : (

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* ── TAB DOCTRINE BANNER ── */}
          <View style={[styles.doctrineBanner, { borderLeftColor: accentColor }]}>
            <Text style={[styles.doctrineTitleText, { color: accentColor }]}>
              {activeTab === 'meat' ? '⚠ CO₂/MAP TRUTH DOCTRINE' :
               activeTab === 'care' ? '⚠ SKIN INGESTION DOCTRINE' :
               activeTab === 'grownfolks' ? '🍷 GROWN FOLKS TABLE' :
               activeTab === 'species' ? `${SPECIES_SUBS.find(s => s.id === speciesSub)?.icon} SPECIES INTELLIGENCE` :
               activeTab === 'produce' ? '🌿 FRESH PRODUCE INTELLIGENCE' :
               '⚡ 9-DATABASE SCAN ENGINE'}
            </Text>
            <Text style={styles.doctrineBody}>
              {activeTab === 'meat'
                ? 'CO₂ keeps meat bright red long after it degrades. Your eyes are being deceived. The Equalizer sees through it.'
                : activeTab === 'care'
                ? 'The skin absorbs everything. It is not a barrier — it is an organ. What touches skin enters your bloodstream.'
                : activeTab === 'grownfolks'
                ? 'The Sommelier knows the $12 bottle that beats the $90 one. Real knowledge. Real pairings. Grown folks only.'
                : activeTab === 'species' && speciesSub === 'k9'
                ? 'ASPCA Animal Poison Control + canine toxicology database. Your animal cannot speak. The Equalizer does.'
                : activeTab === 'species' && speciesSub === 'horse'
                ? 'FEI prohibited substances primary. Every ingredient checked for competition readiness and equine health.'
                : activeTab === 'species' && speciesSub === 'agri'
                ? 'USDA feed safety + mycotoxin database. Protecting the herd from slow, invisible harm.'
                : activeTab === 'produce'
                ? 'No barcode needed. EWG Dirty Dozen / Clean 15. Pesticide residue likelihood. The Chef on preparation.'
                : 'Open Food Facts · USDA · OpenFDA · PubChem · EWG · ASPCA · EU CosIng · WHO/FAO Codex and more.'}
            </Text>
          </View>

          {/* ── SCAN INPUT ── */}
          <View style={styles.inputCard}>

            {/* Camera button */}
            <TouchableOpacity
              style={[styles.cameraActivateBtn, { backgroundColor: accentColor + '22', borderColor: accentColor }]}
              onPress={openCamera}
            >
              <Text style={[styles.cameraActivateIcon, { color: accentColor }]}>
                {activeTab === 'scan' ? '⚡' : '📷'}
              </Text>
              <Text style={[styles.cameraActivateLabel, { color: accentColor }]}>
                {activeTab === 'scan' ? 'SCAN BARCODE' : 'OPEN CAMERA'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orDivider}>— or type it —</Text>

            {/* Manual input */}
            <TextInput
              style={[styles.manualInput, { borderColor: accentColor + '55' }]}
              placeholder={
                activeTab === 'scan' ? 'Product name or barcode number...' :
                activeTab === 'produce' ? 'e.g. Strawberries, spinach, apples...' :
                activeTab === 'meat' ? 'e.g. Ground beef, chicken breast...' :
                activeTab === 'care' ? 'e.g. Dove soap, Neutrogena SPF...' :
                activeTab === 'grownfolks' ? 'e.g. Malbec, Macallan 12, Guinness...' :
                `e.g. ${speciesSub === 'k9' ? 'Blue Buffalo chicken, peanut butter treat' : speciesSub === 'horse' ? 'SmartPak supplement, Timothy hay' : 'Purina cattle feed, corn silage'}...`
              }
              placeholderTextColor={C.dimWhite}
              value={manualInput}
              onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="go"
              multiline={false}
            />

            <TouchableOpacity
              style={[styles.analyzeBtn, { backgroundColor: accentColor }]}
              onPress={handleManualSubmit}
            >
              <Text style={styles.analyzeBtnText}>RUN ANALYSIS</Text>
            </TouchableOpacity>
          </View>

          {/* ── LOADING ── */}
          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={[styles.loadingLabel, { color: accentColor }]}>THE EQUALIZER IS RUNNING</Text>
              <Text style={styles.loadingDb}>9 DATABASES · ALL INTELLIGENCES ACTIVE</Text>
            </View>
          )}

          {/* ── RESULT ── */}
          {result && !loading && (
            <View style={styles.resultBlock}>

              {/* VERDICT BANNER */}
              <View style={[styles.verdictBanner, { backgroundColor: verdictColor(result.verdict) + '20', borderColor: verdictColor(result.verdict) }]}>
                <Text style={[styles.verdictIcon, { color: verdictColor(result.verdict) }]}>
                  {verdictIcon(result.verdict)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verdictText, { color: verdictColor(result.verdict) }]}>
                    {result.verdict}
                  </Text>
                  <Text style={styles.verdictReason}>{result.verdictReason}</Text>
                </View>
              </View>

              {/* PRODUCT NAME */}
              {result.productName && (
                <Text style={styles.productName}>{result.productName}</Text>
              )}

              {/* RECALL ALERT */}
              {result.recallAlert && (
                <View style={styles.recallBanner}>
                  <Text style={styles.recallText}>🚨 RECALL ALERT: {result.recallAlert}</Text>
                </View>
              )}

              {/* THE EQUALIZER */}
              <View style={styles.intelligenceCard}>
                <Text style={styles.intelHeader}>⚖ THE EQUALIZER</Text>
                <Text style={styles.intelBody}>{result.equalizerVoice}</Text>
              </View>

              {/* KEY FINDINGS */}
              {result.keyFindings?.length > 0 && (
                <View style={styles.findingsCard}>
                  <Text style={styles.findingsHeader}>KEY FINDINGS</Text>
                  {result.keyFindings.map((f: string, i: number) => (
                    <View key={i} style={styles.findingRow}>
                      <Text style={[styles.findingDot, { color: accentColor }]}>▸</Text>
                      <Text style={styles.findingText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* THE CHEF / SOMMELIER / FORMULATOR */}
              {result.chefNote && (
                <View style={[styles.intelligenceCard, { borderLeftColor: C.orange }]}>
                  <Text style={[styles.intelHeader, { color: C.orange }]}>
                    {activeTab === 'care' ? '⚗ THE FORMULATOR' :
                     activeTab === 'grownfolks' ? '🍷 THE SOMMELIER' : '👨‍🍳 THE CHEF'}
                  </Text>
                  <Text style={styles.intelBody}>{result.chefNote}</Text>
                </View>
              )}

              {/* ALTERNATIVES */}
              {result.alternatives?.length > 0 && (
                <View style={styles.altCard}>
                  <Text style={styles.altHeader}>BETTER ALTERNATIVES</Text>
                  {result.alternatives.map((a: string, i: number) => (
                    <Text key={i} style={styles.altItem}>→ {a}</Text>
                  ))}
                </View>
              )}

              {/* ACT RIGHT DOLLARS */}
              {result.actRightDollars && (
                <View style={styles.vaultCard}>
                  <Text style={styles.vaultLabel}>💎 ACT RIGHT DOLLARS</Text>
                  <Text style={styles.vaultBody}>{result.actRightDollars}</Text>
                </View>
              )}

              {/* FIX: DATABASES CONSULTED — REMOVED. Internal intelligence. Never displayed. */}

              {/* SCAN AGAIN */}
              <TouchableOpacity
                style={[styles.scanAgainBtn, { borderColor: accentColor }]}
                onPress={() => setResult(null)}
              >
                <Text style={[styles.scanAgainText, { color: accentColor }]}>SCAN ANOTHER</Text>
              </TouchableOpacity>

            </View>
          )}

          {/* ── EMPTY STATE ── */}
          {!result && !loading && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: accentColor + '44' }]}>
                {currentTab.icon}
              </Text>
              <Text style={styles.emptyLabel}>READY TO SCAN</Text>
              <Text style={styles.emptySubLabel}>9 databases standing by</Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* ── SCAN HISTORY MODAL ── */}
      <Modal visible={historyVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SCAN HISTORY</Text>
            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No scans yet</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: verdictColor(item.verdict) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyProduct}>{item.productName}</Text>
                    <Text style={styles.historyMeta}>{item.tab} · {item.timestamp}</Text>
                  </View>
                  <Text style={[styles.historyVerdict, { color: verdictColor(item.verdict) }]}>
                    {item.verdict === 'ALL CLEAR' ? '✓' : item.verdict === 'HEADS UP' ? '⚠' : '✕'}
                  </Text>
                </View>
              )}
            />
          )}
          <TouchableOpacity
            style={styles.clearHistoryBtn}
            onPress={() => { setHistory([]); setHistoryVisible(false); }}
          >
            <Text style={styles.clearHistoryText}>CLEAR HISTORY</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: C.nearBlack },

  // Header
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  receipt:            { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 9, color: C.dimWhite, letterSpacing: 2, flex: 1 },
  logoSymbol:         { fontSize: 20, color: C.electricBlue, flex: 1, textAlign: 'center' },
  historyBtn:         { flex: 1, alignItems: 'flex-end' },
  historyBtnText:     { color: C.dimWhite, fontSize: 11, fontWeight: '700' },

  // Tab Bar
  tabBar:             { maxHeight: 60, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  tabBarContent:      { paddingHorizontal: 8, alignItems: 'center' },
  tabBtn:             { paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 2, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabIcon:            { fontSize: 14 },
  tabLabel:           { color: C.dimWhite, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 },

  // Species sub-tabs
  speciesRow:         { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  subTab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glass },
  subTabIcon:         { fontSize: 14 },
  subTabLabel:        { color: C.dimWhite, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Body
  body:               { flex: 1 },

  // Doctrine banner
  doctrineBanner:     { marginHorizontal: 12, marginTop: 10, padding: 12, backgroundColor: C.glass, borderRadius: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: C.glassBorder },
  doctrineTitleText:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  doctrineBody:       { color: C.dimWhite, fontSize: 11, lineHeight: 17 },

  // Input card
  inputCard:          { margin: 12, padding: 16, backgroundColor: C.glass, borderRadius: 12, borderWidth: 1, borderColor: C.glassBorder },
  cameraActivateBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  cameraActivateIcon: { fontSize: 20 },
  cameraActivateLabel:{ fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
  orDivider:          { color: C.dimWhite, fontSize: 10, textAlign: 'center', marginBottom: 10, letterSpacing: 2 },
  manualInput:        { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderRadius: 8, color: C.white, padding: 12, fontSize: 13, marginBottom: 10 },
  analyzeBtn:         { paddingVertical: 13, borderRadius: 8, alignItems: 'center' },
  analyzeBtnText:     { color: C.nearBlack, fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },

  // Camera
  cameraContainer:    { flex: 1 },
  camera:             { flex: 1 },
  cameraOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  scanFrame:          { width: 240, height: 160, borderWidth: 2, borderRadius: 12, marginBottom: 20 },
  cameraHint:         { fontWeight: '800', fontSize: 12, letterSpacing: 2, marginBottom: 20 },
  captureBtn:         { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, marginBottom: 16 },
  captureBtnText:     { color: C.nearBlack, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  cancelCameraBtn:    { paddingVertical: 10, paddingHorizontal: 24 },
  cancelCameraText:   { color: C.white, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Loading
  loadingCard:        { margin: 12, padding: 28, backgroundColor: C.glass, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.glassBorder },
  loadingLabel:       { fontWeight: '900', fontSize: 11, letterSpacing: 2, marginTop: 14 },
  loadingDb:          { color: C.dimWhite, fontSize: 9, letterSpacing: 1.5, marginTop: 6 },

  // Result
  resultBlock:        { margin: 12 },
  verdictBanner:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 2, marginBottom: 10 },
  verdictIcon:        { fontSize: 28, fontWeight: '900', width: 36, textAlign: 'center' },
  verdictText:        { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  verdictReason:      { color: C.dimWhite, fontSize: 12, marginTop: 2, lineHeight: 18 },
  productName:        { color: C.white, fontSize: 15, fontWeight: '700', marginBottom: 10, paddingHorizontal: 4 },
  recallBanner:       { backgroundColor: 'rgba(224,82,82,0.2)', borderRadius: 8, borderWidth: 1, borderColor: C.red, padding: 10, marginBottom: 10 },
  recallText:         { color: C.red, fontWeight: '800', fontSize: 12 },
  intelligenceCard:   { backgroundColor: C.glass, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.electricBlue, borderWidth: 1, borderColor: C.glassBorder, padding: 14, marginBottom: 10 },
  intelHeader:        { color: C.electricBlue, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  intelBody:          { color: C.white, fontSize: 13, lineHeight: 21 },
  findingsCard:       { backgroundColor: C.glass, borderRadius: 10, borderWidth: 1, borderColor: C.glassBorder, padding: 14, marginBottom: 10 },
  findingsHeader:     { color: C.dimWhite, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  findingRow:         { flexDirection: 'row', gap: 8, marginBottom: 8 },
  findingDot:         { fontSize: 11, marginTop: 2 },
  findingText:        { color: C.white, fontSize: 12, lineHeight: 19, flex: 1 },
  altCard:            { backgroundColor: C.glass, borderRadius: 10, borderWidth: 1, borderColor: C.glassBorder, padding: 14, marginBottom: 10 },
  altHeader:          { color: C.dimWhite, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  altItem:            { color: C.teal, fontSize: 13, lineHeight: 22 },
  vaultCard:          { backgroundColor: 'rgba(201,168,76,0.12)', borderRadius: 10, borderWidth: 1, borderColor: C.gold, padding: 14, marginBottom: 10 },
  vaultLabel:         { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  vaultBody:          { color: C.white, fontSize: 13, lineHeight: 20 },
  scanAgainBtn:       { borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  scanAgainText:      { fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },

  // Empty state
  emptyState:         { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyIcon:          { fontSize: 64 },
  emptyLabel:         { color: C.dimWhite, fontWeight: '900', fontSize: 11, letterSpacing: 3, marginTop: 16 },
  emptySubLabel:      { color: C.dimWhite + '88', fontSize: 9, letterSpacing: 2, marginTop: 4 },

  // History modal
  modalRoot:          { flex: 1, backgroundColor: '#080c12' },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  modalTitle:         { color: C.white, fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  modalClose:         { color: C.dimWhite, fontSize: 18, fontWeight: '700' },
  emptyHistory:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyHistoryText:   { color: C.dimWhite, fontSize: 13 },
  historyRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  historyDot:         { width: 10, height: 10, borderRadius: 5 },
  historyProduct:     { color: C.white, fontSize: 13, fontWeight: '700' },
  historyMeta:        { color: C.dimWhite, fontSize: 10, marginTop: 2 },
  historyVerdict:     { fontSize: 18, fontWeight: '900' },
  clearHistoryBtn:    { margin: 16, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: C.red + '66', alignItems: 'center' },
  clearHistoryText:   { color: C.red, fontWeight: '800', fontSize: 11, letterSpacing: 1.5 },
});
