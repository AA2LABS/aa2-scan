import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { dl, lc, useTheme, type Tokens } from '@/lib/theme-mode';
import {
  buildPersonalTruth, loadMemberProfile, logAwareDollarsFollowed,
  logMembraneEvent, getMembraneEvents,
} from '@/lib/db';

// ─── PALETTE (mirrors apothecary.tsx) ────────────────────────────────────────
const C = {
  bg:          '#050D09',
  card:        '#0C1710',
  border:      '#172E1F',
  borderSoft:  '#1A3523',
  teal:        '#1D9E75',
  gold:        '#C9A84C',
  goldDim:     'rgba(201,168,76,0.13)',
  goldMid:     'rgba(201,168,76,0.22)',
  red:         '#C94C4C',
  redDim:      'rgba(201,76,76,0.13)',
  tealDim:     'rgba(29,158,117,0.13)',
  white:       '#FFFFFF',
  dim:         'rgba(255,255,255,0.60)',
  muted:       'rgba(255,255,255,0.32)',
  glass:       'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.07)',
};
const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
};

const ACCENT = C.gold;

// ─── MODES ───────────────────────────────────────────────────────────────────
type Mode = 'cigar' | 'pipe' | 'strain' | 'contaminant' | 'dose' | 'interaction';
const MODES: { id: Mode; label: string; glyph: string; desc: string; run: string; verb: string; membrane: boolean }[] = [
  { id: 'cigar', label: 'CIGAR', glyph: '◈', membrane: false,
    desc: 'Origin, wrapper, vitola, strength, flavor, house history, pairing — the read for the humidor or the online order.',
    run: '◆  READ THIS CIGAR', verb: 'Read this cigar for an aficionado' },
  { id: 'pipe', label: 'PIPE', glyph: '◍', membrane: false,
    desc: 'Blend components, cut, strength, flavor, and lineage — pipe tobacco read for ordering or the tobacconist.',
    run: '◆  READ THIS BLEND', verb: 'Read this pipe tobacco blend for an aficionado' },
  { id: 'strain', label: 'STRAIN', glyph: '🌿', membrane: false,
    desc: 'Indica · sativa · hybrid. Terpene profile, potency band, effects, and pairing.',
    run: '◆  READ THIS STRAIN', verb: 'Read this cannabis strain & leaf' },
  { id: 'contaminant', label: 'SCREEN', glyph: '⚗', membrane: true,
    desc: 'Pesticides · heavy metals · mold / mycotoxin · solvent residue — screened against your membrane.',
    run: '⚗  SCREEN FOR CONTAMINANTS', verb: 'Screen this for contaminants' },
  { id: 'dose', label: 'DOSE', glyph: '⚖', membrane: true,
    desc: 'Dose guidance filtered against your medications, conditions, and tolerance.',
    run: '⚖  CHECK MY DOSE', verb: 'Advise dose for' },
  { id: 'interaction', label: 'CHECK', glyph: '⚠', membrane: true,
    desc: 'Cross-referenced against your medications and allergies on file.',
    run: '⚠  CHECK INTERACTIONS', verb: 'Check interactions for' },
];

// ─── VERDICT ─────────────────────────────────────────────────────────────────
type Verdict = 'SAFE' | 'CAUTION' | 'CONTRAINDICATED';
const vColor = (v: Verdict) => v === 'SAFE' ? C.teal : v === 'CAUTION' ? C.gold : C.red;
const vDim   = (v: Verdict) => v === 'SAFE' ? C.tealDim : v === 'CAUTION' ? C.goldDim : C.redDim;
const vGlyph = (v: Verdict) => v === 'SAFE' ? '✓' : v === 'CAUTION' ? '⚠' : '✕';

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────
const JSON_SPEC = `Return ONLY valid JSON — no markdown, no backticks, no preamble. Schema: {"verdict":"SAFE"|"CAUTION"|"CONTRAINDICATED" (omit for a pure knowledge read),"subject":"string — what this is","aficionadoVoice":"2-3 sentences, calm connoisseur authority","facts":[{"label":"SHORT UPPERCASE LABEL","body":"string"}],"pairing":"string (optional)","actRightDollars":"REQUIRED. Dollar value or savings. End exactly with: That goes directly into your AA2 Vault as AWARE DOLLARS."}`;

