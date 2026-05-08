// ─── app/transaction-feed.tsx ─── AA2 BioMesh v50 Mockup #06 · AWARE DOLLARS
import React,{useState} from 'react';
import{View,Text,ScrollView,TouchableOpacity,StyleSheet,Platform,StatusBar}from 'react-native';
import{useRouter}from 'expo-router';
const C={
  navy:'#0E1B33',navyDeep:'#08111F',navyCard:'rgba(255,255,255,0.05)',
  navyElev:'rgba(255,255,255,0.04)',line:'rgba(255,255,255,0.08)',lineHi:'rgba(255,255,255,0.16)',
  gold:'#D4A847',goldBord:'rgba(212,168,71,0.40)',green:'#34D399',greenDim:'rgba(52,211,153,0.10)',
  greenBord:'rgba(52,211,153,0.35)',cyan:'#1BB8FF',amber:'#C49A2A',red:'#E24B4A',
  white:'#FFFFFF',muted:'rgba(255,255,255,0.55)',muted2:'rgba(255,255,255,0.32)',
  mono:Platform.OS==='ios'?'Courier New':'monospace',
};
const CHIPS=['ALL','ALIGNED','WATCH','TRAVEL','K9 / PET','EARNED'];
export default function TransactionFeed(){
  const router=useRouter();
  const[filter,setFilter]=useState('ALL');
  return(
    <View style={s.root}>
      <StatusBar barStyle="light-content"/>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <View style={s.brand}><View style={s.brandLogo}/><View><Text style={s.brandWord}>AA2 PANAMA</Text><Text style={s.brandTag}>AWARE · ADAPT · ADVANCE</Text></View></View>
      </View>
      <View style={s.eyebrow}><Text style={s.eyebrowL}>AA2 PAY · TRANSACTIONS</Text><Text style={s.eyebrowR}>CARD · 7K2D</Text></View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroTop}><View style={s.heroLabel}><Text style={s.heroGlyph}>◆</Text><Text style={s.heroLbl}>AWARE DOLLARS</Text></View><Text style={s.heroMonth}>MAY · 2026</Text></View>
          <View style={s.numRow}><Text style={s.currency}>$</Text><Text style={s.num}>247</Text><Text style={s.dec}>.18</Text></View>
          <Text style={s.desc}>Earned when your spend matches your goals. Redeemable inside the AA2 ecosystem.</Text>
          <View style={s.heroFooter}><Text style={s.delta}>▲ +18% VS LAST MONTH</Text><Text style={s.redeem}>REDEEM →</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterStrip}>
          {CHIPS.map(c=><TouchableOpacity key={c} style={[s.fchip,filter===c&&s.fchipActive]} onPress={()=>setFilter(c)}><Text style={[s.fchipText,filter===c&&s.fchipTextActive]}>{c}</Text></TouchableOpacity>)}
        </ScrollView>
        <View style={s.dayHead}><Text style={s.dayLabel}>TODAY · SAT 02 MAY</Text><Text style={s.dayAware}>+ $1.75 <Text style={s.dayGold}>AWARE</Text></Text></View>
        <TouchableOpacity style={s.txRow} activeOpacity={0.75}>
          <View style={[s.txIcon,{borderColor:'rgba(52,211,153,0.4)',backgroundColor:'rgba(52,211,153,0.12)'}]}><Text style={[s.txIconText,{color:C.green}]}>◈</Text></View>
          <View style={s.txBody}>
            <View style={s.txTop}><Text style={s.txMerchant}>Super 99 · Boquete</Text><Text style={s.txAmount}>−$87.42</Text></View>
            <View style={s.txMeta}><View style={s.txMetaL}><View style={[s.txCat,{backgroundColor:'rgba(52,211,153,0.15)',borderColor:'rgba(52,211,153,0.4)'}]}><Text style={[s.txCatText,{color:C.green}]}>GROCERY</Text></View><Text style={s.txTime}>14:44</Text></View><Text style={s.txAware}>◆ +$1.75</Text></View>
            <Text style={[s.txDoctrine,{color:C.green}]}>14 of 17 items scanned and aligned.</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.txRow} activeOpacity={0.75}>
          <View style={[s.txIcon,{borderColor:C.lineHi,backgroundColor:C.navyElev}]}><Text style={[s.txIconText,{color:C.muted}]}>◈</Text></View>
          <View style={s.txBody}>
            <View style={s.txTop}><Text style={s.txMerchant}>Café Ruiz · Boquete</Text><Text style={s.txAmount}>−$12.50</Text></View>
            <View style={s.txMeta}><View style={s.txMetaL}><View style={[s.txCat,{backgroundColor:C.navyElev,borderColor:C.lineHi}]}><Text style={[s.txCatText,{color:C.muted}]}>CAFÉ</Text></View><Text style={s.txTime}>11:08</Text></View><Text style={s.txAwareZero}>·</Text></View>
          </View>
        </TouchableOpacity>
        <View style={s.dayHead}><Text style={s.dayLabel}>YESTERDAY · FRI 01 MAY</Text><Text style={s.dayAware}>+ $1.25 <Text style={s.dayGold}>AWARE</Text></Text></View>
        <TouchableOpacity style={s.txRow} activeOpacity={0.75}>
          <View style={[s.txIcon,{borderColor:'rgba(27,184,255,0.4)',backgroundColor:'rgba(27,184,255,0.12)'}]}><Text style={[s.txIconText,{color:C.cyan}]}>◈</Text></View>
          <View style={s.txBody}>
            <View style={s.txTop}><Text style={s.txMerchant}>Farmacia Arrocha · Boquete</Text><Text style={s.txAmount}>−$31.80</Text></View>
            <View style={s.txMeta}><View style={s.txMetaL}><View style={[s.txCat,{backgroundColor:'rgba(27,184,255,0.15)',borderColor:'rgba(27,184,255,0.4)'}]}><Text style={[s.txCatText,{color:C.cyan}]}>PHARMACY</Text></View><Text style={s.txTime}>16:22</Text></View><Text style={s.txAware}>◆ +$1.25</Text></View>
            <Text style={[s.txDoctrine,{color:C.green}]}>Supplements verified. No contraindications.</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
