// lib/membrane.ts
// AA2 BioMesh — THE MEMBRANE (S.C.A.N. spine: Safety Clarifier Adaptive Nerve).
// Wiring law: intelligence -> membrane -> data -> door. Every intelligence anchors HERE.
// SOVEREIGNTY: the membrane reads ONLY through lib/db.ts. It never touches Supabase directly.
// No fake data; honest-empty until real onboarding data exists.

import { useEffect, useState } from 'react';
import { loadMemberProfile, type FullMemberProfile } from './db';

export type MemberId = string;

export interface BiosignalSnapshot {
  hrv: number | null;
  restingHr: number | null;
  sleepScore: number | null;
  recovery: number | null;
  stress: number | null;
  updatedAt: string | null;
}

export interface IntentProfile {
  goals: string[];
  protect: string[];
  vision: string | null;
  targetDate: string | null;
  horizon: '30' | '60' | '90' | null;
}

export interface MembraneMember {
  id: MemberId;
  name: string | null;
  color: string | null;
  biosignal: BiosignalSnapshot;
}

export interface MembraneState {
  ready: boolean;
  onboarded: boolean;
  primary: MembraneMember | null;
  members: MembraneMember[];
  intent: IntentProfile;
  error: string | null;
}

const EMPTY_STATE: MembraneState = {
  ready: false,
  onboarded: false,
  primary: null,
  members: [],
  intent: { goals: [], protect: [], vision: null, targetDate: null, horizon: null },
  error: null,
};

let state: MembraneState = EMPTY_STATE;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function setState(patch: Partial<MembraneState>) { state = { ...state, ...patch }; emit(); }
export function getMembrane(): MembraneState { return state; }

let loading = false;
let loadedOnce = false;

// Map the full onboarding profile (read THROUGH db.ts) into membrane truth.
function mapProfile(p: FullMemberProfile): Partial<MembraneState> {
  const primary: MembraneMember = {
    id: p.memberId,
    name: p.name ?? null,
    color: null, // assigned per-member by Bio Buddy; never fabricated here
    biosignal: {
      hrv: null,
      restingHr: null,
      sleepScore: p.sleepScore ?? null,
      recovery: null,
      stress: null,
      updatedAt: null,
    },
  };
  return {
    ready: true,
    onboarded: !!p.onboardingComplete,
    primary,
    members: [primary],
    intent: {
      goals: p.primaryGoal ?? [],
      protect: p.speciesProtected ?? [],
      vision: p.visionText ?? null,
      targetDate: p.targetDate ?? null,
      horizon: null,
    },
    error: null,
  };
}

// THE read. db.ts is the only curtain; Supabase lives behind it (Sovereignty Doctrine).
async function readProfile(): Promise<Partial<MembraneState>> {
  try {
    const p = await loadMemberProfile();
    if (!p) return { ready: true, onboarded: false }; // generic truth until onboarded
    return mapProfile(p);
  } catch (e: any) {
    return { ready: true, onboarded: false, error: e?.message ?? 'membrane read failed' };
  }
}

export async function loadMembrane(force = false): Promise<void> {
  if (loading) return;
  if (loadedOnce && !force) return;
  loading = true;
  const patch = await readProfile();
  loadedOnce = true;
  loading = false;
  setState(patch);
}

export function useMembrane(): MembraneState & { refresh: () => Promise<void> } {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    void loadMembrane(false);
    return () => { listeners.delete(l); };
  }, []);
  return { ...state, refresh: () => loadMembrane(true) };
}
