/**
 * AA2 BioMesh — stories.tsx
 * 7-Door Home Screen
 * Canon v44 · April 13, 2026 · SEALED
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ImageBackground, useWindowDimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect, Line, Circle, Path, G } from 'react-native-svg';

const CARD_HEIGHT = 230;

const ScannerGraphic = ({ cardW }: { cardW: number }) => (
  <Svg width={cardW} height={CARD_HEIGHT} viewBox={`0 0 ${cardW} ${CARD_HEIGHT}`}>
    <Rect width={cardW} height={CARD_HEIGHT} fill="#0A0F1A" rx={12} />
    {Array.from({ length: 30 }).map((_, i) => {
      const x = 24 + i * 11 + (i % 3 === 0 ? 3 : 0);
      const h = 90 + (i % 5) * 12;
      const w = i % 4 === 0 ? 6 : 3;
      const opacity = 0.12 + (i % 3) * 0.07;
      return <Rect key={i} x={x} y={(CARD_HEIGHT - h) / 2 - 8} width={w} height={h} fill={`rgba(255,255,255,${opacity})`} />;
    })}
    <Rect x={20} y={CARD_HEIGHT / 2 - 1} width={cardW - 40} height={2} fill="#1BB8FF" opacity={0.95} />
    <Rect x={20} y={CARD_HEIGHT / 2 - 3} width={cardW - 40} height={6} fill="#1BB8FF" opacity={0.12} />
    <Path d={`M ${cardW/2-54} ${CARD_HEIGHT/2-48} L ${cardW/2-54} ${CARD_HEIGHT/2-28} M ${cardW/2-54} ${CARD_HEIGHT/2-48} L ${cardW/2-34} ${CARD_HEIGHT/2-48}`} stroke="#1BB8FF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <Path d={`M ${cardW/2+54} ${CARD_HEIGHT/2-48} L ${cardW/2+54} ${CARD_HEIGHT/2-28} M ${cardW/2+54} ${CARD_HEIGHT/2-48} L ${cardW/2+34} ${CARD_HEIGHT/2-48}`} stroke="#1BB8FF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <Path d={`M ${cardW/2-54} ${CARD_HEIGHT/2+48} L ${cardW/2-54} ${CARD_HEIGHT/2+28} M ${cardW/2-54} ${CARD_HEIGHT/2+48} L ${cardW/2-34} ${CARD_HEIGHT/2+48}`} stroke="#1BB8FF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <Path d={`M ${cardW/2+54} ${CARD_HEIGHT/2+48} L ${cardW/2+54} ${CARD_HEIGHT/2+28} M ${cardW/2+54} ${CARD_HEIGHT/2+48} L ${cardW/2+34} ${CARD_HEIGHT/2+48}`} stroke="#1BB8FF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <Rect x={cardW - 118} y={14} width={100} height={30} rx={6} fill="#1D9E75" opacity={0.95} />
  </Svg>
);

const ConciergeGraphic = ({ cardW }: { cardW: number }) => {
  const wave = (yBase: number, xOff: number): string => {
    const s = xOff;
    return [`M ${s} ${yBase}`,`L ${s+28} ${yBase}`,`L ${s+38} ${yBase-12}`,`L ${s+44} ${yBase+28}`,`L ${s+54} ${yBase-38}`,`L ${s+64} ${yBase+16}`,`L ${s+74} ${yBase}`,`L ${s+128} ${yBase}`,`L ${s+138} ${yBase-10}`,`L ${s+144} ${yBase+24}`,`L ${s+154} ${yBase-32}`,`L ${s+164} ${yBase+14}`,`L ${s+174} ${yBase}`,`L ${cardW} ${yBase}`].join(' ');
  };
  return (
    <Svg width={cardW} height={CARD_HEIGHT} viewBox={`0 0 ${cardW} ${CARD_HEIGHT}`}>
      <Rect width={cardW} height={CARD_HEIGHT} fill="#0A0F1A" rx={12} />
      <Path d={wave(68, 0)} stroke="#E05252" strokeWidth={1.5} fill="none" opacity={0.65} />
      <Path d={wave(115, 18)} stroke="#1BB8FF" strokeWidth={1.5} fill="none" opacity={0.65} />
      <Path d={wave(162, 8)} stroke="#1D9E75" strokeWidth={1.5} fill="none" opacity={0.65} />
      <Rect x={cardW/2-90} y={CARD_HEIGHT/2-34} width={180} height={68} rx={10} fill="#111828" stroke="#1BB8FF" strokeWidth={1} opacity={0.92} />
      <Circle cx={cardW/2-72} cy={CARD_HEIGHT/2-12} r={4} fill="#1BB8FF" opacity={0.9} />
      <Rect x={cardW/2-60} y={CARD_HEIGHT/2-15} width={60} height={7} rx={3} fill="#1BB8FF" opacity={0.3} />
      <Rect x={cardW/2-60} y={CARD_HEIGHT/2+2} width={40} height={7} rx={3} fill="#1BB8FF" opacity={0.18} />
      <Circle cx={cardW/2+72} cy={CARD_HEIGHT/2} r={5} fill="#1D9E75" opacity={0.9} />
    </Svg>
  );
};

const EqualizerGraphic = ({ cardW }: { cardW: number }) => {
  const levels = [0.42, 0.71, 0.58, 0.88, 0.66, 0.92, 0.51, 0.77, 0.44];
  const colors = ['#E05252','#E8873A','#C49A2A','#1D9E75','#1BB8FF','#1D9E75','#C49A2A','#E8873A','#E05252'];
  const bandW = 22; const gap = 14;
  const totalW = levels.length * (bandW + gap) - gap;
  const startX = (cardW - totalW) / 2;
  const maxH = 72; const baseY = CARD_HEIGHT / 2 + 8;
  return (
    <Svg width={cardW} height={CARD_HEIGHT} viewBox={`0 0 ${cardW} ${CARD_HEIGHT}`}>
      <Rect width={cardW} height={CARD_HEIGHT} fill="#0A0F1A" rx={12} />
      <Line x1={16} y1={baseY} x2={cardW-16} y2={baseY} stroke="#FFFFFF" strokeWidth={1} opacity={0.18} strokeDasharray="5,5" />
      {levels.map((level, i) => {
        const x = startX + i * (bandW + gap);
        const barH = level * maxH;
        return (
          <G key={i}>
            <Rect x={x} y={baseY-barH} width={bandW} height={barH} rx={5} fill={colors[i]} opacity={0.88} />
            <Rect x={x} y={baseY} width={bandW} height={barH*0.28} rx={5} fill={colors[i]} opacity={0.22} />
            <Rect x={x} y={baseY-barH-4} width={bandW} height={4} rx={2} fill={colors[i]} opacity={0.5} />
          </G>
        );
      })}
    </Svg>
  );
};

const ChauffeurGraphic = ({ cardW }: { cardW: number }) => {
  const hLines = Array.from({ length: 9 }, (_, i) => i * 28 + 12);
  const vLines = Array.from({ length: 13 }, (_, i) => i * (cardW / 12));
  return (
    <Svg width={cardW} height={CARD_HEIGHT} viewBox={`0 0 ${cardW} ${CARD_HEIGHT}`}>
      <Rect width={cardW} height={CARD_HEIGHT} fill="#0A0F1A" rx={12} />
      {hLines.map((y, i) => <Line key={`h${i}`} x1={0} y1={y} x2={cardW} y2={y} stroke="#FFFFFF" strokeWidth={0.5} opacity={0.07} />)}
      {vLines.map((x, i) => <Line key={`v${i}`} x1={x} y1={0} x2={x} y2={CARD_HEIGHT} stroke="#FFFFFF" strokeWidth={0.5} opacity={0.07} />)}
      <Path d={`M 52 ${CARD_HEIGHT-36} L 110 ${CARD_HEIGHT-80} L 190 ${CARD_HEIGHT-58} L 258 96 L ${cardW-52} 52`} stroke="#1BB8FF" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={52} cy={CARD_HEIGHT-36} r={7} fill="#1D9E75" />
      <Circle cx={52} cy={CARD_HEIGHT-36} r={12} fill="#1D9E75" opacity={0.2} />
      <Circle cx={cardW-52} cy={52} r={7} fill="#1BB8FF" />
      <Circle cx={258} cy={96} r={18} fill="#E05252" opacity={0.15} />
      <Circle cx={258} cy={96} r={10} fill="#E05252" opacity={0.3} />
      <Circle cx={258} cy={96} r={5} fill="#E05252" opacity={0.95} />
    </Svg>
  );
};

const ChefGraphic = ({ cardW }: { cardW: number }) => {
  const steps = ['SCAN','RECIPE','SHOP','SAVED'];
  const colors = ['#1BB8FF','#1D9E75','#C49A2A','#E8873A'];
  const totalW = cardW - 80; const space = totalW / 3;
  const startX = 40; const circleY = CARD_HEIGHT / 2 - 22; const r = 22;
  return (
    <Svg width={cardW} height={CARD_HEIGHT} viewBox={`0 0 ${cardW} ${CARD_HEIGHT}`}>
      <Rect width={cardW} height={CARD_HEIGHT} fill="#0A0F1A" rx={12} />
      <Rect x={cardW/2-78} y={circleY+r+18} width={156} height={56} rx={8} fill="#111828" stroke="#C49A2A" strokeWidth={1} opacity={0.75} />
      {[0,1,2].map(i => <Rect key={i} x={cardW/2-58} y={circleY+r+34+i*14} width={i===0?80:i===1?60:40} height={6} rx={3} fill="#C49A2A" opacity={0.22} />)}
      {steps.slice(0,3).map((_,i) => <Line key={i} x1={startX+i*space+r} y1={circleY} x2={startX+(i+1)*space-r} y2={circleY} stroke="#FFFFFF" strokeWidth={1} opacity={0.15} />)}
      {steps.map((_,i) => (
        <G key={i}>
          <Circle cx={startX+i*space} cy={circleY} r={r+4} fill={colors[i]} opacity={0.12} />
          <Circle cx={startX+i*space} cy={circleY} r={r} fill={colors[i]} opacity={0.92} />
        </G>
      ))}
    </Svg>
  );
};

interface DoorConfig {
  id: string; number: string; title: string; subtitle: string;
  route: string; type: 'photo' | 'graphic'; image?: any;
  accentColor: string; GraphicComponent?: React.ComponentType<{ cardW: number }>;
}

const DOORS: DoorConfig[] = [
  { id:'aa2', number:'01', title:'THE AA2 STORY', subtitle:'I AM THE RECEIPT', route:'/story-aa2', type:'photo', image:require('../assets/images/17789.jpg'), accentColor:'#1BB8FF' },
  { id:'scanner', number:'02', title:'THE SCANNER', subtitle:'S.C.A.N. · Safety Clarifier Adaptive Nerve', route:'/story-scanner', type:'graphic', accentColor:'#1BB8FF', GraphicComponent:ScannerGraphic },
  { id:'concierge', number:'03', title:'THE CONCIERGE', subtitle:'Clarifier Baseline · 30/60/90 Day Arc', route:'/story-concierge', type:'graphic', accentColor:'#E05252', GraphicComponent:ConciergeGraphic },
  { id:'equalizer', number:'04', title:'THE EQUALIZER', subtitle:'Produce · Meat · Species · Forager · Hunter', route:'/story-equalizer', type:'graphic', accentColor:'#1D9E75', GraphicComponent:EqualizerGraphic },
  { id:'chauffeur', number:'05', title:'THE CHAUFFEUR', subtitle:"Kelly's Story · Costa Rica · The Membrane at Full Power", route:'/story-chauffeur', type:'graphic', accentColor:'#1BB8FF', GraphicComponent:ChauffeurGraphic },
  { id:'chef', number:'06', title:'THE CHEF', subtitle:'Scan → Recipe → Shop → International Cookbook', route:'/story-chef', type:'graphic', accentColor:'#C49A2A', GraphicComponent:ChefGraphic },
  { id:'cookbook', number:'07', title:'THE COOKBOOK', subtitle:'AA2 International Live Cooking Recipes', route:'/story-cookbook', type:'photo', image:require('../assets/images/17786.jpg'), accentColor:'#C49A2A' },
];

interface PhotoCardProps { door: DoorConfig; cardW: number; onPress: () => void; }
const PhotoCard = ({ door, cardW, onPress }: PhotoCardProps) => (
  <TouchableOpacity style={[styles.cardWrapper, { borderColor: door.accentColor + '30' }]} onPress={onPress} activeOpacity={0.82}>
    <ImageBackground source={door.image} style={[styles.photoCard, { width: cardW }]} imageStyle={styles.photoImage}>
      <View style={[styles.photoOverlay, { borderColor: door.accentColor + '50' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.doorNumber, { color: door.accentColor }]}>{door.number}</Text>
          <View style={[styles.headerLine, { backgroundColor: door.accentColor }]} />
        </View>
        <View>
          <Text style={styles.doorTitle}>{door.title}</Text>
          <Text style={[styles.doorSubtitle, { color: door.accentColor }]}>{door.subtitle}</Text>
        </View>
        <View style={[styles.enterBadge, { borderColor: door.accentColor }]}>
          <Text style={[styles.enterText, { color: door.accentColor }]}>ENTER →</Text>
        </View>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

interface GraphicCardProps { door: DoorConfig; cardW: number; onPress: () => void; }
const GraphicCard = ({ door, cardW, onPress }: GraphicCardProps) => {
  const { GraphicComponent } = door;
  return (
    <TouchableOpacity style={[styles.cardWrapper, styles.graphicCardWrapper, { borderColor: door.accentColor + '28' }]} onPress={onPress} activeOpacity={0.82}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {GraphicComponent ? <GraphicComponent cardW={cardW} /> : null}
      </View>
      <View style={[styles.graphicOverlay, { width: cardW }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.doorNumber, { color: door.accentColor }]}>{door.number}</Text>
          <View style={[styles.headerLine, { backgroundColor: door.accentColor }]} />
        </View>
        <View>
          <Text style={styles.doorTitle}>{door.title}</Text>
          <Text style={[styles.doorSubtitle, { color: door.accentColor }]}>{door.subtitle}</Text>
        </View>
        <View style={[styles.enterBadge, { borderColor: door.accentColor }]}>
          <Text style={[styles.enterText, { color: door.accentColor }]}>ENTER →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function StoriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = width - 32;
  const handleDoor = (route: string) => { router.push(route as never); };
  const handleBuildMembrane = () => { router.push('/onboarding' as never); };
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080808" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>AA2 BIOMESH</Text>
          <Text style={styles.pageTitle}>Seven Doors.</Text>
          <Text style={styles.pageTitle}>One Membrane.</Text>
          <Text style={styles.pageSub}>Choose where you want to begin.</Text>
        </View>
        {DOORS.map((door) => {
          const onPress = () => handleDoor(door.route);
          if (door.type === 'photo') return <PhotoCard key={door.id} door={door} cardW={cardW} onPress={onPress} />;
          return <GraphicCard key={door.id} door={door} cardW={cardW} onPress={onPress} />;
        })}
        <View style={styles.ctaSection}>
          <View style={styles.ctaDivider} />
          <Text style={styles.ctaCaption}>Ready to go live?</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleBuildMembrane} activeOpacity={0.85}>
            <Text style={styles.ctaButtonText}>BUILD MY MEMBRANE</Text>
          </TouchableOpacity>
          <Text style={styles.receiptStamp}>I AM THE RECEIPT</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#080808' },
  scroll: { flex:1 },
  scrollContent: { paddingHorizontal:16, paddingTop:64, paddingBottom:72, gap:16 },
  pageHeader: { marginBottom:16 },
  pageLabel: { fontFamily:'DMMono_400Regular', fontSize:11, color:'#444', letterSpacing:3.5, marginBottom:10 },
  pageTitle: { fontFamily:'BebasNeue_400Regular', fontSize:52, color:'#FFFFFF', lineHeight:56, letterSpacing:1.5 },
  pageSub: { fontFamily:'DMSans_400Regular', fontSize:13, color:'#555', marginTop:12, letterSpacing:0.3 },
  cardWrapper: { borderRadius:12, overflow:'hidden', borderWidth:1 },
  graphicCardWrapper: { height:CARD_HEIGHT, backgroundColor:'#0A0F1A' },
  photoCard: { height:CARD_HEIGHT, justifyContent:'flex-start' },
  photoImage: { borderRadius:12 },
  photoOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.64)', borderRadius:12, borderWidth:1, padding:20, justifyContent:'space-between' },
  graphicOverlay: { height:CARD_HEIGHT, padding:20, justifyContent:'space-between', backgroundColor:'rgba(8,8,8,0.32)' },
  cardHeader: { flexDirection:'row', alignItems:'center', gap:10 },
  doorNumber: { fontFamily:'DMMono_400Regular', fontSize:12, letterSpacing:2.5 },
  headerLine: { height:1, flex:1, opacity:0.4 },
  doorTitle: { fontFamily:'BebasNeue_400Regular', fontSize:34, color:'#FFFFFF', letterSpacing:1.5, lineHeight:38, marginBottom:3 },
  doorSubtitle: { fontFamily:'DMMono_400Regular', fontSize:10, letterSpacing:1.2, lineHeight:16 },
  enterBadge: { position:'absolute', right:20, bottom:20, borderWidth:1, borderRadius:5, paddingHorizontal:10, paddingVertical:6 },
  enterText: { fontFamily:'DMMono_400Regular', fontSize:10, letterSpacing:2 },
  ctaSection: { marginTop:20, alignItems:'center', gap:14 },
  ctaDivider: { height:1, width:'50%', backgroundColor:'#1E1E1E', marginBottom:6 },
  ctaCaption: { fontFamily:'DMSans_400Regular', fontSize:13, color:'#444', letterSpacing:0.4 },
  ctaButton: { backgroundColor:'#1D9E75', paddingVertical:18, paddingHorizontal:40, borderRadius:8, width:'100%', alignItems:'center', shadowColor:'#1D9E75', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:12, elevation:6 },
  ctaButtonText: { fontFamily:'BebasNeue_400Regular', fontSize:24, color:'#FFFFFF', letterSpacing:4 },
  receiptStamp: { fontFamily:'DMMono_400Regular', fontSize:10, color:'#2A2A2A', letterSpacing:3.5, marginTop:4 },
});
