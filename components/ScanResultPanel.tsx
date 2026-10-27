// ─── components/ScanResultPanel.tsx ──────────────────────────────────────────
// PANEL 02 · SCAN RESULT · DOCTRINE OVERLAY
//
// Built 2026-10-26 to the approved mockup at
//   AA2 Panama QR CODES canibus panel/aa2_panel_02_scan_result.html
//
// THIS IS A REWIRE, NOT A DESIGN. Canon §4.6: "ALL MOCKUPS MUST MIRROR THE
// ACTUAL SCREENS... If a screen does not exist yet, say so plainly and ask —
// do not design one." Here the mockup is the approved one and the screen never
// caught up to it. The founder's own Canon v70 amendment of 2026-09-19 listed
// it as outstanding in as many words: "Scanner panels 01, 02 and 12 — profile
// selector does not exist; result screen is not to panel specification."
//
// Section order below is the panel's order, top to bottom, and it is also the
// SEVERITY RULE: allergen first, goal second, chemistry third, context last.
// A member must never scroll to find a lethal warning.
//
// EVERY SECTION IS CONDITIONAL. A section with no data does not render an
// empty shell — NO FAKE DATA, and a blank is a truthful blank.

import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { dl, lc, type Tokens } from '@/lib/theme-mode';

/* ── THE PANEL'S OWN SHAPES ───────────────────────────────────────────────── */

export type AllergenMatch = {
  allergen: string;
  severity?: string | null;        // SEVERE · MODERATE · MILD
  matchedAs?: string[] | null;     // the actual ingredient words found
  onset?: string | null;           // "~15 min"
  reactions?: string[] | null;     // RESPIRATORY · SKIN
  primaryIngredient?: boolean | null;
};

export type GoalConflict = {
  goal: string;
  conflictedBy?: string[] | null;
  why?: string | null;
};

export type ChemicalFlag = {
  name: string;
  role?: string | null;            // DYE · PRESERVATIVE · SWEETENER
  impact?: string | null;
  severity?: 'red' | 'amber' | null;
};

export type BrandHistory = {
  recalls?: number | null;
  window?: string | null;          // "5 YEAR PATTERN"
  note?: string | null;
};

export type ScanningFor = {
  name: string;
  role?: string | null;            // CHILD · ADULT
  age?: number | null;
  multiplier?: number | null;      // 2.0 for a child
};

type Props = {
  TH: Tokens;
  scanningFor?: ScanningFor | null;
  onSwitchProfile?: () => void;
  brand?: string | null;
  barcode?: string | null;
  allergenMatch?: AllergenMatch | null;
  goalConflict?: GoalConflict | null;
  chemicalFlags?: ChemicalFlag[] | null;
  /** 0–100. From lib/exposure-tracker computeCumulativeLoad — never invented. */
  cumulativeLoad?: number | null;
  brandHistory?: BrandHistory | null;
  /** The Paper Layer signature, Canon Part XVI: ◆ · initials · date · 4-char code. */
  paperCode?: string | null;
  onFindAlternative?: () => void;
  onSaveToRecord?: () => void;
  onShare?: () => void;
};

/* ── THE PAPER LAYER CODE ─────────────────────────────────────────────────────
   Canon Part XVI: "Every print carries: the ◆ glyph · member initials · date ·
   a 4-character re-scan code." The code is DETERMINISTIC — the same scan
   always yields the same four characters, because a re-scan code that changes
   every render cannot bind a printed artifact back to its digital record.
   Ambiguous glyphs (0/O, 1/I) are left out so a human can read it off paper. */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function paperCodeFor(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let out = '';
  for (let i = 0; i < 4; i++) { h = Math.imul(h ^ (h >>> 13), 16777619); out += CODE_ALPHABET[Math.abs(h) % CODE_ALPHABET.length]; }
  return out;
}

