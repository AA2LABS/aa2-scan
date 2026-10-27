import React from 'react';
import { DoorFlood, useProfile, type Row, GREEN, AMBER } from '@/components/DoorFlood';
const SAND = '#D49A4A';

export default function DepthOnDemandScreen() {
  const { p } = useProfile();
  const allergens = p?.foodAllergens ?? [];
  const conds = p?.conditions ?? [];
  const home = p?.homeLocation ?? null;

  const rows: Row[] = [
    // THE STUDY LAYER — wired 2026-09-19. Doctrine says Spoke 17 carries the
    // instructor lesson modules; this is the door to them.
    { icon: '▤', title: 'The Study Layer',
      desc: 'Dellis · Hunter · Yapko · Prosocial · the BCH exam. Every session points at the requirement it feeds and cites where it came from.',
      chip: '5 PATHS', chipColor: SAND,
      route: '/study' },

    // BRAIN TRAIN TOOLS — wired 2026-09-22. The Study Layer is what the member
    // reads; this is what the member runs. Pointer-only, same law.
    { icon: '◆', title: 'Brain Train Tools',
      desc: 'Dropping Anchor, Join The DOTS, the Values Checklist, the Extra Bits. Practices with a start and a stop — run one with the stack on and you keep a record instead of a feeling.',
      chip: '5 TOOLS', chipColor: SAND,
      route: '/brain-train-tools' },

    { icon: '◎', title: 'Tied To What You Scan',
      desc: 'Every flagged chemical opens a lesson. Depth only when you ask for it.',
      chip: 'LIVE', chipColor: SAND },
    { icon: '◉', title: 'Your Chemistry',
      desc: allergens.length ? `Lessons queued for: ${allergens.join(', ')}`
                             : 'Scan something flagged and the lesson appears here.',
      chip: allergens.length ? String(allergens.length) : 'OPEN', chipColor: allergens.length ? SAND : AMBER },
    { icon: '⚘', title: 'Your Conditions',
      desc: conds.length ? `Context curated for: ${conds.join(', ')}` : 'No conditions declared.',
      chip: conds.length ? 'CURATED' : 'CLEAR', chipColor: conds.length ? SAND : GREEN },
    // THE CLARIFIER ROUTING RULE — route 1 of 3. The Curator is how the
    // member reaches the Clarifier from inside the Learning Center.
    { icon: '◎', title: 'Speak to the Curator',
      desc: 'The device saw a spike and not the reason. Tell the Curator what happened and the Clarifier reclassifies it.',
      chip: 'CLARIFIER', chipColor: SAND,
      route: '/clarifier' },
    { icon: '◈', title: 'Language By Location',
      desc: home ? `Anchored to ${home}. Survival relevance — you learn what you scan.`
                 : 'Scan a foreign label and learn the language through it.',
      chip: 'GPS', chipColor: SAND },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-depth-on-demand.png')}
      eyebrow="SPOKE 17 · LEARNING"
      title="Depth-On-Demand"
      accent={SAND}
      heroLine="Curated depth, tied to where you are."
      heroSub="Information with no context. Learning with no anchor — not here."
      rows={rows}
      foot="Agency beats restriction."
    />
  );
}
