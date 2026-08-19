// ─── components/Membrane.tsx ─────────────────────────────────────────────────
// THE MEMBRANE — BIOMETRIC RESONANT MIRRORING, rendered.
// Founder law, locked 2026-08-19: "an audio system that tracks your physical
// markers to alter its delivery... lowering your nervous system's stress
// levels." This is the VISUAL half of that law.
//
// A mirror reflects. Resonance COUPLES. The membrane matches the member's
// actual state first, then leads — and it only leads one direction.
// THE DIRECTION LAW: it can follow the member anywhere except down.
//
// Five rings = five channels, ordered slow → fast, the same way the bands run.
// The middle ring is the SPINE — the calm channel — drawn heaviest, because
// that is the one the member is being led toward.
//
// The carrier line beneath is the tone the voice would ride on. When the
// membrane speaks, `speech` swells the rings and the carrier together —
// the words and the body move as one thing.
//
// The face is a READING, not a decoration. Fast channel opens the eyes.
// Slow channel closes them. The calm channel curves the mouth. Nothing here
// is expressive for its own sake; every pixel is driven by a number.
//
// NO FAKE DATA. This component renders whatever it is handed. It does not
// invent a signal. If the caller has nothing real, it should not be mounted.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const NAVY  = '#0E1B33';
const INK   = '#E8EEF5';
const FAINT = 'rgba(255,255,255,0.32)';

/** Channel values, all normalised 0..1, ordered slow → fast. */
export type MembraneChannels = {
  slow: number;    // delta-equivalent — depth / recovery load
  drift: number;   // theta-equivalent — drift / drowsiness
  calm: number;    // alpha-equivalent — THE SPINE. what we lead toward.
  active: number;  // beta-equivalent — engagement / effort
  sharp: number;   // gamma-equivalent — spike / reactivity
};

export type MembraneProps = {
  channels: MembraneChannels;
  /** 0..1 — how agitated the signal is. Drives the jitter and the colour. */
  turbulence?: number;
  /** 0..1.6 — speech envelope. Swells rings + carrier on the words that carry weight. */
  speech?: number;
  /** Accent hex. Caller decides; the membrane never picks its own mood. */
  accent?: string;
  size?: number;
  showFace?: boolean;
  showCarrier?: boolean;
  /** Set false to freeze (screenshots, reduced motion). */
  animate?: boolean;
};

const RING_KEYS: (keyof MembraneChannels)[] = ['slow', 'drift', 'calm', 'active', 'sharp'];
const POINTS = 48;          // per ring — enough to read as organic, cheap enough for JS
const FRAME_MS = 33;        // ~30fps

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Smooth deterministic wobble — three summed sines, no randomness, no drift. */
function wob(seed: number, t: number, a: number): number {
  return (
    Math.sin(t * (0.31 + seed * 0.07) + a * 1.7 + seed) * 0.5 +
    Math.sin(t * (0.73 + seed * 0.11) + a * 2.3 + seed * 2) * 0.32 +
    Math.sin(t * (1.57 + seed * 0.05) + a * 3.1 + seed * 3) * 0.18
  );
}

