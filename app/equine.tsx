import React from 'react';
import { DoorFlood, useProfile, type Row, GOLD, GREEN, AMBER } from '@/components/DoorFlood';

export default function EquineScreen() {
  const { p } = useProfile();
  const species = (p?.animalSpecies ?? '').toLowerCase();
  const hasHorse = species.includes('horse');

  const rows: Row[] = [
    { icon: '\u25C9', title: 'Your Herd',
      desc: hasHorse ? `${p?.animalSpecies} on file. Feed scanned against their body.`
                     : 'No equine in the membrane. Add them in the checklist.',
      chip: hasHorse ? 'ON FILE' : 'EMPTY', chipColor: hasHorse ? GREEN : AMBER },
    { icon: '\u2698', title: 'Feed Screen',
      desc: 'Every feed and supplement cross-referenced. Interactions surfaced before the bucket.',
      chip: 'LIVE', chipColor: GOLD },
    { icon: '\u26A0', title: 'FEI Prohibited',
      desc: 'Competition compliance checked on every supplement scan.',
      chip: 'FEI', chipColor: GOLD },
    { icon: '\u25C8', title: 'Rider + Horse',
      desc: 'Jockey and horse biosignals synced when both are on the membrane.',
      chip: 'DUAL', chipColor: GOLD },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-equine.jpg')}
      eyebrow="SPOKE 28 \u00B7 EQUESTRIAN"
      title="Equine Intelligence"
      accent={GOLD}
      heroLine="Every feed scanned."
      heroSub="Feed guesswork. Supplement interactions missed \u2014 not here."
      rows={rows}
      foot="Jockey and horse, one membrane."
    />
  );
}
