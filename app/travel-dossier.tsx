// ─── app/travel-dossier.tsx ─── AA2 BioMesh v50 Mockup #09
import React from 'react';
import{View,Text,ScrollView,TouchableOpacity,StyleSheet,Platform,StatusBar}from 'react-native';
import{useRouter}from 'expo-router';
const C={
  navy:'#0E1B33',navyCard:'rgba(255,255,255,0.05)',navyElev:'rgba(255,255,255,0.04)',
  line:'rgba(255,255,255,0.08)',lineHi:'rgba(255,255,255,0.16)',
  gold:'#D4A847',goldBord:'rgba(212,168,71,0.40)',goldDim:'rgba(212,168,71,0.10)',
  green:'#34D399',greenDim:'rgba(52,211,153,0.10)',greenBord:'rgba(52,211,153,0.35)',
  cyan:'#1BB8FF',amber:'#C49A2A',red:'#E24B4A',
  white:'#FFFFFF',muted:'rgba(255,255,255,0.55)',muted2:'rgba(255,255,255,0.32)',
  mono:Platform.OS==='ios'?'Courier New':'monospace',
};
type ModStatus='COMPILED'|'PARTIAL'|'EMPTY';
type ItemLevel='info'|'amber'|'red'|'green';
interface DossierItem{label:string;value:string;level?:ItemLevel;}
interface DossierModule{id:string;icon:string;title:string;status:ModStatus;items:DossierItem[];}
function statusColor(s:ModStatus){return s==='COMPILED'?C.green:s==='PARTIAL'?C.amber:C.muted2;}
function itemColor(l?:ItemLevel){return l==='red'?C.red:l==='amber'?C.amber:l==='green'?C.green:C.muted;}
const DEMO_MODULES:DossierModule[]=[
  {id:'safety',icon:'✚',title:'SAFETY & MEDICAL',status:'COMPILED',items:[{label:'NEAREST ER',value:'Hospital Chiriquí, David · 38km',level:'info'},{label:'ALLERGIES FLAGGED',value:'Tree nuts (SEVERE) · Shellfish (MOD)',level:'amber'},{label:'EMERGENCY LINE',value:'911 (Panama)',level:'info'},{label:'PHARMACY',value:'Farmacia Arrocha · 1.4km',level:'green'}]},
  {id:'nutrition',icon:'🥗',title:'NUTRITION & PANTRY',status:'COMPILED',items:[{label:'GROCERY',value:'Super 99 Boquete · 0.8km',level:'green'},{label:'ORGANIC MARKETS',value:'Feria del Agricultor · Sat 7am',level:'green'},{label:'WATCH ITEMS',value:'3 local products flagged for tree nut cross-contamination',level:'amber'}]},
  {id:'activities',icon:'⛰',title:'ACTIVITY INTEL',status:'COMPILED',items:[{label:'QUETZAL TRAIL',value:'ALL CLEAR · Moderate difficulty · 8km',level:'green'},{label:'VOLCÁN BARÚ',value:'TAKE NOTICE · Elevated activity, summit restricted',level:'amber'},{label:'ALTITUDE NOTE',value:'Boquete 1160m · Barú peak 3478m · Hydration ×1.4',level:'amber'}]},
  {id:'environment',icon:'🌿',title:'ENVIRONMENT',status:'COMPILED',items:[{label:'AIR QUALITY',value:'GOOD · AQI 18 avg',level:'green'},{label:'WATER',value:'Tap safe in Boquete · Carry filter for trails',level:'info'},{label:'WILDLIFE',value:'Coral snake, Fer-de-lance documented in highland trails',level:'amber'}]},
  {id:'k9',icon:'🐕',title:'K9 INTEL',status:'PARTIAL',items:[{label:'VET',value:'Clínica Veterinaria Boquete · 2.3km',level:'green'},{label:'HAZARD PLANTS',value:'4 identified on Quetzal trail — ASPCA DB8 verified',level:'amber'},{label:'WATER ACCESS',value:'Multiple streams on trail — vet advises Giardia risk',level:'amber'}]},
];
export default function TravelDossier(){
  const router=useRouter();
  return(
    <View style={s.root}>
      <StatusBar barStyle="light-content"/>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <View style={s.brand}><View style={s.brandLogo}/><View><Text style={s.brandWord}>AA2 PANAMA</Text><Text style={s.brandTag}>AWARE · ADAPT · ADVANCE</Text></View></View>
      </View>
      <View style={s.eyebrow}><Text style={s.eyebrowL}>TRAVEL · DOSSIER</Text><Text style={s.eyebrowR}>COMPILED 08 MAY 2026</Text></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.cover}>
          <Text style={s.coverEyebrow}>◆ AA2 TRAVEL DOSSIER</Text>
          <Text style={s.coverTitle}>BOQUETE HIGHLAND CIRCUIT</Text>
          <Text style={s.coverDates}>15 JUN 2026 → 28 JUN 2026</Text>
          <Text style={s.coverDest}>Boquete, Chiriquí, Panama</Text>
          <View style={s.coverSig}><Text style={[s.coverSigGlyph,{color:C.red}]}>◆</Text><Text style={s.coverSigText}> JRP · 4F9R</Text></View>
        </View>
        {DEMO_MODULES.map(mod=>(
          <View key={mod.id} style={s.module}>
            <View style={s.moduleHeader}>
              <View style={s.moduleLeft}><Text style={s.moduleIcon}>{mod.icon}</Text><Text style={s.moduleTitle}>{mod.title}</Text></View>
              <View style={[s.statusPill,{borderColor:statusColor(mod.status),backgroundColor:`${statusColor(mod.status)}12`}]}>
                <View style={[s.statusDot,{backgroundColor:statusColor(mod.status)}]}/>
                <Text style={[s.statusText,{color:statusColor(mod.status)}]}>{mod.status}</Text>
              </View>
            </View>
            {mod.items.map((item,i)=>(
              <View key={i} style={[s.itemRow,i<mod.items.length-1&&s.itemRowBorder]}>
                <Text style={s.itemLabel}>{item.label}</Text>
                <Text style={[s.itemValue,{color:itemColor(item.level)}]}>{item.value}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={s.footerSig}>
          <Text style={s.footerLine}>◆ AA2 TRAVEL DOSSIER · BOQUETE HIGHLAND CIRCUIT</Text>
          <Text style={s.footerLine}>15 JUN 2026 → 28 JUN 2026 · Compiled 08 MAY 2026</Text>
          <Text style={s.footerLine}>◆ JRP · 4F9R</Text>
        </View>
        <TouchableOpacity style={s.action} activeOpacity={0.9}><Text style={s.actionText}>Print Dossier · Alive Code</Text><Text style={s.actionArrow}>→</Text></TouchableOpacity>
        <View style={s.secRow}>
          <TouchableOpacity style={s.secBtn}><Text style={s.secBtnText}>Share · physician</Text></TouchableOpacity>
          <TouchableOpacity style={s.secBtn} onPress={()=>router.push('/dossier-builder')}><Text style={s.secBtnText}>Rebuild dossier</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
export function TravelDossierBubble(p:{tripName?:string;departing?:string;returning?:string;modulesCount?:number;onPress:()=>void}){
  return(<TouchableOpacity style={tb.root} onPress={p.onPress} activeOpacity={0.8}><View style={tb.left}><Text style={tb.glyph}>◆</Text><View><Text style={tb.label}>TRAVEL DOSSIER</Text><Text style={tb.meta}>{p.tripName??'NO DOSSIER COMPILED'}{p.departing&&p.returning?` · ${p.departing} → ${p.returning}`:''}{p.modulesCount?` · ${p.modulesCount} MODULES`:''}</Text></View></View><Text style={tb.arrow}>›</Text></TouchableOpacity>);
}
const tb=StyleSheet.create({root:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,backgroundColor:C.goldDim,borderRadius:8,borderWidth:0.5,borderColor:C.goldBord,marginVertical:4},left:{flexDirection:'row',alignItems:'center',gap:10,flex:1},glyph:{color:C.gold,fontSize:14},label:{color:C.white,fontFamily:C.mono,fontSize:10,fontWeight:'700',letterSpacing:2},meta:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1,marginTop:2},arrow:{color:C.gold,fontSize:18}});
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.navy},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingTop:16,paddingBottom:12,borderBottomWidth:0.5,borderBottomColor:C.line,gap:12},
  backBtn:{padding:4},backArrow:{color:C.cyan,fontSize:20},
  brand:{flexDirection:'row',alignItems:'center',gap:10},brandLogo:{width:34,height:22,borderRadius:2,borderWidth:1.5,borderColor:C.cyan},
  brandWord:{color:C.white,fontWeight:'700',fontSize:13,letterSpacing:2},brandTag:{color:C.muted2,fontFamily:C.mono,fontSize:7,letterSpacing:2},
  eyebrow:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:C.line},
  eyebrowL:{fontFamily:C.mono,fontSize:9,letterSpacing:2,color:C.muted},eyebrowR:{fontFamily:C.mono,fontSize:9,letterSpacing:1,color:C.muted2},
  cover:{margin:16,padding:20,backgroundColor:C.navyCard,borderRadius:10,borderWidth:0.5,borderColor:C.goldBord},
  coverEyebrow:{color:C.gold,fontFamily:C.mono,fontSize:9,letterSpacing:3,marginBottom:8},
  coverTitle:{color:C.white,fontSize:22,fontWeight:'800',letterSpacing:2,marginBottom:6},
  coverDates:{color:C.cyan,fontFamily:C.mono,fontSize:11,letterSpacing:1.5,marginBottom:4},
  coverDest:{color:C.muted,fontSize:12,marginBottom:14},
  coverSig:{flexDirection:'row',alignItems:'center'},coverSigGlyph:{fontSize:14},
  coverSigText:{color:C.muted2,fontFamily:C.mono,fontSize:10,letterSpacing:2},
  module:{marginHorizontal:16,marginBottom:8,backgroundColor:C.navyCard,borderRadius:10,padding:14,borderWidth:0.5,borderColor:C.lineHi},
  moduleHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  moduleLeft:{flexDirection:'row',alignItems:'center',gap:8},moduleIcon:{fontSize:16},
  moduleTitle:{color:C.white,fontFamily:C.mono,fontSize:10,fontWeight:'700',letterSpacing:2},
  statusPill:{flexDirection:'row',alignItems:'center',paddingHorizontal:8,paddingVertical:3,borderRadius:3,borderWidth:0.5,gap:4},
  statusDot:{width:5,height:5,borderRadius:2.5},statusText:{fontFamily:C.mono,fontSize:7,letterSpacing:1.5},
  itemRow:{paddingVertical:8},itemRowBorder:{borderBottomWidth:0.5,borderBottomColor:C.line},
  itemLabel:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1.5,marginBottom:3},itemValue:{fontSize:12,lineHeight:18},
  footerSig:{alignItems:'center',paddingVertical:20,borderTopWidth:0.5,borderTopColor:C.line,marginHorizontal:16,marginTop:8},
  footerLine:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:2,marginBottom:4,textAlign:'center'},
  action:{marginHorizontal:18,marginTop:12,backgroundColor:C.cyan,borderRadius:12,paddingVertical:14,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  actionText:{color:'#001520',fontSize:14,fontWeight:'700'},actionArrow:{color:'#001520',fontSize:18,fontWeight:'700'},
  secRow:{flexDirection:'row',gap:8,marginHorizontal:18,marginTop:8,marginBottom:24},
  secBtn:{flex:1,paddingVertical:10,backgroundColor:C.navyCard,borderWidth:0.5,borderColor:C.lineHi,borderRadius:10,alignItems:'center'},
  secBtnText:{color:C.muted,fontSize:11},
});
