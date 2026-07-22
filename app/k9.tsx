import React from 'react';
import { DoorFlood, useProfile, type Row, CYAN, GREEN, AMBER } from '@/components/DoorFlood';

export default function K9Screen() {
  const { p, loaded } = useProfile();
  const species = (p?.animalSpecies ?? '').toLowerCase();
  const hasPet = species.includes('dog') || species.includes('cat');
  const sens = p?.animalSensitivities ?? null;

  const rows: Row[] = [
    { icon: '\u25C9', title: 'Your Animals',
      desc: hasPet ? `${p?.animalSpecies} on file. Every ingredient screened against their body, not a generic one.`
                   : 'No animals in the membrane yet. Add them in the checklist and they read here.',
      chip: hasPet ? 'ON FILE' : 'EMPTY', chipColor: hasPet ? GREEN : AMBER },
    { icon: '\u26A0', title: 'Known Sensitivities',
      desc: sens ? sens : 'None declared. A clean baseline is data too.',
      chip: sens ? 'FLAGGED' : 'CLEAR', chipColor: sens ? AMBER : GREEN },
    { icon: '\u2698', title: 'ASPCA Toxicology',
      desc: 'Canine + feline toxic-ingredient screen on every scan. Weight-adjusted.',
      chip: 'DB 8', chipColor: CYAN },
    { icon: '\u25C8', title: 'Handler Transfer',
      desc: 'Your stress reads into their baseline. Dual-biosignal when the collar is connected.',
      chip: 'PAIRED', chipColor: CYAN },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-k9-feline.jpg')}
      eyebrow="K9 \u00B7 FELINE INTELLIGENCE"
      title="K9 / Feline"
      accent={CYAN}
      heroLine={loaded && hasPet ? `Reading for ${p?.animalSpecies}.` : 'Canine and feline biosignals read.'}
      heroSub="Pet symptoms missed. Food harm silent. Behavior misread \u2014 not here."
      rows={rows}
      foot="Animals speak through biosignals."
    />
  );
}
