import Anthropic from '@anthropic-ai/sdk';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { buildPersonalTruth, loadMemberProfile, saveScan } from '../../lib/db';
import { supabase } from '../../lib/supabase';

const C = {
  nearBlack:'#03050a', electricBlue:'#4a9eff', teal:'#2ecfb3', orange:'#f5922a',
  gold:'#c9a84c', purple:'#b06abf', red:'#e05252', white:'#ffffff',
  dimWhite:'rgba(255,255,255,0.65)', glass:'rgba(255,255,255,0.06)',
  glassBorder:'rgba(255,255,255,0.11)', allClear:'#2ecfb3', headsUp:'#c9a84c', payAttention:'#e05252',
};

const anthropic = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true });

// v28.4 — all heroes JPEG, care image corrected, full-width display
const TAB_HEROES: Record<string, any> = {
  scan:       require('../../assets/images/tab-scan.jpg'),
  produce:    require('../../assets/images/tab-produce.jpg'),
  meat:       require('../../assets/images/tab-meat.jpg'),
  care:       require('../../assets/images/tab-care.jpg'),
  grownfolks: require('../../assets/images/tab-grownfolks.jpg'),
  species:    null,
  k9:         require('../../assets/images/tab-k9.jpg'),
  horse:      require('../../assets/images/tab-horse.jpg'),
  agri:       require('../../assets/images/tab-agri.jpg'),
};

const TABS = [
  { id:'scan',       label:'SCAN',         icon:'⚡', color:C.gold,         mode:'barcode' },
  { id:'produce',    label:'PRODUCE',       icon:'🌿', color:C.teal,         mode:'vision'  },
  { id:'meat',       label:'MEAT',          icon:'🥩', color:C.red,          mode:'vision'  },
  { id:'care',       label:'PERSONAL CARE', icon:'🧴', color:C.purple,       mode:'vision'  },
  { id:'grownfolks', label:'GROWN FOLKS',   icon:'🍷', color:C.gold,         mode:'vision'  },
  { id:'species',    label:'SPECIES',       icon:'🐾', color:C.electricBlue, mode:'vision'  },
];

const SPECIES_SUBS = [
  { id:'k9',    label:'K9 / PET',     icon:'🐕', color:C.electricBlue },
  { id:'horse', label:'EQUESTRIAN',   icon:'🐴', color:C.gold         },
  { id:'agri',  label:'AGRICULTURAL', icon:'🌾', color:C.teal         },
];

const verdictColor = (v:string) => v==='ALL CLEAR'?C.allClear:v==='HEADS UP'?C.headsUp:C.payAttention;
const verdictIcon  = (v:string) => v==='ALL CLEAR'?'✓':v==='HEADS UP'?'⚠':'✕';