export function TransactionFeedBubble(p:{awareDollarsTotal:number;monthLabel:string;onPress:()=>void}){
  return(<TouchableOpacity style={bb.root} onPress={p.onPress} activeOpacity={0.8}><View style={bb.left}><Text style={bb.glyph}>◆</Text><View><Text style={bb.label}>AWARE DOLLARS</Text><Text style={bb.meta}>{p.monthLabel} · TRANSACTION FEED</Text></View></View><View style={bb.right}><Text style={bb.amount}>${p.awareDollarsTotal.toFixed(2)}</Text><Text style={bb.arrow}>›</Text></View></TouchableOpacity>);
}
const bb=StyleSheet.create({root:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,backgroundColor:'rgba(212,168,71,0.06)',borderRadius:8,borderWidth:0.5,borderColor:'rgba(212,168,71,0.30)',marginVertical:4},left:{flexDirection:'row',alignItems:'center',gap:10},glyph:{color:C.gold,fontSize:14},label:{color:C.white,fontFamily:C.mono,fontSize:10,fontWeight:'700',letterSpacing:2},meta:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1,marginTop:2},right:{flexDirection:'row',alignItems:'center',gap:8},amount:{color:C.gold,fontFamily:C.mono,fontSize:18,fontWeight:'800'},arrow:{color:C.gold,fontSize:18}});
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.navy},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingTop:16,paddingBottom:12,borderBottomWidth:0.5,borderBottomColor:C.line,gap:12},
  backBtn:{padding:4},backArrow:{color:C.cyan,fontSize:20},
  brand:{flexDirection:'row',alignItems:'center',gap:10},brandLogo:{width:34,height:22,borderRadius:2,borderWidth:1.5,borderColor:C.cyan},
  brandWord:{color:C.white,fontWeight:'700',fontSize:13,letterSpacing:2},brandTag:{color:C.muted2,fontFamily:C.mono,fontSize:7,letterSpacing:2},
  eyebrow:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:C.line},
  eyebrowL:{fontFamily:C.mono,fontSize:9,letterSpacing:2,color:C.muted},eyebrowR:{fontFamily:C.mono,fontSize:9,letterSpacing:1,color:C.muted2},
  hero:{margin:16,padding:18,backgroundColor:C.navyCard,borderRadius:12,borderWidth:0.5,borderColor:C.goldBord},
  heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  heroLabel:{flexDirection:'row',alignItems:'center',gap:6},heroGlyph:{color:C.gold,fontSize:12},
  heroLbl:{color:C.gold,fontFamily:C.mono,fontSize:10,letterSpacing:2,fontWeight:'700'},heroMonth:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:1},
  numRow:{flexDirection:'row',alignItems:'flex-end',marginBottom:6},currency:{color:C.gold,fontSize:22,fontWeight:'300',lineHeight:52},num:{color:C.gold,fontSize:48,fontWeight:'700',lineHeight:52},dec:{color:C.gold,fontSize:22,fontWeight:'300',lineHeight:52},
  desc:{color:C.muted,fontSize:12,lineHeight:18,marginBottom:10},
  heroFooter:{flexDirection:'row',justifyContent:'space-between'},delta:{color:C.green,fontFamily:C.mono,fontSize:9,letterSpacing:1},redeem:{color:C.cyan,fontFamily:C.mono,fontSize:9,letterSpacing:1},
  filterStrip:{paddingHorizontal:16,paddingVertical:10,gap:8},
  fchip:{paddingHorizontal:12,paddingVertical:6,borderRadius:20,backgroundColor:C.navyCard,borderWidth:0.5,borderColor:C.lineHi},
  fchipActive:{backgroundColor:C.greenDim,borderColor:C.greenBord},
  fchipText:{color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1},fchipTextActive:{color:C.green},
  dayHead:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:8,borderTopWidth:0.5,borderTopColor:C.line},
  dayLabel:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:2},dayAware:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:1},dayGold:{color:C.gold},
  txRow:{flexDirection:'row',paddingHorizontal:18,paddingVertical:12,borderBottomWidth:0.5,borderBottomColor:C.line,gap:12},
  txIcon:{width:36,height:36,borderRadius:8,borderWidth:0.5,alignItems:'center',justifyContent:'center',flexShrink:0},txIconText:{fontSize:14},
  txBody:{flex:1},txTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:4},
  txMerchant:{color:C.white,fontSize:13,fontWeight:'500'},txAmount:{color:C.white,fontFamily:C.mono,fontSize:12},
  txMeta:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},txMetaL:{flexDirection:'row',alignItems:'center',gap:8},
  txCat:{paddingHorizontal:6,paddingVertical:2,borderRadius:3,borderWidth:0.5},txCatText:{fontFamily:C.mono,fontSize:7,letterSpacing:1.5},
  txTime:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1},
  txAware:{color:C.gold,fontFamily:C.mono,fontSize:9,letterSpacing:1},txAwareZero:{color:C.muted2,fontFamily:C.mono,fontSize:9},
  txDoctrine:{color:C.muted,fontSize:11,lineHeight:16,marginTop:4},
});
