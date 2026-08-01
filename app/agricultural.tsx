import React from 'react';
import { DoorFlood, useProfile, type Row, GREEN, AMBER } from '@/components/DoorFlood';
const LEAF = '#5FA83C';

export default function AgriculturalScreen() {
  const { p } = useProfile();
  const species = (p?.animalSpecies ?? '').toLowerCase();
  const hasStock = species.includes('cattle') || species.includes('cow');

  const rows: Row[] = [
    { icon: '◉', title: 'Your Livestock',
      desc: hasStock ? `${p?.animalSpecies} on file. Feed stack screened per head.`
                     : 'No livestock in the membrane. Add them in the checklist.',
      chip: hasStock ? 'ON FILE' : 'EMPTY', chipColor: hasStock ? GREEN : AMBER },
    { icon: '⚘', title: 'Mycotoxin Screen',
      desc: 'Batch contamination checked against herd baseline. Quarantine flagged.',
      chip: 'LIVE', chipColor: LEAF },
    { icon: '⚠', title: 'Feed Additives',
      desc: 'Every additive named in plain language. USDA feed-safety cross-check.',
      chip: 'USDA', chipColor: LEAF },
    { icon: '◈', title: 'Herd Baseline',
      desc: 'Deviations surface before symptoms. Pen-level, not guesswork.',
      chip: 'WATCHING', chipColor: LEAF },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-agricultural.jpg')}
      eyebrow="SPOKE 29 · AGRICULTURAL"
      title="Agricultural Intelligence"
      accent={LEAF}
      heroLine="Full feed stack scanned."
      heroSub="Mycotoxins undetected. Feed additives unchecked — not here."
      rows={rows}
      foot="Livestock aligned."
    />
  );
}
