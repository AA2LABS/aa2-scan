// ─── app/dossier-builder.tsx ─── AA2 BioMesh v50 Mockup #08
import React,{useState} from 'react';
import{View,Text,ScrollView,TouchableOpacity,TextInput,StyleSheet,Platform,StatusBar}from 'react-native';
import{useRouter}from 'expo-router';
const C={
  navy:'#0E1B33',navyCard:'rgba(255,255,255,0.05)',navyElev:'rgba(255,255,255,0.04)',
  line:'rgba(255,255,255,0.08)',lineHi:'rgba(255,255,255,0.16)',
  gold:'#D4A847',green:'#34D399',greenBord:'rgba(52,211,153,0.35)',cyan:'#1BB8FF',
  cyanDim:'rgba(27,184,255,0.10)',amber:'#C49A2A',
  white:'#FFFFFF',muted:'rgba(255,255,255,0.55)',muted2:'rgba(255,255,255,0.32)',
  mono:Platform.OS==='ios'?'Courier New':'monospace',
};
const ACTS=[{id:'hiking',label:'HIKING',icon:'⛰'},{id:'cycling',label:'CYCLING',icon:'🚴'},{id:'urban',label:'URBAN',icon:'🏛'},{id:'hunting',label:'HUNTING',icon:'🎯'},{id:'swimming',label:'SWIMMING',icon:'🏊'},{id:'diving',label:'DIVING',icon:'🤿'},{id:'yoga',label:'YOGA',icon:'🧘'},{id:'k9',label:'K9 WORK',icon:'🐕'},{id:'climbing',label:'CLIMBING',icon:'🧗'}];
const QS=[{id:'destination',qno:'Q1',title:'WHERE ARE\nYOU GOING?',sub:'City, country, or region.'},{id:'dates',qno:'Q2',title:'WHEN DO\nYOU DEPART?',sub:'Departure and return dates.'},{id:'activities',qno:'Q3',title:'WHAT WILL YOU\nBE DOING?',sub:'Activities drive module compilation. Pick truth, not aspiration.'},{id:'members',qno:'Q4',title:'WHO\'S\nTRAVELING?',sub:'Number of people or animals in your party.'},{id:'health',qno:'Q5',title:'ANY HEALTH\nPRIORITIES?',sub:'Allergies, medications, dietary restrictions.'},{id:'special',qno:'Q6',title:'ANYTHING\nELSE?',sub:'Off-grid plans, extreme altitudes, remote areas, tactical needs.'}];
export default function DossierBuilder(){
  const router=useRouter();
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState({destination:'',departing:'',returning:'',activities:[] as string[],memberCount:1,specialNeeds:''});
  const[inputVal,setInputVal]=useState('');
  const q=QS[step];
  function handleNext(){
    const u={...answers};
    if(q.id==='destination')u.destination=inputVal;
    if(q.id==='dates')u.departing=inputVal;
    if(q.id==='health'||q.id==='special')u.specialNeeds=(u.specialNeeds+' '+inputVal).trim();
    setAnswers(u);setInputVal('');
    if(step<QS.length-1){setStep(step+1);}
    else{router.push({pathname:'/travel-dossier',params:{answers:JSON.stringify(u)}});}
  }
  function toggleAct(id:string){const c=answers.activities;setAnswers({...answers,activities:c.includes(id)?c.filter(a=>a!==id):[...c,id]});}
  return(
    <View style={s.root}>
      <StatusBar barStyle="light-content"/>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>step>0?setStep(step-1):router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <View style={s.brand}><View style={s.brandLogo}/><View><Text style={s.brandWord}>AA2 PANAMA</Text><Text style={s.brandTag}>AWARE · ADAPT · ADVANCE</Text></View></View>
      </View>
      <View style={s.eyebrow}><Text style={s.eyebrowL}>TRAVEL · DOSSIER BUILDER</Text><Text style={s.eyebrowR}>{q.qno} OF 6</Text></View>
      <View style={s.progressStrip}>{QS.map((_,i)=><View key={i} style={[s.progSeg,i<step?s.progDone:i===step?s.progActive:{}]}/>)}</View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.qno}>{q.qno} · {q.id.toUpperCase()}</Text>
          <Text style={s.heroTitle}>{q.title.includes('\n')?<>{q.title.split('\n')[0]}{'\n'}<Text style={s.accent}>{q.title.split('\n')[1]}</Text></>:q.title}</Text>
          <Text style={s.doctrine}>{q.sub}</Text>
        </View>
        {q.id==='activities'?(
          <>
            <View style={s.selectedRow}><Text style={s.selectedLbl}>SELECT ALL THAT APPLY</Text><Text style={s.selectedVal}><Text style={s.selectedNum}>{answers.activities.length}</Text> SELECTED</Text></View>
            <View style={s.actGrid}>{ACTS.map(act=>{const sel=answers.activities.includes(act.id);return(<TouchableOpacity key={act.id} style={[s.act,sel&&s.actSel]} onPress={()=>toggleAct(act.id)} activeOpacity={0.8}><Text style={s.actIcon}>{act.icon}</Text><Text style={[s.actLabel,sel&&s.actLabelSel]}>{act.label}</Text>{sel&&<View style={s.actCheck}><Text style={s.actCheckMark}>✓</Text></View>}</TouchableOpacity>);})}</View>
          </>
        ):q.id==='members'?(
          <View style={s.memberPicker}>
            <TouchableOpacity style={s.memberBtn} onPress={()=>answers.memberCount>1&&setAnswers({...answers,memberCount:answers.memberCount-1})}><Text style={s.memberBtnText}>−</Text></TouchableOpacity>
            <Text style={s.memberCount}>{answers.memberCount}</Text>
            <TouchableOpacity style={s.memberBtn} onPress={()=>setAnswers({...answers,memberCount:answers.memberCount+1})}><Text style={s.memberBtnText}>+</Text></TouchableOpacity>
          </View>
        ):(
          <TextInput style={[s.input,(q.id==='health'||q.id==='special')&&s.inputMulti]} value={inputVal} onChangeText={setInputVal} placeholder={q.id==='destination'?'e.g. Boquete, Panama':q.id==='dates'?'e.g. 15 JUN – 28 JUN':'Type your answer...'} placeholderTextColor={C.muted2} multiline={q.id==='health'||q.id==='special'} numberOfLines={q.id==='health'||q.id==='special'?4:1}/>
        )}
        {step>0&&(<View style={s.summaryCard}><Text style={s.summaryLabel}>◆ DOSSIER SO FAR</Text>{answers.destination?<View style={s.sfRow}><Text style={s.sfL}>DESTINATION</Text><Text style={s.sfV}>{answers.destination}</Text></View>:null}{answers.departing?<View style={s.sfRow}><Text style={s.sfL}>DATES</Text><Text style={s.sfV}>{answers.departing}</Text></View>:null}{answers.activities.length>0?<View style={s.sfRow}><Text style={s.sfL}>ACTIVITIES</Text><Text style={s.sfV}>{answers.activities.join(', ')}</Text></View>:null}{answers.memberCount>1?<View style={s.sfRow}><Text style={s.sfL}>PARTY</Text><Text style={s.sfV}>{answers.memberCount} MEMBERS</Text></View>:null}</View>)}
      </ScrollView>
      <TouchableOpacity style={s.action} onPress={handleNext} activeOpacity={0.9}><Text style={s.actionText}>{step<QS.length-1?'Continue':'Compile Dossier'}</Text><Text style={s.actionArrow}>→</Text></TouchableOpacity>
      <TouchableOpacity style={s.backRow} onPress={()=>step>0&&setStep(step-1)}><Text style={s.backRowText}>{step>0?'← GO BACK':''}</Text></TouchableOpacity>
    </View>
  );
}
export function DossierBuilderBubble(p:{destination?:string;departing?:string;onPress:()=>void}){
  return(<TouchableOpacity style={db.root} onPress={p.onPress} activeOpacity={0.8}><View style={db.left}><Text style={db.glyph}>◆</Text><View><Text style={db.label}>TRAVEL DOSSIER BUILDER</Text><Text style={db.meta}>{p.destination?`${p.destination}${p.departing?` · ${p.departing}`:''}` :'BUILD A TRAVEL DOSSIER'}</Text></View></View><Text style={db.arrow}>›</Text></TouchableOpacity>);
}
const db=StyleSheet.create({root:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,backgroundColor:C.cyanDim,borderRadius:8,borderWidth:0.5,borderColor:'rgba(27,184,255,0.30)',marginVertical:4},left:{flexDirection:'row',alignItems:'center',gap:10},glyph:{color:C.cyan,fontSize:14},label:{color:C.white,fontFamily:C.mono,fontSize:10,fontWeight:'700',letterSpacing:2},meta:{color:C.muted2,fontFamily:C.mono,fontSize:8,letterSpacing:1,marginTop:2},arrow:{color:C.cyan,fontSize:18}});
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:C.navy},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,paddingTop:16,paddingBottom:12,borderBottomWidth:0.5,borderBottomColor:C.line,gap:12},
  backBtn:{padding:4},backArrow:{color:C.cyan,fontSize:20},
  brand:{flexDirection:'row',alignItems:'center',gap:10},brandLogo:{width:34,height:22,borderRadius:2,borderWidth:1.5,borderColor:C.cyan},
  brandWord:{color:C.white,fontWeight:'700',fontSize:13,letterSpacing:2},brandTag:{color:C.muted2,fontFamily:C.mono,fontSize:7,letterSpacing:2},
  eyebrow:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:8,borderBottomWidth:0.5,borderBottomColor:C.line},
  eyebrowL:{fontFamily:C.mono,fontSize:9,letterSpacing:2,color:C.muted},eyebrowR:{fontFamily:C.mono,fontSize:9,letterSpacing:1,color:C.muted2},
  progressStrip:{flexDirection:'row',paddingHorizontal:18,paddingVertical:10,gap:4},
  progSeg:{flex:1,height:3,backgroundColor:C.navyElev,borderRadius:1.5},progDone:{backgroundColor:C.cyan},progActive:{backgroundColor:C.white},
  scroll:{paddingHorizontal:18,paddingBottom:16},
  hero:{paddingTop:20,paddingBottom:16},
  qno:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:2,marginBottom:8},
  heroTitle:{color:C.white,fontSize:32,fontWeight:'800',lineHeight:38,letterSpacing:1,marginBottom:10},
  accent:{color:C.cyan},doctrine:{color:C.muted,fontSize:13,lineHeight:20},
  selectedRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:10},
  selectedLbl:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:2},
  selectedVal:{color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:1},selectedNum:{color:C.cyan,fontWeight:'700'},
  actGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16},
  act:{width:'30%',padding:12,backgroundColor:C.navyCard,borderRadius:8,borderWidth:0.5,borderColor:C.lineHi,alignItems:'center',gap:4,position:'relative'},
  actSel:{backgroundColor:C.cyanDim,borderColor:C.cyan},actIcon:{fontSize:20},
  actLabel:{color:C.muted,fontFamily:C.mono,fontSize:8,letterSpacing:1.5},actLabelSel:{color:C.cyan},
  actCheck:{position:'absolute',top:6,right:6,width:16,height:16,borderRadius:8,backgroundColor:C.cyan,alignItems:'center',justifyContent:'center'},
  actCheckMark:{color:'#001520',fontSize:9,fontWeight:'900'},
  memberPicker:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:24,paddingVertical:24},
  memberBtn:{width:48,height:48,borderRadius:24,backgroundColor:C.navyCard,borderWidth:0.5,borderColor:C.lineHi,alignItems:'center',justifyContent:'center'},
  memberBtnText:{color:C.white,fontSize:24},memberCount:{color:C.white,fontSize:48,fontWeight:'700',fontFamily:C.mono,minWidth:60,textAlign:'center'},
  input:{backgroundColor:C.navyCard,borderWidth:0.5,borderColor:C.lineHi,borderRadius:8,padding:14,color:C.white,fontSize:15,marginBottom:16},
  inputMulti:{minHeight:100,textAlignVertical:'top'},
  summaryCard:{backgroundColor:C.navyCard,borderRadius:8,padding:14,borderWidth:0.5,borderColor:C.lineHi,marginTop:8},
  summaryLabel:{color:C.cyan,fontFamily:C.mono,fontSize:9,letterSpacing:2,marginBottom:10},
  sfRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:0.5,borderBottomColor:C.line},
  sfL:{color:C.muted2,fontFamily:C.mono,fontSize:9,letterSpacing:1.5},sfV:{color:C.white,fontSize:12,fontWeight:'500',maxWidth:'60%',textAlign:'right'},
  action:{margin:18,marginBottom:0,padding:14,backgroundColor:C.cyan,borderRadius:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  actionText:{color:'#001520',fontSize:14,fontWeight:'700'},actionArrow:{color:'#001520',fontSize:18,fontWeight:'700'},
  backRow:{alignItems:'center',paddingVertical:14},backRowText:{color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:2},
});
