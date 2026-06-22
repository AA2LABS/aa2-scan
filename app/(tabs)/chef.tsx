import React from 'react';
import FloodScreen from '@/components/FloodScreen';

export default function ChefScreen() {
  return (
    <FloodScreen
      doorImage={require('../../assets/doors/door-chef.jpg')}
      eyebrow="INTELLIGENCE \u00B7 KITCHEN"
      title="The Chef"
      accent="#E0A04A"
      heroColor="#34D399"
      heroLine="Biology-first meals from what you actually bought."
      heroSub="Built off your last basket \u2014 all allergen-cleared."
      rows={[
        { icon: '\u25A4', title: 'From your scan', desc: 'Salmon \u00B7 spinach \u00B7 lemon \u00B7 olive oil.' },
        { icon: '\u25C9', title: 'Tonight', desc: 'Sheet-pan salmon \u2014 anti-inflammatory, Lily-safe.', chip: 'CLEARED', chipKind: 'clr' },
        { icon: '\u25CE', title: 'Goal fit', desc: 'Supports recovery + steadier sleep.', chip: 'ALIGNED', chipKind: 'clr' },
        { icon: '\u2295', title: 'Aficionado', desc: 'Pairing & cigar lounge \u2014 nested inside Chef.' },
      ]}
      foot="Meals that work with the body, not against it."
    />
  );
}