export function initialsFor(name?: string | null): string {
  if (!name) return '—';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

const stampDate = (d = new Date()) =>
  `${String(d.getDate()).padStart(2, '0')}·${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}·${String(d.getFullYear()).slice(-2)}`;

/* ── THE PANEL ────────────────────────────────────────────────────────────── */

export function ScanResultPanel(p: Props) {
  const T = p.TH;
  const C = {
    ink:    dl(T, '#FFFFFF', '#1a1a1a'),
    muted:  dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)'),
    faint:  dl(T, 'rgba(255,255,255,0.32)', 'rgba(0,0,0,0.38)'),
    line:   dl(T, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.10)'),
    lineUp: dl(T, 'rgba(255,255,255,0.16)', 'rgba(0,0,0,0.16)'),
    card:   dl(T, 'rgba(255,255,255,0.05)', '#FFFFFF'),
    red:    dl(T, '#E24B4A', '#C0392B'),
    amber:  dl(T, '#C49A2A', '#9A7418'),
    cyan:   dl(T, '#1BB8FF', '#0B79B0'),
    green:  dl(T, '#34D399', '#12795A'),
    gold:   dl(T, '#D4A847', '#b8861e'),
  };

  const sf = p.scanningFor;
  const flags = (p.chemicalFlags ?? []).filter(f => f && f.name);

  const Label = ({ text, tone }: { text: string; tone: string }) => (
    <Text style={[st.sectionLabel, { color: tone }]}>{text}</Text>
  );

  return (
    <View style={st.wrap}>

      {/* ── PROFILE CONTEXT ───────────────────────────────────────────────────
          Panel 02 leads with WHO this verdict is for, before the product.
          The same bottle is a different answer for a nine-year-old. */}
      {sf?.name ? (
        <View style={[st.profileRow, { borderColor: C.line, backgroundColor: C.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[st.profileName, { color: C.ink }]}>Scanning for {sf.name}</Text>
            <Text style={[st.profileMeta, { color: C.green }]}>
              {[sf.role, sf.age != null ? `${sf.age}YR` : null, sf.multiplier ? `${sf.multiplier.toFixed(1)}× SENSITIVITY` : null]
                .filter(Boolean).join(' · ')}
            </Text>
          </View>
          {p.onSwitchProfile ? (
            <Pressable onPress={p.onSwitchProfile} hitSlop={8}>
              <Text style={[st.switch, { color: C.cyan, borderColor: C.lineUp }]}>SWITCH</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* ── PRODUCT PROVENANCE ───────────────────────────────────────────────
          The brand and the barcode. The panel shows them because a verdict
          without the thing it judged is an opinion. */}
      {(p.brand || p.barcode) ? (
        <View style={st.provenance}>
          {p.brand ? <Text style={[st.brand, { color: C.faint }]}>{p.brand}</Text> : null}
          {p.barcode ? <Text style={[st.barcode, { color: C.muted }]}>◇ {p.barcode}</Text> : null}
        </View>
      ) : null}

      {/* ── 1 · ALLERGEN MATCH — THE MOST DANGEROUS THING FIRST ─────────────── */}
      {p.allergenMatch?.allergen ? (
        <View style={st.section}>
          <Label text="⚠ ALLERGEN MATCH" tone={C.red} />
          <View style={[st.card, { borderColor: lc(T, 'rgba(226,75,74,0.45)'), backgroundColor: lc(T, 'rgba(226,75,74,0.10)') }]}>
            <View style={st.cardTop}>
              <Text style={[st.cardName, { color: C.ink }]}>{p.allergenMatch.allergen.toUpperCase()}</Text>
              {p.allergenMatch.severity ? (
                <Text style={[st.pill, { color: C.red, borderColor: C.red }]}>{p.allergenMatch.severity.toUpperCase()}</Text>
              ) : null}
            </View>
            {p.allergenMatch.matchedAs?.length ? (
              <Text style={[st.cardBody, { color: C.muted }]}>
                Found as <Text style={{ color: C.ink, fontWeight: '700' }}>{p.allergenMatch.matchedAs.join(', ')}</Text>
                {p.allergenMatch.primaryIngredient ? ' in the primary ingredient list.' : '.'}
                {sf?.multiplier && sf.multiplier > 1 ? ' Pediatric severity tier active.' : ''}
              </Text>
            ) : null}
            {(p.allergenMatch.onset || p.allergenMatch.reactions?.length) ? (
              <View style={[st.metaRow, { borderTopColor: C.line }]}>
                {p.allergenMatch.onset ? (
                  <Text style={[st.metaK, { color: C.faint }]}>ONSET <Text style={{ color: C.ink }}>{p.allergenMatch.onset.toUpperCase()}</Text></Text>
                ) : null}
                {p.allergenMatch.reactions?.length ? (
                  <Text style={[st.metaK, { color: C.faint }]}>REACTIONS <Text style={{ color: C.ink }}>{p.allergenMatch.reactions.join(' · ').toUpperCase()}</Text></Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ── 2 · GOAL CONFLICT ────────────────────────────────────────────────
          The Intent Alignment Check of the Six-Step Flow, made visible: does
          this help or hinder what the member said they were going for. */}
      {p.goalConflict?.goal ? (
        <View style={st.section}>
          <Label text="▲ GOAL CONFLICT" tone={C.amber} />
          <View style={[st.card, { borderColor: lc(T, 'rgba(196,154,42,0.40)'), backgroundColor: lc(T, 'rgba(196,154,42,0.10)') }]}>
            <View style={st.cardTop}>
              <Text style={[st.cardName, { color: C.ink }]}>{p.goalConflict.goal}</Text>
              <Text style={[st.pill, { color: C.amber, borderColor: C.amber }]}>CONFLICTED</Text>
            </View>
            {p.goalConflict.why ? (
              <Text style={[st.cardBody, { color: C.muted }]}>
                {p.goalConflict.conflictedBy?.length ? (
                  <>Conflicted by <Text style={{ color: C.amber, fontWeight: '700' }}>{p.goalConflict.conflictedBy.join(', ')}</Text>. </>
                ) : null}
                {p.goalConflict.why}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ── 3 · CHEMICAL FLAGS ───────────────────────────────────────────────
          CHEMICAL DOCTRINE on the screen. Not "contains X" — what X does over
          time to this biology, in this context. The count is in the label so
          the number never travels naked. */}
      {flags.length ? (
        <View style={st.section}>
          <Label text={`◆ CHEMICAL FLAGS · ${flags.length}`} tone={C.cyan} />
          <View style={[st.card, { borderColor: C.line, backgroundColor: C.card }]}>
            {flags.map((f, i) => (
              <View key={i} style={[st.chemRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }]}>
                <View style={[st.marker, { backgroundColor: f.severity === 'red' ? C.red : C.amber }]} />
                <View style={{ flex: 1 }}>
                  <View style={st.chemHead}>
                    <Text style={[st.chemName, { color: C.ink }]}>{f.name}</Text>
                    {f.role ? <Text style={[st.role, { color: C.faint, borderColor: C.line }]}>{f.role.toUpperCase()}</Text> : null}
                  </View>
                  {f.impact ? <Text style={[st.chemImpact, { color: C.muted }]}>{f.impact}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── 4 · SENSITIVITY CONTEXT ──────────────────────────────────────────
          Chemical Doctrine Principle 4, printed: children, animals and
          stressed adults are not mini adults. */}
      {sf?.multiplier && sf.multiplier > 1 ? (
        <View style={st.section}>
          <Label text="◇ SENSITIVITY CONTEXT" tone={C.cyan} />
          <View style={[st.card, { borderColor: C.line, backgroundColor: C.card }]}>
            <Text style={[st.lbl, { color: C.cyan }]}>
              {(sf.role ?? 'MEMBER').toUpperCase()} MULTIPLIER · {sf.multiplier.toFixed(1)}×
            </Text>
            <Text style={[st.cardBody, { color: C.muted, marginTop: 4 }]}>
              {sf.name} is {sf.age ?? '—'}. Sensitivity scales{' '}
              <Text style={{ color: C.ink, fontWeight: '700' }}>{sf.multiplier.toFixed(1)}× adult baseline</Text>.
              A serving that registers as minor for you may register as moderate-to-severe for {sf.name}.
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── 5 · 30-DAY CUMULATIVE LOAD ───────────────────────────────────────
          Chemical Doctrine Principle 2: exposure beats label, and load stacks.
          The number comes from lib/exposure-tracker, never from the model. */}
      {p.cumulativeLoad != null ? (() => {
        const v = Math.max(0, Math.min(100, Math.round(p.cumulativeLoad!)));
        const band = v >= 67 ? 'HIGH' : v >= 34 ? 'MODERATE' : 'LOW';
        const tone = v >= 67 ? C.red : v >= 34 ? C.amber : C.green;
        return (
          <View style={st.section}>
            <Label text="⌐ 30-DAY CUMULATIVE LOAD" tone={C.cyan} />
            <View style={[st.loadRow, { borderColor: C.line, backgroundColor: C.card }]}>
              <Text style={[st.loadLbl, { color: tone }]}>{(sf?.name ?? 'YOU').toUpperCase()} · {band}</Text>
              <View style={[st.bar, { backgroundColor: C.line }]}>
                <View style={[st.barFill, { width: `${v}%`, backgroundColor: tone }]} />
              </View>
              <Text style={[st.loadV, { color: tone }]}>{v}</Text>
            </View>
          </View>
        );
      })() : null}

      {/* ── 6 · BRAND HISTORY ────────────────────────────────────────────────
          Manufacturer-level pattern, stated as pattern and never as a verdict
          on the item in hand. */}
      {p.brandHistory?.recalls != null ? (
        <View style={st.section}>
          <Label text="⊕ BRAND HISTORY" tone={C.amber} />
          <View style={[st.recallRow, { borderColor: C.line, backgroundColor: C.card }]}>
            <Text style={[st.recallNum, { color: C.amber }]}>{p.brandHistory.recalls}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[st.lbl, { color: C.faint }]}>RECALLS · {p.brandHistory.window ?? 'PATTERN'}</Text>
              {p.brandHistory.note ? <Text style={[st.chemImpact, { color: C.muted, marginTop: 2 }]}>{p.brandHistory.note}</Text> : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* ── CLOSING · THE PAPER LAYER SIGNATURE ──────────────────────────────
          Canon Part XVI: every scanner result is printable and every print
          carries the ◆ glyph, the member's initials, the date and a 4-character
          re-scan code. The signature renders on screen so the printed page and
          the digital record are the same artifact. */}
      <View style={[st.closing, { borderTopColor: C.line }]}>
        <Text style={[st.quote, { color: C.muted }]}>When the body speaks, the doctrine listens.</Text>
        <Text style={[st.sig, { color: C.faint }]}>
          <Text style={{ color: C.gold }}>◆</Text>  SCAN · {initialsFor(sf?.name)} · {stampDate()} · {p.paperCode ?? '————'}
        </Text>
      </View>

      {/* ── PRIMARY ACTION ───────────────────────────────────────────────────
          NEVER A BARE NO, ALWAYS A BETTER YES. */}
      {p.onFindAlternative ? (
        <Pressable onPress={p.onFindAlternative} style={[st.primary, { borderColor: C.cyan, backgroundColor: lc(T, 'rgba(27,184,255,0.10)') }]}>
          <Text style={[st.primaryL, { color: C.cyan }]}>Find safe alternative{sf?.name ? ` for ${sf.name}` : ''}</Text>
          <Text style={[st.primaryL, { color: C.cyan }]}>→</Text>
        </Pressable>
      ) : null}

      {/* ── SECONDARY ACTIONS ────────────────────────────────────────────────
          Spoke 32: the structured handoff to a licensed professional. AA2
          organises the question; it never renders the judgment. */}
      {(p.onSaveToRecord || p.onShare) ? (
        <View style={st.secRow}>
          {p.onSaveToRecord ? (
            <Pressable onPress={p.onSaveToRecord} style={[st.sec, { borderColor: C.line }]}>
              <Text style={[st.secL, { color: C.muted }]}>Save to record</Text>
            </Pressable>
          ) : null}
          {p.onShare ? (
            <Pressable onPress={p.onShare} style={[st.sec, { borderColor: C.line }]}>
              <Text style={[st.secL, { color: C.muted }]}>Share · clinician</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* ── STYLE · fonts are the seven the app loads, nothing invented ──────────── */
const st = StyleSheet.create({
  wrap:         { marginTop: 4 },
  section:      { marginTop: 14 },
  sectionLabel: { fontFamily: 'DMMono-Medium', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  profileRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10 },
  profileName:  { fontFamily: 'DMSans-Regular', fontSize: 14, fontWeight: '700' },
  profileMeta:  { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.2, marginTop: 2 },
  switch:       { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.6, borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
  provenance:   { marginTop: 8 },
  brand:        { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.6 },
  barcode:      { fontFamily: 'DMMono-Regular', fontSize: 11, letterSpacing: 1.2, marginTop: 3 },
  card:         { borderWidth: 1, borderRadius: 10, padding: 12 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName:     { fontFamily: 'BebasNeue-Regular', fontSize: 20, letterSpacing: 1.2, flexShrink: 1 },
  pill:         { fontFamily: 'DMMono-Medium', fontSize: 9, letterSpacing: 1.4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  cardBody:     { fontFamily: 'DMSans-Regular', fontSize: 12.5, lineHeight: 18, marginTop: 7 },
  metaRow:      { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 8, gap: 10, flexWrap: 'wrap' },
  metaK:        { fontFamily: 'DMMono-Regular', fontSize: 9, letterSpacing: 1.2 },
  chemRow:      { flexDirection: 'row', gap: 10, paddingVertical: 9 },
  marker:       { width: 3, borderRadius: 2, alignSelf: 'stretch' },
  chemHead:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  chemName:     { fontFamily: 'DMSans-Regular', fontSize: 13, fontWeight: '700' },
  role:         { fontFamily: 'DMMono-Regular', fontSize: 8, letterSpacing: 1.2, borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, overflow: 'hidden' },
  chemImpact:   { fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 17, marginTop: 3 },
  lbl:          { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.4 },
  loadRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12 },
  loadLbl:      { fontFamily: 'DMMono-Medium', fontSize: 9.5, letterSpacing: 1.4 },
  bar:          { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: 5, borderRadius: 3 },
  loadV:        { fontFamily: 'BebasNeue-Regular', fontSize: 17, letterSpacing: 1 },
  recallRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12 },
  recallNum:    { fontFamily: 'BebasNeue-Regular', fontSize: 30, letterSpacing: 1 },
  closing:      { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 18, paddingTop: 12, alignItems: 'center' },
  quote:        { fontFamily: 'CormorantGaramond-Italic', fontSize: 15, textAlign: 'center' },
  sig:          { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.4, marginTop: 7 },
  primary:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 14, marginTop: 14 },
  primaryL:     { fontFamily: 'DMSans-Regular', fontSize: 13.5, fontWeight: '700' },
  secRow:       { flexDirection: 'row', gap: 8, marginTop: 8 },
  sec:          { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  secL:         { fontFamily: 'DMSans-Regular', fontSize: 12.5 },
});

export default ScanResultPanel;
