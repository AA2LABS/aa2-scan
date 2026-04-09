import Anthropic from '@anthropic-ai/sdk';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:          '#050D09',
  card:        '#0C1710',
  cardDeep:    '#081209',
  border:      '#172E1F',
  borderSoft:  '#1A3523',
  teal:        '#1D9E75',
  tealDim:     'rgba(29,158,117,0.13)',
  tealMid:     'rgba(29,158,117,0.22)',
  gold:        '#C9A84C',
  goldDim:     'rgba(201,168,76,0.13)',
  red:         '#C94C4C',
  redDim:      'rgba(201,76,76,0.13)',
  white:       '#FFFFFF',
  dim:         'rgba(255,255,255,0.60)',
  muted:       'rgba(255,255,255,0.32)',
  glass:       'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.07)',
};

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifMd: 'CormorantGaramond-Medium',
  serifSb: 'CormorantGaramond-SemiBold',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
};

// ─── ANTHROPIC ───────────────────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── MODES ───────────────────────────────────────────────────────────────────
type Mode = 'compound' | 'formulate' | 'condition' | 'forager';

const MODES: { id: Mode; label: string; glyph: string; desc: string }[] = [
  {
    id: 'compound',
    label: 'COMPOUND',
    glyph: '⚗',
    desc: 'Single herb, extract, or supplement — full constituent and safety analysis.',
  },
  {
    id: 'formulate',
    label: 'FORMULATE',
    glyph: '⊕',
    desc: 'Build a stack. The Equalizer checks synergies, conflicts, and sequencing before you blend.',
  },
  {
    id: 'condition',
    label: 'CONDITION',
    glyph: '✦',
    desc: 'Enter a health goal and receive a complete plant-based protocol.',
  },
  {
    id: 'forager',
    label: 'FORAGER',
    glyph: '🌿',
    desc: 'Point at or describe any wild plant, mushroom, berry, or wild-caught fish. The Equalizer identifies, verifies edibility, and flags every toxic lookalike.',
  },
];

// ─── VERDICT ─────────────────────────────────────────────────────────────────
type Verdict = 'SAFE' | 'CAUTION' | 'CONTRAINDICATED';

const vColor = (v: Verdict) =>
  v === 'SAFE' ? C.teal : v === 'CAUTION' ? C.gold : C.red;
const vDim = (v: Verdict) =>
  v === 'SAFE' ? C.tealDim : v === 'CAUTION' ? C.goldDim : C.redDim;
const vGlyph = (v: Verdict) =>
  v === 'SAFE' ? '✓' : v === 'CAUTION' ? '⚠' : '✕';

type EdibilityLevel = 'safe' | 'conditional' | 'toxic';
const edibilityColor = (e: EdibilityLevel) =>
  e === 'safe' ? C.teal : e === 'conditional' ? C.gold : C.red;
const edibilityLabel = (e: EdibilityLevel) =>
  e === 'safe' ? 'SAFE TO CONSUME' : e === 'conditional' ? 'CONDITIONAL — READ NOTES' : 'TOXIC — DO NOT CONSUME';

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────
const COMPOUND_SYS = `You are The Equalizer — AA2's apothecary intelligence for Spoke 34. You are backed by 9 silent internal databases spanning ethnobotany, pharmacognosy, toxicology, clinical herbalism, and integrative medicine. Speak as The Equalizer: direct, calm, authoritative. Never preachy.

CRITICAL RULES:
1. NEVER name any database in any user-facing field.
2. Return ONLY valid JSON — no markdown, no backticks, no preamble.
3. verdict must be exactly: "SAFE", "CAUTION", or "CONTRAINDICATED".

Return this exact JSON:
{
  "verdict": "SAFE" | "CAUTION" | "CONTRAINDICATED",
  "compoundName": "string",
  "activeConstituents": ["string"],
  "equalizerVoice": "string — 2–3 sentences as The Equalizer. Direct, specific, factual.",
  "safetyProfile": "string",
  "interactions": ["string"],
  "preparation": "string",
  "dosageNote": "string",
  "contraindications": ["string"],
  "apothecaryNote": "REQUIRED. 3 numbered preparation or sourcing notes. Practical and specific.",
  "actRightDollars": "REQUIRED. Estimated savings versus pharmaceutical equivalent. End exactly with: That goes directly into your AA2 Vault as Act Right Dollars."
}`;

const FORMULATE_SYS = `You are The Equalizer — AA2's apothecary intelligence for Spoke 34. You assess compound stacks for synergy, antagonism, and safety before the member ever formulates.

CRITICAL RULES:
1. NEVER name any database in any user-facing field.
2. Return ONLY valid JSON — no markdown, no backticks, no preamble.
3. verdict must be exactly: "SAFE", "CAUTION", or "CONTRAINDICATED".

Return this exact JSON:
{
  "verdict": "SAFE" | "CAUTION" | "CONTRAINDICATED",
  "stackName": "string — a name for this blend",
  "equalizerVoice": "string — 2–3 sentences assessing the overall stack as The Equalizer.",
  "synergies": ["string"],
  "conflicts": ["string"],
  "sequencing": "string — optimal timing and order of intake",
  "formNote": "REQUIRED. 3 numbered formulation or sourcing notes.",
  "actRightDollars": "REQUIRED. Estimated savings vs. pharmaceutical alternatives. End exactly with: That goes directly into your AA2 Vault as Act Right Dollars."
}`;

