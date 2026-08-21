/**
 * ─── lib/tokenVault.ts ──────────────────────────────────────────────────────
 * WHERE A CREDENTIAL LIVES ON THE MEMBER'S OWN DEVICE.
 *
 * FOUNDER ORDER 2026-08-21: close the OAuth gap.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE:
 *   A credential belongs on the member's device, in the member's own sandbox,
 *   and nowhere else. Not in a database column. Not in a log line. Not in a
 *   chat window — which is why the founder was told to paste his token into
 *   his own app and never into a conversation, and why that instruction still
 *   stands.
 *
 * WHAT THIS IS TODAY — and the honest limit, stated before anyone finds it:
 *   Tokens are written to the app's PRIVATE document directory. On iOS and
 *   Android that directory is inside the app sandbox: no other app can read
 *   it, and it is removed when AA2 is uninstalled. It is NOT the iOS Keychain
 *   or the Android Keystore. It is not hardware-encrypted.
 *
 *   The Keychain lane is `expo-secure-store`, and it is a NATIVE module — it
 *   cannot arrive over an OTA update, only in a new native build. The founder
 *   does not have builds to burn, so this ships on the lane that works today
 *   and the upgrade is a ONE-FUNCTION swap, marked below, that lands the next
 *   time a native build goes out. Nothing else in AA2 changes when it does.
 *
 *   AA2 does not claim Keychain-grade storage it does not have. When it has
 *   it, this comment changes and the claim changes with it.
 *
 * NO NAKED CREDENTIALS: nothing in this file prints, returns for display, or
 * hands a token to any surface but the caller that needs to sign a request.
 * ────────────────────────────────────────────────────────────────────────────
 */

// SDK 54 moved the path-based helpers to the /legacy entry point. The same
// entry lib/garminImport.ts already uses. No native module, OTA-safe.
import * as FileSystem from 'expo-file-system/legacy';

/* ── THE UPGRADE POINT ───────────────────────────────────────────────────────
 * When expo-secure-store is added and a native build ships, replace the two
 * bodies below with:
 *     import * as SecureStore from 'expo-secure-store';
 *     read  -> SecureStore.getItemAsync(key)
 *     write -> SecureStore.setItemAsync(key, value, {
 *                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
 *     wipe  -> SecureStore.deleteItemAsync(key)
 * and migrate once: read the file, write it to SecureStore, delete the file.
 * Nothing above or below this block needs to move.
 * ───────────────────────────────────────────────────────────────────────────*/

const DIR = FileSystem.documentDirectory + 'aa2_vault/';

function pathFor(key: string): string {
  // Keys are AA2-authored constants, never member input, but the guard stays:
  // a key can never climb out of the vault directory.
  return DIR + key.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

async function ensureDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {}
}

export async function vaultRead(key: string): Promise<string | null> {
  try {
    const p = pathFor(key);
    const info = await FileSystem.getInfoAsync(p);
    if (!info.exists) return null;
    const s = await FileSystem.readAsStringAsync(p);
    return s.length ? s : null;
  } catch { return null; }
}

export async function vaultWrite(key: string, value: string): Promise<boolean> {
  try {
    await ensureDir();
    await FileSystem.writeAsStringAsync(pathFor(key), value);
    return true;
  } catch { return false; }
}

export async function vaultWipe(key: string): Promise<void> {
  try { await FileSystem.deleteAsync(pathFor(key), { idempotent: true }); } catch {}
}

/** Typed helpers so callers never hand-roll JSON around a credential. */
export async function vaultReadJson<T>(key: string): Promise<T | null> {
  const raw = await vaultRead(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function vaultWriteJson(key: string, value: unknown): Promise<boolean> {
  try { return await vaultWrite(key, JSON.stringify(value)); } catch { return false; }
}

/**
 * Is this vault the hardware-backed one? Today: no, and it says so. The
 * connection screen reads this so the member is told the truth about where
 * their credential sits, rather than being shown a padlock AA2 has not earned.
 */
export const VAULT_IS_HARDWARE_BACKED = false;
export const VAULT_DESCRIPTION =
  'app-private storage on this device — not the OS keychain yet';