const SYS: Record<Mode, string> = {
  cigar: `You are The Aficionado — AA2's connoisseur intelligence, a master tobacconist. For a cigar, return facts covering, in order: ORIGIN & REGION, WRAPPER · BINDER · FILLER, VITOLA & RING GAUGE, STRENGTH, FLAVOR PROFILE, HOUSE HISTORY & LINEAGE. Provide a pairing. This is a knowledge read — omit verdict. ${JSON_SPEC}`,
  pipe: `You are The Aficionado — AA2's connoisseur intelligence for pipe tobacco. Return facts covering, in order: ORIGIN & REGION, BLEND COMPONENTS (Virginia · Burley · Oriental · Latakia · Perique), CUT, STRENGTH, FLAVOR PROFILE, HOUSE HISTORY & LINEAGE. Provide a pairing. Knowledge read — omit verdict. ${JSON_SPEC}`,
  strain: `You are The Aficionado — cannabis strain & leaf intelligence. Return facts covering: TYPE (indica / sativa / hybrid), TERPENE PROFILE, POTENCY BAND (THC / CBD), EFFECTS, LINEAGE. Provide a pairing. Knowledge read — omit verdict. ${JSON_SPEC}`,
  contaminant: `You are The Equalizer running the Aficionado CONTAMINANT SCREEN. verdict is REQUIRED. Return facts covering: PESTICIDES, HEAVY METALS, MOLD / MYCOTOXIN, SOLVENT RESIDUE — and how each reads against the member's membrane. Never name internal databases. ${JSON_SPEC}`,
  dose: `You are The Equalizer running the Aficionado DOSE clarifier. verdict is REQUIRED. Give dose guidance filtered against the member's medications, conditions, and tolerance. facts: STARTING DOSE, TITRATION, CEILING / CAUTION, ONSET & DURATION. ${JSON_SPEC}`,
  interaction: `You are The Equalizer running the Aficionado INTERACTION CHECK. verdict is REQUIRED. Cross-reference against the member's medications and allergies. facts: FLAGGED INTERACTIONS, ALLERGY CROSS-CHECK, WHAT TO AVOID, MONITOR. ${JSON_SPEC}`,
};

