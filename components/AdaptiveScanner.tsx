// ─── components/AdaptiveScanner.tsx ─── AA2 BioMesh v50 Mockup #12
// STATE 01: VISION READY · STATE 02: FALLBACK · STATE 03: VOICE ACTIVE
import React,{useEffect,useRef} from 'react';
import{View,Text,TouchableOpacity,StyleSheet,Animated,Easing,Platform}from 'react-native';
export type ScannerState='vision'|'failed'|'voice';
interface Props{
  state?:ScannerState;
  onCapture:()=>void;
  onVoiceStart:()=>void;
  onBarcodeOnly:()=>void;
  onTypeOpen:()=>void;
  onVoiceCancel?:()=>void;
  voiceTranscript?:string;
  tabName?:string;
}
const C={
  navy:'#0E1B33',navyDeep:'#08111F',card:'rgba(14,27,51,0.92)',
  line:'rgba(255,255,255,0.10)',lineHi:'rgba(255,255,255,0.18)',
  gold:'#D4A847',goldDim:'rgba(212,168,71,0.12)',goldBord:'rgba(212,168,71,0.45)',
  cyan:'#1BB8FF',cyanDim:'rgba(27,184,255,0.12)',cyanBord:'rgba(27,184,255,0.45)',
  amber:'#C49A2A',
  white:'#FFFFFF',muted:'rgba(255,255,255,0.55)',muted2:'rgba(255,255,255,0.32)',
  mono:Platform.OS==='ios'?'Courier New':'monospace',
};
export function AdaptiveScanner({state='vision',onCapture,onVoiceStart,onBarcodeOnly,onTypeOpen,onVoiceCancel,voiceTranscript,tabName='SCAN'}:Props){
  const scanLine=useRef(new Animated.Value(0)).current;
  const pulse=useRef(new Animated.Value(1)).current;
  const voicePulse=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    if(state!=='vision')return;
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(scanLine,{toValue:1,duration:2800,useNativeDriver:true,easing:Easing.linear}),
      Animated.timing(scanLine,{toValue:0,duration:2800,useNativeDriver:true,easing:Easing.linear}),
    ]));
    loop.start();return()=>loop.stop();
  },[state]);
  useEffect(()=>{
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:0.3,duration:900,useNativeDriver:true}),
      Animated.timing(pulse,{toValue:1,duration:900,useNativeDriver:true}),
    ]));
    loop.start();return()=>loop.stop();
  },[]);
  useEffect(()=>{
    if(state!=='voice')return;
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(voicePulse,{toValue:1.18,duration:600,useNativeDriver:true}),
      Animated.timing(voicePulse,{toValue:1,duration:600,useNativeDriver:true}),
    ]));
    loop.start();return()=>loop.stop();
  },[state]);
  const scanLineY=scanLine.interpolate({inputRange:[0,1],outputRange:[-120,120]});
  // ── STATE 03: VOICE ──────────────────────────────────────────────────────
  if(state==='voice'){
    return(
      <View style={s.root}>
        <View style={s.voiceWrap}>
          <Text style={s.eyebrowMono}>STATE 03 · VOICE ACTIVE (EYES UP)</Text>
          <View style={s.voiceHeader}>
            <Text style={s.brand}>◆ AA2 SCAN</Text>
            <View style={s.pill}><Text style={s.pillText}>{tabName}</Text></View>
          </View>
          <View style={s.voiceBody}>
            <Animated.View style={[s.micOuter,{transform:[{scale:voicePulse}]}]}>
              <View style={s.micInner}><Text style={s.micIcon}>🎙</Text></View>
            </Animated.View>
            <Text style={s.voiceLabel}>◆ LISTENING</Text>
            <Text style={s.voicePrompt}>"Speak the product name"</Text>
            <Text style={s.voiceHint}>Phone down. Eyes up.{'\n'}Concierge is listening.</Text>
            <View style={s.transcriptBox}>
              <Text style={s.transcriptText}>{voiceTranscript?`"${voiceTranscript}"`:'◦  ◦  ◦'}</Text>
            </View>
            <TouchableOpacity style={s.cancelBtn} onPress={onVoiceCancel} activeOpacity={0.7}>
              <Text style={s.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  // ── STATE 02: FALLBACK ───────────────────────────────────────────────────
  if(state==='failed'){
    return(
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.brand}>◆ AA2 SCAN</Text>
          <View style={s.pill}><Text style={s.pillText}>{tabName}</Text></View>
        </View>
        <View style={s.eyebrowRow}>
          <Text style={s.eyebrowText}>COULDN'T READ · ADAPT</Text>
        </View>
        <View style={s.vfDim}>
          <View style={[s.corner,s.cTL,{borderColor:C.muted2,opacity:0.3}]}/>
          <View style={[s.corner,s.cTR,{borderColor:C.muted2,opacity:0.3}]}/>
          <View style={[s.corner,s.cBL,{borderColor:C.muted2,opacity:0.3}]}/>
          <View style={[s.corner,s.cBR,{borderColor:C.muted2,opacity:0.3}]}/>
        </View>
        <View style={s.fallbackPanel}>
          <Text style={s.fbEyebrow}>◆ THE CONCIERGE</Text>
          <Text style={s.fbMsg}>"Couldn't read this clearly. Want to tell me what it is?"</Text>
          <View style={s.fbRow}>
            <TouchableOpacity style={[s.fbBtn,{borderColor:C.gold,backgroundColor:C.goldDim}]} onPress={onVoiceStart} activeOpacity={0.75}>
              <Text style={s.fbBtnIcon}>🎙</Text>
              <Text style={[s.fbBtnLabel,{color:C.gold}]}>SPEAK IT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.fbBtn,{borderColor:C.cyan,backgroundColor:C.cyanDim}]} onPress={onBarcodeOnly} activeOpacity={0.75}>
              <Text style={s.fbBtnIcon}>▭</Text>
              <Text style={[s.fbBtnLabel,{color:C.cyan}]}>BARCODE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.fbBtn,{borderColor:C.line}]} onPress={onTypeOpen} activeOpacity={0.75}>
              <Text style={s.fbBtnIcon}>⌨</Text>
              <Text style={[s.fbBtnLabel,{color:C.muted}]}>TYPE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  // ── STATE 01: VISION READY ───────────────────────────────────────────────
  return(
    <View style={s.root} pointerEvents="box-none">
      <View style={s.header}>
        <Text style={s.brand}>◆ AA2 SCAN</Text>
        <View style={s.pill}><Text style={s.pillText}>{tabName}</Text></View>
      </View>
      <View style={s.eyebrowRow}>
        <Text style={s.eyebrowText}>VISION ACTIVE · POINT AT PRODUCT</Text>
      </View>
      <View style={s.vf} pointerEvents="none">
        <View style={s.readingPill}>
          <Animated.View style={[s.readingDot,{opacity:pulse}]}/>
          <Text style={s.readingText}>READING</Text>
        </View>
        <View style={[s.corner,s.cTL]}/>
        <View style={[s.corner,s.cTR]}/>
        <View style={[s.corner,s.cBL]}/>
        <View style={[s.corner,s.cBR]}/>
        <Animated.View style={[s.scanLine,{transform:[{translateY:scanLineY}]}]}/>
      </View>
      <TouchableOpacity style={s.captureZone} onPress={onCapture} activeOpacity={1}/>
      <View style={s.dock}>
        <ModeBtn icon="👁" label="VISION" priority="PRIMARY" color={C.cyan} bg={C.cyanDim} bord={C.cyanBord} onPress={onCapture} active/>
        <ModeBtn icon="🎙" label="VOICE" priority="2ND" color={C.muted} bg="transparent" bord={C.line} onPress={onVoiceStart}/>
        <ModeBtn icon="▭" label="BARCODE" priority="3RD" color={C.muted} bg="transparent" bord={C.line} onPress={onBarcodeOnly}/>
        <ModeBtn icon="⌨" label="TYPE" priority="4TH" color={C.muted} bg="transparent" bord={C.line} onPress={onTypeOpen}/>
      </View>
      <View style={s.tip} pointerEvents="none">
        <Text style={s.tipAccent}>EYES UP, PHONE DOWN.</Text>
        <Text style={s.tipSub}>Point and Claude sees.</Text>
      </View>
    </View>
  );
}
function ModeBtn({icon,label,priority,color,bg,bord,onPress,active}:{icon:string;label:string;priority:string;color:string;bg:string;bord:string;onPress:()=>void;active?:boolean}){
  return(
    <TouchableOpacity style={[mb.btn,{borderColor:bord,backgroundColor:bg}]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[mb.icon,{color}]}>{icon}</Text>
      <Text style={[mb.label,{color}]}>{label}</Text>
      <Text style={mb.priority}>{priority}</Text>
    </TouchableOpacity>
  );
}
const mb=StyleSheet.create({
  btn:{flex:1,borderWidth:1,borderRadius:6,paddingVertical:10,paddingHorizontal:4,alignItems:'center',gap:3},
  icon:{fontSize:16},
  label:{fontFamily:C.mono,fontSize:7,letterSpacing:1.5},
  priority:{fontFamily:C.mono,fontSize:6,letterSpacing:1,color:C.muted2,opacity:0.7},
});
const s=StyleSheet.create({
  root:{position:'absolute',top:0,left:0,right:0,bottom:0,flexDirection:'column'},
  header:{paddingHorizontal:18,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:C.navyDeep,borderBottomWidth:1,borderBottomColor:C.line},
  brand:{color:C.gold,fontFamily:C.mono,fontSize:13,letterSpacing:3,fontWeight:'700'},
  pill:{borderWidth:1,borderColor:C.cyan,paddingVertical:4,paddingHorizontal:10,borderRadius:3},
  pillText:{fontFamily:C.mono,fontSize:8,letterSpacing:1.5,color:C.cyan},
  eyebrowRow:{paddingVertical:9,paddingHorizontal:18,borderBottomWidth:1,borderBottomColor:C.line,backgroundColor:C.navy},
  eyebrowText:{fontFamily:C.mono,fontSize:9,letterSpacing:2.5,color:C.muted2},
  eyebrowMono:{fontFamily:C.mono,fontSize:8,letterSpacing:1.5,color:C.muted2,textAlign:'center',paddingTop:10,paddingBottom:4},
  vf:{flex:1,position:'relative'},
  vfDim:{flex:1,position:'relative'},
  readingPill:{position:'absolute',top:20,alignSelf:'center',flexDirection:'row',alignItems:'center',backgroundColor:'rgba(14,27,51,0.88)',borderWidth:1,borderColor:C.cyan,paddingVertical:7,paddingHorizontal:16,borderRadius:20,zIndex:5,gap:8},
  readingDot:{width:7,height:7,borderRadius:3.5,backgroundColor:C.cyan},
  readingText:{fontFamily:C.mono,fontSize:10,letterSpacing:2,color:C.cyan},
  corner:{position:'absolute',width:28,height:28,borderColor:C.cyan},
  cTL:{top:55,left:24,borderTopWidth:2,borderLeftWidth:2},
  cTR:{top:55,right:24,borderTopWidth:2,borderRightWidth:2},
  cBL:{bottom:20,left:24,borderBottomWidth:2,borderLeftWidth:2},
  cBR:{bottom:20,right:24,borderBottomWidth:2,borderRightWidth:2},
  scanLine:{position:'absolute',left:24,right:24,top:'50%',height:2,backgroundColor:C.cyan,shadowColor:C.cyan,shadowOpacity:0.9,shadowRadius:10,opacity:0.75},
  captureZone:{position:'absolute',top:80,left:0,right:0,bottom:100,zIndex:10},
  dock:{backgroundColor:C.navyDeep,borderTopWidth:1,borderTopColor:C.line,paddingHorizontal:16,paddingTop:12,paddingBottom:8,flexDirection:'row',gap:8},
  tip:{backgroundColor:C.navyDeep,paddingBottom:18,paddingTop:2,alignItems:'center'},
  tipAccent:{fontFamily:C.mono,fontSize:10,letterSpacing:2,color:C.gold},
  tipSub:{fontSize:12,color:C.muted,fontStyle:'italic',marginTop:2},
  // FALLBACK
  fallbackPanel:{backgroundColor:C.card,borderTopWidth:1,borderTopColor:C.amber,padding:20,marginTop:'auto'},
  fbEyebrow:{fontFamily:C.mono,fontSize:9,letterSpacing:2,color:C.amber,marginBottom:6},
  fbMsg:{color:C.white,fontSize:15,fontStyle:'italic',lineHeight:22,marginBottom:16},
  fbRow:{flexDirection:'row',gap:8},
  fbBtn:{flex:1,borderWidth:1,borderRadius:6,paddingVertical:12,alignItems:'center',gap:5},
  fbBtnIcon:{fontSize:14,color:C.white},
  fbBtnLabel:{fontFamily:C.mono,fontSize:8,letterSpacing:1.5},
  // VOICE
  voiceWrap:{flex:1,backgroundColor:'rgba(8,17,31,0.97)'},
  voiceHeader:{paddingHorizontal:18,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:C.line},
  voiceBody:{flex:1,alignItems:'center',justifyContent:'center',padding:36},
  micOuter:{width:110,height:110,borderRadius:55,backgroundColor:C.goldDim,borderWidth:2,borderColor:C.goldBord,alignItems:'center',justifyContent:'center',marginBottom:24},
  micInner:{width:84,height:84,borderRadius:42,backgroundColor:'rgba(212,168,71,0.08)',alignItems:'center',justifyContent:'center'},
  micIcon:{fontSize:36},
  voiceLabel:{fontFamily:C.mono,fontSize:10,letterSpacing:3,color:C.gold,marginBottom:10},
  voicePrompt:{color:C.white,fontSize:22,fontStyle:'italic',textAlign:'center',marginBottom:6},
  voiceHint:{color:C.muted,fontSize:12,textAlign:'center',lineHeight:18,marginBottom:28},
  transcriptBox:{width:'100%',borderWidth:1,borderColor:C.goldBord,backgroundColor:'rgba(212,168,71,0.07)',borderRadius:8,padding:14,minHeight:52,alignItems:'center',justifyContent:'center',marginBottom:16},
  transcriptText:{color:C.gold,fontSize:14,textAlign:'center'},
  cancelBtn:{borderWidth:1,borderColor:C.line,borderRadius:4,paddingVertical:10,paddingHorizontal:28},
  cancelText:{fontFamily:C.mono,fontSize:9,letterSpacing:2,color:C.muted},
});
export default AdaptiveScanner;
