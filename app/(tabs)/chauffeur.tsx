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
        { icon: '📍', title: 'Map / Route', desc: 'Top-of-view SAFETY BAR — green · cyan · amber · red.', chip: 'CLEAR', chipKind: 'clr', route: '/map' },
        { icon: '📑', title: 'Dossier Builder', desc: '6 questions → compiled trip manual.', route: '/travel' },
        { icon: '📖', title: 'Travel Dossier', desc: 'Sealed by the Equalizer · no single-exit routes.', route: '/travel' },
        { icon: '🏪', title: 'Retail Intelligence Loop', desc: 'Inside the store — cheaper / better / cleaner.', route: '/map' },
      ]}
      foot="Maps with memory. Routes with context."
    />
  );
}
