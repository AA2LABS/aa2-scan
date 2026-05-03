// ─── components/AdaptiveScanner.tsx ───
// AA2 BioMesh · v50 Mockup #12 · Adaptive Scanner Input
// "EYES UP, PHONE DOWN. Point and Claude sees."
// Priority: VISION → VOICE → BARCODE → TEXT
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

export type ScannerState = 'vision' | 'failed' | 'voice';

interface AdaptiveScannerProps {
  state?: ScannerState;
  onCapture: () => void;
  onVoiceStart: () => void;
  onBarcodeOnly: () => void;
  onTypeOpen: () => void;
  onVoiceCancel?: () => void;
  voiceTranscript?: string;
  tabName?: string;
}

const C = {
  navy: '#0E1B33', navyCard: '#142545', navyDeep: '#0A1428',
  gold: '#D4A847', green: '#34D399', cyan: '#1BB8FF',
  amber: '#F59E0B', textHi: '#E6F0FF', textMid: '#8FA3C0',
  textLow: '#5A6E8A', border: '#1F3358',
};

export const AdaptiveScanner: React.FC<AdaptiveScannerProps> = ({
  state = 'vision', onCapture, onVoiceStart, onBarcodeOnly, onTypeOpen,
  onVoiceCancel, voiceTranscript, tabName = 'SCAN',
}) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state !== 'vision') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanLineAnim, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(scanLineAnim, { toValue: 0, duration: 2500, useNativeDriver: true, easing: Easing.linear }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [state, scanLineAnim]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [80, -80] });

  const Header = () => (
    <>
      <View style={s.brandHeader}>
        <View style={s.brandMark}>
          <Text style={s.glyph}>◆</Text>
          <Text style={s.brandName}>AA2 SCAN</Text>
        </View>
        <View style={s.tabPill}><Text style={s.tabPillText}>{tabName}</Text></View>
      </View>
      <View style={s.eyebrowRow}>
        <Text style={[s.eyebrowText, state === 'voice' && { color: C.gold }]}>
          {state === 'voice' ? 'VOICE ACTIVE · LISTENING'
            : state === 'failed' ? "COULDN'T READ · ADAPT"
            : 'VISION ACTIVE · POINT AT PRODUCT'}
        </Text>
      </View>
    </>
  );

  const Dock = (props: { activeMode?: 'vision' | 'voice' }) => (
    <View style={s.inputDock}>
      <View style={s.inputModes}>
        <ModeBtn icon="👁" label="VISION" priority={props.activeMode==='vision'?'ACTIVE':'PRIMARY'} onPress={onCapture} active={props.activeMode==='vision'} />
        <ModeBtn icon="🎙" label="VOICE" priority={props.activeMode==='voice'?'ACTIVE':'2ND'} onPress={onVoiceStart} activeGold={props.activeMode==='voice'} />
        <ModeBtn icon="▭" label="BARCODE" priority="3RD" onPress={onBarcodeOnly} />
        <ModeBtn icon="⌨" label="TYPE" priority="4TH" onPress={onTypeOpen} />
      </View>
      {state === 'vision' && (
        <Text style={s.modeTip}>
          <Text style={s.modeAccent}>EYES UP, PHONE DOWN.{'\n'}</Text>
          Point and Claude sees.
        </Text>
      )}
    </View>
  );

  return (
    <View style={s.overlay} pointerEvents="box-none">
      <Header />

      <View style={s.viewfinderArea} pointerEvents="none">
        {state === 'vision' && (
          <View style={s.vfStatus}>
            <Animated.View style={[s.vfPulse, { opacity: pulseAnim }]} />
            <Text style={s.vfStatusText}>READING</Text>
          </View>
        )}
        <View style={[s.corner, s.cornerTL, state !== 'vision' && { borderColor: C.textLow, opacity: 0.4 }]} />
        <View style={[s.corner, s.cornerTR, state !== 'vision' && { borderColor: C.textLow, opacity: 0.4 }]} />
        <View style={[s.corner, s.cornerBL, state !== 'vision' && { borderColor: C.textLow, opacity: 0.4 }]} />
        <View style={[s.corner, s.cornerBR, state !== 'vision' && { borderColor: C.textLow, opacity: 0.4 }]} />
        {state === 'vision' && <Text style={s.crosshair}>◆</Text>}
        {state === 'failed' && <Text style={[s.crosshair, { color: C.textLow, opacity: 0.4 }]}>◆</Text>}
        {state === 'vision' && (
          <Animated.View style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]} />
        )}
      </View>

      {state === 'failed' && (
        <View style={s.fallbackPanel}>
          <Text style={s.fbEyebrow}>◆ THE CONCIERGE</Text>
          <Text style={s.fbMessage}>"Couldn't read this clearly. Want to tell me what it is?"</Text>
          <View style={s.fallbackCtas}>
            <TouchableOpacity style={[s.fbCta, s.fbCtaPrimary]} onPress={onVoiceStart}>
              <Text style={[s.fbCtaIcon, { color: C.gold }]}>🎙</Text>
              <Text style={[s.fbCtaText, { color: C.gold }]}>SPEAK IT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.fbCta} onPress={onBarcodeOnly}>
              <Text style={s.fbCtaIcon}>▭</Text>
              <Text style={s.fbCtaText}>BARCODE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.fbCta} onPress={onTypeOpen}>
              <Text style={s.fbCtaIcon}>⌨</Text>
              <Text style={s.fbCtaText}>TYPE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'voice' && (
        <View style={s.voiceOverlay}>
          <View style={s.voiceMic}><Text style={s.voiceMicIcon}>🎙</Text></View>
          <Text style={s.voiceEyebrow}>◆ LISTENING</Text>
          <Text style={s.voicePrompt}>"Speak the product name"</Text>
          <Text style={s.voiceHint}>Phone down. Eyes up.{'\n'}Concierge is listening.</Text>
          <View style={s.voiceInputDisplay}>
            <Text style={s.voiceLiveText}>{voiceTranscript ? `"${voiceTranscript}"` : '◦ ◦ ◦'}</Text>
          </View>
          <TouchableOpacity style={s.voiceCancel} onPress={onVoiceCancel}>
            <Text style={s.voiceCancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )}

      <Dock activeMode={state === 'voice' ? 'voice' : state === 'vision' ? 'vision' : undefined} />
    </View>
  );
};

