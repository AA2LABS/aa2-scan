import Anthropic from '@anthropic-ai/sdk';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { buildPersonalTruth, loadMemberProfile, saveScan } from '../../lib/db';

// ─── PALETTE SYSTEM ──────────────────────────────────────────────────────────
const PALETTES = {
  earth:   { bg:'#0D0A04', card:'#1A1408', border:'#2E2208', accent:'#C49A2A', name:'Earth'    },
  ocean:   { bg:'#030D14', card:'#0A1A24', border:'#0E2535', accent:'#4A9EFF', name:'Ocean'    },
  alpine:  { bg:'#040D08', card:'#0A180D', border:'#0E2214', accent:'#2ECF73', name:'Alpine'   },
  obsidian:{ bg:'#080808', card:'#131313', border:'#1E1E1E', accent:'#9B59B6', name:'Obsidian' },
  desert:  { bg:'#0F0A04', card:'#1A1208', border:'#2E1E08', accent:'#F5922A', name:'Desert'  },
} as const;
type PaletteKey = keyof typeof PALETTES;

// ─── FIXED COLORS ────────────────────────────────────────────────────────────
const F = {
  white:        '#FFFFFF',
  dimWhite:     'rgba(255,255,255,0.60)',
  mutedWhite:   'rgba(255,255,255,0.35)',
  allClear:     '#2ECFB3',
  headsUp:      '#C9A84C',
  payAttention: '#E05252',
  red:          '#E05252',
  gold:         '#C49A2A',
  teal:         '#2ECFB3',
  blue:         '#4A9EFF',
  orange:       '#F5922A',
  nearBlack:    '#03050A',
};

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── HEROES ──────────────────────────────────────────────────────────────────
const TAB_HEROES: Record<string, any> = {
  scan:       require('../../assets/images/tab-scan.jpg'),
  produce:    require('../../assets/images/tab-produce.jpg'),
  meat:       require('../../assets/images/tab-meat.jpg'),
  care:       require('../../assets/images/tab-care.jpg'),
  grownfolks: require('../../assets/images/tab-grownfolks.jpg'),
  k9:         require('../../assets/images/tab-k9.jpg'),
  horse:      require('../../assets/images/tab-horse.jpg'),
  agri:       require('../../assets/images/tab-agri.jpg'),
};

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'scan',       label:'SCAN',         icon:'⚡', color:F.gold   },
  { id:'produce',    label:'PRODUCE',       icon:'🌿', color:F.teal   },
  { id:'meat',       label:'MEAT',          icon:'🥩', color:F.red    },
  { id:'care',       label:'PERSONAL CARE', icon:'🧴', color:'#9B59B6'},
  { id:'grownfolks', label:'GROWN FOLKS',   icon:'🍷', color:F.gold   },
  { id:'species',    label:'SPECIES',       icon:'🐾', color:F.blue   },
];

const SPECIES_SUBS = [
  { id:'k9',    label:'K9 / PET',     icon:'🐕', color:F.blue  },
  { id:'horse', label:'EQUESTRIAN',   icon:'🐴', color:F.gold  },
  { id:'agri',  label:'AGRICULTURAL', icon:'🌾', color:F.teal  },
];

const verdictColor = (v:string) =>
  v==='ALL CLEAR' ? F.allClear : v==='HEADS UP' ? F.headsUp : F.payAttention;
