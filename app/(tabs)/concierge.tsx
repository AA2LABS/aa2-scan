import React from 'react';
import FloodScreen from '@/components/FloodScreen';

export default function ConciergeScreen() {
  return (
    <FloodScreen
      doorImage={require('../../assets/doors/door-concierge.jpg')}
      eyebrow="INTELLIGENCE · FRONT DOOR"
      title="The Concierge"
      accent="#D4A847"
      heroColor="#D4A847"
      heroLine="How can I help you, James?"
      heroSub="The front door. Never routes back to onboarding."
      rows={[
        { icon: '\u25C9', title: 'Live Feed', desc: 'What the membrane noticed today.', chip: 'LIVE', chipKind: 'clr' },
        { icon: '\u25C8', title: 'Aware Dollars', desc: 'Money aligned to your goals.', chip: 'USD', chipKind: 'accent' },
        { icon: '\u25A6', title: 'Vision Board', desc: 'Goals \u00B7 trips \u00B7 language \u2014 drag-tile.' },
        { icon: '\u25CE', title: 'Learning Center', desc: 'Depth-On-Demand, tied to what you scan.' },
      ]}
      foot="One intelligence lets you in and routes you anywhere."
    />
  );
}