function ringPath(
  cx: number, cy: number, radius: number,
  amp: number, jit: number, freq: number, t: number, seed: number,
): string {
  let d = '';
  for (let i = 0; i <= POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    const w =
      Math.sin(a * freq + t * (0.9 + seed * 0.35)) * amp +
      wob(seed, t * (0.55 + seed * 0.14), a) * jit +
      Math.sin(a * freq * 2 - t * 1.6) * amp * 0.3;
    const r = radius + w;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.92;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d + 'Z';
}

function carrierPath(w: number, y: number, t: number, calm: number, active: number, jit: number, speech: number): string {
  let d = '';
  const step = Math.max(3, Math.round(w / 90));
  for (let x = 0; x <= w; x += step) {
    const p = x / w;
    const v =
      Math.sin(p * Math.PI * 4 + t * 1.5) * (4 + calm * 14) +
      Math.sin(p * Math.PI * 10 - t * 2.4) * (2 + active * 8) +
      wob(1, t * 0.9, p * 5) * jit * 9 +
      Math.sin(p * Math.PI * 22 + t * 4.1) * speech * 9;
    d += (x === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + (y + v).toFixed(1) + ' ';
  }
  return d;
}

export default function Membrane({
  channels,
  turbulence = 0.2,
  speech = 0,
  accent = '#1BB8FF',
  size = 300,
  showFace = true,
  showCarrier = true,
  animate = true,
}: MembraneProps) {
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const start = useRef(0);

  useEffect(() => {
    if (!animate) return;
    const loop = (ts: number) => {
      if (!start.current) start.current = ts;
      if (ts - last.current >= FRAME_MS) {
        last.current = ts;
        setT((ts - start.current) / 1000);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current != null) cancelAnimationFrame(raf.current); };
  }, [animate]);

  const cx = size / 2;
  const cy = size / 2;
  const base = size * 0.24;
  const jit = clamp01(turbulence) * base * 0.1;
  const sp = speech;

  const rings = RING_KEYS.map((k, i) => {
    const v = clamp01(channels[k]);
    const amp = base * 0.11 * (0.35 + v) + sp * base * 0.13;
    const rad = base * (0.52 + i * 0.19);
    const isSpine = k === 'calm';
    return {
      key: k,
      d: ringPath(cx, cy, rad, amp, jit, 3 + i * 2, t, i),
      opacity: 0.1 + v * 0.3 + sp * 0.16,
      width: isSpine ? 2.1 : 1.15,
    };
  });

  // Face — every value is a reading.
  const openness = clamp01(0.35 + channels.active * 0.55 - channels.slow * 0.28);
  const smile = (channels.calm - 0.42) * 1.5 + sp * 0.25;
  const eyeY = cy - base * 0.16;
  const eyeDX = base * 0.19;
  const mouthY = cy + base * 0.2;
  const mouthW = base * 0.26;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="mglow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.05 + sp * 0.07} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={base * 1.1} fill="url(#mglow)" />

        {rings.map(r => (
          <Path
            key={r.key}
            d={r.d}
            stroke={accent}
            strokeWidth={r.width}
            strokeOpacity={r.opacity}
            fill="none"
          />
        ))}

        {showCarrier && (
          <Path
            d={carrierPath(size, cy + base * 1.42, t, channels.calm, channels.active, clamp01(turbulence), sp)}
            stroke={accent}
            strokeWidth={1.6}
            strokeOpacity={0.3 + sp * 0.4}
            fill="none"
          />
        )}

        {showFace && (
          <>
            <Ellipse
              cx={cx - eyeDX} cy={eyeY}
              rx={base * 0.062} ry={base * 0.062 * Math.max(0.1, openness)}
              stroke={accent} strokeWidth={2} strokeOpacity={0.5} fill="none"
            />
            <Ellipse
              cx={cx + eyeDX} cy={eyeY}
              rx={base * 0.062} ry={base * 0.062 * Math.max(0.1, openness)}
              stroke={accent} strokeWidth={2} strokeOpacity={0.5} fill="none"
            />
            <Path
              d={`M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + smile * base * 0.3} ${cx + mouthW} ${mouthY}`}
              stroke={accent} strokeWidth={2} strokeOpacity={0.45} fill="none"
            />
          </>
        )}
      </Svg>
    </View>
  );
}

/** Small labelled channel meters — the numbers behind the picture. */
export function MembraneChannelMeters({
  channels, labels, accents,
}: {
  channels: MembraneChannels;
  labels?: Partial<Record<keyof MembraneChannels, string>>;
  accents?: Partial<Record<keyof MembraneChannels, string>>;
}) {
  const defLabels: Record<keyof MembraneChannels, string> = {
    slow: 'RECOVERY', drift: 'DRIFT', calm: 'CALM', active: 'ACTIVE', sharp: 'SHARP',
  };
  const defAccents: Record<keyof MembraneChannels, string> = {
    slow: '#AA44FF', drift: '#7B6FA6', calm: '#1BB8FF', active: '#34D399', sharp: '#D4A847',
  };
  return (
    <View style={{ gap: 8 }}>
      {RING_KEYS.map(k => (
        <View key={k} style={s.meterRow}>
          <Text style={s.meterName}>{labels?.[k] ?? defLabels[k]}</Text>
          <View style={s.meterTrack}>
            <View
              style={[
                s.meterFill,
                { width: `${Math.max(4, Math.round(clamp01(channels[k]) * 100))}%`,
                  backgroundColor: accents?.[k] ?? defAccents[k] },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  meterRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meterName:  { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.6, color: FAINT, width: 74 },
  meterTrack: { width: 74, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  meterFill:  { height: '100%', borderRadius: 2 },
});

export { NAVY as MEMBRANE_NAVY, INK as MEMBRANE_INK };