const verdictIcon = (v:string) =>
  v==='ALL CLEAR' ? '✓' : v==='HEADS UP' ? '⚠' : '✕';

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────
function buildSystemPrompt(tab:string, personalTruth:string, speciesSub?:string):string {
  const base = `You are The Equalizer — AA2's immune system and first line of truth. You are backed by 9 internal databases consulted silently.\n\nCRITICAL RULES:\n1. NEVER name any database in any user-facing field.\n2. Speak as The Equalizer in first person. Direct, calm, factual.\n3. NEVER use the words Heimdall, Kybalion, Denzel, Logic, or any mythological reference.\n4. Return ONLY valid JSON — no markdown, no backticks, no preamble.${personalTruth}`;
  const schema = `{\n  "verdict": "ALL CLEAR" | "HEADS UP" | "PAY ATTENTION",\n  "verdictReason": "one sentence",\n  "productName": "string",\n  "keyFindings": ["string","string","string"],\n  "equalizerVoice": "string",\n  "chefNote": "REQUIRED. 3 numbered suggestions.",\n  "actRightDollars": "REQUIRED. Dollar amount saved. End with: That goes directly into your AA2 Vault as Act Right Dollars.",\n  "recallAlert": "string or null",\n  "alternatives": ["string"]\n}`;
  if (tab==='scan')       return `${base}\n\nTAB: PACKAGED/BARCODED GOODS.\n\nReturn:\n${schema}`;
  if (tab==='produce')    return `${base}\n\nTAB: FRESH PRODUCE. Assess pesticide residue, ripeness, origin.\n\nReturn:\n${schema}`;
  if (tab==='meat')       return `${base}\n\nTAB: MEAT — CO2/MAP TRUTH DOCTRINE.\n\nReturn:\n${schema}`;
  if (tab==='care')       return `${base}\n\nTAB: PERSONAL CARE — SKIN INGESTION DOCTRINE. Flag parabens, phthalates, PFAS. Intelligence is The Cosmo Chemist — never The Chef.\n\nReturn:\n${schema}`;
  if (tab==='grownfolks') return `${base}\n\nTAB: GROWN FOLKS — Wine/Spirits/Beer. The Sommelier pairs specifically.\n\nReturn:\n${schema}`;
  if (tab==='species') {
    const m:Record<string,string> = {
      k9:   'TAB: K9/PET. ASPCA Animal Poison Control primary.',
      horse:'TAB: EQUESTRIAN. FEI prohibited substances primary.',
      agri: 'TAB: AGRICULTURAL/LIVESTOCK. USDA feed safety primary.',
    };
    return `${base}\n\n${m[speciesSub||'k9']}\n\nReturn:\n${schema}`;
  }
  return base;
}

type ScanRecord = {
  id:string; timestamp:string; tab:string;
  query:string; verdict:string; productName:string;
};

async function lookupBarcode(barcode:string):Promise<string> {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,{headers:{'User-Agent':'AA2-Scanner/1.0'}});
    const data = await res.json();
    if (data.status!==1||!data.product) return `Barcode: ${barcode}. Not found. Return full verdict JSON.`;
    const p = data.product;
    return [
      `PRODUCT: ${p.product_name||'Unknown'}${p.brands?' by '+p.brands:''}`,
      `BARCODE: ${barcode}`,
      `INGREDIENTS: ${p.ingredients_text_en||p.ingredients_text||'Not listed'}`,
      `ADDITIVES: ${p.additives_tags?.map((a:string)=>a.replace('en:','')).join(', ')||'none'}`,
      `ALLERGENS: ${p.allergens_tags?.join(', ')||'none listed'}`,
      p.nova_group?`NOVA Group: ${p.nova_group}`:'',
      `\nReturn verdict JSON.`,
    ].filter(Boolean).join('\n');
  } catch { return `Barcode: ${barcode}. Lookup failed. Analyze and return verdict JSON.`; }
}

