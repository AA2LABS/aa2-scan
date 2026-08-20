import React, { useEffect, useState } from 'react';
import { DoorFlood, useProfile, type Row, GOLD, GREEN, AMBER } from '@/components/DoorFlood';
import { getVaultLedgerTotal } from '@/lib/db';

export default function VisionBoardScreen() {
  const { p } = useProfile();
  const goals = p?.primaryGoal ?? [];
  const vision = p?.visionText ?? null;
  const n30 = p?.northStar30d ?? null;
  const n90 = p?.northStar90d ?? null;

  // Vault money tile — real AWARE DOLLARS from the ledger. Never fabricated.
  const [vault, setVault] = useState<{ total: number; thisMonth: number; entries: number }>({ total: 0, thisMonth: 0, entries: 0 });
  useEffect(() => { getVaultLedgerTotal().then(setVault); }, []);
  const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

  const rows: Row[] = [
    vault.entries > 0
      ? { icon: '💎', title: 'Vault · Aware Dollars',
          desc: `${money(vault.total)} saved · ${money(vault.thisMonth)} this month`,
          chip: money(vault.total), chipColor: GOLD, route: '/vault' }
      : { icon: '💎', title: 'Vault · Aware Dollars',
          desc: 'Follow a scanner recommendation to start your Vault.',
          chip: '$0.00', chipColor: AMBER, route: '/vault' },
    { icon: '◎', title: 'North Star · 30 Day',
      desc: n30 ?? 'Not declared yet. Set it in the membrane checklist.',
      chip: n30 ? 'SET' : 'OPEN', chipColor: n30 ? GREEN : AMBER },
    { icon: '◎', title: 'North Star · 90 Day',
      desc: n90 ?? 'Not declared yet. The 90-day baseline is where the membrane goes live.',
      chip: n90 ? 'SET' : 'OPEN', chipColor: n90 ? GREEN : AMBER },
    { icon: '◈', title: 'What You Protect',
      desc: goals.length ? goals.join(' · ') : 'No goals on file yet.',
      chip: goals.length ? String(goals.length) : '0', chipColor: goals.length ? GOLD : AMBER },
    { icon: '▦', title: 'Trips & Travel',
      desc: 'Completed trips become tiles here. Route in from the Chauffeur.',
      chip: 'TILES', chipColor: GOLD },
    { icon: '◉', title: 'Vision',
      desc: vision ?? 'Your declared vision appears here once the membrane is sealed.',
      chip: vision ? 'LIVE' : 'OPEN', chipColor: vision ? GREEN : AMBER },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-vision-board.png')}
      // Founder bug 2026-08-19. This art is a square collage whose SUBJECT is
      // its own lettering — "AA2 Vision Board" cut from magazines. Cover-
      // cropping it into the standard 210px strip zoomed past the words and
      // left unreadable letter fragments. Contain, with room, shows the board.
      artFit="contain"
      heroHeight={300}
      eyebrow="CONCIERGE HUB · VISION BOARD"
      title="Vision Board"
      accent={GOLD}
      heroLine={goals.length ? 'Everything you said you wanted.' : 'Goals with no home. Not anymore.'}
      heroSub="Goals · trips · language. Every scan filters against this."
      rows={rows}
      foot="AA2 remembers the life you said you wanted."
    />
  );
}
