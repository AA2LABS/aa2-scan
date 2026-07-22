import React from 'react';
import { DoorFlood, useProfile, type Row, GOLD, GREEN, AMBER } from '@/components/DoorFlood';

export default function AficionadoScreen() {
  const { p } = useProfile();
  const meds = p?.medications ?? null;
  const conds = p?.conditions ?? [];
  const commander = p?.commanderLayerActive ?? false;

  const rows: Row[] = [
    { icon: '\u25C9', title: 'Strain & Leaf Context',
      desc: 'Indica \u00B7 sativa \u00B7 hybrid. Terpene profile, potency band.',
      chip: 'LIVE', chipColor: GOLD },
    { icon: '\u2698', title: 'Contaminant Screen',
      desc: 'Pesticides \u00B7 heavy metals \u00B7 mold / mycotoxin \u00B7 solvent residue.',
      chip: 'SCREENED', chipColor: GOLD },
    { icon: '\u26A0', title: 'Interaction Check',
      desc: meds ? 'Cross-referenced against your medications on file.'
                 : 'No medications on file \u2014 add them and this gate arms.',
      chip: meds ? 'ARMED' : 'OPEN', chipColor: meds ? AMBER : GREEN },
    { icon: '\u25C8', title: 'Commander Layer',
      desc: commander ? 'ACTIVE \u2014 WADA / USADA prohibited list checked on every scan.'
                      : 'Off. Flip it in the checklist if you compete or serve.',
      chip: commander ? 'ARMED' : 'OFF', chipColor: commander ? AMBER : GREEN },
    { icon: '\u25CE', title: 'Cigar \u00B7 Leaf \u00B7 Origin',
      desc: conds.length ? 'Pairing filtered against your conditions.' : 'Wrapper, binder, filler \u2014 origin and pairing.',
      chip: 'PAIRED', chipColor: GOLD },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-aficionado.png')}
      eyebrow="CONNOISSEUR \u00B7 OPT-IN"
      title="Aficionado"
      accent={GOLD}
      heroLine="Your space stays yours."
      heroSub="Blind to contaminants, interactions, dose \u2014 not here."
      rows={rows}
      foot="Nothing shown unless you open it."
    />
  );
}
