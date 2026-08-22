import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { readTheRoom, saveRoomReading, separateRoomFromBody, type RoomNight } from '@/lib/biosignals';
import { dl, useTheme, type Tokens } from '@/lib/theme-mode';

/**
 * ─── THE ROOM ───────────────────────────────────────────────────────────────
 *
 * FOUNDER ORDER, 2026-08-22:
 *   "you get the ozlo wired right so the temp can be shown that it comes up
 *    with."
 *
 * Everything else in Bio Buddy reads JAMES. This card reads WHERE JAMES IS.
 *
 * WHY IT SITS BESIDE THE BODY AND NOT INSIDE IT. Garmin's skin temperature is
 * ALREADY a deviation from his own baseline. The room is an ABSOLUTE fact about
 * a bedroom. Averaged together they would produce a number that describes
 * neither. Kept side by side they answer the one question the stack could not:
 *
 *     skin moves + room holds -> THE MASK did it
 *     skin moves + room moves -> THE ROOM did it
 *
 * MASK-AGNOSTIC BY DESIGN — founder, 2026-08-22: "they can still be worn
 * underneath the manta ... i use the OZLO to still read the room." The buds go
 * under either mask, so the room is measured in every configuration rather than
 * only the ones that happen to include one product.
 *
 * ⚠ THE PIPE IS NOT CLAIMED. No Ozlo export path has been verified — the device
 * ships 2026-08-24 and no manual has been read. Until there is a receipt a room
 * reading is entered by hand and SAYS SO on the row. The channel is real; the
 * automation is not pretended.
 */
