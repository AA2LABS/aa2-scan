/**
 * ─── lib/theme-mode.ts ──────────────────────────────────────────────────────
 * TWO MODES. ONE BUTTON. THE WHOLE APP.
 *
 * FOUNDER, 2026-08-22:
 *   "The member still picks because they are able to click the button that
 *    chooses light or dark. If you make a light version, there is no fucking
 *    mixing both light and dark. The whole app would be light. The whole app
 *    would be dark. I don't know where the confusion's coming from. Done it
 *    before. A year ago. Tactical and K-9 are the only dark everything."
 *
 * ── THE CORRECTION THIS FILE EXISTS TO MAKE ────────────────────────────────
 * On 2026-08-21 the founder said "and fix light mode!" and the assistant
 * LOCKED THE APP TO DARK and wrote a doctrine around it — THE DARK INSTRUMENT
 * LAW. That was wrong twice over:
 *
 *   1. He asked for light mode FIXED, not removed.
 *   2. AA2 ALREADY HAD BOTH MODES, fully designed, a year earlier —
 *      `aa2_all10_both_modes_2.html`, all ten surfaces rendered in light and
 *      dark: Concierge · Chef · Bio Buddy · Chauffeur · Equalizer · K9 ·
 *      K9 Tactical · Equine · Agricultural · K9/Feline.
 *
 * Nothing below is designed by the assistant. EVERY TOKEN IS LIFTED FROM THE
 * FOUNDER'S OWN YEAR-OLD FILE. The accents are matched hue PAIRS — the same
 * colour lifted for dark, never inverted:
 *
 *      blue  #2a7faa  ->  #4a9fd4
 *      gold  #b8861e  ->  #d4a84b
 *      rust  #a85a18  ->  #c4722a
 *
 * THE DARK INSTRUMENT LAW IS STRUCK. Logged, not erased — the reasoning is in
 * hooks/use-color-scheme.ts and the correction stands beside it.
 *
 * ── THE ONE OVERRIDE ───────────────────────────────────────────────────────
 * TACTICAL AND K9 ARE ALWAYS DARK, whatever the member picked. Founder ruling
 * 2026-08-22. Noted honestly: the year-old file rendered K9 and Tactical in
 * BOTH modes — this override is a CHANGE to that file, made deliberately.
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { vaultRead, vaultWrite } from './tokenVault';

export type Mode = 'light' | 'dark';

export type Tokens = {
  mode: Mode;
  /** the page ground */
  bg: string;
  /** a panel sitting on the ground */
  surface: string;
  /** a card sitting on a panel */
  card: string;
  /** hairlines and card edges */
  line: string;
  /** a softer fill for rows and chips */
  fill: string;
  ink: string;
  mut: string;
  faint: string;
  /** the three paired accents */
  blue: string;
  gold: string;
  rust: string;
  /** severity, tuned so LEVEL 2 READS AS LEVEL 2 AT BOTH ENDS */
  sev1: string; sev2: string; sev3: string; sev4: string; sev5: string;
  /** the amber knowledge card — AA2 interpreting rather than reporting */
  knowBg: string; knowBorder: string; knowTitle: string; knowBody: string;
  /** elevation. Light needs a shadow; dark needs none. */
  shadow: string;
  /** what the OS status bar should draw */
  statusBar: 'light' | 'dark';
};

/** LIGHT — lifted verbatim from the founder's own file. */
export const LIGHT: Tokens = {
  mode: 'light',
  bg:      '#F0EEE8',
  surface: '#FAF7F2',
  card:    '#FFFFFF',
  line:    'rgba(0,0,0,0.12)',
  fill:    'rgba(0,0,0,0.03)',
  ink:     '#1a1a1a',
  mut:     'rgba(0,0,0,0.55)',
  faint:   'rgba(0,0,0,0.38)',
  blue:    '#2a7faa',
  gold:    '#b8861e',
  rust:    '#a85a18',
  sev1: '#C0392B', sev2: '#BC6217', sev3: '#9A7418', sev4: '#0B79B0', sev5: '#12795A',
  knowBg: 'rgba(224,160,74,0.10)', knowBorder: 'rgba(154,116,24,0.40)',
  knowTitle: '#8A6410', knowBody: 'rgba(20,16,10,0.82)',
  shadow: '0 1px 4px rgba(0,0,0,0.06)',
  statusBar: 'dark',
};

