import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTheme, dl, type Tokens } from '@/lib/theme-mode';
import {
  BRAIN_TRAIN_TOOLS, TOOL_COUNT, TOOL_KIND_NAMES, toolsOfKind,
  type BrainTool, type ToolKind,
} from '@/lib/study-content';

// ─────────────────────────────────────────────────────────────────────────────
// SPOKE 17 · BRAIN TRAIN TOOLS — wired 2026-09-22.
//
// The Study Layer is what the member READS. This is what the member RUNS.
//
// AA2 CARRIES THE PATH, NEVER THE PROVIDER'S MATERIAL. Every tool here is a
// pointer to Dr Russ Harris's own free download page. AA2 hosts nothing,
// reproduces nothing, and puts his name on every row.
//
// NOTHING IS REQUIRED. No streak, no schedule, no instrument mandate. A
// practice run with no instrument leaves a feeling; run with the stack on it
// leaves a record. The member chooses which one they want that day.
// ─────────────────────────────────────────────────────────────────────────────

const SAND = '#D49A4A';
const KINDS: ToolKind[] = ['audio', 'worksheet', 'pack'];

const open = (url: string) => { Linking.openURL(url).catch(() => {}); };

export default function BrainTrainToolsScreen() {
  const T = useTheme();
  const s = useMemo(() => make(T), [T]);
  const [openId, setOpenId] = useState<string | null>(BRAIN_TRAIN_TOOLS[0]?.id ?? null);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backTxt}>← DEPTH-ON-DEMAND</Text>
        </TouchableOpacity>

        <Text style={s.kicker}>SPOKE 17 · BRAIN TRAIN TOOLS</Text>
        <Text style={s.h1}>The reading is</Text>
        <Text style={[s.h1, s.h1b]}>only half of it.</Text>
        <Text style={s.sub}>
          {TOOL_COUNT} practices with a start and a stop. Every one of them is Dr Russ Harris's
          work, free from his own site — AA2 carries the pointer and the protocol, never the
          material. What AA2 adds is the instrument.
        </Text>

        <View style={s.lawBox}>
          <Text style={s.lawTxt}>
            Run a practice with nothing on and you keep a feeling. Run the same practice with the
            stack on and you keep a record. Neither one is required.
          </Text>
        </View>

        {KINDS.map(k => {
          const list = toolsOfKind(k);
          if (!list.length) return null;
          return (
            <View key={k}>
              <Text style={s.kindName}>{TOOL_KIND_NAMES[k]}</Text>
              {list.map(t => (
                <ToolCard key={t.id} s={s} t={t}
                  open={openId === t.id}
                  onToggle={() => setOpenId(openId === t.id ? null : t.id)} />
              ))}
            </View>
          );
        })}

        <TouchableOpacity style={s.studyCta} activeOpacity={0.85}
          onPress={() => router.push('/study' as Href)}>
          <View style={{ flex: 1 }}>
            <Text style={s.studyTitle}>The Study Layer</Text>
            <Text style={s.studySub}>The reading half — every session points at what it feeds.</Text>
          </View>
          <Text style={s.studyArrow}>→</Text>
        </TouchableOpacity>

        <Text style={s.foot}>Trainable, not treatable.</Text>
      </ScrollView>
    </View>
  );
}