// ─── HARDENED PARSE (mirrors apothecary.tsx) ─────────────────────────────────
function parseResponse(text: string) {
  const cleaned = text.replace(/```json\s?|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  const slice = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try { return JSON.parse(slice); }
  catch { throw new Error('The Aficionado returned an incomplete read. Tap RUN again.'); }
}

function parseDollars(text?: string | null): number | null {
  if (!text) return null;
  const m = String(text).match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
}

// ─── RAW FETCH HELPER (mirrors apothecary.tsx) ───────────────────────────────
async function callAficionado(system: string, userContent: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function AficionadoScreen() {
  const TH = useTheme();
  const s = useMemo(() => make_s(TH), [TH]);

  const [doorOpen, setDoorOpen] = useState(false);
  const [armed, setArmed] = useState<boolean | null>(null); // null = checking

  const [mode, setMode] = useState<Mode>('cigar');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiError, setApiError] = useState('');
  const [logState, setLogState] = useState<'idle' | 'logged' | 'failed'>('idle');

  useEffect(() => {
    getMembraneEvents(200)
      .then(events => setArmed(events.some(e => e.event_type === 'restricted_layer_armed' && e.subject === 'Aficionado')))
      .catch(() => setArmed(false));
  }, []);

  const clearResult = () => { setResult(null); setApiError(''); setLogState('idle'); };

  const switchMode = (m: Mode) => { setMode(m); clearResult(); };

  const armAficionado = () => {
    Alert.alert('Aficionado', 'Arm this restricted layer?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'YES', onPress: async () => {
          setArmed(true);
          await logMembraneEvent({ eventType: 'restricted_layer_armed', sourceScreen: 'aficionado', subject: 'Aficionado', value: { armed: true } });
        } },
    ]);
  };

  const active = MODES.find(m => m.id === mode)!;

  const run = async () => {
    if (!query.trim()) { Alert.alert('Enter something', 'Type what you are enjoying.'); return; }
    setLoading(true);
    clearResult();
    try {
      let system = SYS[mode];
      if (active.membrane) {
        const profile = await loadMemberProfile();
        system = `MEMBER MEMBRANE (filter every read against this, never restate it):\n${buildPersonalTruth(profile)}\n\n` + system;
      }
      const text = await callAficionado(system, `${active.verb}: ${query.trim()}`);
      setResult(parseResponse(text));
    } catch (err: any) {
      setApiError(err?.message || 'The Aficionado could not complete this read. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const follow = async () => {
    const amt = parseDollars(result?.actRightDollars);
    if (amt == null) return;
    const ok = await logAwareDollarsFollowed({
      productName:    result?.subject ?? query,
      recommendation: result?.actRightDollars,
      amountSaved:    amt,
      scanResult:     result,
    });
    setLogState(ok ? 'logged' : 'failed');
  };

  // ── DOOR ────────────────────────────────────────────────────────────────
  if (!doorOpen) {
    return (
      <View style={s.doorRoot}>
        <Image source={require('@/assets/doors/door-aficionado.png')} resizeMode="cover" style={s.doorImg} />
        <View style={s.doorScrim} />
        <SafeAreaView style={s.doorContent}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backTxt}>← BACK</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Text style={[s.doorEyebrow, { color: ACCENT }]}>CONNOISSEUR · OPT-IN</Text>
          <Text style={s.doorTitle}>Aficionado</Text>
          <Text style={s.doorSub}>Your space stays yours. Cigar, pipe, strain — read for the humidor or screened against your membrane.</Text>
          <TouchableOpacity style={[s.doorBtn, { backgroundColor: ACCENT }]} onPress={() => setDoorOpen(true)}>
            <Text style={s.doorBtnTxt}>CONTINUE →</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ── LOCKED (restricted layer not armed) ──────────────────────────────────
  if (armed === false) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Text style={s.headerTitle}>AFICIONADO</Text>
          <View style={s.badge}><Text style={s.badgeText}>RESTRICTED LAYER</Text></View>
        </View>
        <View style={s.lockedCard}>
          <Text style={s.lockGlyph}>🔒</Text>
          <Text style={s.lockTitle}>RESTRICTED LAYER · OFF</Text>
          <Text style={s.lockBody}>
            Aficionado is a restricted layer, default OFF. Arm it to open cigar, pipe, strain, contaminant, dose, and interaction intelligence.
          </Text>
          <TouchableOpacity style={[s.runBtn, { marginTop: 18 }]} onPress={armAficionado}>
            <Text style={s.runBtnText}>ARM AFICIONADO →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (armed === null) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={s.loadingLabel}>READING THE MEMBRANE</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── DATA SCREEN ──────────────────────────────────────────────────────────
  const hasResult = !!result;
  const v: Verdict | undefined = result?.verdict;
  const bColor = v ? vColor(v) : ACCENT;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>AFICIONADO</Text>
        <View style={s.badge}><Text style={s.badgeText}>THE AFICIONADO</Text></View>
      </View>

      {/* CATEGORY TABS */}
      <View style={s.modeStrip}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[s.modeBtn, mode === m.id && { borderColor: ACCENT, backgroundColor: C.goldDim }]}
            onPress={() => switchMode(m.id)}
          >
            <Text style={[s.modeGlyph, mode === m.id && { color: ACCENT }]}>{m.glyph}</Text>
            <Text style={[s.modeLabel, mode === m.id && { color: ACCENT }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 88 }} keyboardShouldPersistTaps="handled">
        {hasResult && !loading ? (
          <TouchableOpacity style={[s.resetBar, { borderColor: ACCENT }]} onPress={clearResult}>
            <Text style={[s.resetBarText, { color: ACCENT }]}>◆  ENJOY SOMETHING ELSE</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.inputCard}>
            <Text style={s.modeDesc}>{active.desc}</Text>

            {/* ASK BAR */}
            <Text style={s.fieldLabel}>WHAT ARE YOU ENJOYING?</Text>
            <View style={s.rowInput}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="cigar · pipe tobacco · strain · vintage…"
                placeholderTextColor={C.muted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={run}
                returnKeyType="search"
                autoCorrect={false}
              />
              <View style={s.micBtn}><Text style={s.micTxt}>🎤</Text></View>
            </View>

            <TouchableOpacity style={s.runBtn} onPress={run}>
              <Text style={s.runBtnText}>{active.run}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={s.loadingLabel}>THE AFICIONADO IS READING</Text>
            <Text style={s.loadingSubLabel}>CONNOISSEUR INTELLIGENCE ACTIVE</Text>
          </View>
        )}

        {!!apiError && !loading && (
          <View style={[s.inputCard, { borderColor: C.red + '88' }]}>
            <Text style={[s.fieldLabel, { color: C.red }]}>READ INTERRUPTED</Text>
            <Text style={s.errorBody}>{apiError}</Text>
            <TouchableOpacity style={[s.runBtn, { backgroundColor: 'rgba(201,76,76,0.18)', borderColor: C.red }]} onPress={() => { setApiError(''); run(); }}>
              <Text style={[s.runBtnText, { color: C.red }]}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasResult && !loading && (
          <>
            <View style={[s.verdictBanner, { backgroundColor: v ? vDim(v) : C.goldDim, borderColor: bColor }]}>
              <View style={[s.verdictCircle, { borderColor: bColor }]}>
                <Text style={[s.verdictGlyph, { color: bColor }]}>{v ? vGlyph(v) : '◆'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.verdictTag, { color: bColor }]}>{v ?? 'AFICIONADO'}</Text>
                <Text style={s.verdictSubject} numberOfLines={2}>{result.subject || ''}</Text>
              </View>
            </View>

            {!!result.aficionadoVoice && (
              <View style={[s.intelBlock, { borderLeftColor: ACCENT }]}>
                <Text style={[s.intelTag, { color: ACCENT }]}>THE AFICIONADO</Text>
                <Text style={s.intelVoice}>{result.aficionadoVoice}</Text>
              </View>
            )}

            {Array.isArray(result.facts) && result.facts.map((f: any, i: number) => (
              <View key={i} style={s.dataCard}>
                <Text style={s.dataCardTitle}>{f.label}</Text>
                <Text style={s.prose}>{f.body}</Text>
              </View>
            ))}

            {!!result.pairing && (
              <View style={s.dataCard}>
                <Text style={s.dataCardTitle}>PAIRING</Text>
                <Text style={s.prose}>{result.pairing}</Text>
              </View>
            )}

            {!!result.actRightDollars && (
              <View style={s.vaultCard}>
                <Text style={s.vaultLabel}>💰  AWARE DOLLARS</Text>
                <Text style={s.vaultBody}>{result.actRightDollars}</Text>
                {logState === 'logged' ? (
                  <View style={[s.followBtn, { borderColor: lc(TH, '#8fd6ff') }]}>
                    <Text style={[s.followTxt, { color: lc(TH, '#8fd6ff') }]}>✓ LOGGED TO VAULT</Text>
                  </View>
                ) : logState === 'failed' ? (
                  <TouchableOpacity style={[s.followBtn, { borderColor: C.gold }]} onPress={follow}>
                    <Text style={[s.followTxt, { color: C.gold }]}>⚠ NOT SAVED — RETRY</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.followBtn, { borderColor: C.gold, opacity: parseDollars(result.actRightDollars) == null ? 0.4 : 1 }]}
                    onPress={follow}
                    disabled={parseDollars(result.actRightDollars) == null}
                  >
                    <Text style={[s.followTxt, { color: C.gold }]}>◆ I FOLLOWED THIS →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_s = (T: Tokens) => {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Door
  doorRoot: { flex: 1, backgroundColor: C.bg },
  doorImg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' },
  doorScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(5,13,9,0.55)' },
  doorContent: { flex: 1, padding: 24 },
  back: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.45)' },
  backTxt: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: F.mono },
  doorEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 3, marginBottom: 6 },
  doorTitle: { fontFamily: F.display, fontSize: 52, color: '#fff', letterSpacing: 3, marginBottom: 10 },
  doorSub: { fontFamily: F.serif, fontSize: 17, color: C.dim, lineHeight: 24, marginBottom: 24 },
  doorBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doorBtnTxt: { fontFamily: F.mono, fontSize: 12, color: dl(T, '#03050A', '#F0EEE8'), letterSpacing: 2, fontWeight: '600' },

  // Header
  header: { alignItems: 'center', paddingTop: 10, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontFamily: F.display, fontSize: 36, color: C.white, letterSpacing: 5, lineHeight: 40 },
  badge: { marginTop: 5, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: ACCENT, backgroundColor: C.goldDim },
  badgeText: { fontFamily: F.mono, fontSize: 8, color: ACCENT, letterSpacing: 3 },

  // Locked
  lockedCard: { margin: 12, marginTop: 24, padding: 28, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  lockGlyph: { fontSize: 40, marginBottom: 12 },
  lockTitle: { fontFamily: F.mono, fontSize: 11, color: ACCENT, letterSpacing: 2.5, marginBottom: 12 },
  lockBody: { fontFamily: F.serif, fontSize: 16, color: C.dim, lineHeight: 24, textAlign: 'center' },

  // Mode strip
  modeStrip: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, gap: 4 },
  modeGlyph: { fontFamily: F.mono, fontSize: 15, color: C.dim },
  modeLabel: { fontFamily: F.mono, fontSize: 7.5, color: C.dim, letterSpacing: 1 },

  body: { flex: 1 },

  resetBar: { marginHorizontal: 12, marginTop: 10, marginBottom: 4, paddingVertical: 13, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  resetBarText: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2 },

  inputCard: { marginHorizontal: 12, marginTop: 12, marginBottom: 8, padding: 18, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  modeDesc: { fontFamily: F.serif, fontSize: 16, color: C.dim, lineHeight: 22, marginBottom: 18, fontStyle: 'italic' },
  fieldLabel: { fontFamily: F.mono, fontSize: 9, color: C.dim, letterSpacing: 2.5, marginBottom: 8 },
  input: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.borderSoft, borderRadius: 8, color: C.white, fontFamily: F.mono, fontSize: 13, padding: 12, marginBottom: 12 },
  rowInput: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  micBtn: { width: 46, height: 46, borderRadius: 8, borderWidth: 1, borderColor: C.borderSoft, backgroundColor: C.glass, justifyContent: 'center', alignItems: 'center' },
  micTxt: { fontSize: 18 },
  runBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: ACCENT, marginTop: 2 },
  runBtnText: { fontFamily: F.mono, fontSize: 11, color: dl(T, '#03050A', '#F0EEE8'), letterSpacing: 2, fontWeight: '600' },

  loadingCard: { marginHorizontal: 12, marginVertical: 12, padding: 32, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  loadingLabel: { fontFamily: F.mono, fontSize: 11, color: ACCENT, letterSpacing: 2.5, marginTop: 16, textAlign: 'center' },
  loadingSubLabel: { fontFamily: F.mono, fontSize: 8, color: C.muted, letterSpacing: 2, marginTop: 6, textAlign: 'center' },

  errorBody: { fontFamily: F.serif, fontSize: 15, color: C.dim, lineHeight: 22, marginBottom: 14 },

  verdictBanner: { marginHorizontal: 12, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1.5, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  verdictCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  verdictGlyph: { fontFamily: F.mono, fontSize: 20, fontWeight: '700' },
  verdictTag: { fontFamily: F.mono, fontSize: 9, letterSpacing: 3, marginBottom: 4 },
  verdictSubject: { fontFamily: F.display, fontSize: 22, color: C.white, letterSpacing: 2, lineHeight: 26 },

  intelBlock: { marginHorizontal: 12, marginVertical: 5, padding: 16, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3 },
  intelTag: { fontFamily: F.mono, fontSize: 8, color: ACCENT, letterSpacing: 3, marginBottom: 10 },
  intelVoice: { fontFamily: F.serif, fontSize: 17, color: C.white, lineHeight: 26 },

  dataCard: { marginHorizontal: 12, marginVertical: 5, padding: 16, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  dataCardTitle: { fontFamily: F.mono, fontSize: 8, color: C.dim, letterSpacing: 2.5, marginBottom: 12 },
  prose: { fontFamily: F.serif, fontSize: 16, color: C.white, lineHeight: 24 },

  vaultCard: { marginHorizontal: 12, marginTop: 8, marginBottom: 5, padding: 16, backgroundColor: C.goldDim, borderRadius: 10, borderWidth: 1, borderColor: C.gold + '66' },
  vaultLabel: { fontFamily: F.mono, fontSize: 9, color: C.gold, letterSpacing: 2.5, marginBottom: 8 },
  vaultBody: { fontFamily: F.serif, fontSize: 16, color: C.white, lineHeight: 24 },
  followBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  followTxt: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
});
};