/** DARK — lifted verbatim from the same file. */
export const DARK: Tokens = {
  mode: 'dark',
  bg:      '#080808',
  surface: '#060506',
  card:    'rgba(255,255,255,0.06)',
  line:    'rgba(255,255,255,0.18)',
  fill:    'rgba(255,255,255,0.07)',
  ink:     '#FFFFFF',
  mut:     'rgba(255,255,255,0.68)',
  faint:   'rgba(255,255,255,0.42)',
  blue:    '#4a9fd4',
  gold:    '#d4a84b',
  rust:    '#c4722a',
  sev1: '#E05252', sev2: '#E8873A', sev3: '#C49A2A', sev4: '#1BB8FF', sev5: '#1D9E75',
  knowBg: 'rgba(224,160,74,0.14)', knowBorder: 'rgba(224,160,74,0.55)',
  knowTitle: '#E0A04A', knowBody: 'rgba(255,255,255,0.88)',
  shadow: 'none',
  statusBar: 'light',
};

/**
 * ALWAYS DARK, WHATEVER THE MEMBER PICKED.
 * Founder ruling 2026-08-22: "Tactical and K-9 are the only dark everything."
 * A tactical surface is not a preference. It is a condition of use — a bright
 * screen in the field is a liability, not a style choice.
 */
export const ALWAYS_DARK = /(^|\/)(k9|tactical|k9-tactical|equine|agricultural)(\b|\/|$)/i;

export function routeForcesDark(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // K9 and TACTICAL only. Equine and Agricultural are listed in the pattern
  // above for one reason and it is written down rather than assumed: they sit
  // on the same species spoke. THEY ARE NOT FORCED until the founder says so.
  return /(^|\/)(k9|tactical)(\b|\/|$)/i.test(pathname);
}

/* ── the store ────────────────────────────────────────────────────────────── */

const KEY = 'aa2_mode_v1';

type Ctx = {
  /** what the member picked */
  picked: Mode;
  /** what this screen must actually render — picked, unless forced dark */
  tokens: Tokens;
  forced: boolean;
  setMode: (m: Mode) => void;
  toggle: () => void;
  ready: boolean;
};

const ThemeCtx = createContext<Ctx>({
  picked: 'dark', tokens: DARK, forced: false,
  setMode: () => {}, toggle: () => {}, ready: false,
});