function buildSystemPrompt(tab:string, personalTruth:string, speciesSub?:string):string {
  const base = `You are The Equalizer — AA2's immune system and first line of truth. You are backed by 9 internal databases that you consult silently.\n\nCRITICAL RULES:\n1. NEVER name any database in any user-facing field.\n2. Speak as The Equalizer in first person. Direct, calm, factual.\n3. NEVER use the words Heimdall, Kybalion, Denzel, Logic, or any mythological reference.\n4. Return ONLY valid JSON — no markdown, no backticks, no preamble.${personalTruth}`;
  const schema = `{\n  "verdict": "ALL CLEAR" | "HEADS UP" | "PAY ATTENTION",\n  "verdictReason": "one sentence",\n  "productName": "string",\n  "keyFindings": ["string","string","string"],\n  "equalizerVoice": "string",\n  "chefNote": "REQUIRED. 3 numbered suggestions. 1. ... 2. ... 3. ...",\n  "actRightDollars": "REQUIRED. Dollar amount saved. End with: That goes directly into your AA2 Vault as Act Right Dollars.",\n  "recallAlert": "string or null",\n  "alternatives": ["string"]\n}`;
  if (tab==='scan')       return `${base}\n\nTAB: PACKAGED/BARCODED GOODS. Cross-reference ingredients for additives, allergens, recall status, cumulative exposure. Translate chemical names to plain language.\n\nReturn:\n${schema}`;
  if (tab==='produce')    return `${base}\n\nTAB: FRESH PRODUCE. Assess pesticide residue (Dirty Dozen/Clean 15), ripeness, origin, nutrient density.\n\nReturn:\n${schema}`;
  if (tab==='meat')       return `${base}\n\nTAB: MEAT — CO2/MAP TRUTH DOCTRINE. CO2 keeps meat red after degradation. Trust nose and date, not appearance. Assess freshness, sourcing, antibiotic/hormone use.\n\nReturn:\n${schema}`;
  if (tab==='care')       return `${base}\n\nTAB: PERSONAL CARE — SKIN INGESTION DOCTRINE. Skin absorbs everything. Flag: parabens, phthalates, formaldehyde releasers, synthetic fragrances, PFAS, heavy metals.\n\nReturn:\n${schema}`;
  if (tab==='grownfolks') return `${base}\n\nTAB: GROWN FOLKS — Wine/Spirits/Beer. The Sommelier pairs specifically. Assess sulfites, tannins, additives, histamine.\n\nReturn:\n${schema}`;
  if (tab==='species') {
    const m:Record<string,string> = {
      k9:    'TAB: K9/PET. ASPCA Animal Poison Control primary. Flag: xylitol, grapes, raisins, onion, macadamia, chocolate, artificial sweeteners, mycotoxins.',
      horse: 'TAB: EQUESTRIAN. FEI prohibited substances primary. Flag any substance harming performance or triggering positive test.',
      agri:  'TAB: AGRICULTURAL/LIVESTOCK. USDA feed safety primary. Flag: mycotoxins, heavy metals, antibiotic residues, growth hormones.',
    };
    return `${base}\n\n${m[speciesSub||'k9']}\n\nReturn:\n${schema}`;
  }
  return base;
}

type ScanRecord = { id:string; timestamp:string; tab:string; query:string; verdict:string; productName:string; };

async function lookupBarcode(barcode:string):Promise<string> {
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,{headers:{'User-Agent':'AA2-Scanner/1.0'}});
    const data = await res.json();
    if (data.status!==1||!data.product) return `Barcode: ${barcode}. Not found. Infer ingredients and return full verdict JSON.`;
    const p=data.product;
    return [`PRODUCT DATA:`,`PRODUCT: ${p.product_name||'Unknown'}${p.brands?' by '+p.brands:''}`,`BARCODE: ${barcode}`,`INGREDIENTS: ${p.ingredients_text_en||p.ingredients_text||'Not listed'}`,`ADDITIVES: ${p.additives_tags?.map((a:string)=>a.replace('en:','')).join(', ')||'none'}`,`ALLERGENS: ${p.allergens_tags?.join(', ')||'none listed'}`,p.nova_group?`NOVA Group: ${p.nova_group}`:'',p.nutriscore_grade?`Nutri-Score: ${p.nutriscore_grade.toUpperCase()}`:'',`\nAnalyze and return verdict JSON.`].filter(Boolean).join('\n');
  } catch { return `Barcode: ${barcode}. Lookup failed. Analyze based on barcode alone.`; }
}

