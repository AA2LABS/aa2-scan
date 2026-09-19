import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTheme, dl, type Tokens } from '@/lib/theme-mode';
import {
  STUDY_PATHS, SHELF, SHELF_NAMES, SHELF_COUNT, AUDIBLE_COUNT, shelf,
  pathMinutes, readyModules,
  type StudyPath, type StudyModule, type ShelfKey,
} from '@/lib/study-content';

// ─────────────────────────────────────────────────────────────────────────────
// SPOKE 17 · THE STUDY LAYER — wired 2026-09-19.
//
// Reached from Depth-On-Demand. This is the CONTENT — the material the member
// is actually going to absorb, broken into sessions, each one pointing at the
// credential requirement it feeds.
//
// AA2 CARRIES THE PATH, NEVER THE PROVIDER'S MATERIAL. Every module is a
// pointer with its source cited. Nothing here reproduces a manual, a workbook
// or an exam. See lib/study-content.ts for the full law.
//
// PENDING IS SHOWN, NOT HIDDEN. A module whose structure has not been verified
// says so on the face of it. A path waiting on a physical book says which book.
// The member can always see what AA2 knows and what it does not.
//
// THE SHELF carries Audible search links — a search, never a product claim,
// because no specific audio edition has been verified for any title.
// ─────────────────────────────────────────────────────────────────────────────

const SAND = '#D49A4A';

const open = (url: string) => { Linking.openURL(url).catch(() => {}); };

