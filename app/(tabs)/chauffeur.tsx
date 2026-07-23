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
        { icon: '▭', title: 'Dossier', desc: 'Trip card: who, where, allergens, language.' },
        { icon: '◆', title: 'Safety bar', desc: 'Live area read along the route.', chip: 'CLEAR', chipKind: 'clr' },
        { icon: '◈', title: 'Retail intel', desc: 'Cleared stores & pharmacies en route.' },
        { icon: '◍', title: 'Grid', desc: 'ON GRID / OFF GRID maps — pre-synced.', chip: 'ON', chipKind: 'clr', route: '/map' },
      ]}
      foot="Maps with memory. Routes with context."
    />
  );
}
