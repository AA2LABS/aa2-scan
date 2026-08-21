/**
 * ─── lib/ouraAuth.ts ────────────────────────────────────────────────────────
 * OURA'S DOOR — now one of three, all running on the same engine.
 *
 * The whole OAuth2 lane moved to lib/oauth.ts on 2026-08-21 when WHOOP and
 * Strava joined it. Oura's endpoints, scopes and single-use refresh rule live
 * in the PROVIDERS registry there, with their sources beside them.
 *
 * This file stays so that lib/biosignals.ts and the Bio Buddy control panel
 * keep importing the name they already know. It is a door, not a duplicate.
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  connectProvider, connectionFor, disconnectProvider, getValidToken,
  redirectUri, configProblem, PROVIDERS,
  type Connection, type ConnectResult,
} from './oauth';

export type OuraConnection = Connection;
export type { ConnectResult };

export const OURA_SCOPES = PROVIDERS.oura.scopes;

export const ouraRedirectUri  = () => redirectUri('oura');
export const ouraConfigProblem = () => configProblem('oura');
export const connectOura      = () => connectProvider('oura');
export const disconnectOura   = () => disconnectProvider('oura');
export const ouraConnection   = () => connectionFor('oura');
export const getValidOuraToken = () => getValidToken('oura');
