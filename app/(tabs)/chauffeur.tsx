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
      ask={{ q: 'Where are you going?', hint: 'destination · route · store…  🎤' }}
      sectionHeader="WHAT THE CHAUFFEUR DOES"
      rows={[
        { icon: '📍', title: 'Map / Route', desc: 'top-of-view SAFETY BAR · green/cyan/amber/red', chip: 'OPEN ›', chipKind: 'accent', route: '/map' },
        { icon: '📑', title: 'Dossier Builder', desc: '6 questions → compiled trip manual', chip: 'OPEN ›', chipKind: 'accent', route: '/travel' },
        { icon: '📖', title: 'Travel Dossier', desc: 'sealed by the Equalizer · no single-exit routes', chip: 'OPEN ›', chipKind: 'accent', route: '/travel' },
        { icon: '🏪', title: 'Retail Intelligence Loop', desc: 'inside the store — cheaper / better / cleaner', chip: 'OPEN ›', chipKind: 'accent', route: '/map' },
      ]}
      foot="EACH ROW IS LIVE. NO CONTINUE BUTTON."
    />
  );
}