export function ThemeProviderAA2({
  children, pathname,
}: { children: React.ReactNode; pathname?: string | null }) {
  // DARK is the opening default — it is what shipped, and a member who never
  // touches the button sees no change.
  const [picked, setPicked] = useState<Mode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await vaultRead(KEY);
        if (v === 'light' || v === 'dark') setPicked(v);
      } catch {}
      setReady(true);
    })();
  }, []);

  const setMode = useCallback((m: Mode) => {
    setPicked(m);
    vaultWrite(KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setPicked(prev => {
      const next: Mode = prev === 'dark' ? 'light' : 'dark';
      vaultWrite(KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const forced = routeForcesDark(pathname);
  const tokens = forced ? DARK : (picked === 'light' ? LIGHT : DARK);

  const value = useMemo(
    () => ({ picked, tokens, forced, setMode, toggle, ready }),
    [picked, tokens, forced, setMode, toggle, ready]
  );

  return React.createElement(ThemeCtx.Provider, { value }, children);
}

/** The one call every screen makes. */
export function useTheme(): Tokens {
  return useContext(ThemeCtx).tokens;
}

/** For the button itself, and for anything that needs to know it was forced. */
export function useThemeControl(): Ctx {
  return useContext(ThemeCtx);
}

/* ── THE MIGRATION HELPER ─────────────────────────────────────────────────────
 *
 * Thirty-two screens were hand-painted against near-black over a year. Their
 * colours are not a system — they are five different door grounds (Earth
 * #0D0A04, Ocean #030D14, Alpine #040D08, Obsidian #080808, Desert #0F0A04),
 * a navy hall #0E1B33, and about four hundred literals besides.
 *
 * `dl` migrates a screen WITHOUT touching what dark looks like. The dark value
 * stays in the file, verbatim, as a literal you can read and diff. The light
 * value comes from the founder's own two-mode file. That makes LAW 1 provable
 * rather than promised: if you can still see #0E1B33 in the source, dark did
 * not move.
 *
 *     backgroundColor: dl(T, '#0E1B33', T.bg)
 *                          ^ what shipped   ^ his light ground
 */
export function dl<V>(T: Tokens, darkValue: V, lightValue: V): V {
  return T.mode === 'dark' ? darkValue : lightValue;
}

/* ── THE FIVE DOORS ───────────────────────────────────────────────────────────
 *
 * The scanner's door palettes, in both modes. The DARK column is copied out of
 * app/(tabs)/index.tsx exactly as it has always been. The LIGHT column follows
 * the founder's own file, where every surface shares ONE ground (#FAF7F2 on
 * #F0EEE8) and the door's identity is carried by the ACCENT, not the ground:
 *
 *      gold    #C49A2A -> #b8861e
 *      blue    #4A9EFF -> #2a7faa
 *      green   #2ECF73 -> #2a882a
 *      purple  #9B59B6 -> #5566aa
 *      orange  #F5922A -> #a85a18
 *
 * That is his design decision, not an inference: in light mode ten surfaces
 * rendered on the same cream and were told apart by colour of type and rule.
 */
export type DoorKey = 'earth' | 'ocean' | 'alpine' | 'obsidian' | 'desert';
export type Door = { bg: string; card: string; border: string; accent: string; name: string };

export const DOORS_DARK: Record<DoorKey, Door> = {
  earth:    { bg:'#0D0A04', card:'#1A1408', border:'#2E2208', accent:'#C49A2A', name:'Earth'    },
  ocean:    { bg:'#030D14', card:'#0A1A24', border:'#0E2535', accent:'#4A9EFF', name:'Ocean'    },
  alpine:   { bg:'#040D08', card:'#0A180D', border:'#0E2214', accent:'#2ECF73', name:'Alpine'   },
  obsidian: { bg:'#080808', card:'#131313', border:'#1E1E1E', accent:'#9B59B6', name:'Obsidian' },
  desert:   { bg:'#0F0A04', card:'#1A1208', border:'#2E1E08', accent:'#F5922A', name:'Desert'   },
};

export const DOORS_LIGHT: Record<DoorKey, Door> = {
  earth:    { bg:'#F0EEE8', card:'#FFFFFF', border:'rgba(0,0,0,0.12)', accent:'#b8861e', name:'Earth'    },
  ocean:    { bg:'#F0EEE8', card:'#FFFFFF', border:'rgba(0,0,0,0.12)', accent:'#2a7faa', name:'Ocean'    },
  alpine:   { bg:'#F0EEE8', card:'#FFFFFF', border:'rgba(0,0,0,0.12)', accent:'#2a882a', name:'Alpine'   },
  obsidian: { bg:'#F0EEE8', card:'#FFFFFF', border:'rgba(0,0,0,0.12)', accent:'#5566aa', name:'Obsidian' },
  desert:   { bg:'#F0EEE8', card:'#FFFFFF', border:'rgba(0,0,0,0.12)', accent:'#a85a18', name:'Desert'   },
};

export function doorsFor(T: Tokens): Record<DoorKey, Door> {
  return T.mode === 'dark' ? DOORS_DARK : DOORS_LIGHT;
}

/* ── THE RESOLVER ─────────────────────────────────────────────────────────────
 *
 * Some colours in AA2 do not live in a stylesheet. They live in DATA — the five
 * door palettes, the severity ladder, a per-item accent on a list row. Rewriting
 * a data table would change what the data SAYS; that is not a rewire, it is an
 * edit. So the data keeps its dark value and the SCREEN resolves it at render:
 *
 *     <Text style={{ color: lc(T, item.accent) }}>
 *
 * Same table as the stylesheets use, so a colour cannot mean one thing in a
 * sheet and another thing in a row. Anything not in the table comes back
 * UNCHANGED — a colour AA2 has no light answer for is left alone rather than
 * guessed at. NEVER MANUFACTURE A DOCTRINE applies to palettes too.
 */
const LIGHT_HEX: Record<string, string> = {
  '#0e1b33': '#F0EEE8',
  '#03050a': '#F0EEE8',
  '#0d0a04': '#F0EEE8',
  '#080808': '#F0EEE8',
  '#030d14': '#F0EEE8',
  '#040d08': '#F0EEE8',
  '#0f0a04': '#F0EEE8',
  '#0a0804': '#FAF7F2',
  '#060506': '#FAF7F2',
  '#0a0a0a': '#FAF7F2',
  '#1a1408': '#FFFFFF',
  '#0a1a24': '#FFFFFF',
  '#0a180d': '#FFFFFF',
  '#131313': '#FFFFFF',
  '#1a1208': '#FFFFFF',
  '#2e2208': 'rgba(0,0,0,0.12)',
  '#0e2535': 'rgba(0,0,0,0.12)',
  '#0e2214': 'rgba(0,0,0,0.12)',
  '#1e1e1e': 'rgba(0,0,0,0.12)',
  '#2e1e08': 'rgba(0,0,0,0.12)',
  '#e8eef5': '#1a1a1a',
  '#ecedee': '#1a1a1a',
  '#8a99ad': 'rgba(0,0,0,0.55)',
  '#8b7355': 'rgba(0,0,0,0.55)',
  '#5c6b80': 'rgba(0,0,0,0.38)',
  '#1bb8ff': '#2a7faa',
  '#4a9eff': '#2a7faa',
  '#4a9fd4': '#2a7faa',
  '#8fd6ff': '#1f6a90',
  '#0a7ea4': '#1f6a90',
  '#d4a847': '#b8861e',
  '#c49a2a': '#b8861e',
  '#c9a84c': '#b8861e',
  '#d4a84b': '#b8861e',
  '#e0a04a': '#8A6410',
  '#e8c887': '#8A6410',
  '#b8860b': '#8A6410',
  '#34d399': '#12795A',
  '#1d9e75': '#12795A',
  '#7ce7c4': '#12795A',
  '#2ecfb3': '#12795A',
  '#2ecf73': '#2a882a',
  '#5cd65c': '#2a882a',
  '#4caf50': '#2a882a',
  '#4aaa4a': '#2a882a',
  '#e05252': '#C0392B',
  '#e24b4a': '#C0392B',
  '#ff4444': '#C0392B',
  '#e8873a': '#BC6217',
  '#f5922a': '#a85a18',
  '#c4722a': '#a85a18',
  '#9b59b6': '#5566aa',
  '#b48cf2': '#5566aa',
  '#8899cc': '#5566aa',
};

/** Accent hues inside rgba(): the hue swaps, the alpha is kept. */
const LIGHT_TRIPLE: Record<string, string> = {
  '27,184,255': '42,127,170',
  '74,158,255': '42,127,170',
  '212,168,71': '184,134,30',
  '196,154,42': '184,134,30',
  '224,160,74': '154,116,24',
  '52,211,153': '18,121,90',
  '29,158,117': '18,121,90',
  '46,207,115': '42,136,42',
  '224,82,82': '192,57,43',
  '226,75,74': '192,57,43',
  '232,135,58': '188,98,23',
  '245,146,42': '168,90,24',
  '155,89,182': '85,102,170',
  '180,140,242': '85,102,170',
};

/** White-on-dark is the neutral system. Black-on-light is its counterpart —
 *  and NOT at the same alpha. Ink on cream is already high contrast; a tint on
 *  cream is not. These land on LIGHT.mut / .faint / .line / .fill exactly. */
const LIGHT_ALPHA: Record<string, number> = {
  '0.02': 0.015,
  '0.025': 0.02,
  '0.03': 0.02,
  '0.04': 0.02,
  '0.05': 0.03,
  '0.06': 0.03,
  '0.07': 0.03,
  '0.08': 0.04,
  '0.09': 0.05,
  '0.1': 0.05,
  '0.12': 0.1,
  '0.14': 0.11,
  '0.15': 0.12,
  '0.16': 0.12,
  '0.18': 0.12,
  '0.2': 0.14,
  '0.22': 0.16,
  '0.25': 0.18,
  '0.28': 0.3,
  '0.3': 0.34,
  '0.32': 0.38,
  '0.35': 0.38,
  '0.38': 0.38,
  '0.4': 0.4,
  '0.42': 0.4,
  '0.45': 0.44,
  '0.48': 0.46,
  '0.5': 0.5,
  '0.55': 0.55,
  '0.58': 0.55,
  '0.6': 0.55,
  '0.65': 0.55,
  '0.68': 0.55,
  '0.7': 0.66,
  '0.75': 0.72,
  '0.8': 0.78,
  '0.85': 0.82,
  '0.88': 0.82,
  '0.9': 0.86,
  '0.95': 0.88,
};

export function lc(T: Tokens, c: string | undefined | null): string {
  if (!c) return c as string;
  if (T.mode === 'dark') return c;               // dark is what shipped. Never touched.
  const hex = LIGHT_HEX[c.toLowerCase()];
  if (hex) return hex;
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(c);
  if (!m) return c;
  const r = m[1], g = m[2], b = m[3], a = m[4];
  if (r === '255' && g === '255' && b === '255') {
    if (a === undefined) return c;               // solid white: context decides, not a table
    const na = LIGHT_ALPHA[String(parseFloat(a))] ?? Math.round(parseFloat(a) * 55) / 100;
    return `rgba(0,0,0,${na})`;
  }
  if (r === '0' && g === '0' && b === '0') return c;   // a scrim reads the same on both
  const trip = LIGHT_TRIPLE[`${r},${g},${b}`];
  if (!trip) return c;
  return a === undefined ? `rgb(${trip})` : `rgba(${trip},${a})`;
}
