import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getScanHistory } from '../../lib/db';

const NAVY = '#0E1B33', INK = '#E8EEF5', MUT = '#8A99AD', FAINT = '#5C6B80', LINE = 'rgba(255,255,255,0.10)';
const CYAN = '#1BB8FF', GREEN = '#34D399', AMBER = '#E0A04A', RED = '#E24B4A';

function clearanceOf(row: any) {
  const v = row?.verdict_label;
  if (row?.allergen_triggered || v === 'PAY ATTENTION') {
    return { tag: 'BLOCKED', color: RED, dot: RED };
  }
  if (v === 'TAKE NOTICE' || v === 'HEADS UP' || row?.verdict_level === 'caution') {
    return { tag: 'CAUTION', color: AMBER, dot: AMBER };
  }
  return { tag: 'CLEARED', color: GREEN, dot: GREEN };
}

type GateRow = { icon: string; title: string; desc: string; chip: string; chipColor: string; route?: string };
const GATES: GateRow[] = [
  { icon: '▤', title: 'Vault', desc: 'Sealed record of every clearance & block.', chip: 'SEALED', chipColor: GREEN },
  { icon: '℞', title: 'Pill', desc: 'Medication interaction gate — RxNorm.', chip: 'CLEAR', chipColor: GREEN },
  { icon: '⚘', title: 'Apothecary', desc: 'Plant + tincture clearance.', chip: 'CLEAR', chipColor: GREEN, route: '/apothecary' },
  { icon: '◍', title: 'Grid', desc: 'ON GRID / OFF GRID maps — pre-synced.', chip: 'ON', chipColor: GREEN, route: '/map' },
  { icon: '◉', title: 'Species', desc: 'Which body — James · Spouse · Lily · K9.', chip: '4', chipColor: AMBER },
  { icon: '◈', title: 'Environmental', desc: 'Location, air, contact exposure.', chip: 'WATCHING', chipColor: AMBER },
];

export default function EqualizerScreen() {
  const [scans, setScans] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await getScanHistory(8);
    setScans(rows);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  const anyBlocked = scans.some(r => clearanceOf(r).tag === 'BLOCKED');
  const heroState = anyBlocked ? 'CLEARANCES LOGGED' : 'ALL CLEAR · STANDBY';
  const heroColor = anyBlocked ? AMBER : GREEN;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
    >
      <View style={st.hero}>
        <Image source={require('../../assets/doors/door-equalizer.jpg')} resizeMode="cover" style={st.heroImg} />
        <View style={st.heroScrim} />
        <View style={st.heroContent}>
          <Text style={[st.eyebrow, { color: CYAN }]}>INTELLIGENCE 0X05 · DOOR OPENED</Text>
          <Text style={st.title}>The Equalizer</Text>
        </View>
      </View>

      <View style={st.band}>
        <Text style={[st.bandLine, { color: heroColor }]}>{heroState}</Text>
        <Text style={st.bandSub}>Speaks only in emergencies. Nothing passes without clearance.</Text>
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>LAST CLEARANCES</Text>
        {scans.length === 0 ? (
          <Text style={st.empty}>No scans yet. Run a scan and it logs here.</Text>
        ) : scans.map((row, i) => {
          const c = clearanceOf(row);
          return (
            <View key={row.id ?? i} style={[st.logRow, i > 0 ? st.logBorder : null]}>
              <View style={[st.dot, { backgroundColor: c.dot }]} />
              <View style={{ flex: 1 }}>
                <Text style={st.logName}>{row.product_name || row.barcode || 'Scan'}</Text>
                <Text style={st.logMeta}>{(row.scan_tab || '').toUpperCase()}</Text>
              </View>
              <View style={[st.logChip, { backgroundColor: c.color + '1F' }]}>
                <Text style={[st.logChipTxt, { color: c.color }]}>{c.tag}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={st.section}>
        <Text style={st.sectionH}>THE GATES IT GUARDS</Text>
        {GATES.map((g, i) => {
          const inner = (
            <>
              <View style={st.gateIcon}><Text style={st.gateIconTxt}>{g.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.gateName}>{g.title}</Text>
                <Text style={st.gateDesc}>{g.desc}</Text>
              </View>
              <View style={[st.gateChip, { backgroundColor: g.chipColor + '1F' }]}>
                <Text style={[st.gateChipTxt, { color: g.chipColor }]}>{g.chip}</Text>
              </View>
            </>
          );
          return g.route ? (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => router.push(g.route as any)}
              style={st.gate}
            >
              {inner}
            </TouchableOpacity>
          ) : (
            <View key={i} style={st.gate}>
              {inner}
            </View>
          );
        })}
      </View>

      <Text style={st.foot}>Nothing passes without clearance.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  hero: { height: 230, position: 'relative', justifyContent: 'flex-end' },
  heroImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,12,22,0.5)' },
  heroContent: { padding: 18, paddingBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  band: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE, alignItems: 'center' },
  bandLine: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  bandSub: { fontSize: 12, color: MUT, marginTop: 7, textAlign: 'center', lineHeight: 17 },
  section: { paddingHorizontal: 14, paddingTop: 16 },
  sectionH: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: FAINT, marginBottom: 11, marginLeft: 2 },
  empty: { fontSize: 12, color: FAINT, fontStyle: 'italic', paddingVertical: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  logBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.05)' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  logName: { fontSize: 13.5, fontWeight: '700', color: INK },
  logMeta: { fontSize: 10.5, color: FAINT, marginTop: 2 },
  logChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  logChipTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  gate: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: LINE, borderRadius: 12, padding: 13, marginBottom: 10 },
  gateIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: 'rgba(27,184,255,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(27,184,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  gateIconTxt: { fontSize: 17, color: CYAN },
  gateName: { fontSize: 14, fontWeight: '700', color: INK },
  gateDesc: { fontSize: 11, color: MUT, marginTop: 2, lineHeight: 15 },
  gateChip: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6 },
  gateChipTxt: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.5 },
  foot: { textAlign: 'center', fontSize: 11, color: CYAN, marginTop: 18 },
});
