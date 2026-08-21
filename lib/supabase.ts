/**
 * ─── lib/supabase.ts ────────────────────────────────────────────────────────
 * THE MEMBRANE'S CONNECTION — and the session that has to survive the night.
 *
 * FOUNDER ORDER 2026-08-21: "FIND ANY SHORTCUTS THAT ARE NOT WIRED FOR
 * IMMEDIATE SUCCESS WHEN I FIRE IT UP. NO REASON IT ALL SHOULD NOT WORK!"
 *
 * WHAT WAS WRONG — the single line that emptied the whole app:
 *   createClient(url, key)
 * with no options. supabase-js defaults its session storage to localStorage,
 * which DOES NOT EXIST in React Native. So the session created at onboarding
 * (onboarding.tsx calls signInAnonymously) lived in memory and died with the
 * app. Next launch: no session, auth.getUser() returns null, and every reader
 * and writer in AA2 — profile, biosignals, imports, the baseline screen, the
 * Oura token — takes its `if (!user) return null` branch and shows nothing.
 *
 * The app was not broken. It was LOGGED OUT, silently, every single launch.
 *
 * THE FIX: a storage adapter the membrane actually has. expo-file-system is
 * already in the build, already used for the seal flag, and needs no native
 * module — so the session persists over OTA, today, with no new build.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { vaultRead, vaultWipe, vaultWrite } from './tokenVault';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * supabase-js accepts any async {getItem,setItem,removeItem}. This is the same
 * app-private sandbox the Oura credential uses — one vault, one place a
 * credential can live on this device, and it is wiped when AA2 is uninstalled.
 */
const membraneStorage = {
  getItem:    (key: string) => vaultRead(key),
  setItem:    async (key: string, value: string) => { await vaultWrite(key, value); },
  removeItem: async (key: string) => { await vaultWipe(key); },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: membraneStorage,
    persistSession: true,      // the session survives the app closing
    autoRefreshToken: true,    // and survives its own expiry
    detectSessionInUrl: false, // there is no URL bar on a phone
  },
});
