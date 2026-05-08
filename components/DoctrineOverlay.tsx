// ─── components/DoctrineOverlay.tsx ─── AA2 BioMesh v50 Mockup #02
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
const C = {
  navy:'#0E1B33',navyDeep:'#08111F',navyCard:'rgba(255,255,255,0.05)',
  navyElev:'rgba(255,255,255,0.04)',line:'rgba(255,255,255,0.08)',
  lineHi:'rgba(255,255,255,0.16)',gold:'#D4A847',goldBord:'rgba(212,168,71,0.40)',
  green:'#34D399',greenDim:'rgba(52,211,153,0.10)',greenBord:'rgba(52,211,153,0.35)',
  cyan:'#1BB8FF',cyanDim:'rgba(27,184,255,0.10)',
  amber:'#C49A2A',amberDim:'rgba(196,154,42,0.10)',amberBord:'rgba(196,154,42,0.40)',
  red:'#E24B4A',redDim:'rgba(226,75,74,0.10)',redBord:'rgba(226,75,74,0.45)',
  white:'#FFFFFF',muted:'rgba(255,255,255,0.55)',muted2:'rgba(255,255,255,0.32)',
  mono:Platform.OS==='ios'?'Courier New':'monospace',
};
export type Verdict='ALL CLEAR'|'TAKE NOTICE'|'PAY ATTENTION';
export interface AllergenAlert{name:string;severity:'SEVERE'|'MODERATE'|'MILD';onset?:string;reactions?:string;}
export interface GoalConflict{goalLabel:string;reason:string;}
export interface ChemFlag{chemical:string;role:string;impact:string;level:'red'|'amber';}
export interface DoctrineOverlayProps{
  verdict:Verdict;verdictReason?:string;productName?:string;productBrand?:string;
  productBarcode?:string;memberName?:string;memberMeta?:string;scanTimestamp?:string;
  allergenAlerts?:AllergenAlert[];goalConflicts?:GoalConflict[];chemicalFlags?:ChemFlag[];
  sensitivityNote?:string;cumulativeScore?:number;closingQuote?:string;signatureCode?:string;
  primaryCTA?:string;onPrimaryCTA?:()=>void;onSaveRecord?:()=>void;onShare?:()=>void;
  onDismiss?:()=>void;onSwitchMember?:()=>void;
}
function accent(v:Verdict){return v==='ALL CLEAR'?C.green:v==='TAKE NOTICE'?C.amber:C.red;}
export function DoctrineOverlay(p:DoctrineOverlayProps){
  const a=accent(p.verdict);
  return(
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={s.brand}><View style={s.brandLogo}/><View><Text style={s.brandWord}>AA2 PANAMA</Text><Text style={s.brandTag}>AWARE · ADAPT · ADVANCE</Text></View></View>
      </View>
      <View style={s.eyebrow}><Text style={s.eyebrowL}>SCANNER PRO · RESULT</Text><Text style={s.eyebrowR}>{p.scanTimestamp??''}</Text></View>
      {p.memberName?<View style={s.profileCtx}><View style={s.profileLeft}><View style={s.profileAvatar}><Text style={s.profileAvatarText}>{p.memberName.charAt(0).toUpperCase()}</Text></View><View><Text style={s.profileName}>Scanning for {p.memberName}</Text>{p.memberMeta?<Text style={s.profileMeta}>{p.memberMeta}</Text>:null}</View></View><TouchableOpacity onPress={p.onSwitchMember}><Text style={s.switchBtn}>SWITCH</Text></TouchableOpacity></View>:null}
      <View style={s.product}><View style={s.productIcon}><Text style={s.productIconText}>⬜</Text></View><View style={s.productInfo}>{p.productBrand?<Text style={s.productBrand}>{p.productBrand.toUpperCase()}</Text>:null}<Text style={s.productName}>{p.productName??'Unknown Product'}</Text>{p.productBarcode?<Text style={s.productBarcode}>◇ {p.productBarcode}</Text>:null}</View></View>
      <View style={[s.verdict,{borderColor:a}]}><View style={s.verdictPillRow}><View style={[s.verdictDot,{backgroundColor:a}]}/><Text style={[s.verdictPill,{color:a}]}>{p.verdict}</Text></View>{p.verdictReason?<Text style={s.verdictHeadline}>{p.verdictReason}</Text>:null}</View>
      {(p.allergenAlerts??[]).length>0&&<View style={[s.evidence,{borderLeftColor:C.red}]}><Text style={[s.sectionLabel,{color:C.red}]}>⚠ ALLERGEN MATCH</Text>{(p.allergenAlerts??[]).map((al,i)=><View key={i} style={s.allergenCard}><View style={s.allergenTop}><Text style={s.allergenName}>{al.name.toUpperCase()}</Text><View style={[s.levelPill,{backgroundColor:C.redDim,borderColor:C.redBord}]}><Text style={[s.levelText,{color:C.red}]}>{al.severity}</Text></View></View>{(al.onset||al.reactions)?<View style={s.allergenMeta}>{al.onset?<Text style={s.allergenMetaItem}>ONSET <Text style={s.allergenMetaVal}>{al.onset}</Text></Text>:null}{al.reactions?<Text style={s.allergenMetaItem}>REACTIONS <Text style={s.allergenMetaVal}>{al.reactions}</Text></Text>:null}</View>:null}</View>)}</View>}
      {(p.goalConflicts??[]).length>0&&<View style={[s.evidence,{borderLeftColor:C.amber}]}><Text style={[s.sectionLabel,{color:C.amber}]}>▲ GOAL CONFLICT</Text>{(p.goalConflicts??[]).map((g,i)=><View key={i} style={s.goalCard}><View style={s.goalTop}><Text style={s.goalName}>{g.goalLabel}</Text><View style={[s.levelPill,{backgroundColor:C.amberDim,borderColor:C.amberBord}]}><Text style={[s.levelText,{color:C.amber}]}>CONFLICTED</Text></View></View><Text style={s.goalBody}>{g.reason}</Text></View>)}</View>}
      {(p.chemicalFlags??[]).length>0&&<View style={[s.evidence,{borderLeftColor:C.cyan}]}><Text style={[s.sectionLabel,{color:C.cyan}]}>◆ CHEMICAL FLAGS · {(p.chemicalFlags??[]).length}</Text>{(p.chemicalFlags??[]).map((c,i)=><View key={i} style={s.chemRow}><View style={[s.chemMarker,{backgroundColor:c.level==='red'?C.red:C.amber}]}/><View style={s.chemBody}><View style={s.chemTop}><Text style={s.chemName}>{c.chemical}</Text><Text style={s.chemRole}>{c.role}</Text></View><Text style={s.chemImpact}>{c.impact}</Text></View></View>)}</View>}
      {p.sensitivityNote?<View style={[s.evidence,{borderLeftColor:C.cyan}]}><Text style={[s.sectionLabel,{color:C.muted2}]}>◇ SENSITIVITY CONTEXT</Text><View style={s.sensNote}><Text style={s.sensLabel}>CHILD MULTIPLIER · 2.0×</Text><Text style={s.sensBody}>{p.sensitivityNote}</Text></View></View>:null}
      {typeof p.cumulativeScore==='number'?<View style={[s.evidence,{borderLeftColor:C.cyan}]}><Text style={[s.sectionLabel,{color:C.muted2}]}>⌐ 30-DAY CUMULATIVE LOAD</Text><View style={s.cumRow}><View style={s.cumBarOuter}><View style={[s.cumBarFill,{width:`${Math.min(p.cumulativeScore,100)}%` as any}]}/></View><Text style={s.cumVal}>{p.cumulativeScore}</Text></View></View>:null}
      <View style={s.closing}><Text style={s.closingQuote}>{p.closingQuote??'When the body speaks, the doctrine listens.'}</Text><Text style={s.closingSig}><Text style={{color:C.red}}>◆</Text>{'  '}{p.signatureCode??'AA2 · BIOMESH · v50'}</Text></View>
      {p.primaryCTA?<TouchableOpacity style={s.primaryCta} onPress={p.onPrimaryCTA} activeOpacity={0.85}><Text style={s.primaryCtaText}>{p.primaryCTA}</Text><Text style={s.primaryCtaArrow}>→</Text></TouchableOpacity>:null}
      <View style={s.secondaryRow}><TouchableOpacity style={s.secBtn} onPress={p.onSaveRecord}><Text style={s.secBtnText}>Save to record</Text></TouchableOpacity><TouchableOpacity style={s.secBtn} onPress={p.onShare}><Text style={s.secBtnText}>Share · physician</Text></TouchableOpacity></View>
      {p.onDismiss?<TouchableOpacity style={s.dismiss} onPress={p.onDismiss}><Text style={s.dismissText}>DISMISS</Text></TouchableOpacity>:null}
    </ScrollView>
  );
}
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.navy},scroll:{paddingBottom:80},
  header:{paddingHorizontal:18,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:0.5,borderBottomColor:C.line},
  brand:{flexDirection:'row',alignItems:'center',gap:10},brandLogo:{width:34,height:22,borderRadius:2,borderWidth:1.5,borderColor:C.cyan},
  brandWord:{color:C.white,fontWeight:'700',fontSize:13,letterSpacing:2},brandTag:{color:C.muted2,fontFamily:C.mono,fontSize:7,letterSpacing:2},
  eyebrow:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:C.line},
  eyebrowL:{fontFamily:C.mono,fontSize:9,letterSpacing:2,color:C.muted},eyebrowR:{fontFamily:C.mono,fontSize:9,letterSpacing:1,color:C.muted2},
  profileCtx:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:18,paddingVertical:10,backgroundColor:C.navyElev,borderBottomWidth:0.5,borderBottomColor:C.line},
  profileLeft:{flexDirection:'row',alignItems:'center',gap:10},
  profileAvatar:{width:28,height:28,borderRadius:14,backgroundColor:C.greenDim,borderWidth:1,borderColor:C.greenBord,alignItems:'center',justifyContent:'center'},
  profileAvatarText:{color:C.green,fontSize:11,fontWeight:'700'},profileName:{color:C.white,fontSize:13,fontWeight:'500'},
  profileMeta:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1,marginTop:2},switchBtn:{color:C.cyan,fontFamily:C.mono,fontSize:9,letterSpacing:1.5},
  product:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingVertical:12,gap:10,borderBottomWidth:0.5,borderBottomColor:C.line},
  productIcon:{width:40,height:40,borderRadius:6,backgroundColor:C.navyCard,alignItems:'center',justifyContent:'center',borderWidth:0.5,borderColor:C.lineHi},
  productIconText:{fontSize:18},productInfo:{flex:1},
  productBrand:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:2,marginBottom:2},
  productName:{color:C.white,fontSize:15,fontWeight:'600',marginBottom:2},productBarcode:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:1},
  verdict:{marginHorizontal:18,marginTop:14,padding:14,backgroundColor:C.navyCard,borderRadius:8,borderWidth:1},
  verdictPillRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  verdictDot:{width:7,height:7,borderRadius:3.5},verdictPill:{fontFamily:C.mono,fontSize:11,fontWeight:'800',letterSpacing:2,flex:1},
  verdictHeadline:{color:C.white,fontSize:15,fontWeight:'700',lineHeight:22,letterSpacing:0.3},
  evidence:{marginHorizontal:18,marginTop:10,backgroundColor:C.navyCard,borderRadius:8,padding:14,borderLeftWidth:3,borderLeftColor:C.line},
  sectionLabel:{fontFamily:C.mono,fontSize:9,letterSpacing:2,marginBottom:10},
  allergenCard:{marginBottom:8},allergenTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},
  allergenName:{color:C.white,fontSize:13,fontWeight:'700',letterSpacing:1},
  levelPill:{paddingHorizontal:8,paddingVertical:3,borderRadius:3,borderWidth:0.5},levelText:{fontSize:8,fontFamily:C.mono,letterSpacing:1.5,fontWeight:'700'},
  allergenMeta:{flexDirection:'row',gap:12},allergenMetaItem:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1},allergenMetaVal:{color:C.white},
  goalCard:{marginBottom:8},goalTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4},goalName:{color:C.white,fontSize:13,fontWeight:'600'},goalBody:{color:C.muted,fontSize:12,lineHeight:18},
  chemRow:{flexDirection:'row',gap:10,paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:C.line},chemMarker:{width:4,borderRadius:2,alignSelf:'stretch',minHeight:40},chemBody:{flex:1},
  chemTop:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:3},chemName:{color:C.white,fontSize:13,fontWeight:'600'},chemRole:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1.5,backgroundColor:C.navyElev,paddingHorizontal:6,paddingVertical:2,borderRadius:2},chemImpact:{color:C.muted,fontSize:11,lineHeight:16},
  sensNote:{padding:10,backgroundColor:C.cyanDim,borderRadius:4},sensLabel:{color:C.cyan,fontFamily:C.mono,fontSize:9,letterSpacing:1.5,marginBottom:4},sensBody:{color:C.white,fontSize:12,lineHeight:18},
  cumRow:{flexDirection:'row',alignItems:'center',gap:10},cumBarOuter:{flex:1,height:4,backgroundColor:C.navyElev,borderRadius:2},cumBarFill:{height:4,backgroundColor:C.cyan,borderRadius:2},cumVal:{color:C.white,fontFamily:C.mono,fontSize:10},
  closing:{marginHorizontal:18,marginTop:20,paddingVertical:16,borderTopWidth:0.5,borderTopColor:C.line,alignItems:'center'},closingQuote:{color:C.muted,fontSize:13,fontStyle:'italic',textAlign:'center',lineHeight:20,marginBottom:10},closingSig:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:2},
  primaryCta:{marginHorizontal:18,marginTop:12,backgroundColor:C.cyan,borderRadius:12,paddingVertical:14,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},primaryCtaText:{color:'#001520',fontSize:14,fontWeight:'700'},primaryCtaArrow:{color:'#001520',fontSize:18,fontWeight:'700'},
  secondaryRow:{flexDirection:'row',gap:8,marginHorizontal:18,marginTop:8},secBtn:{flex:1,paddingVertical:10,backgroundColor:C.navyCard,borderWidth:0.5,borderColor:C.lineHi,borderRadius:10,alignItems:'center'},secBtnText:{color:C.muted,fontSize:11},
  dismiss:{paddingVertical:16,alignItems:'center'},dismissText:{color:C.muted2,fontFamily:C.mono,fontSize:10,letterSpacing:2.5},
});
export default DoctrineOverlay;
