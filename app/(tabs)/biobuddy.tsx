import React from 'react';
import FloodScreen from '@/components/FloodScreen';

export default function BioBuddyScreen() {
  return (
    <FloodScreen
      doorImage={require('../../assets/doors/door-biobuddy.jpg')}
      eyebrow="INTELLIGENCE \u00B7 NERVOUS SYSTEM"
      title="Bio Buddy"
      accent="#1BB8FF"
      heroLine="Every device read as one body."
      heroSub="Your baseline \u2014 translated, not just numbers."
      rows={[
        { icon: '\u25D0', title: 'Garmin Tactix 8', desc: 'Strain + GPS load.', chip: 'SYNCED', chipKind: 'clr' },
        { icon: '\u25EF', title: 'Oura Ring 4', desc: 'Sleep recovery \u221214% this week.', chip: 'WATCH', chipKind: 'watch' },
        { icon: '\u25D1', title: 'WHOOP 5.0', desc: 'HRV 62ms \u00B7 above your baseline.', chip: 'CLEAR', chipKind: 'clr' },
        { icon: '\u266A', title: 'Muse S Athena', desc: 'EEG calm score trending up.', chip: 'SYNCED', chipKind: 'clr' },
      ]}
      foot="Six wearables, one nervous system, one truth."
    />
  );
}
