import React from 'react';
import FloodScreen from '@/components/FloodScreen';
import { useMembrane } from '@/lib/membrane';

export default function ConciergeScreen() {
  const m = useMembrane();
  const name = m.onboarded ? (m.primary?.name ?? '') : '';
  const heroLine = name ? `How can I help you, ${name}?` : 'How can I help you?';
  const heroSub = m.onboarded
    ? 'The front door. Never routes back to onboarding.'
    : 'The front door. Generic until your membrane is built.';
  const liveChip = m.onboarded ? 'LIVE' : 'STANDBY';
  const liveDesc = m.onboarded
    ? 'What the membrane noticed today.'
    : 'Quiet until the membrane has your baseline.';

  return (
    <FloodScreen
      doorImage={require('../../assets/doors/door-concierge.jpg')}
      eyebrow="INTELLIGENCE \u00B7 FRONT DOOR"
      title="The Concierge"
      accent="#D4A847"
      heroColor="#D4A847"
      heroLine={heroLine}
      heroSub={heroSub}
      rows={[
        { icon: '\u25C9', title: 'Live Feed', desc: liveDesc, chip: liveChip, chipKind: 'clr' },
        { icon: '\u25C8', title: 'Aware Dollars', desc: 'Money aligned to your goals.', chip: 'USD', chipKind: 'accent' },
        { icon: '\u25A6', title: 'Vision Board', desc: 'Goals \u00B7 trips \u00B7 language \u2014 drag-tile.' },
        { icon: '\u25CE', title: 'Learning Center', desc: 'Depth-On-Demand, tied to what you scan.' },
      ]}
      foot="One intelligence lets you in and routes you anywhere."
    />
  );
}