export default function ScannerScreen() {
  const [permission,requestPermission] = useCameraPermissions();
  const [activeTab,setActiveTab]       = useState('scan');
  const [speciesSub,setSpeciesSub]     = useState('k9');
  const [cameraMode,setCameraMode]     = useState(false);
  const [scanning,setScanning]         = useState(false);
  const [manualInput,setManualInput]   = useState('');
  const [loading,setLoading]           = useState(false);
  const [result,setResult]             = useState<any>(null);
  const [history,setHistory]           = useState<ScanRecord[]>([]);
  const [historyVisible,setHistoryVisible] = useState(false);
  const [barcodeReady,setBarcodeReady] = useState(false);
  const scannedRef     = useRef(false);
  const lastBarcodeRef = useRef<string|null>(null);
  const currentTab  = TABS.find(t=>t.id===activeTab)!;
  const accentColor = activeTab==='species'?(SPECIES_SUBS.find(s=>s.id===speciesSub)?.color??C.electricBlue):currentTab.color;
  const heroKey     = activeTab==='species'?speciesSub:activeTab;
  const heroImage   = TAB_HEROES[heroKey]??null;

  const handleBarcodeScanned = ({data}:{data:string}) => { if(loading)return; lastBarcodeRef.current=data; setBarcodeReady(true); };

  const openCamera = async () => {
    if (!permission?.granted) { const r=await requestPermission(); if(!r.granted){Alert.alert('Camera Permission','AA2 needs camera access.');return;} }
    scannedRef.current=false; lastBarcodeRef.current=null; setBarcodeReady(false); setCameraMode(true); setScanning(true);
  };

  const handleCapture = async () => {
    if(loading)return;
    const barcode=lastBarcodeRef.current;
    if(activeTab==='scan'){
      if(barcode){scannedRef.current=true;setScanning(false);setCameraMode(false);await runAnalysis(barcode);}
      else Alert.alert('Point at Barcode','Aim at a barcode then tap capture.');
      return;
    }
    if(activeTab==='care'){
      if(barcode){scannedRef.current=true;setScanning(false);setCameraMode(false);await runAnalysis(barcode);return;}
      setCameraMode(false);setScanning(false);
      await runAnalysis('Personal care product — camera scan. Apply skin ingestion doctrine. Return verdict JSON.');
      return;
    }
    const tabLabel=activeTab==='species'?`${SPECIES_SUBS.find(s=>s.id===speciesSub)?.label??'Species'} product`:currentTab.label;
    setCameraMode(false);setScanning(false);
    await runAnalysis(`Camera scan — ${tabLabel}. Analyze and return verdict JSON.`);
  };

  const handleCancelCamera = () => { lastBarcodeRef.current=null; setBarcodeReady(false); scannedRef.current=false; setCameraMode(false); setScanning(false); };

  const runAnalysis = async (query:string) => {
    setLoading(true);setResult(null);
    const effectiveSub=activeTab==='species'?speciesSub:undefined;
    try {
      const profile = await loadMemberProfile();
      const personalTruth = buildPersonalTruth(profile);
      const isBarcode=activeTab==='scan'&&/^\d{6,14}$/.test(query.trim());
      let content=query;
      if(isBarcode){const bd=await Promise.race<string|null>([lookupBarcode(query.trim()),new Promise<null>(r=>setTimeout(()=>r(null),3000))]);if(bd)content=bd;}
      else if(activeTab==='scan') content=`Product name: ${query}. Analyze and return verdict JSON.`;
      else if(activeTab==='species'){const sub=SPECIES_SUBS.find(s=>s.id===speciesSub)?.label??speciesSub;content=`${sub} — item: ${query}. Analyze and return verdict JSON.`;}
      const response=await anthropic.messages.create({model:'claude-sonnet-4-20250514',max_tokens:1000,system:buildSystemPrompt(activeTab,personalTruth,effectiveSub),messages:[{role:'user',content}]});
      const parsed=JSON.parse(((response.content[0] as any).text??'').replace(/```json|```/g,'').trim());
      setResult(parsed);
      await saveScan({
        query,
        productName: parsed.productName || query,
        scanTab: activeTab === 'species' ? `SPECIES_${speciesSub.toUpperCase()}` : activeTab,
        verdict: parsed.verdict,
        fullAnalysis: parsed,
        memberId: profile?.memberId ?? null,
      });
      setHistory(prev=>[{id:Date.now().toString(),timestamp:new Date().toLocaleString(),tab:activeTab==='species'?`SPECIES · ${speciesSub.toUpperCase()}`:currentTab.label,query,verdict:parsed.verdict,productName:parsed.productName||query},...prev].slice(0,50));
    } catch(e){Alert.alert('Analysis Error','The Equalizer could not complete the analysis. Try again.');}
    finally{setLoading(false);scannedRef.current=false;}
  };

  const handleManualSubmit = async () => {
    if(!manualInput.trim()){Alert.alert('Enter Something','Type a product name or barcode.');return;}
    const input=manualInput.trim();setManualInput('');await runAnalysis(input);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.receipt} numberOfLines={1}>I AM THE RECEIPT</Text>
        <Text style={styles.dna}>🧬</Text>
        <TouchableOpacity onPress={()=>setHistoryVisible(true)} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>{history.length>0?`⏱ ${history.length}`:'⏱'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabGrid}>
        {[TABS.slice(0,3),TABS.slice(3,6)].map((row,rowIdx)=>(
          <View key={rowIdx} style={styles.tabRow}>
            {row.map(tab=>(
              <TouchableOpacity key={tab.id} style={[styles.tabBtn,activeTab===tab.id&&{borderBottomColor:tab.color,borderBottomWidth:2}]} onPress={()=>{setActiveTab(tab.id);setResult(null);}}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel,activeTab===tab.id&&{color:tab.color}]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {activeTab==='species'&&(
        <View style={styles.speciesRow}>
          {SPECIES_SUBS.map(sub=>(
            <TouchableOpacity key={sub.id} style={[styles.subTab,speciesSub===sub.id&&{backgroundColor:sub.color+'22',borderColor:sub.color}]} onPress={()=>{setSpeciesSub(sub.id);setResult(null);}}>
              <Text style={styles.subTabIcon}>{sub.icon}</Text>
              <Text style={[styles.subTabLabel,speciesSub===sub.id&&{color:sub.color}]}>{sub.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {cameraMode?(
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="back" onBarcodeScanned={activeTab==='scan'||activeTab==='care'?handleBarcodeScanned:undefined}>
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraFrameGroup}>
                <View style={[styles.scanFrame,{borderColor:accentColor}]}/>
                <Text style={[styles.cameraHint,{color:accentColor}]}>
                  {activeTab==='scan'?(barcodeReady?'BARCODE READY · TAP TO SCAN':'POINT AT BARCODE'):activeTab==='care'?(barcodeReady?'BARCODE READY · TAP TO SCAN':'FRAME THE PRODUCT'):'FRAME THE ITEM'}
                </Text>
              </View>
              <View style={styles.cameraControls}>
                <TouchableOpacity style={[styles.captureOuter,{borderColor:accentColor}]} onPress={handleCapture} activeOpacity={0.85}>
                  <View style={[styles.captureInner,{backgroundColor:accentColor}]}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelCamera}>
                  <Text style={styles.cancelText}>✕ CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      ):(
        <ScrollView style={styles.body} contentContainerStyle={{paddingBottom:60}}>
          <View style={[styles.doctrineBanner,{borderLeftColor:accentColor}]}>
            <Text style={[styles.doctrineTitle,{color:accentColor}]}>
              {activeTab==='meat'?'⚠ CO₂/MAP TRUTH DOCTRINE':activeTab==='care'?'⚠ SKIN INGESTION DOCTRINE':activeTab==='grownfolks'?'🍷 GROWN FOLKS TABLE':activeTab==='species'?`${SPECIES_SUBS.find(s=>s.id===speciesSub)?.icon} SPECIES INTELLIGENCE`:activeTab==='produce'?'🌿 FRESH PRODUCE INTELLIGENCE':'⚡ SAFETY CLARIFIER ADAPTIVE NERVE'}
            </Text>
            <Text style={styles.doctrineBody}>
              {activeTab==='meat'?'CO₂ keeps meat bright red long after it degrades. Your eyes are being deceived. The Equalizer sees through it.':activeTab==='care'?'The skin absorbs everything. It is not a barrier — it is an organ. What touches skin enters your bloodstream.':activeTab==='grownfolks'?'The Sommelier knows the $12 bottle that beats the $90 one. Real knowledge. Real pairings. Grown folks only.':activeTab==='species'&&speciesSub==='k9'?'ASPCA Animal Poison Control + canine toxicology. Your animal cannot speak. The Equalizer does.':activeTab==='species'&&speciesSub==='horse'?'FEI prohibited substances primary. Every ingredient checked for competition readiness and equine health.':activeTab==='species'&&speciesSub==='agri'?'USDA feed safety + mycotoxin monitoring. Protecting the herd from slow, invisible harm.':activeTab==='produce'?'No barcode needed. Pesticide residue likelihood. EWG Dirty Dozen / Clean 15. The Chef on preparation.':'Packaged goods. Barcoded products. Every ingredient cross-referenced before you buy.'}
            </Text>
          </View>

          <View style={styles.inputCard}>
            <TouchableOpacity style={[styles.cameraBtn,{backgroundColor:accentColor+'22',borderColor:accentColor}]} onPress={openCamera}>
              <Text style={[styles.cameraBtnIcon,{color:accentColor}]}>{activeTab==='scan'?'⚡':'📷'}</Text>
              <Text style={[styles.cameraBtnLabel,{color:accentColor}]}>{activeTab==='scan'?'SCAN BARCODE':'OPEN CAMERA'}</Text>
            </TouchableOpacity>
            <Text style={styles.orDivider}>— or type it —</Text>
            <TextInput
              style={[styles.input,{borderColor:accentColor+'55'}]}
              placeholder={activeTab==='scan'?'Product name or barcode number...':activeTab==='produce'?'e.g. Strawberries, spinach, apples...':activeTab==='meat'?'e.g. Ground beef, chicken breast...':activeTab==='care'?'e.g. Dove soap, Neutrogena SPF...':activeTab==='grownfolks'?'e.g. Malbec, Macallan 12, Guinness...':speciesSub==='k9'?'e.g. Blue Buffalo, peanut butter treat...':speciesSub==='horse'?'e.g. SmartPak supplement, Timothy hay...':'e.g. Purina cattle feed, corn silage...'}
              placeholderTextColor={C.dimWhite} value={manualInput} onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit} returnKeyType="go" multiline={false}
            />
            <TouchableOpacity style={[styles.analyzeBtn,{backgroundColor:accentColor}]} onPress={handleManualSubmit}>
              <Text style={styles.analyzeBtnText}>RUN ANALYSIS</Text>
            </TouchableOpacity>
          </View>

          {loading&&(
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={accentColor}/>
              <Text style={[styles.loadingLabel,{color:accentColor}]}>THE EQUALIZER IS RUNNING</Text>
              <Text style={styles.loadingDb}>9 DATABASES · ALL INTELLIGENCES ACTIVE</Text>
            </View>
          )}

          {result&&!loading&&(
            <View style={styles.resultBlock}>
              <View style={[styles.verdictBanner,{backgroundColor:verdictColor(result.verdict)+'20',borderColor:verdictColor(result.verdict)}]}>
                <Text style={[styles.verdictIcon,{color:verdictColor(result.verdict)}]}>{verdictIcon(result.verdict)}</Text>
                <View style={{flex:1}}>
                  <Text style={[styles.verdictText,{color:verdictColor(result.verdict)}]}>{result.verdict}</Text>
                  <Text style={styles.verdictReason}>{result.verdictReason}</Text>
                </View>
              </View>
              {result.productName&&<Text style={styles.productName}>{result.productName}</Text>}
              {result.recallAlert&&<View style={styles.recallBanner}><Text style={styles.recallText}>🚨 RECALL ALERT: {result.recallAlert}</Text></View>}
              {result.equalizerVoice&&<View style={styles.intelCard}><Text style={styles.intelBody}>{result.equalizerVoice}</Text></View>}
              {result.keyFindings?.length>0&&(
                <View style={styles.findingsCard}>
                  <Text style={styles.findingsHeader}>KEY FINDINGS</Text>
                  {result.keyFindings.map((f:string,i:number)=>(
                    <View key={i} style={styles.findingRow}>
                      <Text style={[styles.findingDot,{color:accentColor}]}>▸</Text>
                      <Text style={styles.findingText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
              {result.chefNote&&(
                <View style={[styles.intelCard,{borderLeftColor:C.orange}]}>
                  <Text style={[styles.intelHeader,{color:C.orange}]}>
                    {activeTab==='care'?'⚗ FORMULATOR':activeTab==='grownfolks'?'🍷 THE SOMMELIER':activeTab==='species'?(speciesSub==='k9'?'🐕 CANINE NUTRITIONIST':speciesSub==='horse'?'🐴 EQUINE NUTRITIONIST':'🌾 AGRICULTURAL ANALYST'):'👨‍🍳 THE CHEF'}
                  </Text>
                  <Text style={styles.intelBody}>{result.chefNote}</Text>
                </View>
              )}
              {result.alternatives?.length>0&&(
                <View style={styles.altCard}>
                  <Text style={styles.altHeader}>BETTER ALTERNATIVES</Text>
                  {result.alternatives.map((a:string,i:number)=><Text key={i} style={styles.altItem}>→ {a}</Text>)}
                </View>
              )}
              {result.actRightDollars&&(
                <View style={styles.vaultCard}>
                  <Text style={styles.vaultLabel}>💎 ACT RIGHT DOLLARS</Text>
                  <Text style={styles.vaultBody}>{result.actRightDollars}</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.scanAgainBtn,{borderColor:accentColor}]} onPress={()=>setResult(null)}>
                <Text style={[styles.scanAgainText,{color:accentColor}]}>SCAN ANOTHER</Text>
              </TouchableOpacity>
            </View>
          )}

          {!result&&!loading&&(
            <View style={styles.emptyState}>
              {heroImage?(<Image source={heroImage} style={styles.heroImage} resizeMode="cover"/>):(<Text style={{fontSize:48,marginBottom:16}}>{currentTab.icon}</Text>)}
              <Text style={styles.emptyLabel}>READY TO SCAN</Text>
              <Text style={styles.emptySubLabel}>9 DATABASES STANDING BY</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={historyVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SCAN HISTORY</Text>
            <TouchableOpacity onPress={()=>setHistoryVisible(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          {history.length===0?(<View style={styles.emptyHistory}><Text style={styles.emptyHistoryText}>No scans yet</Text></View>):(
            <FlatList data={history} keyExtractor={item=>item.id} contentContainerStyle={{padding:16}}
              renderItem={({item})=>(
                <View style={styles.historyRow}>
                  <View style={[styles.historyDot,{backgroundColor:verdictColor(item.verdict)}]}/>
                  <View style={{flex:1}}>
                    <Text style={styles.historyProduct}>{item.productName}</Text>
                    <Text style={styles.historyMeta}>{item.tab} · {item.timestamp}</Text>
                  </View>
                  <Text style={[styles.historyVerdict,{color:verdictColor(item.verdict)}]}>{verdictIcon(item.verdict)}</Text>
                </View>
              )}
            />
          )}
          <TouchableOpacity style={styles.clearBtn} onPress={()=>{setHistory([]);setHistoryVisible(false);}}>
            <Text style={styles.clearBtnText}>CLEAR HISTORY</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:C.nearBlack},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:8,paddingBottom:6,borderBottomWidth:1,borderBottomColor:C.glassBorder},
  receipt:{fontFamily:Platform.OS==='ios'?'Courier New':'monospace',fontSize:9,color:C.dimWhite,letterSpacing:2,flex:1},
  dna:{fontSize:20,color:C.electricBlue,flex:1,textAlign:'center'},
  historyBtn:{flex:1,alignItems:'flex-end'},
  historyBtnText:{color:C.dimWhite,fontSize:11,fontWeight:'700'},
  tabGrid:{borderBottomWidth:1,borderBottomColor:C.glassBorder},
  tabRow:{flexDirection:'row'},
  tabBtn:{flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:2,borderBottomColor:'transparent'},
  tabIcon:{fontSize:16},
  tabLabel:{color:C.dimWhite,fontSize:8,fontWeight:'800',letterSpacing:0.6,marginTop:2},
  speciesRow:{flexDirection:'row',paddingHorizontal:12,paddingVertical:8,gap:8},
  subTab:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:8,borderRadius:8,borderWidth:1,borderColor:C.glassBorder,backgroundColor:C.glass},
  subTabIcon:{fontSize:14},
  subTabLabel:{color:C.dimWhite,fontSize:9,fontWeight:'800',letterSpacing:0.5},
  body:{flex:1},
  doctrineBanner:{marginHorizontal:12,marginTop:10,padding:12,backgroundColor:C.glass,borderRadius:10,borderLeftWidth:3,borderWidth:1,borderColor:C.glassBorder},
  doctrineTitle:{fontSize:10,fontWeight:'800',letterSpacing:1.5,marginBottom:4},
  doctrineBody:{color:C.dimWhite,fontSize:11,lineHeight:17},
  inputCard:{margin:12,padding:16,backgroundColor:C.glass,borderRadius:12,borderWidth:1,borderColor:C.glassBorder},
  cameraBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:14,borderRadius:10,borderWidth:1,marginBottom:12},
  cameraBtnIcon:{fontSize:20},
  cameraBtnLabel:{fontWeight:'900',fontSize:13,letterSpacing:1.5},
  orDivider:{color:C.dimWhite,fontSize:10,textAlign:'center',marginBottom:10,letterSpacing:2},
  input:{backgroundColor:'rgba(255,255,255,0.04)',borderWidth:1,borderRadius:8,color:C.white,padding:12,fontSize:13,marginBottom:10},
  analyzeBtn:{paddingVertical:13,borderRadius:8,alignItems:'center'},
  analyzeBtnText:{color:C.nearBlack,fontWeight:'900',fontSize:12,letterSpacing:1.5},
  cameraContainer:{flex:1},
  camera:{flex:1},
  cameraOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'space-between',alignItems:'center',paddingTop:40,paddingBottom:48},
  cameraFrameGroup:{alignItems:'center'},
  scanFrame:{width:240,height:160,borderWidth:2,borderRadius:12,marginBottom:20},
  cameraHint:{fontWeight:'800',fontSize:12,letterSpacing:2},
  cameraControls:{alignItems:'center',width:'100%'},
  captureOuter:{width:80,height:80,borderRadius:40,borderWidth:4,alignItems:'center',justifyContent:'center',backgroundColor:C.glass,marginBottom:20},
  captureInner:{width:60,height:60,borderRadius:30},
  cancelBtn:{paddingVertical:12,paddingHorizontal:28,backgroundColor:C.glass,borderRadius:10,borderWidth:1,borderColor:C.glassBorder},
  cancelText:{color:C.dimWhite,fontSize:12,fontWeight:'800',letterSpacing:1.5},
  loadingCard:{margin:12,padding:28,backgroundColor:C.glass,borderRadius:12,alignItems:'center',borderWidth:1,borderColor:C.glassBorder},
  loadingLabel:{fontWeight:'900',fontSize:11,letterSpacing:2,marginTop:14},
  loadingDb:{color:C.dimWhite,fontSize:9,letterSpacing:1.5,marginTop:6},
  resultBlock:{margin:12},
  verdictBanner:{flexDirection:'row',alignItems:'center',gap:12,padding:16,borderRadius:12,borderWidth:2,marginBottom:10},
  verdictIcon:{fontSize:28,fontWeight:'900',width:36,textAlign:'center'},
  verdictText:{fontSize:18,fontWeight:'900',letterSpacing:1},
  verdictReason:{color:C.dimWhite,fontSize:12,marginTop:2,lineHeight:18},
  productName:{color:C.white,fontSize:15,fontWeight:'700',marginBottom:10,paddingHorizontal:4},
  recallBanner:{backgroundColor:'rgba(224,82,82,0.2)',borderRadius:8,borderWidth:1,borderColor:C.red,padding:10,marginBottom:10},
  recallText:{color:C.red,fontWeight:'800',fontSize:12},
  intelCard:{backgroundColor:C.glass,borderRadius:10,borderLeftWidth:3,borderLeftColor:C.electricBlue,borderWidth:1,borderColor:C.glassBorder,padding:14,marginBottom:10},
  intelHeader:{color:C.electricBlue,fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:8},
  intelBody:{color:C.white,fontSize:13,lineHeight:21},
  findingsCard:{backgroundColor:C.glass,borderRadius:10,borderWidth:1,borderColor:C.glassBorder,padding:14,marginBottom:10},
  findingsHeader:{color:C.dimWhite,fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:10},
  findingRow:{flexDirection:'row',gap:8,marginBottom:8},
  findingDot:{fontSize:11,marginTop:2},
  findingText:{color:C.white,fontSize:12,lineHeight:19,flex:1},
  altCard:{backgroundColor:C.glass,borderRadius:10,borderWidth:1,borderColor:C.glassBorder,padding:14,marginBottom:10},
  altHeader:{color:C.dimWhite,fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:8},
  altItem:{color:C.teal,fontSize:13,lineHeight:22},
  vaultCard:{backgroundColor:'rgba(201,168,76,0.12)',borderRadius:10,borderWidth:1,borderColor:C.gold,padding:14,marginBottom:10},
  vaultLabel:{color:C.gold,fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:6},
  vaultBody:{color:C.white,fontSize:13,lineHeight:20},
  scanAgainBtn:{borderWidth:1,borderRadius:8,paddingVertical:12,alignItems:'center',marginTop:4},
  scanAgainText:{fontWeight:'900',fontSize:12,letterSpacing:1.5},
  emptyState:{alignItems:'center',paddingTop:32,paddingBottom:40},
  heroImage:{width:'100%',height:220,marginBottom:16,borderRadius:12,opacity:0.90},
  emptyLabel:{color:C.dimWhite,fontWeight:'900',fontSize:11,letterSpacing:3,marginTop:4},
  emptySubLabel:{color:C.dimWhite+'88',fontSize:9,letterSpacing:2,marginTop:4},
  modalRoot:{flex:1,backgroundColor:'#080c12'},
  modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:C.glassBorder},
  modalTitle:{color:C.white,fontWeight:'900',fontSize:14,letterSpacing:2},
  modalClose:{color:C.dimWhite,fontSize:18,fontWeight:'700'},
  emptyHistory:{flex:1,alignItems:'center',justifyContent:'center'},
  emptyHistoryText:{color:C.dimWhite,fontSize:13},
  historyRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.glassBorder},
  historyDot:{width:10,height:10,borderRadius:5},
  historyProduct:{color:C.white,fontSize:13,fontWeight:'700'},
  historyMeta:{color:C.dimWhite,fontSize:10,marginTop:2},
  historyVerdict:{fontSize:18,fontWeight:'900'},
  clearBtn:{margin:16,padding:14,borderRadius:8,borderWidth:1,borderColor:C.red+'66',alignItems:'center'},
  clearBtnText:{color:C.red,fontWeight:'800',fontSize:11,letterSpacing:1.5},
});