export default function StudyScreen() {
  const T = useTheme();
  const s = useMemo(() => make(T), [T]);
  const [openPath, setOpenPath] = useState<string | null>(STUDY_PATHS[1]?.slug ?? null);

  const totalReady = STUDY_PATHS.reduce((n, p) => n + readyModules(p).length, 0);
  const totalMin   = STUDY_PATHS.reduce((n, p) => n + pathMinutes(p), 0);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backTxt}>← DEPTH-ON-DEMAND</Text>
        </TouchableOpacity>

        <Text style={s.kicker}>SPOKE 17 · THE STUDY LAYER</Text>
        <Text style={s.h1}>What you are</Text>
        <Text style={[s.h1, s.h1b]}>about to absorb.</Text>
        <Text style={s.sub}>
          Five paths. Every session points at the requirement it feeds, and carries the source
          it came from. AA2 holds the path — it never holds someone else's book.
        </Text>

        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statV}>{STUDY_PATHS.length}</Text>
            <Text style={s.statL}>PATHS</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statV}>{totalReady}</Text>
            <Text style={s.statL}>SESSIONS READY</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statV}>{Math.round(totalMin / 60)}</Text>
            <Text style={s.statL}>HOURS SCOPED</Text>
          </View>
        </View>
        <Text style={s.scopeNote}>
          Scoped, not targeted. Nothing here counts down at you or says you are behind.
        </Text>

        <TouchableOpacity style={s.recCta} activeOpacity={0.85}
          onPress={() => router.push('/retention' as Href)}>
          <View style={{ flex: 1 }}>
            <Text style={s.recTitle}>The Retention Record</Text>
            <Text style={s.recSub}>Not how long you studied — what you still hold.</Text>
          </View>
          <Text style={s.recArrow}>→</Text>
        </TouchableOpacity>

        {STUDY_PATHS.map(p => (
          <PathCard key={p.slug} s={s} p={p}
            open={openPath === p.slug}
            onToggle={() => setOpenPath(openPath === p.slug ? null : p.slug)} />
        ))}

        {/* ── THE SHELF ─────────────────────────────────────────────── */}
        <Text style={s.legend}>THE SHELF · WHAT YOU ALREADY OWN</Text>
        <Text style={s.legendBody}>
          {SHELF_COUNT} titles catalogued, {AUDIBLE_COUNT} of them on Audible. Every row is a book
          you hold. Links are Audible searches, never product claims.
        </Text>

        {(Object.keys(SHELF_NAMES) as ShelfKey[]).map(k => {
          const books = shelf(k);
          if (!books.length) return null;
          return (
            <View key={k}>
              <View style={s.shelfHead}>
                <Text style={s.shelfName}>{SHELF_NAMES[k]}</Text>
                <Text style={s.shelfCount}>{books.length}</Text>
              </View>
              <View style={s.card}>
                {books.map((b, i) => (
                  <View key={b.title} style={[s.shelfRow, i === books.length - 1 && s.last]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.shelfTitle}>{b.title}</Text>
                      <Text style={s.shelfAuthor}>{b.author}</Text>
                      {b.note ? <Text style={s.shelfNote}>{b.note}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={[s.fmt, b.format === 'print' && s.fmtPrint]}>
                        {b.format === 'both' ? 'BOTH' : b.format.toUpperCase()}
                      </Text>
                      {b.format !== 'print' && (
                        <TouchableOpacity onPress={() => open(b.audible)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={s.audible}>AUDIBLE ↗</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <Text style={s.foot}>You learn what you scan. You keep what you check.</Text>
      </ScrollView>
    </View>
  );
}

function PathCard({ s, p, open: isOpen, onToggle }: {
  s: any; p: StudyPath; open: boolean; onToggle: () => void;
}) {
  const ready   = readyModules(p).length;
  const pending = p.modules.length - ready;
  return (
    <View style={[s.pathCard, { borderColor: p.accent }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={s.pathHead}>
        <View style={{ flex: 1 }}>
          <Text style={[s.pathTitle, { color: p.accent }]}>{p.title}</Text>
          <Text style={s.pathAuthor}>{p.author}</Text>
          <Text style={s.pathProv}>{p.provider}</Text>
        </View>
        <Text style={[s.chev, isOpen && s.chevOpen]}>›</Text>
      </TouchableOpacity>

      <View style={s.pathMeta}>
        <Text style={s.metaChip}>{p.modules.length} MODULES</Text>
        <Text style={s.metaChip}>{Math.round(pathMinutes(p) / 60)} H SCOPED</Text>
        {pending > 0 && <Text style={[s.metaChip, s.metaPending]}>{pending} PENDING</Text>}
      </View>

      {p.feeds ? <Text style={s.feeds}>FEEDS → {p.feeds}</Text> : null}

      {isOpen && (
        <View style={s.pathBody}>
          <View style={s.srcBox}>
            <Text style={s.srcTxt}>{p.sourceNote}</Text>
            <TouchableOpacity onPress={() => open(p.source)}>
              <Text style={[s.srcLink, { color: p.accent }]}>SOURCE ↗</Text>
            </TouchableOpacity>
          </View>

          {p.modules.map(m => <ModuleRow key={m.id} s={s} m={m} accent={p.accent} pathSlug={p.slug} />)}

          <TouchableOpacity style={s.audRow} onPress={() => open(p.audible)} activeOpacity={0.8}>
            <Text style={s.audTxt}>
              {p.owned ? 'OPEN IN AUDIBLE — you own this' : 'FIND IT ON AUDIBLE'}
            </Text>
            <Text style={[s.audArrow, { color: p.accent }]}>↗</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ModuleRow({ s, m, accent, pathSlug }: { s: any; m: StudyModule; accent: string; pathSlug: string }) {
  const [show, setShow] = useState(false);
  const pending = m.status !== 'ready';
  return (
    <View style={s.modRow}>
      <TouchableOpacity activeOpacity={0.75} onPress={() => setShow(!show)} style={s.modHead}>
        <View style={{ flex: 1 }}>
          <Text style={[s.modLabel, pending && s.modLabelPending]}>{m.label}</Text>
          <Text style={s.modScope}>
            {m.scope} MIN
            {m.status === 'pending-book'   ? ' · AWAITING THE BOOK'   : ''}
            {m.status === 'pending-portal' ? ' · AWAITING THE PORTAL' : ''}
          </Text>
        </View>
        <Text style={[s.modPlus, { color: accent }]}>{show ? '−' : '+'}</Text>
      </TouchableOpacity>
      {show && (
        <View style={s.modBody}>
          <Text style={s.modIntent}>{m.intent}</Text>
          <Text style={s.recallLabel}>RECALL · +1 · +3 · +7 · +30</Text>
          {m.recall.map((r, i) => (
            <Text key={i} style={s.recall}>· {r}</Text>
          ))}
          <Text style={s.heldNote}>One tap: held, or did not hold. No score, ever.</Text>
          {!pending && (
            <TouchableOpacity activeOpacity={0.85} style={[s.startBtn, { borderColor: accent }]}
              onPress={() => router.push(`/study-session?path=${pathSlug}&module=${m.id}` as Href)}>
              <Text style={[s.startTxt, { color: accent }]}>START THIS SESSION →</Text>
            </TouchableOpacity>
          )}
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
    sub: { color: MUT, fontSize: 13, lineHeight: 20, marginBottom: 22 },
    stats: { flexDirection: 'row', gap: 10 },
    stat: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
    statV: { color: INK, fontSize: 20, fontWeight: '700' },
    statL: { color: FAINT, fontSize: 8, letterSpacing: 1.2, marginTop: 3 },
    scopeNote: { color: FAINT, fontSize: 10, lineHeight: 15, marginTop: 8, marginBottom: 24, fontStyle: 'italic' },

    pathCard: { borderWidth: 1, borderRadius: 6, backgroundColor: CARD, padding: 14, marginBottom: 12 },
    pathHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    pathTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
    pathAuthor: { color: INK, fontSize: 11, marginTop: 3 },
    pathProv: { color: FAINT, fontSize: 9, letterSpacing: 0.8, marginTop: 4 },
    chev: { color: FAINT, fontSize: 22, transform: [{ rotate: '90deg' }] },
    chevOpen: { transform: [{ rotate: '270deg' }] },
    pathMeta: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
    metaChip: { color: MUT, fontSize: 8, letterSpacing: 1.2, borderWidth: 1, borderColor: LINE,
      borderRadius: 3, paddingHorizontal: 7, paddingVertical: 4 },
    metaPending: { color: '#E0A04A', borderColor: '#E0A04A' },
    feeds: { color: FAINT, fontSize: 9, letterSpacing: 1.1, marginTop: 10 },

    pathBody: { marginTop: 14, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12 },
    srcBox: { borderLeftWidth: 2, borderLeftColor: LINE, paddingLeft: 10, marginBottom: 14, gap: 6 },
    srcTxt: { color: MUT, fontSize: 11, lineHeight: 17 },
    srcLink: { fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },

    modRow: { borderTopWidth: 1, borderTopColor: LINE },
    modHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
    modLabel: { color: INK, fontSize: 13, lineHeight: 18 },
    modLabelPending: { color: MUT, fontStyle: 'italic' },
    modScope: { color: FAINT, fontSize: 8, letterSpacing: 1.2, marginTop: 3 },
    modPlus: { fontSize: 18, fontWeight: '300' },
    modBody: { paddingBottom: 14, gap: 6 },
    modIntent: { color: MUT, fontSize: 12, lineHeight: 18 },
    recallLabel: { color: FAINT, fontSize: 8, letterSpacing: 1.6, marginTop: 6 },
    recall: { color: MUT, fontSize: 12, lineHeight: 18 },
    heldNote: { color: FAINT, fontSize: 10, marginTop: 4, fontStyle: 'italic' },

    audRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12, marginTop: 6 },
    audTxt: { color: MUT, fontSize: 10, letterSpacing: 1.3 },
    audArrow: { fontSize: 13, fontWeight: '700' },

    recCta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 8,
      borderWidth: 1, borderColor: SAND, borderRadius: 6, padding: 14 },
    recTitle: { color: SAND, fontSize: 14, fontWeight: '700' },
    recSub: { color: MUT, fontSize: 11, lineHeight: 16, marginTop: 3 },
    recArrow: { color: SAND, fontSize: 17, fontWeight: '700' },
    startBtn: { borderWidth: 1, borderRadius: 4, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    startTxt: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
    shelfHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
      marginTop: 22, marginBottom: 8 },
    shelfName: { color: SAND, fontSize: 9, letterSpacing: 1.6, fontWeight: '700' },
    shelfCount: { color: FAINT, fontSize: 9, letterSpacing: 1.2 },
    legend: { color: FAINT, fontSize: 10, letterSpacing: 1.8, marginTop: 26, marginBottom: 6 },
    legendBody: { color: MUT, fontSize: 11, lineHeight: 17, marginBottom: 12 },
    card: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 6 },
    shelfRow: { flexDirection: 'row', padding: 13, borderBottomWidth: 1, borderBottomColor: LINE, gap: 12 },
    last: { borderBottomWidth: 0 },
    shelfTitle: { color: INK, fontSize: 13 },
    shelfAuthor: { color: FAINT, fontSize: 10, marginTop: 2 },
    shelfNote: { color: MUT, fontSize: 10, lineHeight: 15, marginTop: 5 },
    fmt: { color: SAND, fontSize: 8, letterSpacing: 1.2, borderWidth: 1, borderColor: SAND,
      borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3 },
    fmtPrint: { color: '#E0A04A', borderColor: '#E0A04A' },
    audible: { color: MUT, fontSize: 9, letterSpacing: 1.2 },

    foot: { color: FAINT, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: 28, fontStyle: 'italic' },
  });
};
