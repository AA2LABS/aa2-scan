import React from 'react';
import { DoorFlood, useProfile, type Row, CYAN, GREEN, AMBER } from '@/components/DoorFlood';

export default function K9Screen() {
  const { p, loaded } = useProfile();
  const species = (p?.animalSpecies ?? '').toLowerCase();
  const hasPet = species.includes('dog') || species.includes('cat');
  const sens = p?.animalSensitivities ?? null;

  const rows: Row[] = [
    { icon: '◉', title: 'Your Animals',
      desc: hasPet ? `${p?.animalSpecies} on file. Every ingredient screened against their body, not a generic one.`
                   : 'No animals in the membrane yet. Add them in the checklist and they read here.',
      chip: hasPet ? 'ON FILE' : 'EMPTY', chipColor: hasPet ? GREEN : AMBER },
    { icon: '⚠', title: 'Known Sensitivities',
      desc: sens ? sens : 'None declared. A clean baseline is data too.',
      chip: sens ? 'FLAGGED' : 'CLEAR', chipColor: sens ? AMBER : GREEN },
    { icon: '⚘', title: 'ASPCA Toxicology',
      desc: 'Canine + feline toxic-ingredient screen on every scan. Weight-adjusted.',
      chip: 'DB 8', chipColor: CYAN },
    { icon: '◈', title: 'Handler Transfer',
      desc: 'Your stress reads into their baseline. Dual-biosignal when the collar is connected.',
      chip: 'PAIRED', chipColor: CYAN },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-k9-feline.jpg')}
      artPosition="top"
      eyebrow="K9 · FELINE INTELLIGENCE"
      title="K9 / Feline"
      accent={CYAN}
      heroLine={loaded && hasPet ? `Reading for ${p?.animalSpecies}.` : 'Canine and feline biosignals read.'}
      heroSub="Pet symptoms missed. Food harm silent. Behavior misread — not here."
      rows={rows}
      foot="Animals speak through biosignals."
    />
  );
}
