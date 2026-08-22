// ─── components/DoctrineOverlay.tsx ───────────────────────────────────────────
// AA2 Doctrine Overlay · Scan result panel
// v50 · Mockup-locked against panel #2 (Scan Result with Doctrine Overlay)
//
// Renders a DoctrineVerdict from lib/scan-with-doctrine.ts
// Dark UI canonical: navy #0E1B33, gold #D4A847, green #34D399,
// cyan #1BB8FF, red #E24B4A, ◆ signature mark.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { DoctrineVerdict, Verdict } from '../lib/chemical-doctrine';

import { dl, useTheme, type Tokens } from '@/lib/theme-mode';
/** TWO MODES, ONE PALETTE — dark literals kept verbatim; light from the founder's file. */
const colorsFor = (T: Tokens) => ({
  navyDeep: dl(T, '#0E1B33', '#F0EEE8'),
  navyMid: dl(T, '#162544', '#FAF7F2'),
  navyCard: dl(T, '#1A2D52', '#FFFFFF'),
  gold: dl(T, '#D4A847', '#b8861e'),
  green: dl(T, '#34D399', '#12795A'),
  cyan: dl(T, '#1BB8FF', '#2a7faa'),
  red: dl(T, '#E24B4A', '#C0392B'),
  amber: dl(T, '#F59E0B', '#9A7418'),
  textHi: '#F5F1E8',
  textMid: dl(T, '#A8B2CC', 'rgba(0,0,0,0.55)'),
  textLow: dl(T, '#6B7896', 'rgba(0,0,0,0.38)'),
  border: dl(T, '#2A3D66', 'rgba(0,0,0,0.12)'),
});

function verdictColor(T: Tokens, v: Verdict): string {
  const C = colorsFor(T);
  switch (v) {
    case 'ALL CLEAR':     return C.green;
    case 'TAKE NOTICE':   return C.amber;
    case 'PAY ATTENTION': return C.red;
    default:              return C.textMid;
  }
}

export interface DoctrineOverlayProps {
  verdict: DoctrineVerdict;
  productName?: string;
  memberName?: string;
  cumulativeLoadScore?: number;
  onAlternative?: () => void;
  onDismiss?: () => void;
}

export function DoctrineOverlay(props: DoctrineOverlayProps) {
  const TH = useTheme();
  const C = colorsFor(TH);
  const styles = useMemo(() => make_styles(TH), [TH]);

  const {
    verdict,
    productName,
    memberName,
    cumulativeLoadScore,
    onAlternative,
    onDismiss,
  } = props;

  const accent = verdictColor(TH, verdict.verdict);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER · brand mark + verdict pill */}
      <View style={styles.header}>
        <Text style={styles.brand}>◆ AA2</Text>
        {memberName ? (
          <Text style={styles.memberLabel}>FOR {memberName.toUpperCase()}</Text>
        ) : (
          <Text style={styles.memberLabel}>GENERIC SCAN</Text>
        )}
      </View>

      {/* VERDICT PILL */}
      <View style={[styles.verdictPill, { borderColor: accent }]}>
        <View style={[styles.verdictDot, { backgroundColor: accent }]} />
        <Text style={[styles.verdictText, { color: accent }]}>
          {verdict.verdict}
        </Text>
      </View>

      {/* PRODUCT NAME */}
      {productName ? (
        <Text style={styles.productName}>{productName}</Text>
      ) : null}

      {/* ALLERGEN ALERTS · always first per doctrine */}
      {verdict.allergenAlerts.length > 0 && (
        <View style={[styles.section, styles.sectionAlert]}>
          <Text style={styles.sectionLabel}>⚠ ALLERGEN ALERTS</Text>
          {verdict.allergenAlerts.map((a, i) => (
            <View key={`a-${i}`} style={styles.alertRow}>
              <Text style={styles.alertName}>{a.allergenName.toUpperCase()}</Text>
              <Text style={[styles.alertSeverity, { color: C.red }]}>
                {a.severity}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* GOAL CONFLICTS */}
      {verdict.goalConflicts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>↗ GOAL CONFLICTS</Text>
          {verdict.goalConflicts.map((g, i) => (
            <View key={`g-${i}`} style={styles.goalRow}>
              <Text style={styles.goalLabel}>{g.goalLabel}</Text>
              <Text style={styles.goalReason}>{g.plainLanguage}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CHEMICAL FLAGS */}
      {verdict.chemicalFlags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>◆ CHEMICAL FLAGS</Text>
          {verdict.chemicalFlags.map((c, i) => (
            <View key={`c-${i}`} style={styles.chemRow}>
              <Text style={styles.chemName}>{c.chemical}</Text>
              <Text style={styles.chemCategory}>
                {c.category.toUpperCase()}
              </Text>
              <Text style={styles.chemConcern}>{c.concern}</Text>
            </View>
          ))}
        </View>
      )}

      {/* SENSITIVITY NOTE */}
      {verdict.sensitivityNote ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>SENSITIVITY</Text>
          <Text style={styles.noteText}>{verdict.sensitivityNote}</Text>
        </View>
      ) : null}

      {/* CUMULATIVE WARNING */}
      {verdict.cumulativeWarning ? (
        <View style={[styles.noteBox, { borderColor: C.amber }]}>
          <Text style={[styles.noteLabel, { color: C.amber }]}>
            CUMULATIVE LOAD
          </Text>
          <Text style={styles.noteText}>{verdict.cumulativeWarning}</Text>
          {typeof cumulativeLoadScore === 'number' ? (
            <Text style={styles.scoreText}>
              30-DAY SCORE · {cumulativeLoadScore}/100
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* ALTERNATIVE CTA */}
      {verdict.alternativeCTA ? (
        <TouchableOpacity
          style={[styles.ctaButton, { borderColor: C.cyan }]}
          onPress={onAlternative}
          activeOpacity={0.7}
        >
          <Text style={[styles.ctaText, { color: C.cyan }]}>
            {verdict.alternativeCTA}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* DISMISS */}
      {onDismiss ? (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          activeOpacity={0.6}
        >
          <Text style={styles.dismissText}>DISMISS</Text>
        </TouchableOpacity>
      ) : null}

      {/* SIGNATURE FOOTER */}
      <Text style={styles.footer}>◆ AA2 BIOMESH · v50</Text>
    </ScrollView>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_styles = (T: Tokens) => {
  const C = colorsFor(T);
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.navyDeep,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    color: C.gold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  memberLabel: {
    color: C.textLow,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  verdictPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  verdictText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  productName: {
    color: C.textHi,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: C.navyMid,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.border,
  },
  sectionAlert: {
    borderLeftColor: C.red,
  },
  sectionLabel: {
    color: C.textLow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  alertName: {
    color: C.textHi,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  alertSeverity: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  goalRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  goalLabel: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalReason: {
    color: C.textMid,
    fontSize: 13,
    lineHeight: 18,
  },
  chemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  chemName: {
    color: C.textHi,
    fontSize: 13,
    fontWeight: '600',
  },
  chemCategory: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  chemConcern: {
    color: C.textMid,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  noteBox: {
    backgroundColor: C.navyCard,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  noteLabel: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  noteText: {
    color: C.textHi,
    fontSize: 13,
    lineHeight: 19,
  },
  scoreText: {
    color: C.amber,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 8,
  },
  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderRadius: 4,
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: dl(T, 'rgba(27,184,255,0.05)', 'rgba(42,127,170,0.05)'),
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  dismissButton: {
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  dismissText: {
    color: C.textLow,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  footer: {
    color: C.textLow,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.5,
  },
});
};


export default DoctrineOverlay;
