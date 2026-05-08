// ─── components/CannabisLayer.tsx ─── AA2 BioMesh v50 Mockup #11
// Subscriber opt-in · Default OFF · Chauffeur/Concierge flows only
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
const C = {
  navy:'#0E1B33',navyCard:'rgba(255,255,255,0.05)',line:'rgba(255,255,255,0.08)',
  gold:'#D4A847',goldDim:'rgba(212,168,71,0.10)',goldBord:'rgba(212,168,71,0.40)',
  green:'#34D399',greenDim:'rgba(52,211,153,0.10)',greenBord:'rgba(52,211,153,0.35)',
  cyan:'#1BB8FF',cyanDim:'rgba(27,184,255,0.10)',
  amber:'#C49A2A',amberDim:'rgba(196,154,42,0.10)',amberBord:'rgba(196,154,42,0.40)',
  red:'#E24B4A',white:'#FFFFFF',muted:'rgba(255,255,255,0.55)',muted2:'rgba(255,255,255,0.32)',
  mono:Platform.OS==='ios'?'Courier New':'monospace',
};
export type LegalStatus='LEGAL'|'DECRIMINALIZED'|'MEDICAL_ONLY'|'ILLEGAL';
export interface StrainProfile{name:string;type:'INDICA'|'SATIVA'|'HYBRID';thcPct:number;cbdPct:number;terpenes:string[];effects:string[];cautions?:string[];}
export interface CannabisLayerProps{
  enabled:boolean;onToggle:(v:boolean)=>void;isSubscriber:boolean;
  countryCode:string;countryName:string;legalStatus:LegalStatus;legalNote?:string;
  strain?:StrainProfile;interactionWarnings?:string[];drivingAdvisory?:string;
  conciergeNote?:string;onClose?:()=>void;
}
function legalColor(s:LegalStatus){return s==='LEGAL'?C.green:s==='DECRIMINALIZED'?C.amber:s==='MEDICAL_ONLY'?C.cyan:C.red;}
function legalLabel(s:LegalStatus){return s==='LEGAL'?'LEGAL':s==='DECRIMINALIZED'?'DECRIMINALIZED':s==='MEDICAL_ONLY'?'MEDICAL ONLY':'ILLEGAL';}
export function CannabisLayer(p:CannabisLayerProps){
  const sc=legalColor(p.legalStatus);
  return(
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.headerLeft}><Text style={s.glyph}>◆</Text><View><Text style={s.title}>CANNABIS LAYER</Text><Text style={s.subtitle}>CHAUFFEUR · CONCIERGE</Text></View></View>
        <View style={s.headerRight}>
          {p.isSubscriber?<Switch value={p.enabled} onValueChange={p.onToggle} trackColor={{false:C.line,true:C.greenBord}} thumbColor={p.enabled?C.green:C.muted2}/>:<TouchableOpacity style={s.upgradePill}><Text style={s.upgradeText}>UPGRADE ›</Text></TouchableOpacity>}
          {p.onClose?<TouchableOpacity onPress={p.onClose} style={s.closeBtn}><Text style={s.closeText}>✕</Text></TouchableOpacity>:null}
        </View>
      </View>
      {!p.isSubscriber?(
        <View style={s.gatedBox}><Text style={s.gatedIcon}>🔒</Text><Text style={s.gatedTitle}>SUBSCRIBER FEATURE</Text><Text style={s.gatedBody}>Cannabis Layer is available to Concierge and Chauffeur subscribers.</Text></View>
      ):!p.enabled?(
        <View style={s.offBox}><Text style={s.offText}>Cannabis Layer is OFF. Toggle on above to activate for this session.</Text></View>
      ):(
        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.legalBar,{borderColor:sc,backgroundColor:`${sc}10`}]}><View style={[s.legalDot,{backgroundColor:sc}]}/><View style={s.legalBody}><Text style={[s.legalStatus,{color:sc}]}>{legalLabel(p.legalStatus)}</Text><Text style={s.legalCountry}>{p.countryName} · {p.countryCode}</Text></View></View>
          {p.legalNote?<Text style={s.legalNote}>{p.legalNote}</Text>:null}
          {p.strain?<View style={s.section}><Text style={s.sectionLabel}>◆ STRAIN PROFILE</Text><View style={s.strainTop}><Text style={s.strainName}>{p.strain.name}</Text><View style={[s.typePill,{backgroundColor:p.strain.type==='INDICA'?'rgba(138,43,226,0.15)':p.strain.type==='SATIVA'?'rgba(52,211,153,0.12)':'rgba(27,184,255,0.10)',borderColor:p.strain.type==='INDICA'?'rgba(138,43,226,0.4)':p.strain.type==='SATIVA'?C.greenBord:'rgba(27,184,255,0.35)'}]}><Text style={[s.typeText,{color:p.strain.type==='INDICA'?'#9B59B6':p.strain.type==='SATIVA'?C.green:C.cyan}]}>{p.strain.type}</Text></View></View><View style={s.potencyRow}><View style={s.potencyItem}><Text style={s.potencyLabel}>THC</Text><Text style={s.potencyVal}>{p.strain.thcPct}%</Text></View><View style={s.potencyItem}><Text style={s.potencyLabel}>CBD</Text><Text style={s.potencyVal}>{p.strain.cbdPct}%</Text></View></View>{p.strain.effects.length>0?<Text style={s.effectText}>{p.strain.effects.join(' · ')}</Text>:null}{p.strain.cautions&&p.strain.cautions.length>0?<View style={s.cautionBox}>{p.strain.cautions.map((c,i)=><Text key={i} style={s.cautionText}>⚠ {c}</Text>)}</View>:null}</View>:null}
          {(p.interactionWarnings??[]).length>0?<View style={s.section}><Text style={[s.sectionLabel,{color:C.amber}]}>⚠ INTERACTIONS</Text>{(p.interactionWarnings??[]).map((w,i)=><View key={i} style={s.warnRow}><Text style={s.warnText}>{w}</Text></View>)}</View>:null}
          {p.drivingAdvisory?<View style={[s.advisoryBox,{borderColor:C.red,backgroundColor:`${C.red}10`}]}><Text style={[s.advisoryLabel,{color:C.red}]}>🚗 DRIVING ADVISORY</Text><Text style={s.advisoryText}>{p.drivingAdvisory}</Text></View>:null}
          {p.conciergeNote?<View style={s.conciergeBox}><Text style={s.conciergeEyebrow}>◆ THE CONCIERGE</Text><Text style={s.conciergeNote}>"{p.conciergeNote}"</Text></View>:null}
        </ScrollView>
      )}
    </View>
  );
}
export function CannabisLayerBubble(p:{legalStatus:LegalStatus;countryName:string;enabled:boolean;isSubscriber:boolean;onPress:()=>void}){
  const color=legalColor(p.legalStatus);
  return(<TouchableOpacity style={[sb.root,{borderColor:p.enabled?color:C.line}]} onPress={p.onPress} activeOpacity={0.8}><View style={[sb.dot,{backgroundColor:p.enabled?color:C.muted2}]}/><View style={sb.body}><Text style={[sb.label,{color:p.enabled?color:C.muted2}]}>CANNABIS LAYER</Text><Text style={sb.meta}>{p.enabled?`${legalLabel(p.legalStatus)} · ${p.countryName}`:p.isSubscriber?'TAP TO ENABLE':'SUBSCRIBER ONLY'}</Text></View><Text style={[sb.arrow,{color:p.enabled?color:C.muted2}]}>›</Text></TouchableOpacity>);
}
const sb=StyleSheet.create({root:{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:C.navyCard,borderRadius:8,borderWidth:0.5,marginVertical:4,gap:10},dot:{width:8,height:8,borderRadius:4},body:{flex:1},label:{fontFamily:C.mono,fontSize:9,letterSpacing:2,fontWeight:'700'},meta:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1,marginTop:2},arrow:{fontSize:18}});
const s=StyleSheet.create({
  root:{backgroundColor:C.navy,borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:C.greenBord},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,borderBottomWidth:0.5,borderBottomColor:C.line,backgroundColor:C.greenDim},
  headerLeft:{flexDirection:'row',alignItems:'center',gap:10},glyph:{color:C.green,fontSize:14},
  title:{color:C.white,fontFamily:C.mono,fontSize:11,fontWeight:'700',letterSpacing:2},subtitle:{color:C.green,fontFamily:C.mono,fontSize:8,letterSpacing:2,marginTop:1},
  headerRight:{flexDirection:'row',alignItems:'center',gap:10},
  upgradePill:{backgroundColor:C.goldDim,borderWidth:1,borderColor:C.gold,borderRadius:4,paddingHorizontal:8,paddingVertical:4},
  upgradeText:{color:C.gold,fontFamily:C.mono,fontSize:8,letterSpacing:1.5},closeBtn:{padding:4},closeText:{color:C.muted,fontSize:14},
  gatedBox:{padding:20,alignItems:'center'},gatedIcon:{fontSize:28,marginBottom:10},
  gatedTitle:{color:C.white,fontFamily:C.mono,fontSize:11,letterSpacing:2,marginBottom:6},gatedBody:{color:C.muted,fontSize:12,textAlign:'center',lineHeight:18},
  offBox:{padding:18},offText:{color:C.muted,fontSize:13,lineHeight:20},
  content:{maxHeight:500},
  legalBar:{flexDirection:'row',alignItems:'center',margin:14,padding:12,borderRadius:8,borderWidth:1,gap:12},
  legalDot:{width:10,height:10,borderRadius:5},legalBody:{flex:1},
  legalStatus:{fontFamily:C.mono,fontSize:12,fontWeight:'800',letterSpacing:2},legalCountry:{color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1,marginTop:2},
  legalNote:{color:C.muted,fontSize:12,lineHeight:18,marginHorizontal:14,marginBottom:8},
  section:{marginHorizontal:14,marginBottom:12,backgroundColor:C.navyCard,borderRadius:8,padding:12},
  sectionLabel:{color:C.cyan,fontFamily:C.mono,fontSize:9,letterSpacing:2,marginBottom:10},
  strainTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  strainName:{color:C.white,fontSize:16,fontWeight:'700'},
  typePill:{paddingHorizontal:8,paddingVertical:3,borderRadius:3,borderWidth:0.5},typeText:{fontFamily:C.mono,fontSize:8,letterSpacing:1.5,fontWeight:'700'},
  potencyRow:{flexDirection:'row',gap:16,marginBottom:10},potencyItem:{flex:1},
  potencyLabel:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1.5,marginBottom:2},potencyVal:{color:C.white,fontFamily:C.mono,fontSize:14,fontWeight:'700'},
  effectText:{color:C.muted,fontSize:11,lineHeight:16,marginTop:4},
  cautionBox:{marginTop:10,padding:8,borderRadius:4,borderWidth:0.5,borderColor:C.amberBord,backgroundColor:C.amberDim},
  cautionText:{color:C.amber,fontFamily:C.mono,fontSize:9,letterSpacing:1,marginBottom:2},
  warnRow:{borderLeftWidth:2,borderLeftColor:C.amber,paddingLeft:10,marginBottom:8},warnText:{color:C.muted,fontSize:12,lineHeight:18},
  advisoryBox:{marginHorizontal:14,marginBottom:12,padding:12,borderRadius:8,borderWidth:1},
  advisoryLabel:{fontFamily:C.mono,fontSize:9,letterSpacing:2,marginBottom:6},advisoryText:{color:C.white,fontSize:12,lineHeight:18},
  conciergeBox:{marginHorizontal:14,marginBottom:12,padding:14,backgroundColor:'rgba(212,168,71,0.06)',borderRadius:8,borderWidth:0.5,borderColor:'rgba(212,168,71,0.25)'},
  conciergeEyebrow:{color:C.gold,fontFamily:C.mono,fontSize:9,letterSpacing:2,marginBottom:6},conciergeNote:{color:C.white,fontSize:14,fontStyle:'italic',lineHeight:22},
});
export default CannabisLayer;