export function TheRoom() {
  const T = useTheme();
  const st = useMemo(() => makeSt(T), [T]);

  const [nights, setNights] = useState<RoomNight[]>([]);
  const [loading, setLoading] = useState(true);
  const [temp, setTemp] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const rows = await readTheRoom(30);
      if (alive) { setNights(rows); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  useFocusEffect(load);

  /** THE REGIME LAW: a median is not a baseline, but with a handful of nights a
   *  median is the honest stand-in — and it is labelled as what it is. */
  const roomBaseline = useMemo(() => {
    const v = nights.map(n => n.roomTempC).filter((x): x is number => x != null).sort((a, b) => a - b);
    if (v.length < 3) return null;
    return v[Math.floor(v.length / 2)];
  }, [nights]);

  const latest = nights.length ? nights[nights.length - 1] : null;
  const verdict = latest ? separateRoomFromBody(latest, roomBaseline) : null;

  const onSave = async () => {
    const c = parseFloat(temp.replace(',', '.'));
    if (!isFinite(c)) { setNote('Enter the room temperature in degrees Celsius.'); return; }
    setSaving(true); setNote(null);
    const today = new Date().toISOString().slice(0, 10);
    const res = await saveRoomReading({ date: today, tempC: c, byHand: true });
    setSaving(false);
    setNote(res.ok ? 'Recorded, and marked as entered by hand.' : res.message);
    if (res.ok) { setTemp(''); load(); }
  };

  return (
    <View style={st.wrap}>
      <Text style={st.eyebrow}>THE ROOM · WHERE YOU SLEPT</Text>

      {loading ? (
        <ActivityIndicator color={T.blue} style={{ marginVertical: 14 }} />
      ) : (
        <>
          <View style={st.pair}>
            <View style={st.cell}>
              <Text style={st.k}>ROOM</Text>
              <Text style={st.v}>
                {latest?.roomTempC != null ? `${latest.roomTempC.toFixed(1)}°C` : '—'}
              </Text>
              <Text style={st.sub}>ABSOLUTE · THE BEDROOM</Text>
            </View>
            <View style={st.cell}>
              <Text style={st.k}>YOUR SKIN</Text>
              <Text style={[st.v, { color: T.gold }]}>
                {latest?.skinTempDelta != null
                  ? `${latest.skinTempDelta > 0 ? '+' : ''}${latest.skinTempDelta.toFixed(2)}°`
                  : '—'}
              </Text>
              <Text style={st.sub}>AGAINST YOUR OWN BASELINE</Text>
            </View>
          </View>

          {/* THE SEPARATION. No naked numbers — it says which one moved, or that
              it cannot tell, and never passes judgement on the member. */}
          {verdict ? (
            <View style={st.know}>
              <Text style={st.knowT}>{verdict.confident ? 'THE SEPARATION' : 'NOT YET SEPARABLE'}</Text>
              <Text style={st.knowB}>{verdict.line}</Text>
            </View>
          ) : (
            <View style={st.know}>
              <Text style={st.knowT}>NOTHING ON RECORD</Text>
              <Text style={st.knowB}>
                No room has been measured yet. Once it is, a night where your skin
                moved and the room held still means something a wrist alone can
                never tell you.
              </Text>
            </View>
          )}

          <Text style={st.baseL}>
            {roomBaseline != null
              ? `Room median ${roomBaseline.toFixed(1)}°C across ${nights.filter(n => n.roomTempC != null).length} measured nights — a median, not yet a baseline.`
              : 'Three measured nights before a room median means anything.'}
          </Text>

          {/* BY HAND UNTIL THERE IS A PIPE. Said on the card, not buried. */}
          <View style={st.entry}>
            <TextInput
              style={st.input}
              value={temp}
              onChangeText={setTemp}
              placeholder="room °C last night"
              placeholderTextColor={T.faint}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={onSave}
            />
            <Pressable
              onPress={onSave}
              disabled={saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={st.btn}>
              <Text style={st.btnTxt}>{saving ? 'SAVING…' : 'RECORD'}</Text>
            </Pressable>
          </View>
          <Text style={st.hand}>
            Entered by hand. The Ozlo case has no verified export path yet — when
            it has one it writes to this same place and this box goes quiet.
          </Text>
          {note ? <Text style={st.note}>{note}</Text> : null}
        </>
      )}
    </View>
  );
}

const makeSt = (T: Tokens) => StyleSheet.create({
  wrap:    { marginHorizontal: 14, marginBottom: 16, padding: 16, borderRadius: 14,
             borderWidth: 1, borderColor: T.line, backgroundColor: T.fill },
  eyebrow: { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 2, color: T.blue, marginBottom: 12 },
  pair:    { flexDirection: 'row', gap: 10 },
  cell:    { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: T.line,
             backgroundColor: dl(T, 'rgba(255,255,255,0.05)', '#FFFFFF'), padding: 13 },
  k:       { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 1.6, color: T.mut },
  v:       { fontSize: 26, fontWeight: '800', color: T.ink, marginTop: 4 },
  sub:     { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 1.2, color: T.faint, marginTop: 4 },
  know:    { marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 13,
             backgroundColor: T.knowBg, borderColor: T.knowBorder },
  knowT:   { fontFamily: 'DMMono-Medium', fontSize: 10.5, letterSpacing: 2, color: T.knowTitle, marginBottom: 7 },
  knowB:   { fontSize: 13.5, lineHeight: 20, color: T.knowBody },
  baseL:   { fontFamily: 'DMMono-Regular', fontSize: 10.5, letterSpacing: 1, color: T.faint, marginTop: 10, lineHeight: 16 },
  entry:   { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  input:   { flex: 1, color: T.ink, fontSize: 13.5, paddingVertical: 10, paddingHorizontal: 12,
             borderRadius: 999, borderWidth: 1, borderColor: T.line, backgroundColor: T.card },
  btn:     { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 999,
             borderWidth: 1, borderColor: T.blue, backgroundColor: dl(T, 'rgba(27,184,255,0.10)', 'rgba(42,127,170,0.10)') },
  btnTxt:  { fontFamily: 'DMMono-Medium', fontSize: 12, letterSpacing: 1.4, color: T.blue },
  hand:    { fontSize: 12, lineHeight: 18, color: T.mut, marginTop: 9 },
  note:    { fontSize: 12.5, color: T.gold, marginTop: 8 },
});
