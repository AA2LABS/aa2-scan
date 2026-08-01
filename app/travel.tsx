import React from 'react';
import { DoorFlood, useProfile, type Row, GREEN, AMBER } from '@/components/DoorFlood';
const ORANGE = '#E08A3C';

export default function TravelScreen() {
  const { p } = useProfile();
  const freq = p?.travelFrequency ?? [];
  const allergens = p?.foodAllergens ?? [];
  const meds = p?.medications ?? null;

  const rows: Row[] = [
    { icon: '▭', title: 'Travel Profile',
      desc: freq.length ? freq.join(' · ') : 'Not declared. Add it in the checklist.',
      chip: freq.length ? 'ON FILE' : 'EMPTY', chipColor: freq.length ? GREEN : AMBER },
    { icon: '⚠', title: 'Allergen Card',
      desc: allergens.length ? `${allergens.join(', ')} — translated for the destination.`
                             : 'No allergens declared. Clean baseline travels with you.',
      chip: allergens.length ? String(allergens.length) : 'CLEAR', chipColor: allergens.length ? AMBER : GREEN },
    { icon: '℞', title: 'Medical Brief',
      desc: meds ? 'Your medications travel in the dossier, border-ready.' : 'No medications on file.',
      chip: meds ? 'ON FILE' : 'NONE', chipColor: meds ? ORANGE : GREEN },
    { icon: '◈', title: 'Travel Dossier',
      desc: 'Safety · allergen · medical · language · routes — compiled and printable.',
      chip: 'API PENDING', chipColor: AMBER },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-travel.png')}
      eyebrow="TRAVEL · DOSSIER"
      title="Travel"
      accent={ORANGE}
      heroLine="One sealed dossier."
      heroSub="A new country with no plan — not anymore. Your membrane crosses the border with you."
      rows={rows}
      foot="Cultural curiosity without risk."
    />
  );
}
