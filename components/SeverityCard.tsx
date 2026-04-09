import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

interface SeverityCardProps {
  level: SeverityLevel;
  title: string;
  body: string;
  detail?: string;
}

const LEVEL_CONFIG = {
  1: {
    color:  '#E05252',
    bg:     'rgba(224,82,82,0.12)',
    border: 'rgba(224,82,82,0.40)',
    icon:   '☠',
    label:  'DANGER',
  },
  2: {
    color:  '#E8873A',
    bg:     'rgba(232,135,58,0.12)',
    border: 'rgba(232,135,58,0.40)',
    icon:   '⚠',
    label:  'CAUTION',
  },
  3: {
    color:  '#C49A2A',
    bg:     'rgba(196,154,42,0.12)',
    border: 'rgba(196,154,42,0.40)',
    icon:   '◉',
    label:  'TAKE NOTICE',
  },
  4: {
    color:  '#1BB8FF',
    bg:     'rgba(27,184,255,0.08)',
    border: 'rgba(27,184,255,0.25)',
    icon:   '●',
    label:  'INFO',
  },
  5: {
    color:  '#1D9E75',
    bg:     'rgba(29,158,117,0.12)',
    border: 'rgba(29,158,117,0.35)',
    icon:   '◆',
    label:  'ACT RIGHT',
  },
};

export default function SeverityCard({ level, title, body, detail }: SeverityCardProps) {
  const cfg = LEVEL_CONFIG[level];
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

const st = StyleSheet.create({
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
    color:       'rgba(255,255,255,0.85)',
    lineHeight:  20,
  },
  detail: {
    fontFamily:    'DMMono-Regular',
    fontSize:       10,
    color:         'rgba(255,255,255,0.50)',
    marginTop:      6,
    lineHeight:    16,
    letterSpacing:  0.5,
  },
});