const ModeBtn: React.FC<{
  icon: string; label: string; priority: string;
  onPress?: () => void; active?: boolean; activeGold?: boolean;
}> = ({ icon, label, priority, onPress, active, activeGold }) => {
  const borderColor = active ? C.cyan : activeGold ? C.gold : C.border;
  const bgColor = active ? 'rgba(27,184,255,0.08)' : activeGold ? 'rgba(212,168,71,0.10)' : 'transparent';
  const iconColor = active ? C.cyan : activeGold ? C.gold : C.textMid;
  const labelColor = active ? C.cyan : activeGold ? C.gold : C.textLow;
  return (
    <TouchableOpacity
      style={[ms.btn, { borderColor, backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[ms.icon, { color: iconColor }]}>{icon}</Text>
      <Text style={[ms.label, { color: labelColor }]}>{label}</Text>
      <Text style={ms.priority}>{priority}</Text>
    </TouchableOpacity>
  );
};

const ms = StyleSheet.create({
  btn: { flex: 1, borderWidth: 1, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', gap: 4 },
  icon: { fontSize: 18 },
  label: { fontSize: 8, letterSpacing: 1.5 },
  priority: { fontSize: 7, letterSpacing: 1, color: C.textLow, opacity: 0.6 },
});

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  brandHeader: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.navyDeep },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glyph: { color: C.gold, fontSize: 14 },
  brandName: { color: C.textHi, fontSize: 14, letterSpacing: 3, fontWeight: '600' },
  tabPill: { borderWidth: 1, borderColor: C.cyan, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3 },
  tabPillText: { fontSize: 9, letterSpacing: 1.5, color: C.cyan },
  eyebrowRow: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.navy },
  eyebrowText: { fontSize: 10, letterSpacing: 2, color: C.textLow },
  viewfinderArea: { flex: 1, position: 'relative' },
  vfStatus: { position: 'absolute', top: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.cyan, backgroundColor: 'rgba(20,37,69,0.85)', zIndex: 5 },
  vfPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.cyan, marginRight: 8 },
  vfStatusText: { fontSize: 10, letterSpacing: 1.5, color: C.cyan },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: C.cyan },
  cornerTL: { top: 60, left: 30, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 60, right: 30, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 30, left: 30, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 30, right: 30, borderBottomWidth: 2, borderRightWidth: 2 },
  crosshair: { position: 'absolute', top: '50%', alignSelf: 'center', color: C.gold, fontSize: 24, opacity: 0.5 },
  scanLine: { position: 'absolute', left: 30, right: 30, top: '50%', height: 2, backgroundColor: C.cyan, shadowColor: C.cyan, shadowOpacity: 0.8, shadowRadius: 8, opacity: 0.7 },
  inputDock: { backgroundColor: C.navyDeep, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  inputModes: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeTip: { fontSize: 12, color: C.textMid, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  modeAccent: { color: C.gold, fontStyle: 'normal', fontSize: 10, letterSpacing: 1.5 },
  fallbackPanel: { position: 'absolute', bottom: 110, left: 0, right: 0, backgroundColor: C.navyCard, borderTopWidth: 1, borderTopColor: C.amber, padding: 22 },
  fbEyebrow: { color: C.amber, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  fbMessage: { color: C.textHi, fontStyle: 'italic', fontSize: 16, lineHeight: 22, marginBottom: 16 },
  fallbackCtas: { flexDirection: 'row', gap: 8 },
  fbCta: { flex: 1, borderWidth: 1, borderColor: C.cyan, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 4 },
  fbCtaPrimary: { backgroundColor: 'rgba(212,168,71,0.12)', borderColor: C.gold },
  fbCtaIcon: { fontSize: 14, color: C.cyan },
  fbCtaText: { fontSize: 9, letterSpacing: 1.5, color: C.cyan },
  voiceOverlay: { position: 'absolute', top: 100, left: 0, right: 0, bottom: 110, backgroundColor: 'rgba(10,20,40,0.94)', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 10 },
  voiceMic: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(212,168,71,0.1)', borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  voiceMicIcon: { fontSize: 40 },
  voiceEyebrow: { color: C.gold, fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  voicePrompt: { color: C.textHi, fontSize: 22, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  voiceHint: { color: C.textMid, fontSize: 12, textAlign: 'center', marginBottom: 32, lineHeight: 18 },
  voiceInputDisplay: { width: '100%', backgroundColor: C.navyCard, borderWidth: 1, borderColor: C.gold, borderRadius: 6, padding: 16, minHeight: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  voiceLiveText: { color: C.gold, fontSize: 15, textAlign: 'center' },
  voiceCancel: { borderWidth: 1, borderColor: C.textLow, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 24 },
  voiceCancelText: { color: C.textMid, fontSize: 10, letterSpacing: 2 },
});

export default AdaptiveScanner;
