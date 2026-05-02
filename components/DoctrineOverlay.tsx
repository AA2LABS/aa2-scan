// ─── components/DoctrineOverlay.tsx ───────────────────────────────────────────
// AA2 Doctrine Overlay · Scan result panel
// v50 · Mockup-locked against panel #2 (Scan Result with Doctrine Overlay)
//
// Renders a DoctrineVerdict from lib/scan-with-doctrine.ts
// Dark UI canonical: navy #0E1B33, gold #D4A847, green #34D399,
// cyan #1BB8FF, red #E24B4A, ◆ signature mark.

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { DoctrineVerdict, Verdict } from '../lib/chemical-doctrine';

const COLORS = {
  navyDeep: '#0E1B33',
  navyMid:  '#162544',
  navyCard: '#1A2D52',
  gold:     '#D4A847',
  green:    '#34D399',
  cyan:     '#1BB8FF',
  red:      '#E24B4A',
  amber:    '#F59E0B',
  textHi:   '#F5F1E8',
  textMid:  '#A8B2CC',
  textLow:  '#6B7896',
  border:   '#2A3D66',
};

function verdictColor(v: Verdict): string {
  switch (v) {
    case 'ALL CLEAR':     return COLORS.green;
    case 'TAKE NOTICE':   return COLORS.amber;
    case 'PAY ATTENTION': return COLORS.red;
    default:              return COLORS.textMid;
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
  const {
    verdict,
    productName,
    memberName,
    cumulativeLoadScore,
    onAlternative,
    onDismiss,
  } = props;

  const accent = verdictColor(verdict.verdict);

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
              <Text style={styles.alertName}>{a.name.toUpperCase()}</Text>
              <Text style={[styles.alertSeverity, { color: COLORS.red }]}>
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
              <Text style={styles.goalReason}>{g.reason}</Text>
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
        <View style={[styles.noteBox, { borderColor: COLORS.amber }]}>
          <Text style={[styles.noteLabel, { color: COLORS.amber }]}>
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
          style={[styles.ctaButton, { borderColor: COLORS.cyan }]}
          onPress={onAlternative}
          activeOpacity={0.7}
        >
          <Text style={[styles.ctaText, { color: COLORS.cyan }]}>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
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
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  memberLabel: {
    color: COLORS.textLow,
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
    color: COLORS.textHi,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: COLORS.navyMid,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.border,
  },
  sectionAlert: {
    borderLeftColor: COLORS.red,
  },
  sectionLabel: {
    color: COLORS.textLow,
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
    borderBottomColor: COLORS.border,
  },
  alertName: {
    color: COLORS.textHi,
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
    borderBottomColor: COLORS.border,
  },
  goalLabel: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalReason: {
    color: COLORS.textMid,
    fontSize: 13,
    lineHeight: 18,
  },
  chemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chemName: {
    color: COLORS.textHi,
    fontSize: 13,
    fontWeight: '600',
  },
  chemCategory: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  chemConcern: {
    color: COLORS.textMid,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  noteBox: {
    backgroundColor: COLORS.navyCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  noteLabel: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  noteText: {
    color: COLORS.textHi,
    fontSize: 13,
    lineHeight: 19,
  },
  scoreText: {
    color: COLORS.amber,
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
    backgroundColor: 'rgba(27,184,255,0.05)',
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
    color: COLORS.textLow,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  footer: {
    color: COLORS.textLow,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.5,
  },
});

export default DoctrineOverlay;