// ─── PALETTE DOTS ────────────────────────────────────────────────────────────
function PaletteDots({ current, onSelect, cardBg }: {
  current: PaletteKey;
  onSelect: (k:PaletteKey) => void;
  cardBg: string;
}) {
  return (
    <View style={[pd.bar, { backgroundColor: cardBg }]}>
      {(Object.keys(PALETTES) as PaletteKey[]).map(k => (
        <TouchableOpacity key={k} onPress={() => onSelect(k)}
          style={[pd.dot, { backgroundColor: PALETTES[k].accent, opacity: current===k ? 1 : 0.45,
            transform:[{ scale: current===k ? 1.3 : 1 }] }]}/>
      ))}
    </View>
  );
}
const pd = StyleSheet.create({
  bar:{ flexDirection:'row', gap:10, justifyContent:'center', paddingVertical:8, paddingHorizontal:16 },
  dot:{ width:16, height:16, borderRadius:8 },
});

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [palette,       setPalette]     = useState<PaletteKey>('earth');
  const [activeTab,     setActiveTab]   = useState('scan');
  const [speciesSub,    setSpeciesSub]  = useState('k9');
  const [cameraMode,    setCameraMode]  = useState(false);
  const [scanning,      setScanning]    = useState(false);
  const [manualInput,   setManualInput] = useState('');
  const [loading,       setLoading]     = useState(false);
  const [result,        setResult]      = useState<any>(null);
  const [history,       setHistory]     = useState<ScanRecord[]>([]);
  const [historyVisible,setHistoryVisible] = useState(false);
  const [barcodeReady,  setBarcodeReady]   = useState(false);
  const [memberProfile, setMemberProfile]  = useState<any>(null);

  const scannedRef     = useRef(false);
  const lastBarcodeRef = useRef<string|null>(null);

  const P           = PALETTES[palette];
  const currentTab  = TABS.find(t => t.id===activeTab)!;
  const accentColor = activeTab==='species'
    ? (SPECIES_SUBS.find(s => s.id===speciesSub)?.color ?? F.blue)
    : currentTab.color;
  const heroKey   = activeTab==='species' ? speciesSub : activeTab;
  const heroImage = TAB_HEROES[heroKey] ?? null;

  useEffect(() => { loadMemberProfile().then(setMemberProfile); }, []);

  const handleBarcodeScanned = ({ data }:{ data:string }) => {
    if (loading) return;
    lastBarcodeRef.current = data;
    setBarcodeReady(true);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { Alert.alert('Camera Permission','AA2 needs camera access.'); return; }
    }
    scannedRef.current = false;
    lastBarcodeRef.current = null;
    setBarcodeReady(false);
    setCameraMode(true);
    setScanning(true);
  };

  const handleCapture = async () => {
    if (loading) return;
    const barcode = lastBarcodeRef.current;
    if (activeTab==='scan') {
      if (barcode) { scannedRef.current=true; setScanning(false); setCameraMode(false); await runAnalysis(barcode); }
      else Alert.alert('Frame It First','Wait for the gold border — then tap.');
      return;
    }
    if (activeTab==='care') {
      if (barcode) { scannedRef.current=true; setScanning(false); setCameraMode(false); await runAnalysis(barcode); return; }
      setCameraMode(false); setScanning(false);
      await runAnalysis('Personal care product — camera scan. Skin ingestion doctrine. Return verdict JSON.');
      return;
    }
    const tabLabel = activeTab==='species'
      ? `${SPECIES_SUBS.find(s=>s.id===speciesSub)?.label??'Species'} product`
      : currentTab.label;
    setCameraMode(false); setScanning(false);
    await runAnalysis(`Camera scan — ${tabLabel}. Return verdict JSON.`);
  };

  const handleCancelCamera = () => {
    lastBarcodeRef.current = null;
    setBarcodeReady(false);
    scannedRef.current = false;
    setCameraMode(false);
    setScanning(false);
  };

  const runAnalysis = async (query:string) => {
    setLoading(true); setResult(null);
    const effectiveSub = activeTab==='species' ? speciesSub : undefined;
    try {
      const profile       = memberProfile;
      const personalTruth = buildPersonalTruth(profile);
      const isBarcode     = activeTab==='scan' && /^\d{6,14}$/.test(query.trim());
      let content         = query;
      if (isBarcode) {
        const bd = await Promise.race<string|null>([
          lookupBarcode(query.trim()),
          new Promise<null>(r => setTimeout(()=>r(null),3000)),
        ]);
        if (bd) content = bd;
      } else if (activeTab==='scan') {
        content = `Product name: ${query}. Analyze and return verdict JSON.`;
      } else if (activeTab==='species') {
        const sub = SPECIES_SUBS.find(s=>s.id===speciesSub)?.label ?? speciesSub;
        content = `${sub} — item: ${query}. Analyze and return verdict JSON.`;
      }
      const response = await anthropic.messages.create({
        model:'claude-sonnet-4-20250514', max_tokens:1000,
        system: buildSystemPrompt(activeTab, personalTruth, effectiveSub),
        messages:[{ role:'user', content }],
      });
      const parsed = JSON.parse(
        ((response.content[0] as any).text??'').replace(/```json|```/g,'').trim()
      );
      setResult(parsed);
      await saveScan({
        query, productName: parsed.productName||query,
        scanTab: activeTab==='species' ? `SPECIES_${speciesSub.toUpperCase()}` : activeTab,
        verdict: parsed.verdict, fullAnalysis: parsed,
        memberId: profile?.memberId ?? null,
      });
      setHistory(prev => [{
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        tab: activeTab==='species' ? `SPECIES · ${speciesSub.toUpperCase()}` : currentTab.label,
        query, verdict: parsed.verdict,
        productName: parsed.productName||query,
      }, ...prev].slice(0,50));
    } catch {
      Alert.alert('Analysis Error','The Equalizer could not complete the analysis. Try again.');
    } finally { setLoading(false); scannedRef.current=false; }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) { Alert.alert('Enter Something','Type a product name or barcode.'); return; }
    const input = manualInput.trim(); setManualInput(''); await runAnalysis(input);
  };

  const intelLabel = () => {
    if (activeTab==='care')                return '⚗ COSMO CHEMIST';
    if (activeTab==='grownfolks')          return '🍷 THE SOMMELIER';
    if (activeTab==='species') {
      if (speciesSub==='k9')    return '🐕 CANINE NUTRITIONIST';
      if (speciesSub==='horse') return '🐴 EQUINE NUTRITIONIST';
      return '🌾 AGRICULTURAL ANALYST';
    }
    return '👨‍🍳 THE CHEF';
  };

  const doctrineCopy = () => {
    if (activeTab==='meat')       return { t:'⚠ CO₂/MAP TRUTH DOCTRINE',         b:'CO₂ keeps meat red long after it degrades. Your eyes are being deceived. The Equalizer sees through it.' };
    if (activeTab==='care')       return { t:'⚠ SKIN INGESTION DOCTRINE',          b:'The skin is not a barrier — it is an organ. What touches your skin enters your bloodstream.' };
    if (activeTab==='grownfolks') return { t:'🍷 GROWN FOLKS TABLE',               b:'The Sommelier knows the $12 bottle that beats the $90 one. Real knowledge. Real pairings.' };
    if (activeTab==='species'&&speciesSub==='k9')    return { t:'🐕 CANINE NUTRITIONIST',     b:'ASPCA Animal Poison Control + canine toxicology. Your animal cannot speak. The Equalizer does.' };
    if (activeTab==='species'&&speciesSub==='horse') return { t:'🐴 EQUINE NUTRITIONIST',    b:'FEI prohibited substances primary. Every ingredient checked for competition readiness.' };
    if (activeTab==='species'&&speciesSub==='agri')  return { t:'🌾 AGRICULTURAL ANALYST',   b:'USDA feed safety + mycotoxin monitoring. Protecting the herd from slow, invisible harm.' };
    if (activeTab==='produce')    return { t:'🌿 FRESH PRODUCE INTELLIGENCE',       b:'No barcode needed. Pesticide residue, EWG Dirty Dozen / Clean 15, preparation guidance.' };
    return { t:'⚡ SAFETY CLARIFIER · ADAPTIVE NERVE', b:'Every ingredient cross-referenced before you buy. The donut knows about the bikini.' };
  };
  const { t:docT, b:docB } = doctrineCopy();

  return (
    <SafeAreaView style={[s.root, { backgroundColor:P.bg }]}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor:P.bg, borderBottomColor:P.border }]}>
        <Text style={s.receipt}>I AM THE RECEIPT</Text>
        <Text style={s.dna}>🧬</Text>
        <TouchableOpacity onPress={()=>setHistoryVisible(true)} style={s.historyBtn}>
          <Text style={[s.historyBtnText,{color:P.accent}]}>
            {history.length>0?`⏱ ${history.length}`:'⏱'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PALETTE DOTS */}
      <PaletteDots current={palette} onSelect={setPalette} cardBg={P.card}/>

      {/* TABS */}
      <View style={[s.tabGrid,{borderBottomColor:P.border}]}>
        {[TABS.slice(0,3),TABS.slice(3,6)].map((row,ri)=>(
          <View key={ri} style={s.tabRow}>
            {row.map(tab=>(
              <TouchableOpacity key={tab.id}
                style={[s.tabBtn,
                  activeTab===tab.id&&{borderBottomColor:tab.color,borderBottomWidth:2.5,backgroundColor:tab.color+'14'}]}
                onPress={()=>{setActiveTab(tab.id);setResult(null);}}>
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel,{color:activeTab===tab.id?tab.color:F.dimWhite}]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* SPECIES SUBS */}
      {activeTab==='species'&&(
        <View style={[s.speciesRow,{backgroundColor:P.bg}]}>
          {SPECIES_SUBS.map(sub=>(
            <TouchableOpacity key={sub.id}
              style={[s.subTab,{borderColor:speciesSub===sub.id?sub.color:P.border,backgroundColor:speciesSub===sub.id?sub.color+'1A':P.card}]}
              onPress={()=>{setSpeciesSub(sub.id);setResult(null);}}>
              <Text style={s.subTabIcon}>{sub.icon}</Text>
              <Text style={[s.subTabLabel,{color:speciesSub===sub.id?sub.color:F.dimWhite}]}>{sub.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CAMERA */}
      {cameraMode?(
        <View style={s.cameraContainer}>
          <CameraView style={s.camera} facing="back"
            onBarcodeScanned={activeTab==='scan'||activeTab==='care'?handleBarcodeScanned:undefined}>
            <View style={s.cameraOverlay}>
              <View style={s.cameraFrameGroup}>
                <View style={[s.scanFrame,{
                  borderColor:barcodeReady?F.gold:P.accent,
                  borderWidth:barcodeReady?3:1.5,
                }]}/>
                <Text style={[s.frameDoctrine,{color:F.gold}]}>FRAME IT · CONFIRM IT · SCAN IT</Text>
                <Text style={[s.cameraHint,{color:barcodeReady?F.gold:P.accent}]}>
                  {activeTab==='scan'?(barcodeReady?'● LOCKED — TAP TO SCAN':'POINT AT BARCODE'):
                   activeTab==='care'?(barcodeReady?'● LOCKED — TAP TO SCAN':'FRAME THE PRODUCT'):
                   'FRAME THE ITEM'}
                </Text>
              </View>
              <View style={s.cameraControls}>
                <TouchableOpacity
                  style={[s.captureOuter,{borderColor:barcodeReady?F.gold:P.accent}]}
                  onPress={handleCapture} activeOpacity={0.85}>
                  <View style={[s.captureInner,{backgroundColor:barcodeReady?F.gold:P.accent}]}/>
                </TouchableOpacity>
                <TouchableOpacity style={[s.cancelBtn,{borderColor:P.border}]} onPress={handleCancelCamera}>
                  <Text style={s.cancelText}>✕ CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      ):(
        <ScrollView style={s.body} contentContainerStyle={{paddingBottom:80}}>

          {/* HERO */}
          {heroImage&&(
            <View style={s.heroWrap}>
              <Image source={heroImage} style={s.heroImage} resizeMode="cover"/>
              <View style={[s.heroOverlay,{backgroundColor:P.bg+'CC'}]}>
                <Text style={[s.heroTabLabel,{color:accentColor}]}>{currentTab.label}</Text>
                <Text style={[s.heroSubLabel,{color:F.dimWhite}]}>9 DATABASES STANDING BY</Text>
              </View>
            </View>
          )}

          {/* DOCTRINE BANNER */}
          <View style={[s.doctrineBanner,{backgroundColor:P.card,borderLeftColor:accentColor,borderColor:P.border}]}>
            <Text style={[s.doctrineTitle,{color:accentColor}]}>{docT}</Text>
            <Text style={[s.doctrineBody,{color:F.dimWhite}]}>{docB}</Text>
          </View>

          {/* INPUT CARD */}
          <View style={[s.inputCard,{backgroundColor:P.card,borderColor:P.border}]}>
            <TouchableOpacity
              style={[s.cameraBtn,{backgroundColor:accentColor+'1A',borderColor:accentColor}]}
              onPress={openCamera}>
              <Text style={[s.cameraBtnIcon,{color:accentColor}]}>{activeTab==='scan'?'⚡':'📷'}</Text>
              <Text style={[s.cameraBtnLabel,{color:accentColor}]}>{activeTab==='scan'?'SCAN BARCODE':'OPEN CAMERA'}</Text>
            </TouchableOpacity>
            <Text style={[s.orDivider,{color:F.mutedWhite}]}>— or type it —</Text>
            <TextInput
              style={[s.input,{borderColor:P.border,color:F.white,backgroundColor:P.bg}]}
              placeholder={
                activeTab==='scan'?'Product name or barcode...':
                activeTab==='produce'?'e.g. Strawberries, spinach...':
                activeTab==='meat'?'e.g. Ground beef, chicken breast...':
                activeTab==='care'?'e.g. Dove soap, Neutrogena SPF...':
                activeTab==='grownfolks'?'e.g. Malbec, Macallan 12...':
                speciesSub==='k9'?'e.g. Blue Buffalo, peanut butter...':
                speciesSub==='horse'?'e.g. SmartPak supplement...':
                'e.g. Purina cattle feed, corn silage...'}
              placeholderTextColor={F.mutedWhite}
              value={manualInput} onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit} returnKeyType="go"/>
            <TouchableOpacity style={[s.analyzeBtn,{backgroundColor:accentColor}]} onPress={handleManualSubmit}>
              <Text style={s.analyzeBtnText}>RUN ANALYSIS</Text>
            </TouchableOpacity>
          </View>

          {/* LOADING */}
          {loading&&(
            <View style={[s.loadingCard,{backgroundColor:P.card,borderColor:P.border}]}>
              <ActivityIndicator size="large" color={accentColor}/>
              <Text style={[s.loadingLabel,{color:accentColor}]}>THE EQUALIZER IS RUNNING</Text>
              <Text style={[s.loadingDb,{color:F.dimWhite}]}>9 DATABASES · ALL INTELLIGENCES ACTIVE</Text>
            </View>
          )}

          {/* RESULT */}
          {result&&!loading&&(
            <View style={s.resultBlock}>
              <View style={[s.verdictBanner,{backgroundColor:verdictColor(result.verdict)+'1A',borderColor:verdictColor(result.verdict)}]}>
                <View style={[s.verdictIconWrap,{backgroundColor:verdictColor(result.verdict)+'22'}]}>
                  <Text style={[s.verdictIcon,{color:verdictColor(result.verdict)}]}>{verdictIcon(result.verdict)}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={[s.verdictText,{color:verdictColor(result.verdict)}]}>{result.verdict}</Text>
                  <Text style={[s.verdictReason,{color:F.dimWhite}]}>{result.verdictReason}</Text>
                </View>
              </View>
              {result.productName&&<Text style={[s.productName,{color:F.white}]}>{result.productName}</Text>}
              {result.recallAlert&&(
                <View style={[s.recallBanner,{borderColor:F.red}]}>
                  <Text style={[s.recallText,{color:F.red}]}>🚨 RECALL: {result.recallAlert}</Text>
                </View>
              )}
              {result.equalizerVoice&&(
                <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:accentColor,borderColor:P.border}]}>
                  <Text style={[s.intelHeader,{color:accentColor}]}>⚡ THE EQUALIZER</Text>
                  <Text style={[s.intelBody,{color:F.white}]}>{result.equalizerVoice}</Text>
                </View>
              )}
              {result.keyFindings?.length>0&&(
                <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                  <Text style={[s.findingsHeader,{color:F.dimWhite}]}>KEY FINDINGS</Text>
                  {result.keyFindings.map((f:string,i:number)=>(
                    <View key={i} style={s.findingRow}>
                      <Text style={[s.findingDot,{color:accentColor}]}>▸</Text>
                      <Text style={[s.findingText,{color:F.white}]}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
              {result.chefNote&&(
                <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.orange,borderColor:P.border}]}>
                  <Text style={[s.intelHeader,{color:F.orange}]}>{intelLabel()}</Text>
                  <Text style={[s.intelBody,{color:F.white}]}>{result.chefNote}</Text>
                </View>
              )}
              {result.alternatives?.length>0&&(
                <View style={[s.altCard,{backgroundColor:P.card,borderColor:P.border}]}>
                  <Text style={[s.altHeader,{color:F.dimWhite}]}>BETTER ALTERNATIVES</Text>
                  {result.alternatives.map((a:string,i:number)=>(
                    <Text key={i} style={[s.altItem,{color:F.teal}]}>→ {a}</Text>
                  ))}
                </View>
              )}
              {result.actRightDollars&&(
                <View style={[s.vaultCard,{borderColor:F.gold}]}>
                  <Text style={[s.vaultLabel,{color:F.gold}]}>💎 ACT RIGHT DOLLARS</Text>
                  <Text style={[s.vaultBody,{color:F.white}]}>{result.actRightDollars}</Text>
                </View>
              )}
              <TouchableOpacity style={[s.scanAgainBtn,{borderColor:accentColor}]} onPress={()=>setResult(null)}>
                <Text style={[s.scanAgainText,{color:accentColor}]}>SCAN ANOTHER</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMPTY */}
          {!result&&!loading&&!heroImage&&(
            <View style={s.emptyState}>
              <Text style={{fontSize:48,marginBottom:16}}>{currentTab.icon}</Text>
              <Text style={[s.emptyLabel,{color:F.dimWhite}]}>READY TO SCAN</Text>
              <Text style={[s.emptySubLabel,{color:F.mutedWhite}]}>9 DATABASES STANDING BY</Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* HISTORY MODAL */}
      <Modal visible={historyVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.modalRoot,{backgroundColor:P.bg}]}>
          <View style={[s.modalHeader,{borderBottomColor:P.border}]}>
            <Text style={[s.modalTitle,{color:F.white}]}>SCAN HISTORY</Text>
            <TouchableOpacity onPress={()=>setHistoryVisible(false)}>
              <Text style={[s.modalClose,{color:F.dimWhite}]}>✕</Text>
            </TouchableOpacity>
          </View>
          {history.length===0
            ?<View style={s.emptyHistory}><Text style={[s.emptyHistoryText,{color:F.dimWhite}]}>No scans yet</Text></View>
            :<FlatList data={history} keyExtractor={item=>item.id} contentContainerStyle={{padding:16}}
              renderItem={({item})=>(
                <View style={[s.historyRow,{borderBottomColor:P.border}]}>
                  <View style={[s.historyDot,{backgroundColor:verdictColor(item.verdict)}]}/>
                  <View style={{flex:1}}>
                    <Text style={[s.historyProduct,{color:F.white}]}>{item.productName}</Text>
                    <Text style={[s.historyMeta,{color:F.dimWhite}]}>{item.tab} · {item.timestamp}</Text>
                  </View>
                  <Text style={[s.historyVerdict,{color:verdictColor(item.verdict)}]}>{verdictIcon(item.verdict)}</Text>
                </View>
              )}/>
          }
          <TouchableOpacity style={[s.clearBtn,{borderColor:F.red+'55'}]}
            onPress={()=>{setHistory([]);setHistoryVisible(false);}}>
            <Text style={[s.clearBtnText,{color:F.red}]}>CLEAR HISTORY</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:            {flex:1},
  header:          {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:8,paddingBottom:8,borderBottomWidth:1},
  receipt:         {fontFamily:Platform.OS==='ios'?'Courier New':'monospace',fontSize:9,color:F.dimWhite,letterSpacing:2,flex:1},
  dna:             {fontSize:20,flex:1,textAlign:'center'},
  historyBtn:      {flex:1,alignItems:'flex-end'},
  historyBtnText:  {fontSize:11,fontWeight:'700'},
  tabGrid:         {borderBottomWidth:1},
  tabRow:          {flexDirection:'row'},
  tabBtn:          {flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:2,borderBottomColor:'transparent'},
  tabIcon:         {fontSize:15},
  tabLabel:        {fontSize:7.5,fontWeight:'800',letterSpacing:0.5,marginTop:3},
  speciesRow:      {flexDirection:'row',paddingHorizontal:12,paddingVertical:8,gap:8},
  subTab:          {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:9,borderRadius:10,borderWidth:1},
  subTabIcon:      {fontSize:14},
  subTabLabel:     {fontSize:9,fontWeight:'800',letterSpacing:0.5},
  body:            {flex:1},
  heroWrap:        {position:'relative'},
  heroImage:       {width:'100%',height:280},
  heroOverlay:     {position:'absolute',bottom:0,left:0,right:0,padding:14},
  heroTabLabel:    {fontSize:13,fontWeight:'900',letterSpacing:3},
  heroSubLabel:    {fontSize:9,letterSpacing:2,marginTop:2},
  doctrineBanner:  {marginHorizontal:12,marginTop:12,padding:14,borderRadius:12,borderLeftWidth:3,borderWidth:1},
  doctrineTitle:   {fontSize:10,fontWeight:'900',letterSpacing:1.5,marginBottom:5},
  doctrineBody:    {fontSize:12,lineHeight:18},
  inputCard:       {margin:12,padding:16,borderRadius:16,borderWidth:1},
  cameraBtn:       {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:15,borderRadius:12,borderWidth:1,marginBottom:12},
  cameraBtnIcon:   {fontSize:20},
  cameraBtnLabel:  {fontWeight:'900',fontSize:13,letterSpacing:1.5},
  orDivider:       {fontSize:10,textAlign:'center',marginBottom:10,letterSpacing:2},
  input:           {borderWidth:1,borderRadius:10,padding:13,fontSize:13,marginBottom:10},
  analyzeBtn:      {paddingVertical:14,borderRadius:10,alignItems:'center'},
  analyzeBtnText:  {color:F.nearBlack,fontWeight:'900',fontSize:12,letterSpacing:1.5},
  cameraContainer: {flex:1},
  camera:          {flex:1},
  cameraOverlay:   {flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'space-between',alignItems:'center',paddingTop:40,paddingBottom:48},
  cameraFrameGroup:{alignItems:'center'},
  scanFrame:       {width:240,height:160,borderRadius:14,marginBottom:12},
  frameDoctrine:   {fontSize:9,letterSpacing:2,fontFamily:Platform.OS==='ios'?'Courier New':'monospace',marginBottom:8},
  cameraHint:      {fontWeight:'900',fontSize:12,letterSpacing:2},
  cameraControls:  {alignItems:'center',width:'100%'},
  captureOuter:    {width:80,height:80,borderRadius:40,borderWidth:4,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.08)',marginBottom:20},
  captureInner:    {width:60,height:60,borderRadius:30},
  cancelBtn:       {paddingVertical:12,paddingHorizontal:28,borderRadius:10,borderWidth:1},
  cancelText:      {color:F.dimWhite,fontSize:12,fontWeight:'800',letterSpacing:1.5},
  loadingCard:     {margin:12,padding:28,borderRadius:16,alignItems:'center',borderWidth:1},
  loadingLabel:    {fontWeight:'900',fontSize:11,letterSpacing:2,marginTop:14},
  loadingDb:       {fontSize:9,letterSpacing:1.5,marginTop:6},
  resultBlock:     {margin:12},
  verdictBanner:   {flexDirection:'row',alignItems:'center',gap:14,padding:16,borderRadius:14,borderWidth:2,marginBottom:12},
  verdictIconWrap: {width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},
  verdictIcon:     {fontSize:24,fontWeight:'900'},
  verdictText:     {fontSize:18,fontWeight:'900',letterSpacing:0.5},
  verdictReason:   {fontSize:12,marginTop:3,lineHeight:18},
  productName:     {fontSize:16,fontWeight:'700',marginBottom:10,paddingHorizontal:2},
  recallBanner:    {borderRadius:10,borderWidth:1,padding:12,marginBottom:10,backgroundColor:'rgba(224,82,82,0.12)'},
  recallText:      {fontWeight:'800',fontSize:12},
  intelCard:       {borderRadius:12,borderLeftWidth:3,borderWidth:1,padding:16,marginBottom:10},
  intelHeader:     {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:8},
  intelBody:       {fontSize:13,lineHeight:21},
  findingsCard:    {borderRadius:12,borderWidth:1,padding:16,marginBottom:10},
  findingsHeader:  {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:10},
  findingRow:      {flexDirection:'row',gap:8,marginBottom:8},
  findingDot:      {fontSize:11,marginTop:2},
  findingText:     {fontSize:12,lineHeight:19,flex:1},
  altCard:         {borderRadius:12,borderWidth:1,padding:16,marginBottom:10},
  altHeader:       {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:8},
  altItem:         {fontSize:13,lineHeight:22},
  vaultCard:       {borderRadius:12,borderWidth:1,padding:16,marginBottom:10,backgroundColor:'rgba(196,154,42,0.10)'},
  vaultLabel:      {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:6},
  vaultBody:       {fontSize:13,lineHeight:20},
  scanAgainBtn:    {borderWidth:1.5,borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:4},
  scanAgainText:   {fontWeight:'900',fontSize:12,letterSpacing:1.5},
  emptyState:      {alignItems:'center',paddingTop:40,paddingBottom:40},
  emptyLabel:      {fontWeight:'900',fontSize:11,letterSpacing:3,marginTop:4},
  emptySubLabel:   {fontSize:9,letterSpacing:2,marginTop:4},
  modalRoot:       {flex:1},
  modalHeader:     {flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1},
  modalTitle:      {fontWeight:'900',fontSize:14,letterSpacing:2},
  modalClose:      {fontSize:18,fontWeight:'700'},
  emptyHistory:    {flex:1,alignItems:'center',justifyContent:'center'},
  emptyHistoryText:{fontSize:13},
  historyRow:      {flexDirection:'row',alignItems:'center',gap:12,paddingVertical:13,borderBottomWidth:1},
  historyDot:      {width:10,height:10,borderRadius:5},
  historyProduct:  {fontSize:13,fontWeight:'700'},
  historyMeta:     {fontSize:10,marginTop:2},
  historyVerdict:  {fontSize:18,fontWeight:'900'},
  clearBtn:        {margin:16,padding:14,borderRadius:10,borderWidth:1,alignItems:'center'},
  clearBtnText:    {fontWeight:'800',fontSize:11,letterSpacing:1.5},
});