const CONDITION_SYS = `You are The Equalizer — AA2's apothecary intelligence for Spoke 34. Given a health goal or condition, return a complete plant-based protocol.

CRITICAL RULES:
1. NEVER name any database in any user-facing field.
2. Return ONLY valid JSON — no markdown, no backticks, no preamble.
3. verdict must be exactly: "SAFE", "CAUTION", or "CONTRAINDICATED".

Return this exact JSON:
{
  "verdict": "SAFE" | "CAUTION" | "CONTRAINDICATED",
  "protocolName": "string",
  "equalizerVoice": "string — 2–3 sentences as The Equalizer on this condition and the protocol rationale.",
  "primaryHerbs": [{"name":"string","role":"string","preparation":"string"}],
  "supportingHerbs": [{"name":"string","role":"string"}],
  "lifestyle": ["string"],
  "cautions": ["string"],
  "protocolNote": "REQUIRED. 3 numbered steps to implement this protocol.",
  "actRightDollars": "REQUIRED. Estimated savings vs. pharmaceutical approaches. End exactly with: That goes directly into your AA2 Vault as Act Right Dollars."
}`;

const FORAGER_SYS = `You are The Equalizer running the FORAGER LAYER — AA2's wild food intelligence for Spoke 34. Backed by 9 silent databases spanning mycology, ethnobotany, wilderness survival medicine, foraging field guides, and regional flora/fauna databases. Speak as The Equalizer: direct, calm, authoritative. A wrong identification can kill. Be exact.

CRITICAL RULES:
1. NEVER name any database in any user-facing field.
2. Return ONLY valid JSON — no markdown, no backticks, no preamble.
3. verdict must be exactly: "SAFE", "CAUTION", or "CONTRAINDICATED".
4. edibility must be exactly: "safe", "conditional", or "toxic".
5. If you cannot identify with high confidence, set edibility to "conditional" and explain in foragerNote.

Return this exact JSON:
{
  "verdict": "SAFE" | "CAUTION" | "CONTRAINDICATED",
  "edibility": "safe" | "conditional" | "toxic",
  "commonName": "string",
  "scientificName": "genus species",
  "equalizerVoice": "string — 2–3 sentences as The Equalizer. Name what this is, where it grows, what it does. Precise.",
  "season": "string — when to find it, peak window",
  "region": "string — geographic range where this species is found",
  "preparation": "string — how to harvest, clean, and prepare. Be specific. Include any required cooking.",
  "lookalikes": [
    {
      "name": "string — common name of toxic lookalike",
      "difference": "string — specific observable difference that distinguishes it from the target species"
    }
  ],
  "foragerNote": "REQUIRED. 3 numbered practical field notes — harvesting tips, storage, any warnings specific to this specimen.",
  "actRightDollars": "REQUIRED. Estimated market value of a typical foraged haul of this species. End exactly with: That goes directly into your AA2 Vault as Act Right Dollars."
}`;

// ─── BARCODE LOOKUP ──────────────────────────────────────────────────────────
async function lookupBarcode(barcode: string): Promise<string> {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, { headers: { 'User-Agent': 'AA2-Scanner/1.0' } });
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return `Barcode: ${barcode}. Product not in database. Identify the most likely herb, supplement, or botanical extract associated with this barcode and analyze it. Return compound verdict JSON.`;
    }
    const p = data.product;
    return [
      `SUPPLEMENT/PRODUCT: ${p.product_name || 'Unknown'}${p.brands ? ' by ' + p.brands : ''}`,
      `BARCODE: ${barcode}`,
      `INGREDIENTS: ${p.ingredients_text_en || p.ingredients_text || 'Not listed'}`,
      `ADDITIVES: ${p.additives_tags?.map((a: string) => a.replace('en:', '')).join(', ') || 'none'}`,
      `\nAnalyze as a botanical compound or supplement. Return compound verdict JSON.`,
    ].filter(Boolean).join('\n');
  } catch (err: any) {
    return `Barcode: ${barcode}. Lookup failed. Analyze as herb or supplement and return compound verdict JSON.`;
  }
}