function ToolCard({ s, t, open: isOpen, onToggle }: {
  s: any; t: BrainTool; open: boolean; onToggle: () => void;
}) {
  return (
    <View style={[s.card, { borderColor: t.accent }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: t.accent }]}>{t.name}</Text>
          <Text style={s.author}>{t.author}</Text>
        </View>
        <Text style={[s.chev, isOpen && s.chevOpen]}>›</Text>
      </TouchableOpacity>

      <View style={s.meta}>
        <Text style={s.chip}>{t.minutes ? `${t.minutes} MIN` : 'NO CLOCK'}</Text>
        <Text style={s.chip}>{t.kind.toUpperCase()}</Text>
        {t.instrument ? <Text style={s.chip}>INSTRUMENT OPTIONAL</Text> : null}
      </View>

      {isOpen && (
        <View style={s.body}>
          <Text style={s.label}>WHAT IT DOES</Text>
          <Text style={s.txt}>{t.what}</Text>

          <Text style={s.label}>HOW YOU RUN IT</Text>
          <Text style={s.txt}>{t.how}</Text>

          {t.instrument ? (
            <>
              <Text style={s.label}>THE RECORD</Text>
              <Text style={s.txt}>{t.instrument}</Text>
            </>
          ) : null}

          {t.file ? (
            <View style={s.fileBox}>
              <Text style={s.fileTxt}>YOUR COPY · {t.file}</Text>
              <Text style={s.fileNote}>
                Held in your own vault. AA2 does not carry the file — it carries where it came from.
              </Text>
            </View>
          ) : null}

          <View style={s.srcBox}>
            <Text style={s.srcTxt}>{t.sourceNote}</Text>
            <TouchableOpacity onPress={() => open(t.source)}>
              <Text style={[s.srcLink, { color: t.accent }]}>GET IT FROM THE AUTHOR ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const make = (T: Tokens) => {
  const BG    = dl(T, '#0A0804', '#FAF7F2');
  const CARD  = dl(T, '#150F0A', '#FFFFFF');
  const LINE  = dl(T, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.10)');
  const INK   = dl(T, '#FFFFFF', '#141414');
  const MUT   = dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)');
  const FAINT = dl(T, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    pad: { padding: 20, paddingBottom: 56 },
    back: { marginBottom: 14 },
    backTxt: { color: FAINT, fontSize: 10, letterSpacing: 1.6 },
    kicker: { color: SAND, fontSize: 9, letterSpacing: 1.8, marginBottom: 10 },
    h1: { color: INK, fontSize: 33, lineHeight: 36, fontWeight: '300', letterSpacing: -0.6 },
    h1b: { fontWeight: '700', marginBottom: 12 },
    sub: { color: MUT, fontSize: 13, lineHeight: 20, marginBottom: 18 },

    lawBox: { borderLeftWidth: 2, borderLeftColor: SAND, paddingLeft: 12, marginBottom: 24 },
    lawTxt: { color: MUT, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

    kindName: { color: SAND, fontSize: 9, letterSpacing: 1.8, fontWeight: '700',
      marginTop: 18, marginBottom: 8 },

    card: { borderWidth: 1, borderRadius: 6, backgroundColor: CARD, padding: 14, marginBottom: 12 },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    name: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
    author: { color: FAINT, fontSize: 10, marginTop: 3 },
    chev: { color: FAINT, fontSize: 22, transform: [{ rotate: '90deg' }] },
    chevOpen: { transform: [{ rotate: '270deg' }] },
    meta: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
    chip: { color: MUT, fontSize: 8, letterSpacing: 1.2, borderWidth: 1, borderColor: LINE,
      borderRadius: 3, paddingHorizontal: 7, paddingVertical: 4 },

    body: { marginTop: 14, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12, gap: 4 },
    label: { color: FAINT, fontSize: 8, letterSpacing: 1.6, marginTop: 8 },
    txt: { color: MUT, fontSize: 12, lineHeight: 18 },

    fileBox: { borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 10, marginTop: 12, gap: 4 },
    fileTxt: { color: INK, fontSize: 10, letterSpacing: 1.1 },
    fileNote: { color: FAINT, fontSize: 10, lineHeight: 15 },

    srcBox: { borderLeftWidth: 2, borderLeftColor: LINE, paddingLeft: 10, marginTop: 14, gap: 6 },
    srcTxt: { color: MUT, fontSize: 11, lineHeight: 17 },
    srcLink: { fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },

    studyCta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24,
      borderWidth: 1, borderColor: SAND, borderRadius: 6, padding: 14 },
    studyTitle: { color: SAND, fontSize: 14, fontWeight: '700' },
    studySub: { color: MUT, fontSize: 11, lineHeight: 16, marginTop: 3 },
    studyArrow: { color: SAND, fontSize: 17, fontWeight: '700' },

    foot: { color: FAINT, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: 28,
      fontStyle: 'italic' },
  });
};
