import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dl, useTheme, type Tokens } from '@/lib/theme-mode';
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

interface SeverityCardProps {
  level: SeverityLevel;
  title: string;
  body: string;
  detail?: string;
}

/**
 * ─── THE FIVE-LEVEL LADDER, IN BOTH MODES ───────────────────────────────────
 *
 *   1 RED    ☠ IMMEDIATE DANGER      2 ORANGE ⚠ SERIOUS CAUTION
 *   3 GOLD   ◉ TAKE NOTICE           4 BLUE   ● INFORMATION
 *   5 GREEN  ◆ ACT RIGHT
 *
 * The DARK hexes below were #E05252 · #E8873A · #C49A2A · #1BB8FF · #1D9E75 and
 * they still are — T.sev1..sev5 in dark mode resolve to exactly those five
 * values, which is why this table could stop repeating them. Nothing moved.
 *
 * The LIGHT five are the founder's own, not a dimmed copy of the dark five:
 *   #C0392B · #BC6217 · #9A7418 · #0B79B0 · #12795A
 * They exist because a level has to READ AS ITS OWN LEVEL at both ends. A
 * severity that goes muddy on cream is a severity the member misreads, and a
 * misread severity is the one failure this component cannot have.
 *
 * CARD LAW: fill 12% · border 40% · border always stronger than the fill.
 */
function tint(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const LEVEL_META = {
  1: { icon: '☠', label: 'DANGER'      },
  2: { icon: '⚠', label: 'CAUTION'     },
  3: { icon: '◉', label: 'TAKE NOTICE' },
  4: { icon: '●', label: 'INFO'        },
  5: { icon: '◆', label: 'ACT RIGHT'   },
} as const;

const levelConfig = (T: Tokens) => {
  const hue: Record<SeverityLevel, string> = { 1: T.sev1, 2: T.sev2, 3: T.sev3, 4: T.sev4, 5: T.sev5 };
  const fill: Record<SeverityLevel, number> = { 1: 0.12, 2: 0.12, 3: 0.12, 4: 0.08, 5: 0.12 };
  const edge: Record<SeverityLevel, number> = { 1: 0.40, 2: 0.40, 3: 0.40, 4: 0.25, 5: 0.35 };
  const out = {} as Record<SeverityLevel, { color: string; bg: string; border: string; icon: string; label: string }>;
  ([1, 2, 3, 4, 5] as SeverityLevel[]).forEach(l => {
    out[l] = { color: hue[l], bg: tint(hue[l], fill[l]), border: tint(hue[l], edge[l]), ...LEVEL_META[l] };
  });
  return out;
};


export default function SeverityCard({ level, title, body, detail }: SeverityCardProps) {
  const TH = useTheme();
  const st = useMemo(() => make_st(TH), [TH]);

  const cfg = levelConfig(TH)[level];
  return (
    <View style={[st.card, {
      backgroundColor: cfg.bg,
      borderColor:     cfg.border,
      borderLeftColor: cfg.color,
    }]}>
      <View style={st.header}>
        <Text style={[st.icon, { color: cfg.color }]}>{cfg.icon}</Text>
        <Text style={[st.label, { color: cfg.color }]}>{cfg.label} · {title}</Text>
      </View>
      <Text style={st.body}>{body}</Text>
      {detail && <Text style={st.detail}>{detail}</Text>}
    </View>
  );
}

/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_st = (T: Tokens) => {
  return StyleSheet.create({
  card: {
    borderRadius:    12,
    padding:         14,
    marginBottom:    10,
    borderWidth:      1,
    borderLeftWidth:  3,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            8,
    marginBottom:   6,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontFamily:    'DMMono-Medium',
    fontSize:       10,
    letterSpacing:  2,
  },
  body: {
    fontFamily: 'DMSans-Regular',
    fontSize:    13,
    color:       dl(T, 'rgba(255,255,255,0.85)', 'rgba(0,0,0,0.82)'),
    lineHeight:  20,
  },
  detail: {
    fontFamily:    'DMMono-Regular',
    fontSize:       10,
    color:         dl(T, 'rgba(255,255,255,0.50)', 'rgba(0,0,0,0.5)'),
    marginTop:      6,
    lineHeight:    16,
    letterSpacing:  0.5,
  },
});
};