// ─── STACK ITEM TYPE ─────────────────────────────────────────────────────────
type StackItem = { id: string; name: string };

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ApothecaryScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const frameW      = Math.min(screenW * 0.68, 300);
  const frameH      = frameW * 0.58;
  const camPadTop   = Math.max(screenH * 0.08, 32);
  const camPadBot   = Math.max(screenH * 0.10, 44);
  const captureSize = Math.min(Math.max(screenW * 0.19, 68), 90);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cameraMode,   setCameraMode]   = useState(false);
  const [barcodeReady, setBarcodeReady] = useState(false);
  const lastBarcodeRef = useRef<string | null>(null);
  const scannedRef     = useRef(false);

  const [mode,          setMode]          = useState<Mode>('compound');
  const [query,         setQuery]         = useState('');
  const [condition,     setCondition]     = useState('');
  const [stackInput,    setStackInput]    = useState('');
  const [stack,         setStack]         = useState<StackItem[]>([]);
  const [foragerQuery,  setForagerQuery]  = useState('');
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState<any>(null);
  const [apiError,      setApiError]      = useState('');

  const clearResult = () => { setResult(null); setApiError(''); };

  const switchMode = (m: Mode) => {
    setMode(m);
    clearResult();
    closeCameraIfOpen();
  };

  const closeCameraIfOpen = () => {
    lastBarcodeRef.current = null;
    setBarcodeReady(false);
    scannedRef.current = false;
    setCameraMode(false);
  };

  const addToStack = () => {
    if (!stackInput.trim()) return;
    setStack(prev => [...prev, { id: Date.now().toString(), name: stackInput.trim() }]);
    setStackInput('');
  };

  const removeFromStack = (id: string) =>
    setStack(prev => prev.filter(s => s.id !== id));

  const parseResponse = (text: string) => {
    const cleaned = text.replace(/```json\s?|```/g, '').trim();
    return JSON.parse(cleaned);
  };

  // ── Camera handlers ───────────────────────────────────────────────────────
  const openCamera = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { Alert.alert('Camera Permission', 'AA2 needs camera access.'); return; }
    }
    scannedRef.current = false;
    lastBarcodeRef.current = null;
    setBarcodeReady(false);
    setCameraMode(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (loading) return;
    lastBarcodeRef.current = data;
    setBarcodeReady(true);
  };

  const handleCapture = async () => {
    if (loading) return;
    const barcode = lastBarcodeRef.current;
    scannedRef.current = true;

    if (mode === 'forager') {
      // Capture photo as base64 BEFORE closing camera
      let capturedBase64: string | undefined;
      try {
        const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.7 });
        capturedBase64 = photo?.base64;
      } catch {
        // fall through — will send text-only if photo capture fails
      }

      closeCameraIfOpen();
      setLoading(true);
      clearResult();

      try {
        const textContent = 'Wild plant, mushroom, berry, or fish photographed — identify the species. Assess edibility, list toxic lookalikes, provide foraging and preparation guidance. Return forager verdict JSON.';
        const messages: any[] = capturedBase64
          ? [{ role: 'user', content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: capturedBase64 } },
              { type: 'text', text: textContent },
            ]}]
          : [{ role: 'user', content: textContent }];

        const res = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1600,
          system: FORAGER_SYS,
          messages,
        });
        setResult(parseResponse((res.content[0] as any).text || ''));
      } catch (err: any) {
        setApiError(err?.message || err?.toString() || 'The Equalizer could not complete this analysis. Try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    closeCameraIfOpen();
    setLoading(true);
    clearResult();

    try {
      let content: string;
      if (barcode) {
        content = await Promise.race<string>([
          lookupBarcode(barcode),
          new Promise<string>(r => setTimeout(() => r(`Barcode: ${barcode}. Analyze as herb or supplement. Return compound verdict JSON.`), 3000)),
        ]);
      } else {
        content = 'Plant, herb, or supplement photographed — no barcode detected. Identify the most likely botanical or supplement in frame and provide full compound analysis. Return compound verdict JSON.';
      }
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        system: COMPOUND_SYS,
        messages: [{ role: 'user', content }],
      });
      setResult(parseResponse((res.content[0] as any).text || ''));
    } catch (err: any) {
      setApiError(err?.message || err?.toString() || 'The Equalizer could not complete this analysis. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCamera = () => { closeCameraIfOpen(); };

  // ── Analysis runners ──────────────────────────────────────────────────────
  const runCompound = async () => {
    if (!query.trim()) {
      Alert.alert('Enter a compound', 'Type an herb, extract, or supplement name.');
      return;
    }
    setLoading(true);
    clearResult();
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        system: COMPOUND_SYS,
        messages: [{ role: 'user', content: `Analyze for Spoke 34: ${query.trim()}` }],
      });
      setResult(parseResponse((res.content[0] as any).text || ''));
    } catch (err: any) {
      setApiError(err?.message || err?.toString() || 'The Equalizer could not complete this analysis. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const runFormulate = async () => {
    if (stack.length < 2) {
      Alert.alert('Add at least 2 compounds', 'The Equalizer needs a stack to assess.');
      return;
    }
    setLoading(true);
    clearResult();
    try {
      const list = stack.map(s => s.name).join(', ');
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        system: FORMULATE_SYS,
        messages: [{ role: 'user', content: `Assess this compound stack for Spoke 34: ${list}` }],
      });
      setResult(parseResponse((res.content[0] as any).text || ''));
    } catch (err: any) {
      setApiError(err?.message || err?.toString() || 'The Equalizer could not assess this stack. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const runCondition = async () => {
    if (!condition.trim()) {
      Alert.alert('Describe your goal', 'Enter a health goal or condition.');
      return;
    }
    setLoading(true);
    clearResult();
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1600,
        system: CONDITION_SYS,
        messages: [{ role: 'user', content: `Build a plant protocol for Spoke 34 member. Goal or condition: ${condition.trim()}` }],
      });
      setResult(parseResponse((res.content[0] as any).text || ''));
    } catch (err: any) {
      setApiError(err?.message || err?.toString() || 'The Equalizer could not build this protocol. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const runForager = async () => {
    if (!foragerQuery.trim()) {
      Alert.alert('Describe what you found', 'Type a name or description of the wild find.');
      return;
    }
    setLoading(true);
    clearResult();
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1600,
        system: FORAGER_SYS,
        messages: [{ role: 'user', content: `Identify and assess this wild find: ${foragerQuery.trim()}` }],
      });
      setResult(parseResponse((res.content[0] as any).text || ''));
    } catch (err: any) {
      setApiError(err?.message || err?.toString() || 'The Equalizer could not complete this analysis. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => {
    if (mode === 'compound')  runCompound();
    if (mode === 'formulate') runFormulate();
    if (mode === 'condition') runCondition();
    if (mode === 'forager')   runForager();
  };

  const hasResult = !!result;
  const v: Verdict | null = result?.verdict ?? null;

  // ── CAMERA FULL-SCREEN ────────────────────────────────────────────────────
  if (cameraMode) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: '#000' }]}>
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={mode !== 'forager' ? handleBarcodeScanned : undefined}
          >
            <View style={[s.camOverlay, { paddingTop: camPadTop, paddingBottom: camPadBot }]}>
              <View style={s.camFrameGroup}>
                <View style={[s.camFrame, {
                  width: frameW, height: frameH,
                  borderColor: barcodeReady ? C.gold : C.teal,
                  borderWidth: barcodeReady ? 3 : 1.5,
                }]}/>
                <Text style={[s.camDoctrine, { color: C.gold }]}>
                  {mode === 'forager' ? 'FRAME YOUR WILD FIND' : 'FRAME PLANT · LABEL · BARCODE'}
                </Text>
                <Text style={[s.camHint, { color: barcodeReady ? C.gold : C.teal }]}>
                  {barcodeReady ? '● LOCKED — TAP TO SCAN' : 'FRAME IT · CONFIRM IT · SCAN IT'}
                </Text>
              </View>
              <View style={s.camControls}>
                <TouchableOpacity
                  style={[s.captureOuter, {
                    width: captureSize, height: captureSize, borderRadius: captureSize / 2,
                    borderColor: barcodeReady ? C.gold : C.teal,
                  }]}
                  onPress={handleCapture}
                  activeOpacity={0.85}>
                  <View style={[s.captureInner, {
                    width: captureSize * 0.74, height: captureSize * 0.74, borderRadius: captureSize * 0.37,
                    backgroundColor: barcodeReady ? C.gold : C.teal,
                  }]}/>
                </TouchableOpacity>
                <TouchableOpacity style={s.camCancelBtn} onPress={handleCancelCamera}>
                  <Text style={s.camCancelText}>✕ CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </SafeAreaView>
    );
  }

  // ── MAIN SCREEN ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>APOTHECARY</Text>
        <View style={s.equalizerBadge}>
          <Text style={s.equalizerBadgeText}>THE EQUALIZER</Text>
        </View>
      </View>

      {/* ── MODE STRIP ── */}
      <View style={s.modeStrip}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[
              s.modeBtn,
              mode === m.id && { borderColor: C.teal, backgroundColor: C.tealDim },
            ]}
            onPress={() => switchMode(m.id)}
          >
            <Text style={[s.modeGlyph, mode === m.id && { color: C.teal }]}>
              {m.glyph}
            </Text>
            <Text style={[s.modeLabel, mode === m.id && { color: C.teal }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={{ paddingBottom: 88 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ════════════ COMPOUND MODE ════════════ */}
        {mode === 'compound' && (
          hasResult && !loading ? (
            <TouchableOpacity
              style={[s.resetBar, { borderColor: C.teal }]}
              onPress={clearResult}
            >
              <Text style={[s.resetBarText, { color: C.teal }]}>
                ⚗  ANALYZE ANOTHER COMPOUND
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.inputCard}>
              <Text style={s.modeDesc}>{MODES[0].desc}</Text>

              <TouchableOpacity style={s.scanCameraBtn} onPress={openCamera}>
                <Text style={s.scanCameraBtnIcon}>📷</Text>
                <Text style={s.scanCameraBtnLabel}>SCAN PLANT · LABEL · BARCODE</Text>
              </TouchableOpacity>

              <Text style={s.orDivider}>— or type it —</Text>

              <Text style={s.fieldLabel}>COMPOUND NAME</Text>
              <TextInput
                style={s.input}
                placeholder="Ashwagandha, Berberine, Lion's Mane, Moringa..."
                placeholderTextColor={C.muted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleRun}
                returnKeyType="search"
                autoCorrect={false}
              />
              <TouchableOpacity style={s.runBtn} onPress={handleRun}>
                <Text style={s.runBtnText}>⚗  RUN COMPOUND ANALYSIS</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* ════════════ FORMULATE MODE ════════════ */}
        {mode === 'formulate' && (
          hasResult && !loading ? (
            <TouchableOpacity
              style={[s.resetBar, { borderColor: C.teal }]}
              onPress={() => { clearResult(); setStack([]); }}
            >
              <Text style={[s.resetBarText, { color: C.teal }]}>
                ⊕  BUILD ANOTHER STACK
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.inputCard}>
              <Text style={s.modeDesc}>{MODES[1].desc}</Text>

              {stack.length > 0 && (
                <>
                  <Text style={s.fieldLabel}>YOUR STACK</Text>
                  {stack.map((item, i) => (
                    <View key={item.id} style={s.stackRow}>
                      <Text style={s.stackIndex}>{i + 1}</Text>
                      <Text style={s.stackName}>{item.name}</Text>
                      <TouchableOpacity
                        onPress={() => removeFromStack(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={s.removeGlyph}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              <Text style={[s.fieldLabel, stack.length > 0 && { marginTop: 14 }]}>
                ADD COMPOUND
              </Text>
              <View style={s.rowInput}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Reishi, Magnesium Glycinate, Turmeric..."
                  placeholderTextColor={C.muted}
                  value={stackInput}
                  onChangeText={setStackInput}
                  onSubmitEditing={addToStack}
                  returnKeyType="done"
                  autoCorrect={false}
                />
                <TouchableOpacity style={s.addBtn} onPress={addToStack}>
                  <Text style={s.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {stack.length >= 2 ? (
                <TouchableOpacity style={[s.runBtn, { marginTop: 14 }]} onPress={handleRun}>
                  <Text style={s.runBtnText}>⊕  CHECK STACK INTERACTIONS</Text>
                </TouchableOpacity>
              ) : (
                <Text style={s.hintText}>
                  Add at least 2 compounds to assess the stack.
                </Text>
              )}
            </View>
          )
        )}

        {/* ════════════ CONDITION MODE ════════════ */}
        {mode === 'condition' && (
          hasResult && !loading ? (
            <TouchableOpacity
              style={[s.resetBar, { borderColor: C.teal }]}
              onPress={() => { clearResult(); setCondition(''); }}
            >
              <Text style={[s.resetBarText, { color: C.teal }]}>
                ✦  NEW PROTOCOL
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.inputCard}>
              <Text style={s.modeDesc}>{MODES[2].desc}</Text>
              <Text style={s.fieldLabel}>HEALTH GOAL OR CONDITION</Text>
              <TextInput
                style={[s.input, { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder="e.g. improve sleep quality, reduce systemic inflammation, support adrenal health..."
                placeholderTextColor={C.muted}
                value={condition}
                onChangeText={setCondition}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={s.runBtn} onPress={handleRun}>
                <Text style={s.runBtnText}>✦  BUILD PLANT PROTOCOL</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* ════════════ FORAGER MODE ════════════ */}
        {mode === 'forager' && (
          hasResult && !loading ? (
            <TouchableOpacity
              style={[s.resetBar, { borderColor: C.teal }]}
              onPress={() => { clearResult(); setForagerQuery(''); }}
            >
              <Text style={[s.resetBarText, { color: C.teal }]}>
                🌿  IDENTIFY ANOTHER FIND
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.inputCard}>
              <Text style={s.modeDesc}>{MODES[3].desc}</Text>

              <TouchableOpacity style={[s.scanCameraBtn, { borderColor: C.teal }]} onPress={openCamera}>
                <Text style={s.scanCameraBtnIcon}>📷</Text>
                <Text style={s.scanCameraBtnLabel}>FRAME YOUR WILD FIND</Text>
              </TouchableOpacity>

              <Text style={s.orDivider}>— or describe it —</Text>

              <Text style={s.fieldLabel}>WHAT DID YOU FIND?</Text>
              <TextInput
                style={[s.input, { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder="e.g. brown cap mushroom with gills, found near oak trees in October... or: wild berries, blue-black, cluster formation..."
                placeholderTextColor={C.muted}
                value={foragerQuery}
                onChangeText={setForagerQuery}
                multiline
                numberOfLines={3}
                autoCorrect={false}
              />
              <TouchableOpacity style={s.runBtn} onPress={handleRun}>
                <Text style={s.runBtnText}>🌿  IDENTIFY &amp; ASSESS</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* ════════════ LOADING ════════════ */}
        {loading && (
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={s.loadingLabel}>THE EQUALIZER IS CONSULTING</Text>
            <Text style={s.loadingSubLabel}>9 SILENT DATABASES ACTIVE</Text>
          </View>
        )}

        {/* ════════════ ERROR ════════════ */}
        {!!apiError && !loading && (
          <View style={[s.inputCard, { borderColor: C.red + '88' }]}>
            <Text style={[s.fieldLabel, { color: C.red }]}>ANALYSIS INTERRUPTED</Text>
            <Text style={s.errorBody}>{apiError}</Text>
            <TouchableOpacity
              style={[s.runBtn, { backgroundColor: 'rgba(201,76,76,0.18)', borderColor: C.red }]}
              onPress={() => { setApiError(''); handleRun(); }}
            >
              <Text style={[s.runBtnText, { color: C.red }]}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════ RESULTS ════════════ */}
        {hasResult && !loading && v && (
          <>
            <View style={[s.verdictBanner, { backgroundColor: vDim(v), borderColor: vColor(v) }]}>
              <View style={[s.verdictCircle, { borderColor: vColor(v) }]}>
                <Text style={[s.verdictGlyph, { color: vColor(v) }]}>{vGlyph(v)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.verdictTag, { color: vColor(v) }]}>{v}</Text>
                <Text style={s.verdictSubject} numberOfLines={2}>
                  {result.compoundName || result.stackName || result.protocolName || result.commonName || ''}
                </Text>
              </View>
            </View>

            {/* Forager edibility badge */}
            {mode === 'forager' && result.edibility && (
              <View style={[s.edibilityBadge, { backgroundColor: edibilityColor(result.edibility as EdibilityLevel) + '1A', borderColor: edibilityColor(result.edibility as EdibilityLevel) }]}>
                <Text style={[s.edibilityBadgeText, { color: edibilityColor(result.edibility as EdibilityLevel) }]}>
                  {result.edibility === 'safe' ? '✓' : result.edibility === 'conditional' ? '⚠' : '✕'}  {edibilityLabel(result.edibility as EdibilityLevel)}
                </Text>
              </View>
            )}

            {/* Forager species name */}
            {mode === 'forager' && result.commonName && (
              <View style={{ marginHorizontal: 12, marginBottom: 4 }}>
                <Text style={[s.foragerSpeciesName, { fontFamily: F.serifIt }]}>{result.commonName}</Text>
                {result.scientificName && (
                  <Text style={s.foragerScientificName}>{result.scientificName}</Text>
                )}
              </View>
            )}

            {!!result.equalizerVoice && (
              <View style={[s.intelBlock, { borderLeftColor: C.teal }]}>
                <Text style={s.intelTag}>{mode === 'forager' ? '🌿 THE EQUALIZER · FORAGER LAYER' : 'THE EQUALIZER'}</Text>
                <Text style={s.intelVoice}>{result.equalizerVoice}</Text>
              </View>
            )}

            {/* ── COMPOUND RESULTS ── */}
            {mode === 'compound' && (
              <>
                {result.activeConstituents?.length > 0 && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>ACTIVE CONSTITUENTS</Text>
                    {(result.activeConstituents as string[]).map((c, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.teal }]}>◆</Text>
                        <Text style={s.bulletBody}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!result.safetyProfile && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>SAFETY PROFILE</Text>
                    <Text style={s.prose}>{result.safetyProfile}</Text>
                  </View>
                )}
                {result.interactions?.length > 0 && (
                  <View style={[s.dataCard, { borderColor: C.gold + '55' }]}>
                    <Text style={[s.dataCardTitle, { color: C.gold }]}>KNOWN INTERACTIONS</Text>
                    {(result.interactions as string[]).map((item, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.gold }]}>⚠</Text>
                        <Text style={s.bulletBody}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!result.preparation && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>PREPARATION</Text>
                    <Text style={s.prose}>{result.preparation}</Text>
                  </View>
                )}
                {!!result.dosageNote && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>DOSAGE NOTE</Text>
                    <Text style={s.prose}>{result.dosageNote}</Text>
                  </View>
                )}
                {result.contraindications?.length > 0 && (
                  <View style={[s.dataCard, { borderColor: C.red + '55' }]}>
                    <Text style={[s.dataCardTitle, { color: C.red }]}>CONTRAINDICATIONS</Text>
                    {(result.contraindications as string[]).map((item, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.red }]}>✕</Text>
                        <Text style={s.bulletBody}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!result.apothecaryNote && (
                  <View style={[s.intelBlock, { borderLeftColor: C.gold }]}>
                    <Text style={[s.intelTag, { color: C.gold }]}>APOTHECARY NOTE</Text>
                    <Text style={s.intelVoice}>{result.apothecaryNote}</Text>
                  </View>
                )}
              </>
            )}

            {/* ── FORMULATE RESULTS ── */}
            {mode === 'formulate' && (
              <>
                {result.synergies?.length > 0 && (
                  <View style={s.dataCard}>
                    <Text style={[s.dataCardTitle, { color: C.teal }]}>SYNERGIES</Text>
                    {(result.synergies as string[]).map((item, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.teal }]}>◆</Text>
                        <Text style={s.bulletBody}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {result.conflicts?.length > 0 && (
                  <View style={[s.dataCard, { borderColor: C.gold + '55' }]}>
                    <Text style={[s.dataCardTitle, { color: C.gold }]}>CONFLICTS</Text>
                    {(result.conflicts as string[]).map((item, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.gold }]}>⚠</Text>
                        <Text style={s.bulletBody}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!result.sequencing && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>SEQUENCING & TIMING</Text>
                    <Text style={s.prose}>{result.sequencing}</Text>
                  </View>
                )}
                {!!result.formNote && (
                  <View style={[s.intelBlock, { borderLeftColor: C.gold }]}>
                    <Text style={[s.intelTag, { color: C.gold }]}>FORMULATION NOTE</Text>
                    <Text style={s.intelVoice}>{result.formNote}</Text>
                  </View>
                )}
              </>
            )}

            {/* ── CONDITION RESULTS ── */}
            {mode === 'condition' && (
              <>
                {result.primaryHerbs?.length > 0 && (
                  <View style={s.dataCard}>
                    <Text style={[s.dataCardTitle, { color: C.teal }]}>PRIMARY HERBS</Text>
                    {(result.primaryHerbs as { name: string; role: string; preparation: string }[]).map((h, i) => (
                      <View key={i} style={s.herbCard}>
                        <Text style={s.herbName}>{h.name}</Text>
                        <Text style={s.herbRole}>{h.role}</Text>
                        {!!h.preparation && <Text style={s.herbPrep}>Preparation — {h.preparation}</Text>}
                      </View>
                    ))}
                  </View>
                )}
                {result.supportingHerbs?.length > 0 && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>SUPPORTING HERBS</Text>
                    {(result.supportingHerbs as { name: string; role: string }[]).map((h, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.teal }]}>◆</Text>
                        <Text style={s.bulletBody}>
                          <Text style={s.herbNameInline}>{h.name}</Text>
                          {h.role ? `  —  ${h.role}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {result.lifestyle?.length > 0 && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>LIFESTYLE PROTOCOL</Text>
                    {(result.lifestyle as string[]).map((item, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.teal }]}>◆</Text>
                        <Text style={s.bulletBody}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {result.cautions?.length > 0 && (
                  <View style={[s.dataCard, { borderColor: C.gold + '55' }]}>
                    <Text style={[s.dataCardTitle, { color: C.gold }]}>CAUTIONS</Text>
                    {(result.cautions as string[]).map((item, i) => (
                      <View key={i} style={s.bulletRow}>
                        <Text style={[s.bulletDot, { color: C.gold }]}>⚠</Text>
                        <Text style={s.bulletBody}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!result.protocolNote && (
                  <View style={[s.intelBlock, { borderLeftColor: C.gold }]}>
                    <Text style={[s.intelTag, { color: C.gold }]}>PROTOCOL NOTE</Text>
                    <Text style={s.intelVoice}>{result.protocolNote}</Text>
                  </View>
                )}
              </>
            )}

            {/* ── FORAGER RESULTS ── */}
            {mode === 'forager' && (
              <>
                {!!result.season && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>SEASON</Text>
                    <Text style={s.prose}>{result.season}</Text>
                  </View>
                )}
                {!!result.region && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>REGION</Text>
                    <Text style={s.prose}>{result.region}</Text>
                  </View>
                )}
                {!!result.preparation && (
                  <View style={s.dataCard}>
                    <Text style={s.dataCardTitle}>PREPARATION</Text>
                    <Text style={s.prose}>{result.preparation}</Text>
                  </View>
                )}
                {result.lookalikes?.length > 0 && (
                  <View style={[s.dataCard, { borderColor: C.red + '55' }]}>
                    <Text style={[s.dataCardTitle, { color: C.red }]}>⚠ TOXIC LOOKALIKES</Text>
                    {(result.lookalikes as { name: string; difference: string }[]).map((lk, i) => (
                      <View key={i} style={[s.lookalikesRow, i < result.lookalikes.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 10, marginBottom: 10 }]}>
                        <Text style={s.lookalikeNameText}>{lk.name}</Text>
                        <Text style={s.lookalikeDiffText}>{lk.difference}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!result.foragerNote && (
                  <View style={[s.intelBlock, { borderLeftColor: C.gold }]}>
                    <Text style={[s.intelTag, { color: C.gold }]}>FORAGER NOTE</Text>
                    <Text style={s.intelVoice}>{result.foragerNote}</Text>
                  </View>
                )}
              </>
            )}

            {!!result.actRightDollars && (
              <View style={s.vaultCard}>
                <Text style={s.vaultLabel}>💰  ACT RIGHT DOLLARS</Text>
                <Text style={s.vaultBody}>{result.actRightDollars}</Text>
              </View>
            )}

            <View style={s.disclaimer}>
              <Text style={s.disclaimerText}>
                This is educational intelligence — not medical advice. Consult a qualified practitioner before starting any protocol.
              </Text>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 36,
    color: C.white,
    letterSpacing: 5,
    lineHeight: 40,
  },
  equalizerBadge: {
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.teal,
    backgroundColor: C.tealDim,
  },
  equalizerBadgeText: {
    fontFamily: F.mono,
    fontSize: 8,
    color: C.teal,
    letterSpacing: 3,
  },

  modeStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 4,
  },
  modeGlyph: { fontFamily: F.mono, fontSize: 16, color: C.dim },
  modeLabel: { fontFamily: F.mono, fontSize: 8, color: C.dim, letterSpacing: 1.5 },

  body: { flex: 1 },

  scanCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.teal,
    backgroundColor: C.tealDim,
    marginBottom: 12,
  },
  scanCameraBtnIcon:  { fontSize: 18 },
  scanCameraBtnLabel: { fontFamily: F.mono, fontSize: 11, color: C.teal, letterSpacing: 1.5, fontWeight: '600' },
  orDivider: { fontFamily: F.mono, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: 2, marginBottom: 12 },

  resetBar: {
    marginHorizontal: 12, marginTop: 10, marginBottom: 4,
    paddingVertical: 13, borderRadius: 8, borderWidth: 1.5, alignItems: 'center',
  },
  resetBarText: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2 },

  inputCard: {
    marginHorizontal: 12, marginTop: 12, marginBottom: 8,
    padding: 18, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  modeDesc: { fontFamily: F.serif, fontSize: 16, color: C.dim, lineHeight: 22, marginBottom: 18, fontStyle: 'italic' },
  fieldLabel: { fontFamily: F.mono, fontSize: 9, color: C.dim, letterSpacing: 2.5, marginBottom: 8 },
  input: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.borderSoft,
    borderRadius: 8, color: C.white, fontFamily: F.mono, fontSize: 13, padding: 12, marginBottom: 12,
  },
  runBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: C.teal, marginTop: 2 },
  runBtnText: { fontFamily: F.mono, fontSize: 11, color: '#03050A', letterSpacing: 2, fontWeight: '600' },

  rowInput: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  addBtn: { width: 46, height: 46, borderRadius: 8, backgroundColor: C.teal, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#03050A', fontSize: 26, fontWeight: '700', lineHeight: 30, fontFamily: F.mono },

  stackRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass,
    borderRadius: 8, borderWidth: 1, borderColor: C.glassBorder,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, gap: 10,
  },
  stackIndex: { fontFamily: F.mono, fontSize: 12, color: C.teal, width: 18 },
  stackName:  { fontFamily: F.mono, fontSize: 13, color: C.white, flex: 1 },
  removeGlyph:{ fontFamily: F.mono, fontSize: 14, color: C.red, paddingLeft: 6 },

  hintText: { fontFamily: F.mono, fontSize: 10, color: C.muted, letterSpacing: 0.5, marginTop: 12, textAlign: 'center' },

  loadingCard: {
    marginHorizontal: 12, marginVertical: 12, padding: 32,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  loadingLabel:    { fontFamily: F.mono, fontSize: 11, color: C.teal, letterSpacing: 2.5, marginTop: 16, textAlign: 'center' },
  loadingSubLabel: { fontFamily: F.mono, fontSize: 8, color: C.muted, letterSpacing: 2, marginTop: 6, textAlign: 'center' },

  errorBody: { fontFamily: F.serif, fontSize: 15, color: C.dim, lineHeight: 22, marginBottom: 14 },

  verdictBanner: {
    marginHorizontal: 12, marginTop: 12, marginBottom: 4,
    borderRadius: 12, borderWidth: 1.5, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  verdictCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  verdictGlyph:  { fontFamily: F.mono, fontSize: 20, fontWeight: '700' },
  verdictTag:    { fontFamily: F.mono, fontSize: 9, letterSpacing: 3, marginBottom: 4 },
  verdictSubject:{ fontFamily: F.display, fontSize: 22, color: C.white, letterSpacing: 2, lineHeight: 26 },

  // Forager
  edibilityBadge: {
    marginHorizontal: 12, marginTop: 8, marginBottom: 4,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center',
  },
  edibilityBadgeText: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  foragerSpeciesName: { fontSize: 30, color: C.white, lineHeight: 36, marginBottom: 3 },
  foragerScientificName: { fontFamily: F.mono, fontSize: 11, color: C.dim, letterSpacing: 0.5 },
  lookalikesRow: { marginBottom: 4 },
  lookalikeNameText: { fontFamily: F.monoMd, fontSize: 13, color: C.red, marginBottom: 3 },
  lookalikeDiffText: { fontFamily: F.serif, fontSize: 15, color: C.dim, lineHeight: 22 },

  intelBlock: {
    marginHorizontal: 12, marginVertical: 5, padding: 16,
    backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3,
  },
  intelTag:  { fontFamily: F.mono, fontSize: 8, color: C.teal, letterSpacing: 3, marginBottom: 10 },
  intelVoice:{ fontFamily: F.serif, fontSize: 17, color: C.white, lineHeight: 26 },

  dataCard: {
    marginHorizontal: 12, marginVertical: 5, padding: 16,
    backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  dataCardTitle: { fontFamily: F.mono, fontSize: 8, color: C.dim, letterSpacing: 2.5, marginBottom: 12 },
  prose:         { fontFamily: F.serif, fontSize: 16, color: C.white, lineHeight: 24 },

  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bulletDot: { fontFamily: F.mono, fontSize: 10, color: C.teal, marginTop: 4, width: 14, textAlign: 'center' },
  bulletBody:{ fontFamily: F.serif, fontSize: 16, color: C.white, lineHeight: 24, flex: 1 },

  herbCard: {
    backgroundColor: C.glass, borderRadius: 8, borderWidth: 1, borderColor: C.glassBorder, padding: 12, marginBottom: 8,
  },
  herbName:      { fontFamily: F.display, fontSize: 18, color: C.teal, letterSpacing: 2, marginBottom: 3 },
  herbRole:      { fontFamily: F.serif, fontSize: 15, color: C.white, lineHeight: 22, fontStyle: 'italic' },
  herbPrep:      { fontFamily: F.mono, fontSize: 11, color: C.dim, marginTop: 6, letterSpacing: 0.5 },
  herbNameInline:{ fontFamily: F.monoMd, fontSize: 14, color: C.teal },

  vaultCard: {
    marginHorizontal: 12, marginTop: 8, marginBottom: 5, padding: 16,
    backgroundColor: C.goldDim, borderRadius: 10, borderWidth: 1, borderColor: C.gold + '66',
  },
  vaultLabel: { fontFamily: F.mono, fontSize: 9, color: C.gold, letterSpacing: 2.5, marginBottom: 8 },
  vaultBody:  { fontFamily: F.serif, fontSize: 16, color: C.white, lineHeight: 24 },

  disclaimer: {
    marginHorizontal: 12, marginTop: 10, marginBottom: 8, padding: 14,
    borderRadius: 8, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.glass,
  },
  disclaimerText: { fontFamily: F.mono, fontSize: 9, color: C.muted, letterSpacing: 0.8, lineHeight: 15, textAlign: 'center' },

  // Camera
  camOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'space-between', alignItems: 'center' },
  camFrameGroup: { alignItems: 'center' },
  camFrame:      { borderRadius: 14, marginBottom: 12 },
  camDoctrine:   { fontSize: 9, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 8 },
  camHint:       { fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  camControls:   { alignItems: 'center', width: '100%' },
  captureOuter:  { borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
  captureInner:  {},
  camCancelBtn:  { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  camCancelText: { color: 'rgba(255,255,255,0.60)', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
});
