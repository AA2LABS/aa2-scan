import React from 'react';
import FloodScreen from '@/components/FloodScreen';

export default function ChauffeurScreen() {
  return (
    <FloodScreen
      doorImage={require('../../assets/doors/door-chauffeur.webp')}
      eyebrow="INTELLIGENCE 0X04"
      title="The Chauffeur"
      accent="#1BB8FF"
      heroLine="Pre-programmed safe routes. Briefings at every waypoint."
      heroSub="Dossier first, then the road."
      rows={[
        { icon: '\u25AD', title: 'Dossier', desc: 'Trip card: who, where, allergens, language.' },
        { icon: '\u25C6', title: 'Safety bar', desc: 'Live area read along the route.', chip: 'CLEAR', chipKind: 'clr' },
        { icon: '\u25C8', title: 'Retail intel', desc: 'Cleared stores & pharmacies en route.' },
        { icon: '\u25CD', title: 'Grid', desc: 'ON GRID / OFF GRID maps \u2014 pre-synced.', chip: 'ON', chipKind: 'clr' },
      ]}
      foot="Maps with memory. Routes with context."
    />
  );
}
