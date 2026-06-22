import React from 'react';
import FloodScreen from '@/components/FloodScreen';

export default function EqualizerScreen() {
  return (
    <FloodScreen
      doorImage={require('../../assets/doors/door-equalizer.jpg')}
      eyebrow="INTELLIGENCE 0X05"
      title="The Equalizer"
      accent="#1BB8FF"
      heroColor="#34D399"
      heroLine="ALL CLEAR \u00B7 STANDBY"
      heroSub="Speaks only in emergencies. Right now it is quiet."
      rows={[
        { icon: '\u25A4', title: 'Vault', desc: 'Sealed record of every clearance & block.', chip: 'SEALED', chipKind: 'clr' },
        { icon: '\u211E', title: 'Pill', desc: 'Medication interaction gate \u2014 RxNorm.', chip: 'CLEAR', chipKind: 'clr' },
        { icon: '\u2698', title: 'Apothecary', desc: 'Plant + tincture clearance.', chip: 'CLEAR', chipKind: 'clr' },
        { icon: '\u25C9', title: 'Species', desc: 'Which body \u2014 James \u00B7 Spouse \u00B7 Lily \u00B7 K9.', chip: '4', chipKind: 'watch' },
        { icon: '\u25C8', title: 'Environmental', desc: 'Location, air, contact exposure.', chip: 'WATCHING', chipKind: 'watch' },
      ]}
      foot="Nothing passes without clearance."
    />
  );
}
