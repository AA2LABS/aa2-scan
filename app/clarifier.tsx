import React from 'react';
import { DoorFlood, useProfile, type Row, GREEN, AMBER, CYAN, GOLD } from '@/components/DoorFlood';

// ─────────────────────────────────────────────────────────────────────────────
// THE CLARIFIER — wired 2026-09-12.
//
// THE CLARIFIER ROUTING RULE (founder, locked): the intelligence name going
// forward is the Clarifier. Three ways in, all equal:
//   1. Depth-On-Demand → the Curator   (app/depth-on-demand.tsx, row "Speak to the Curator")
//   2. Ask the Concierge               (app/(tabs)/concierge.tsx, row "Bring me the Clarifier")
//   3. The CLARIFIER button            (app/(tabs)/aa2.tsx, Door Hall grid)
//
// THE NO NEGATIVE ZONE IS A RULE ON THE SYSTEM, NOT ON THE MEMBER. The member
// may say anything here. The journal is the exit, not the entrance.
//
// SERVE THE TABLE, DO NOT SIT AT IT (founder law, 2026-09-12): nothing on this
// screen grades the member, ranks them, or tells them something they already
// did was wrong. It reclassifies a signal. That is all it does.
//
// ⚠ PLACEHOLDER ART — there is no door-clarifier render in assets/doors yet.
// door-depth-on-demand.png stands in because Depth-On-Demand is route 1. Drop
// a real render at assets/doors/door-clarifier.* and change this one line.
//
// The nine categories below are NOT invented — they are the ClarifierCategory
// union in lib/clarifier.ts (lines 14–23), rendered as the member sees them.
// ─────────────────────────────────────────────────────────────────────────────

const VIOLET = '#9B8CFF';

export default function ClarifierScreen() {
  const { p } = useProfile();
  const name = p?.name ?? null;

  const rows: Row[] = [
    { icon: '◎', title: 'The body reported. You supply the meaning.',
      desc: 'Arousal and stress move the same raw signals — heart rate, HRV, skin response. Only context separates them, and the context is yours.',
      chip: 'WHY', chipColor: VIOLET },

    { icon: '♥', title: 'Intimacy',
      desc: 'Private entry. Excluded from the stress baseline, always. Recovery-relevant, never logged as distress.',
      chip: 'PRIVATE', chipColor: VIOLET },

    { icon: '✦', title: 'Excitement',
      desc: 'Promotion, good news, a celebration. The spike was real. The distress was not.',
      chip: 'CLEARS', chipColor: GREEN },

    { icon: '⚡', title: 'Exertion',
      desc: 'An unlogged workout, ranch work, chores. Counted as activity, not distress.',
      chip: 'CLEARS', chipColor: GREEN },

    { icon: '♨', title: 'Heat exposure',
      desc: 'Sauna, hot tub, sun. Heat elevates heart rate without distress — noted, not counted.',
      chip: 'CLEARS', chipColor: GREEN },

    { icon: '☕', title: 'Stimulant response',
      desc: 'Chemical Doctrine: timing and cumulative load tracked, never judged.',
      chip: 'CLEARS', chipColor: GREEN },

    { icon: '⚘', title: 'Possible illness',
      desc: 'Flagged for early awareness, not fear. The immune system watches this one.',
      chip: 'WATCH', chipColor: AMBER },

    { icon: '✈', title: 'Travel load',
      desc: 'Flights, altitude, time zones. Adjusted against the travel baseline — give it a night.',
      chip: 'ADJUSTS', chipColor: CYAN },

    { icon: '◈', title: 'Conflict — and confirmed stress',
      desc: 'You are allowed to say it was stress. It stays stress, it counts, and the loop closes when you log its end.',
      chip: 'COUNTS', chipColor: AMBER },

    { icon: '⚖', title: 'Every reclassification carries its weight',
      desc: 'Magnitude is how hard the body moved. Valence is which direction it moved you. Two axes, never one — and the reason is shown with the number.',
      chip: 'NO NAKED NUMBERS', chipColor: GOLD },

    { icon: '◉', title: 'Speak to the Curator',
      desc: 'Depth-On-Demand carries the lesson behind whatever the Clarifier just reclassified.',
      chip: 'OPEN', chipColor: VIOLET,
      route: '/depth-on-demand' },

    { icon: '🎙️', title: 'Ask the Concierge instead',
      desc: 'You never have to find the right door. Say what happened and the Concierge routes it.',
      chip: 'OPEN', chipColor: VIOLET,
      route: '/(tabs)/concierge' },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-depth-on-demand.png')}
      eyebrow="THE CLARIFIER · CONTEXT LAYER"
      title="The Clarifier"
      accent={VIOLET}
      heroLine={name ? `The device saw a spike, ${name}. It did not see why.` : 'The device saw a spike. It did not see why.'}
      heroSub="Nothing here is a diagnosis. It is a reclassification — you tell the membrane what the signal actually was."
      rows={rows}
      foot="No judgment. No lecture. Discreet by default."
    />
  );
}
