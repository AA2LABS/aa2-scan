import React from 'react';
import { DoorFlood, useProfile, type Row, GREEN, AMBER } from '@/components/DoorFlood';
const SAND = '#D49A4A';

export default function DepthOnDemandScreen() {
  const { p } = useProfile();
  const allergens = p?.foodAllergens ?? [];
  const conds = p?.conditions ?? [];
  const home = p?.homeLocation ?? null;

  const rows: Row[] = [
    { icon: '◎', title: 'Tied To What You Scan',
      desc: 'Every flagged chemical opens a lesson. Depth only when you ask for it.',
      chip: 'LIVE', chipColor: SAND },
    { icon: '◉', title: 'Your Chemistry',
      desc: allergens.length ? `Lessons queued for: ${allergens.join(', ')}`
                             : 'Scan something flagged and the lesson appears here.',
      chip: allergens.length ? String(allergens.length) : 'OPEN', chipColor: allergens.length ? SAND : AMBER },
    { icon: '⚘', title: 'Your Conditions',
      desc: conds.length ? `Context curated for: ${conds.join(', ')}` : 'No conditions declared.',
      chip: conds.length ? 'CURATED' : 'CLEAR', chipColor: conds.length ? SAND : GREEN },
    { icon: '◈', title: 'Language By Location',
      desc: home ? `Anchored to ${home}. Survival relevance — you learn what you scan.`
                 : 'Scan a foreign label and learn the language through it.',
      chip: 'GPS', chipColor: SAND },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-depth-on-demand.png')}
      eyebrow="SPOKE 17 · LEARNING"
      title="Depth-On-Demand"
      accent={SAND}
      heroLine="Curated depth, tied to where you are."
      heroSub="Information with no context. Learning with no anchor — not here."
      rows={rows}
      foot="Agency beats restriction."
    />
  );
}
