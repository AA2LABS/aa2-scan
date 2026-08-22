import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeControl, type Tokens } from '@/lib/theme-mode';

/**
 * ─── THE BUTTON ─────────────────────────────────────────────────────────────
 *
 * FOUNDER, 2026-08-22:
 *   "The member still picks because they are able to click the button that
 *    chooses light or dark. If you make a light version, there is no fucking
 *    mixing both light and dark. The whole app would be light. The whole app
 *    would be dark."
 *
 * So this is not a per-screen switch and it is not a system-follow switch. It
 * is ONE decision that moves the entire panel, stored in the vault, restored on
 * the next launch. The member's pick survives the app closing — the same
 * failure that made him thirty-three strangers is not repeated here.
 *
 * WHEN IT IS FORCED. On K9 and TACTICAL the button still shows what the member
 * picked, but the screen renders dark regardless, and the button SAYS SO rather
 * than lying by omission. Founder ruling: "Tactical and K-9 are the only dark
 * everything." A tactical surface is a condition of use, not a preference — and
 * ZERO SHAME means the app explains itself instead of silently disobeying.
 *
 * READABILITY LAW: label 10.5 minimum, body 13 minimum. Both met.
 * HITSLOP: the segments render ~34px tall; hitSlop lifts each to 44px.
 */
export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { picked, tokens: T, forced, setMode, ready } = useThemeControl();
  const st = useMemo(() => makeSt(T), [T]);

  if (!ready) return null;

  return (
    <View style={st.wrap}>
      {!compact ? <Text style={st.eyebrow}>THE PANEL</Text> : null}

      <View style={st.track}>
        {(['light', 'dark'] as const).map(m => {
          const on = picked === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              style={[st.seg, on && st.segOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={m === 'light' ? 'Light panel' : 'Dark panel'}
            >
              <Text style={[st.segTxt, on && st.segTxtOn]}>
                {m === 'light' ? '☀  LIGHT' : '☾  DARK'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {forced ? (
        <Text style={st.forced}>
          This door renders dark whatever you pick. Tactical and K9 are dark
          everything — a bright screen in the field is a liability, not a style.
          Your pick is kept and every other door honours it.
        </Text>
      ) : !compact ? (
        <Text style={st.note}>One pick. The whole app. Kept for next time.</Text>
      ) : null}
    </View>
  );
}

const makeSt = (T: Tokens) =>
  StyleSheet.create({
    wrap: { marginTop: 4, marginBottom: 16 },
    eyebrow: {
      fontSize: 10.5, letterSpacing: 2, fontWeight: '700',
      color: T.gold, marginBottom: 8, marginLeft: 2,
    },
    track: {
      flexDirection: 'row', borderRadius: 12, padding: 3,
      backgroundColor: T.fill, borderWidth: 1, borderColor: T.line,
    },
    seg: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
    segOn: {
      backgroundColor: T.mode === 'dark' ? 'rgba(255,255,255,0.10)' : '#FFFFFF',
      borderWidth: 1, borderColor: T.line,
    },
    segTxt: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: T.faint },
    segTxtOn: { color: T.ink },
    note: { fontSize: 12, color: T.mut, marginTop: 8, marginLeft: 2 },
    forced: {
      fontSize: 12.5, lineHeight: 18, color: T.knowBody, marginTop: 10,
      backgroundColor: T.knowBg, borderWidth: 1, borderColor: T.knowBorder,
      borderRadius: 12, padding: 12,
    },
  });
