import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { logMembraneEvent } from '@/lib/db';
import { classifyClarification } from '@/lib/clarifier';

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const BLUE        = '#1BB8FF';
const BLUE_DIM    = 'rgba(27,184,255,0.15)';
const BLUE_BORDER = 'rgba(27,184,255,0.40)';
const GREEN       = '#1D9E75';
const RED         = '#E05252';
const GOLD        = '#C49A2A';
const DARK_BG     = '#0A0804';
const CARD_BG     = '#150F0A';
const WHITE       = '#FFFFFF';
const MUTED       = 'rgba(255,255,255,0.55)';
const TEAL        = '#2ECFB3';
const PURPLE      = '#9B59B6';
const ORANGE      = '#E8873A';

// ─── FONTS ───────────────────────────────────────────────────────────────────
const F = {
  display: 'BebasNeue-Regular',
  serif:   'CormorantGaramond-Regular',
  serifIt: 'CormorantGaramond-Italic',
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
  sans:    'DMSans-Regular',
  sansMd:  'DMSans-Medium',
};

// ─── DIMENSIONS ──────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

// ─── PANEL DATA ──────────────────────────────────────────────────────────────
const PANELS = [
  { id: 1,  caption: 'This is what your morning looks like. Every device. Every signal. One rhythm.' },
  { id: 2,  caption: 'The more you clarify, the more precisely the membrane reflects you — not the population average.' },
  { id: 3,  caption: 'Your allergens are the first check on every scan. Labels lie. The Equalizer does not.' },
  { id: 4,  caption: 'Roadside stand in Montana. Market in Tokyo. Wild river in Iceland. Point. Scan. Know.' },
  { id: 5,  caption: 'Your buddies got the elk. The system tells you what to do next.' },
  { id: 6,  caption: 'Everyone you protect. One membrane.' },
  { id: 7,  caption: 'They cannot read labels. You can. Because the system reads them first.' },
  { id: 8,  caption: 'Handler biology transfers. The system knows before the mission starts.' },
  { id: 9,  caption: 'Feed consistency is performance. Biosignal sync is trust.' },
  { id: 10, caption: 'Mycotoxins do not announce themselves. The system catches what the eye misses.' },
  { id: 11, caption: 'Every destination briefed. Every route pre-cleared. You move. We prepare.' },
  { id: 12, caption: 'The $12 bottle that beats the $90 one. The Sommelier knows.' },
  { id: 13, caption: 'The skin is not a barrier. It is an organ. The Cosmo Chemist reads every formula.' },
  { id: 14, caption: 'Every recipe you save builds your personal gourmet library. Download it. Share it. It grows for life.' },
  { id: 15, caption: '' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function TagChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: color + '80', backgroundColor: color + '1F', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

function PanelChip({ label, color = BLUE, filled = false }: { label: string; color?: string; filled?: boolean }) {
  return (
    <View style={{
      borderWidth: 1,
      borderColor: color,
      backgroundColor: filled ? color : color + '20',
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 5,
    }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: filled ? '#03050A' : color, letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function SevCard({ level, title, children }: { level: 1|2|3|4|5; title: string; children: React.ReactNode }) {
  const cfg = {
    1: { color: RED,    bg: 'rgba(224,82,82,0.12)',   border: 'rgba(224,82,82,0.30)',   icon: '☠', tag: 'IMMEDIATE DANGER' },
    2: { color: ORANGE, bg: 'rgba(232,135,58,0.10)',  border: 'rgba(232,135,58,0.30)',  icon: '⚠', tag: 'SERIOUS CAUTION' },
    3: { color: GOLD,   bg: 'rgba(196,154,42,0.10)',  border: 'rgba(196,154,42,0.30)',  icon: '◉', tag: 'TAKE NOTICE' },
    4: { color: BLUE,   bg: 'rgba(27,184,255,0.08)',  border: 'rgba(27,184,255,0.20)',  icon: '●', tag: 'INFORMATION' },
    5: { color: GREEN,  bg: 'rgba(29,158,117,0.10)',  border: 'rgba(29,158,117,0.25)',  icon: '◆', tag: 'ACT RIGHT' },
  }[level];
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderLeftWidth: 3, borderColor: cfg.border, borderLeftColor: cfg.color, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: cfg.color }}>{cfg.icon}</Text>
        <Text style={{ fontFamily: F.monoMd, fontSize: 8, color: cfg.color, letterSpacing: 2 }}>{cfg.tag} · {title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── PANEL 1 — MEMBRANE LIVE ─────────────────────────────────────────────────
function Panel1() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 3, flex: 1 }}>I AM THE RECEIPT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN }} />
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 2 }}>MEMBRANE LIVE</Text>
        </View>
      </View>
      <Text style={{ fontFamily: F.serifIt, fontSize: 36, color: WHITE, marginBottom: 4 }}>James Pitts</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 16 }}>BELGRADE, MT</Text>
      {[
        { label: 'Garmin Tactix 8',  value: '74 HRV',       color: BLUE   },
        { label: 'Oura Ring 4',       value: '68 Readiness', color: GREEN  },
        { label: 'Beats Pro 2',       value: '42ms HRV',     color: GOLD   },
        { label: 'Oakley Meta HSTN',  value: '58 bpm',       color: PURPLE },
      ].map(d => (
        <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, flex: 1 }}>{d.label}</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 11, color: d.color }}>{d.value}</Text>
        </View>
      ))}
      <View style={{ marginTop: 16, marginBottom: 16 }}>
        {[{ color: BLUE, w: '90%' }, { color: GREEN, w: '75%' }, { color: GOLD, w: '85%' }, { color: PURPLE, w: '70%' }].map((b, i) => (
          <View key={i} style={{ height: 2, borderRadius: 1, backgroundColor: b.color, width: b.w as any, marginBottom: 5 }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        {[{ num: '74', label: 'HRV', color: BLUE }, { num: '68', label: 'READINESS', color: GREEN }, { num: '42', label: 'HRV MS', color: GOLD }, { num: '58', label: 'BPM', color: PURPLE }].map(s => (
          <View key={s.label} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontFamily: F.monoMd, fontSize: 22, color: s.color }}>{s.num}</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 1 }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 16, backgroundColor: CARD_BG, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(196,154,42,0.30)', flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>AWARE DOLLARS</Text>
          <Text style={{ fontFamily: F.display, fontSize: 32, color: GOLD }}>$47.20</Text>
        </View>
        <View style={{ borderWidth: 1, borderColor: GOLD, borderRadius: 8, padding: 8 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 8, color: GOLD, letterSpacing: 1 }}>AA2 · ACT RIGHT</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED, marginTop: 2 }}>**** 4021</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 2 — BIO BUDDY CLARIFIER ───────────────────────────────────────────
function Panel2() {
  // The member supplies the meaning the device could not. Their words reach the membrane.
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyText, setClarifyText] = useState('');
  const [clarifySaved, setClarifySaved] = useState(false);
  const [clarifyError, setClarifyError] = useState(false);

  const submitClarify = async () => {
    const note = clarifyText.trim();
    if (!note) return;
    // The Clarifier's brain: the member's words pick the category. Sexual
    // activity is NEVER logged as stress — it is its own private,
    // recovery-relevant context (founder law 2026-08-01).
    const c = classifyClarification(note);
    const ok = await logMembraneEvent({
      eventType: 'clarifier_corrected',
      sourceScreen: 'clarifier',
      subject: c.category,
      note: c.privateEntry ? undefined : note,
      value: {
        category: c.category,
        excludeFromStressBaseline: c.excludeFromStressBaseline,
        private: c.privateEntry,
        reclass: c.reclassLine,
      },
    });
    if (ok) { setClarifySaved(true); setClarifyText(''); setClarifyOpen(false); setClarifyError(false); }
    else { setClarifyError(true); }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ backgroundColor: 'rgba(224,82,82,0.12)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(224,82,82,0.40)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2 }}>BIO BUDDY · BIOSIGNAL EVENT</Text>
            <Text style={{ fontFamily: F.display, fontSize: 20, color: WHITE, marginTop: 2 }}>Elevated Stress Pattern Detected</Text>
          </View>
        </View>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 8 }}>TODAY · 2:47 PM</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED }}>Garmin HR 118bpm</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD }}>Oura Stress 74</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED }}>Strava No activity</Text>
        </View>
      </View>
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BLUE_DIM, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE_DIM, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14 }}>🧠</Text>
          </View>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 2, marginLeft: 8 }}>BIO BUDDY · CLARIFIER</Text>
        </View>
        <Text style={{ fontFamily: F.serifIt, fontSize: 16, color: WHITE, lineHeight: 24, marginBottom: 16 }}>
          "Bios reported as stress at 2:47 PM. Is that accurate, or would you like to clarify?"
        </Text>
        {clarifySaved ? (
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: '#8fd6ff', letterSpacing: 1, textAlign: 'center', paddingVertical: 8 }}>
            ✓ SENT TO YOUR MEMBRANE
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: BLUE, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                activeOpacity={0.8}
                onPress={() => { logMembraneEvent({ eventType: 'clarifier_confirmed', sourceScreen: 'clarifier', subject: 'stress', value: { confirmed: true } }); }}>
                <Text style={{ fontFamily: F.monoMd, fontSize: 9, color: '#03050A', letterSpacing: 1 }}>YES · LOG AS STRESS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, borderWidth: 1, borderColor: BLUE_DIM, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                activeOpacity={0.8}
                onPress={() => setClarifyOpen(o => !o)}>
                <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 1 }}>I'D LIKE TO CLARIFY</Text>
              </TouchableOpacity>
            </View>
            {clarifyOpen && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  style={{ borderWidth: 1, borderColor: BLUE_DIM, backgroundColor: DARK_BG, borderRadius: 8, padding: 12, minHeight: 72, color: WHITE, fontFamily: F.sans, fontSize: 13, textAlignVertical: 'top' }}
                  placeholder="What was actually happening?"
                  placeholderTextColor={MUTED}
                  value={clarifyText}
                  onChangeText={t => { setClarifyText(t); setClarifyError(false); }}
                  autoFocus
                  multiline
                />
                {clarifyError && (
                  <Text style={{ fontFamily: F.mono, fontSize: 9, color: ORANGE, letterSpacing: 1, marginTop: 6 }}>
                    ⚠ NOT SAVED — RETRY
                  </Text>
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={clarifyText.trim().length === 0}
                  onPress={submitClarify}
                  style={{ marginTop: 10, borderWidth: 1, borderColor: '#8fd6ff', backgroundColor: 'rgba(143,214,255,0.10)', borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: clarifyText.trim().length === 0 ? 0.4 : 1 }}>
                  <Text style={{ fontFamily: F.monoMd, fontSize: 9, color: '#8fd6ff', letterSpacing: 1 }}>◆ SEND TO MEMBRANE →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      <View style={{ backgroundColor: 'rgba(29,158,117,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(29,158,117,0.40)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: GREEN }}>✓</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 1, marginLeft: 6 }}>CLARIFICATION LOGGED · 2:53 PM</Text>
        </View>
        <Text style={{ fontFamily: F.serifIt, fontSize: 14, color: WHITE, lineHeight: 22, marginBottom: 10 }}>
          "That is not stress. I just got promoted and got approved for my new house. That's excitement."
        </Text>
        {[
          { color: BLUE,  text: 'Garmin HR spike — reclassified STRESS → EXCITEMENT' },
          { color: GREEN, text: 'Oura stress 74 — excluded from stress baseline' },
          { color: BLUE,  text: 'Positive life event logged' },
        ].map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: b.color, marginTop: 4 }} />
            <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, flex: 1 }}>{b.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── PANEL 3 — EQUALIZER + CHEF ──────────────────────────────────────────────
function Panel3() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ backgroundColor: 'rgba(196,154,42,0.15)', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(196,154,42,0.35)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD }} />
        <Text style={{ fontFamily: F.mono, fontSize: 10, color: GOLD, letterSpacing: 1 }}>HEADS UP · Read before you buy</Text>
      </View>
      <View style={{ backgroundColor: 'rgba(224,82,82,0.10)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderLeftWidth: 3, borderColor: 'rgba(224,82,82,0.30)', borderLeftColor: RED }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 6 }}>MEMBRANE FLAG · PEANUT ALLERGEN</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 13, color: WHITE, lineHeight: 20 }}>
          This tomato paste <Text style={{ color: RED }}>contains traces of peanut oil</Text> from shared equipment. Your membrane flags peanut sensitivity.
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {['Muir Glen ✓', 'Bianco DiNapoli ✓', 'Jovial ✓'].map(b => <TagChip key={b} label={b} color={GREEN} />)}
        </View>
      </View>
      <Text style={{ fontFamily: F.serifIt, fontSize: 22, color: WHITE, marginTop: 12, marginBottom: 2 }}>Cento Tomato Paste</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 12 }}>6 OZ · CANNED · SCANNED IN STORE</Text>
      <Text style={{ fontFamily: F.serifIt, fontSize: 18, color: GOLD, marginBottom: 4 }}>The Chef</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>TAP A RECIPE TO BUILD YOUR LIST</Text>
      <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.sans, fontSize: 15, color: WHITE }}>Spaghetti Bolognese</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, marginTop: 3 }}>8 ingredients · 45 min · 3 still needed</Text>
        </View>
        <Text style={{ fontFamily: F.sans, fontSize: 20, color: MUTED, marginLeft: 8 }}>›</Text>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 4 — THE FORAGER ───────────────────────────────────────────────────
function Panel4() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: BLUE_DIM, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16 }}>🌿</Text>
        <View>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 2 }}>THE EQUALIZER · FORAGER LAYER</Text>
          <Text style={{ fontFamily: F.serifIt, fontSize: 16, color: WHITE, marginTop: 2 }}>Fish & Water</Text>
        </View>
      </View>
      <View style={{ backgroundColor: CARD_BG, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: BLUE_DIM }}>
        <View style={{ backgroundColor: 'rgba(29,158,117,0.20)', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN }} />
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: GREEN, letterSpacing: 2 }}>ALL CLEAR · EDIBLE</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, marginLeft: 'auto' }}>Identified with high confidence</Text>
        </View>
        <View style={{ padding: 14 }}>
          <Text style={{ fontFamily: F.serifIt, fontSize: 28, color: WHITE, marginBottom: 2 }}>Rainbow Trout</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, marginBottom: 10 }}>Oncorhynchus mykiss · Salmonidae</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <TagChip label="SAFE TO EAT" color={GREEN} />
            <TagChip label="NATIVE · MT" color={BLUE} />
            <TagChip label="IN SEASON"   color={TEAL} />
          </View>
          {[
            { label: 'HABITAT',      value: "Cold, clear mountain streams. Yellowstone drainage. Thrives in Montana's Clark Fork system.", color: WHITE },
            { label: 'EDIBILITY',    value: 'Excellent. Mild, clean flavor. Best pan-fried or grilled over open flame within 24 hours.', color: GREEN },
            { label: 'NUTRITION',    value: 'High Omega-3 (1.9g/100g). 20g protein. Low mercury. Vitamin D, B12, selenium.', color: WHITE },
            { label: 'REGULATIONS',  value: 'Montana FWP: 5 fish/day limit. Local water restrictions. License required.', color: RED },
          ].map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 1, width: 80 }}>{r.label}</Text>
              <Text style={{ fontFamily: F.sans, fontSize: 12, color: r.color, flex: 1, lineHeight: 18 }}>{r.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 5 — THE HUNTER ────────────────────────────────────────────────────
function Panel5() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(232,135,58,0.30)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16 }}>🦌</Text>
        <View>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: ORANGE, letterSpacing: 2 }}>HUNTER INTELLIGENCE</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, marginTop: 2 }}>Wild Game · Field Safety · Harvest Intelligence</Text>
        </View>
      </View>
      <SevCard level={1} title="CWD STATUS">
        <Text style={{ fontFamily: F.serifIt, fontSize: 18, color: WHITE, marginBottom: 6 }}>Rocky Mountain Elk · Bull · 3-4 years</Text>
        <View style={{ backgroundColor: 'rgba(224,82,82,0.20)', borderRadius: 6, padding: 10 }}>
          <Text style={{ fontFamily: F.monoMd, fontSize: 9, color: RED, letterSpacing: 1, marginBottom: 4 }}>CASES DETECTED · GALLATIN COUNTY</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, lineHeight: 18 }}>
            Do not consume brain, spinal cord, eyes, spleen, or lymph nodes. Contact Montana FWP for free testing kit before consumption.
          </Text>
        </View>
      </SevCard>
      <SevCard level={2} title="FIELD SAFETY">
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, lineHeight: 18 }}>
          Liver fluke risk in elk from wet regions. Inspect liver before consumption. Lead fragmentation possible — rifle harvest: trim 6 inches around wound channel.
        </Text>
      </SevCard>
      <SevCard level={3} title="REGULATIONS">
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, lineHeight: 18 }}>
          Montana FWP · Bull elk · 1 per season · Tag within 24hrs · Report to FWP within 24hrs of harvest · License required.
        </Text>
      </SevCard>
    </ScrollView>
  );
}

// ─── PANEL 6 — THE FAMILY DASHBOARD ─────────────────────────────────────────
function Panel6() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 3 }}>I AM THE RECEIPT</Text>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 2 }}>MEMBRANE LIVE</Text>
        </View>
      </View>

      {/* James Pitts */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(27,184,255,0.30)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.serifIt, fontSize: 20, color: WHITE }}>James Pitts</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginTop: 2 }}>BELGRADE, MT</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(27,184,255,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: BLUE, letterSpacing: 1 }}>MEMBRANE LIVE</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
          <Text style={{ fontFamily: F.monoMd, fontSize: 12, color: BLUE }}>74 HRV</Text>
          <Text style={{ fontFamily: F.monoMd, fontSize: 12, color: GREEN }}>68 RDY</Text>
          <Text style={{ fontFamily: F.monoMd, fontSize: 12, color: GREEN }}>ALL CLEAR</Text>
        </View>
      </View>

      {/* Sarah M. */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(196,154,42,0.30)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.serifIt, fontSize: 20, color: WHITE }}>Sarah M.</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginTop: 2 }}>BELGRADE, MT</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(196,154,42,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: GOLD, letterSpacing: 1 }}>SCANNER ACTIVE</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.monoMd, fontSize: 11, color: RED }}>PAY ATTENTION</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 11, color: MUTED }}>Nestle Pure Life</Text>
        </View>
      </View>

      {/* Children */}
      {['Child 1', 'Child 2'].map(name => (
        <View key={name} style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sans, fontSize: 13, color: WHITE, flex: 1 }}>{name}</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 1 }}>PROTECTED</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── PANEL 7 — K9 / FELINE ───────────────────────────────────────────────────
function Panel7() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header badge */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: BLUE_DIM, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 16 }}>🐾</Text>
        <View>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 2 }}>K9 / FELINE INTELLIGENCE</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 11, color: MUTED, marginTop: 2 }}>ASPCA Database Active</Text>
        </View>
      </View>

      {/* Danger card */}
      <View style={{ backgroundColor: 'rgba(224,82,82,0.12)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderLeftWidth: 3, borderColor: 'rgba(224,82,82,0.30)', borderLeftColor: RED }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 8 }}>LEVEL 1 · IMMEDIATE DANGER</Text>
        <Text style={{ fontFamily: F.monoMd, fontSize: 12, color: RED, letterSpacing: 1, marginBottom: 6 }}>XYLITOL DETECTED · TOXIC TO CANINES</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 13, color: WHITE, lineHeight: 20 }}>
          This product contains xylitol. Even small amounts cause rapid insulin release and liver failure in dogs. Do not give to any canine.
        </Text>
      </View>

      {/* Safe alternatives */}
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 2, marginBottom: 8 }}>CANINE-SAFE ALTERNATIVES</Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {["Zuke's Mini Naturals ✓", 'Wellness Soft WellBites ✓', 'Blue Buffalo Bits ✓'].map(b => (
          <TagChip key={b} label={b} color={GREEN} />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── PANEL 8 — K9 TACTICAL ───────────────────────────────────────────────────
function Panel8() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: 'rgba(139,115,85,1)', letterSpacing: 3, marginBottom: 8 }}>SPOKE 27 · TACTICAL</Text>
      <Text style={{ fontFamily: F.display, fontSize: 36, color: WHITE, marginBottom: 4 }}>K9 Tactical</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginBottom: 16 }}>Handler + Canine · Mission Readiness</Text>

      {/* Handler row */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(27,184,255,0.25)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE }} />
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: BLUE, letterSpacing: 2, marginLeft: 6 }}>HANDLER</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED, marginLeft: 'auto' }}>HR 94 · STRESS 42</Text>
        </View>
        <View style={{ height: 2, borderRadius: 1, backgroundColor: BLUE, width: '65%' }} />
      </View>

      {/* K9 row */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(224,82,82,0.35)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: RED }} />
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: RED, letterSpacing: 2, marginLeft: 6 }}>K9 UNIT</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: RED, marginLeft: 'auto' }}>HR 118 · STRESS ELEVATED</Text>
        </View>
        <View style={{ height: 2, borderRadius: 1, backgroundColor: RED, width: '80%' }} />
      </View>

      {/* Transfer alert */}
      <View style={{ backgroundColor: 'rgba(224,82,82,0.10)', borderRadius: 10, padding: 12, marginTop: 4, borderWidth: 1, borderColor: 'rgba(224,82,82,0.35)', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: RED }}>⚠</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 1, marginBottom: 3 }}>HANDLER STRESS TRANSFERRING TO K9</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 11, color: MUTED, lineHeight: 16 }}>
            Recommend handler recovery protocol before deployment.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 9 — EQUINE INTELLIGENCE ───────────────────────────────────────────
function Panel9() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 8 }}>SPOKE 28 · EQUESTRIAN</Text>
      <Text style={{ fontFamily: F.display, fontSize: 36, color: WHITE, marginBottom: 4 }}>Equine Intelligence</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginBottom: 16 }}>Equine Nutritionist · Safety · Performance</Text>

      {/* Feed scan result */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(196,154,42,0.30)' }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>FEED SCAN RESULT</Text>
        <Text style={{ fontFamily: F.sansMd, fontSize: 14, color: WHITE, marginBottom: 4 }}>Standlee Premium Timothy Grass</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <PanelChip label="SAFE" color={GREEN} />
          <PanelChip label="LOW SUGAR" color={BLUE} />
          <PanelChip label="VERIFIED" color={GREEN} />
        </View>
      </View>

      {/* Supplement warning */}
      <View style={{ backgroundColor: 'rgba(232,135,58,0.10)', borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 3, borderColor: 'rgba(232,135,58,0.30)', borderLeftColor: ORANGE }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: ORANGE, letterSpacing: 2, marginBottom: 6 }}>LEVEL 2 · SUPPLEMENT INTERACTION</Text>
        <Text style={{ fontFamily: F.monoMd, fontSize: 12, color: ORANGE, letterSpacing: 1, marginBottom: 6 }}>IRON OVERLOAD RISK</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, lineHeight: 18 }}>
          Current iron supplement combined with this hay exceeds safe threshold for your horse's weight and breed. Reduce iron supplement by 50% or switch hay source.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 10 — AGRICULTURAL INTELLIGENCE ────────────────────────────────────
function Panel10() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: '#4CAF50', letterSpacing: 3, marginBottom: 8 }}>SPOKE 29 · AGRICULTURAL</Text>
      <Text style={{ fontFamily: F.display, fontSize: 32, color: WHITE, marginBottom: 4 }}>Agricultural Intelligence</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginBottom: 16 }}>Agricultural Analyst · Livestock · Feed Safety</Text>

      {/* Danger card */}
      <View style={{ backgroundColor: 'rgba(224,82,82,0.12)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderLeftWidth: 3, borderColor: 'rgba(224,82,82,0.30)', borderLeftColor: RED }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 8 }}>LEVEL 1 · IMMEDIATE DANGER</Text>
        <Text style={{ fontFamily: F.monoMd, fontSize: 13, color: RED, letterSpacing: 1, marginBottom: 4 }}>MYCOTOXIN DETECTED</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 11, color: RED, marginBottom: 8 }}>DON · ABOVE SAFE THRESHOLD</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, lineHeight: 18 }}>
          Deoxynivalenol detected at 2.4 ppm. Safe threshold for cattle is 2.0 ppm. Do not feed this lot. Risk of reduced feed intake, immune suppression, reproductive issues.
        </Text>
      </View>

      {/* Action */}
      <View style={{ backgroundColor: 'rgba(27,184,255,0.10)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BLUE_DIM }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 2, marginBottom: 6 }}>RECOMMENDED ACTION</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 11, color: MUTED, lineHeight: 16 }}>
          Quarantine this feed lot. Contact supplier for replacement. Test remaining inventory before use.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 11 — THE CHAUFFEUR ─────────────────────────────────────────────────
function Panel11() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 3, marginBottom: 8 }}>INTELLIGENCE 0X04</Text>
      <Text style={{ fontFamily: F.display, fontSize: 36, color: WHITE, marginBottom: 4 }}>The Chauffeur</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 13, color: MUTED, marginBottom: 16 }}>Travel Intelligence · Route Safety · Waypoint Briefings</Text>

      {/* Route card */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BLUE_DIM }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 2 }}>SAFE ROUTE · PRE-CLEARED</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN, marginLeft: 'auto' }} />
        </View>
        <Text style={{ fontFamily: F.monoMd, fontSize: 12, color: WHITE, letterSpacing: 1, marginBottom: 12 }}>BELGRADE, MT → BOZEMAN, MT</Text>
        {[
          { name: 'Belgrade I-90 On-Ramp',    dist: '0.4 mi' },
          { name: 'Belgrade-Amsterdam Road',   dist: '3.2 mi' },
          { name: 'Bozeman City Center',       dist: '8.1 mi' },
        ].map((w, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE }} />
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, flex: 1 }}>{w.name}</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED }}>{w.dist}</Text>
          </View>
        ))}
      </View>

      {/* Global grocery match */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(196,154,42,0.25)' }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>GLOBAL GROCERY MATCH · TOKYO</Text>
        {[
          { yours: 'Olive oil',    match: 'Yamaki Olive Oil' },
          { yours: 'Greek yogurt', match: 'Meiji Bulgaria Yogurt' },
          { yours: 'Sourdough',    match: 'Viron Baguette' },
        ].map((g, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, flex: 1 }}>{g.yours}</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 10, color: MUTED }}>→</Text>
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, flex: 1 }}>{g.match}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── PANEL 12 — WINE AND SPIRITS ─────────────────────────────────────────────
function Panel12() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>WINE & SPIRITS INTELLIGENCE</Text>
      <Text style={{ fontFamily: F.serifIt, fontSize: 28, color: WHITE, marginBottom: 2 }}>Macallan 12</Text>
      <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, marginBottom: 12 }}>Highland Single Malt · 12 Year</Text>

      {/* Result chips */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <PanelChip label="ALL CLEAR" color={GREEN} />
        <PanelChip label="40% ABV"   color={BLUE} />
        <PanelChip label="GLUTEN FREE" color={GREEN} />
      </View>

      {/* Moderation note */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>MODERATION NOTE</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, lineHeight: 18 }}>
          Clean distillation, fewer congeners. Same liver processing required.
        </Text>
      </View>

      {/* Better alternatives */}
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>BETTER ALTERNATIVES</Text>
      {[
        '→ Glenfiddich 12 (similar profile, better value)',
        '→ Glenlivet 12 (lighter, citrus notes)',
        '→ Monkey Shoulder (blended, budget-friendly)',
      ].map((alt, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text style={{ fontFamily: F.sansMd, fontSize: 13, color: BLUE, lineHeight: 20, flex: 1 }}>{alt}</Text>
          <View style={{ gap: 6, marginLeft: 8 }}>
            <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontFamily: F.mono, fontSize: 9, color: MUTED }}>WHY?</Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: BLUE_BORDER, backgroundColor: BLUE_DIM, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE }}>WHERE →</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Act Right */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 10, padding: 12, marginTop: 4, borderWidth: 1, borderColor: 'rgba(196,154,42,0.25)' }}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: GREEN }}>◆</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 9, color: GREEN, letterSpacing: 2 }}>AWARE DOLLARS</Text>
        </View>
        <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, lineHeight: 16, marginTop: 4 }}>
          Switching saves $8-12 per bottle. Goes directly to your AA2 Vault.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── PANEL 13 — PERSONAL CARE ────────────────────────────────────────────────
function Panel13() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Doctrine header */}
      <View style={{ backgroundColor: 'rgba(155,89,182,0.12)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderLeftWidth: 3, borderColor: 'rgba(155,89,182,0.30)', borderLeftColor: PURPLE }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: PURPLE, letterSpacing: 2, marginBottom: 6 }}>SKIN INGESTION DOCTRINE</Text>
        <Text style={{ fontFamily: F.sans, fontSize: 13, color: WHITE, lineHeight: 20 }}>
          The skin is not a barrier — it is an organ. What touches your skin enters your bloodstream. The Cosmo Chemist names every chemical.
        </Text>
      </View>

      {/* Product scanned */}
      <Text style={{ fontFamily: F.serifIt, fontSize: 20, color: WHITE, marginBottom: 2 }}>Neutrogena T/Gel Shampoo</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 12 }}>SCANNED · PERSONAL CARE</Text>

      {/* Flagged ingredients */}
      <View style={{ backgroundColor: 'rgba(224,82,82,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(224,82,82,0.25)' }}>
        <Text style={{ fontFamily: F.mono, fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 10 }}>FLAGGED INGREDIENTS</Text>
        {[
          { name: 'Coal Tar',                concern: 'Known carcinogen. EWG Hazard 10.' },
          { name: 'Sodium Lauryl Sulfate',   concern: 'Skin irritant. Penetration enhancer.' },
          { name: 'Fragrance',               concern: 'Undisclosed chemicals. Allergen risk.' },
        ].map((ing, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: RED, marginTop: 5 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: RED }}>{ing.name}</Text>
              <Text style={{ fontFamily: F.sans, fontSize: 11, color: MUTED, lineHeight: 15, marginTop: 2 }}>{ing.concern}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── PANEL 14 — THE VAULT · COOKBOOK ─────────────────────────────────────────
function Panel14() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 4 }}>THE VAULT · COOKBOOK</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2 }}>YOUR LIVING GOURMET LIBRARY</Text>

      {/* Recipe card */}
      <View style={{ backgroundColor: CARD_BG, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,154,42,0.30)', marginTop: 12 }}>
        {/* Saved badge */}
        <View style={{ backgroundColor: 'rgba(29,158,117,0.20)', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: GREEN }}>✓</Text>
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: GREEN, letterSpacing: 2 }}>SAVED TO COOKBOOK</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, marginLeft: 'auto' }}>APR 7, 2026 · IN-STORE SCAN</Text>
        </View>

        {/* Recipe title + chips + ingredients */}
        <View style={{ padding: 14 }}>
          <Text style={{ fontFamily: F.serifIt, fontSize: 26, color: WHITE, marginBottom: 2 }}>Spaghetti Bolognese</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <PanelChip label="ITALIAN" color={GOLD} />
            <PanelChip label="45 MIN"  color={MUTED} />
            <PanelChip label="SERVES 4" color={MUTED} />
          </View>

          {[
            { dot: GREEN, name: 'Tomato paste · 2 tbsp',   status: 'SCANNED',       statusColor: GREEN },
            { dot: GREEN, name: 'Spaghetti noodles · 400g', status: 'SCANNED',       statusColor: GREEN },
            { dot: RED,   name: 'Olive oil · 2 tbsp',       status: 'VERIFY BRAND',  statusColor: RED   },
            { dot: BLUE,  name: 'Yellow onion · 1 large',   status: 'PRODUCE',       statusColor: BLUE  },
            { dot: BLUE,  name: 'Garlic · 4 cloves',        status: 'PRODUCE',       statusColor: BLUE  },
          ].map((row, i, arr) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingVertical: 5,
              borderBottomWidth: i < arr.length - 1 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.dot }} />
              <Text style={{ fontFamily: F.sans, fontSize: 12, color: WHITE, flex: 1 }}>{row.name}</Text>
              <Text style={{ fontFamily: F.mono, fontSize: 9, color: row.statusColor, letterSpacing: 1 }}>{row.status}</Text>
            </View>
          ))}

          {/* Membrane notes */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10, marginTop: 10 }}>
            <Text style={{ fontFamily: F.mono, fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>MEMBRANE NOTES · PRIVATE</Text>
            <Text style={{ fontFamily: F.sans, fontSize: 11, color: MUTED, lineHeight: 16 }}>
              2 ingredients flagged. Substitutes confirmed. Shared version shows clean list only — membrane flags stay private.
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{ flex: 1, backgroundColor: GOLD, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
          onPress={() => { logMembraneEvent({ eventType: 'cookbook_opened', sourceScreen: 'preview-panels' }); router.push('/chef' as any); }}>
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: '#03050A', letterSpacing: 1 }}>SHARE RECIPE →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{ flex: 1, borderWidth: 1, borderColor: BLUE, backgroundColor: BLUE_DIM, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
          onPress={() => { logMembraneEvent({ eventType: 'cookbook_opened', sourceScreen: 'preview-panels' }); router.push('/chef' as any); }}>
          <Text style={{ fontFamily: F.monoMd, fontSize: 10, color: BLUE, letterSpacing: 1 }}>DOWNLOAD PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom note */}
      <Text style={{ fontFamily: F.sans, fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18, marginTop: 12 }}>
        Your Cookbook grows with every saved recipe. Download it. Share it. It is yours — always.
      </Text>
    </ScrollView>
  );
}

// ─── PANEL 15 — NORTH STAR TRANSITION ────────────────────────────────────────
function Panel15({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontFamily: F.mono, fontSize: 9, color: BLUE, letterSpacing: 3, textAlign: 'center', marginBottom: 40 }}>
        THE MEMBRANE · AA2 BIOSIGNAL SYSTEM
      </Text>
      <Text style={{ fontFamily: F.serifIt, fontSize: 26, color: WHITE, textAlign: 'center', lineHeight: 40, marginBottom: 16 }}>
        "The more of yourself you bring to this system — the more the system's mirror can reflect back to you."
      </Text>
      <Text style={{ fontFamily: F.mono, fontSize: 10, color: BLUE, letterSpacing: 2, textAlign: 'center', marginBottom: 48 }}>
        5 MINUTES · 8 BLOCKS · ONE MEMBRANE
      </Text>
      <TouchableOpacity onPress={onComplete} activeOpacity={0.85} style={{ width: '100%' }}>
        <View style={{ borderWidth: 1, borderColor: 'rgba(27,184,255,0.5)', backgroundColor: 'rgba(27,184,255,0.08)', borderRadius: 14, paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.monoMd, fontSize: 13, color: '#8fd6ff', letterSpacing: 2 }}>CHANGE ANYTHING →</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ─── FIRST-OPEN SEQUENCE (Canon v51 "THE MEMBRANE FIRST" · locked 2026-07-30) ──
// The initiation runs panels 1→8 and stops at K9 TACTICAL. Onboarding — the
// membrane build — begins DIRECTLY after the tactical-K9 screen. Panels 9–14
// (equine, agricultural, travel, sommelier, cosmo chemist, cookbook) stay
// authored here and live in the master storybook — they do not gate the skin.
// ─── THE NINE ONBOARDING STORIES — CANON LOCKED SERIES ───────────────────────
// Founder ruling 2026-08-01 (Option A): the initiation flip book IS the Nine
// Stories, canon-verbatim, never abbreviated. "Each story teaches the system
// without explaining the system." SKIP is always available — no funnel, no
// paywall behind it, so no one is forced to re-read what they already know.
// Founder photo series (2026-08-01): AA2 pre-built into every picture — the
// actual Control Panel on the doctor's tablet, the real scan on the Fold at
// the bar, the Equalizer in the Uber. The mockups-mirror-the-screens law,
// applied to photography.
const NINE_STORIES: {
  n: number; title: string; audience: string; accent: string;
  lines: string[]; quote?: string; linesAfter?: string[]; lesson: string; img: any;
}[] = [
  { n: 1, title: 'The Grocery Aisle', audience: 'PARENTS', accent: BLUE,
    img: require('../assets/stories/story-1-grocery-aisle.jpg'),
    lines: ['A parent scans cereal.', 'Nothing alarming on the label.', 'AA2 quietly says:'],
    quote: 'This conflicts with your child’s sleep recovery trend.',
    linesAfter: ['Parent switches brands.', 'No drama. No lecture. Just prevention.'],
    lesson: 'Chemicals affect behavior before symptoms.' },
  { n: 2, title: 'The School Lunch', audience: 'CHILDREN', accent: GREEN,
    img: require('../assets/stories/story-2-school-lunch.jpg'),
    lines: ['A child scans food at school.', 'The scanner translates ingredients into simple language.', 'The child learns: words, meaning, self-awareness.', 'They choose differently — by themselves.'],
    lesson: 'Agency beats restriction.' },
  { n: 3, title: 'The Foreign Menu', audience: 'TRAVEL & LANGUAGE', accent: TEAL,
    img: require('../assets/stories/story-3-foreign-menu.jpg'),
    lines: ['A family abroad scans a menu.', 'AA2 translates, explains preparation, warns about regional substitutes.', 'They eat confidently.'],
    lesson: 'Cultural curiosity without risk.' },
  { n: 4, title: 'The Uber Ride', audience: 'YOUNG ADULT SAFETY', accent: PURPLE,
    img: require('../assets/stories/story-4-uber-ride.jpg'),
    lines: ['Heart rate rises unexpectedly.', 'AA2 notes chemical + stress + environment overlap.', 'Subtle alert:'],
    quote: 'Environment inconsistent with baseline.',
    linesAfter: ['Awareness increases. Nothing escalates.'],
    lesson: 'Safety begins before danger.' },
  { n: 5, title: 'The First Date Drink', audience: 'TRUST & EXPOSURE', accent: GOLD,
    img: require('../assets/stories/story-5-first-date-drink.jpg'),
    lines: ['A drink is scanned.', 'AA2 recalls: past reactions, delayed effects, tolerance drift.', 'User switches drinks.', 'The night stays clear.'],
    lesson: 'Chemistry affects judgment.' },
  { n: 6, title: 'The Dog That Wouldn’t Eat', audience: 'PETS', accent: ORANGE,
    img: require('../assets/stories/story-6-dog-wouldnt-eat.jpg'),
    lines: ['A dog refuses food.', 'Scanner reveals: recent formula change, chemical irritant, stress overlap with handler.', 'Food is changed. Behavior normalizes.'],
    lesson: 'Animals speak through biosignals.' },
  { n: 7, title: 'The Working K9', audience: 'TACTICAL', accent: '#8B7355',
    img: require('../assets/stories/story-7-working-k9.jpg'),
    lines: ['Handler stress rises. Dog stress follows.', 'Scanner flags: supplement interaction, environment exposure, hydration imbalance.', 'Mission readiness preserved.'],
    lesson: 'Handler biology transfers.' },
  { n: 8, title: 'The Doctor Visit', audience: 'MEDICAL SHARING', accent: RED,
    img: require('../assets/stories/story-8-doctor-visit.jpg'),
    lines: ['User opts to share AA2 data.', 'Physician sees: exposure timeline, reaction curves, recovery patterns.', 'Diagnosis accelerates.'],
    lesson: 'Data removes guesswork.' },
  { n: 9, title: 'The Long View', audience: 'LEGACY', accent: BLUE,
    img: require('../assets/stories/story-9-long-view.jpg'),
    lines: ['Years of scans show: fewer inflammatory spikes, improved learning, calmer baseline, healthier animals, aligned spending.', 'AA2 says nothing.', 'The results speak.'],
    lesson: 'Small decisions compound into legacy.' },
];

function StoryPanel({ story }: { story: typeof NINE_STORIES[0] }) {
  return (
    <View style={{ flex: 1, marginHorizontal: -20, marginTop: Platform.OS === 'android' ? -48 : -60, marginBottom: -100 }}>
      {/* The founder's photo — AA2 alive on a screen inside every scene. */}
      <ImageBackground source={story.img} resizeMode="cover" style={StyleSheet.absoluteFillObject as any} />
      {/* Scrim — the photo breathes up top, the story reads down low. */}
      <View style={[StyleSheet.absoluteFillObject as any, { backgroundColor: 'rgba(5,6,10,0.28)' }]} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '64%', backgroundColor: 'rgba(5,6,10,0.60)' }} pointerEvents="none" />
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 104 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: story.accent, marginBottom: 8 }}>
          STORY {story.n} OF 9 · {story.audience}
        </Text>
        <Text style={{ fontFamily: F.display, fontSize: 40, color: WHITE, letterSpacing: 1, marginBottom: 14, lineHeight: 42 }}>
          {story.title}
        </Text>
        {story.lines.map((l, i) => (
          <Text key={i} style={{ fontFamily: F.serif, fontSize: 18, color: 'rgba(255,255,255,0.94)', lineHeight: 26, marginBottom: 7 }}>
            {l}
          </Text>
        ))}
        {story.quote ? (
          <View style={{ borderLeftWidth: 2, borderLeftColor: story.accent, paddingLeft: 14, marginTop: 4, marginBottom: 7 }}>
            <Text style={{ fontFamily: F.serifIt, fontSize: 19, color: story.accent, lineHeight: 26 }}>
              “{story.quote}”
            </Text>
          </View>
        ) : null}
        {(story.linesAfter ?? []).map((l, i) => (
          <Text key={`a${i}`} style={{ fontFamily: F.serif, fontSize: 18, color: 'rgba(255,255,255,0.94)', lineHeight: 26, marginBottom: 7 }}>
            {l}
          </Text>
        ))}
        <View style={{ marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.30)', paddingTop: 11 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 2.5, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>LESSON</Text>
          <Text style={{ fontFamily: F.sansMd, fontSize: 15, color: GOLD, lineHeight: 21 }}>{story.lesson}</Text>
        </View>
      </View>
    </View>
  );
}

// The initiation flip book: the Nine Stories, then the North Star (panel 15).
const FIRST_OPEN_PANELS: { id: number; caption: string; story?: typeof NINE_STORIES[0] }[] = [
  ...NINE_STORIES.map(s => ({ id: 100 + s.n, caption: '', story: s })),
  { id: 15, caption: '' },
];

export default function PreviewPanels({ onComplete }: { onComplete: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  };

  const isLastPanel = activeIndex === FIRST_OPEN_PANELS.length - 1;

  const renderPanel = ({ item }: { item: any }) => {
    const isLast = item.id === 15;
    return (
      <View style={{
        width: SCREEN_W,
        flex: 1,
        backgroundColor: DARK_BG,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 48 : 60,
        paddingBottom: 100,
      }}>
        {item.story && <StoryPanel story={item.story} />}
        {item.id === 15 && <Panel15 onComplete={onComplete} />}

        {!isLast && item.caption?.length > 0 && (
          <View style={styles.captionWrap} pointerEvents="none">
            <Text style={styles.caption}>{item.caption}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: DARK_BG }}>
      <FlatList
        ref={flatListRef}
        data={FIRST_OPEN_PANELS}
        keyExtractor={item => String(item.id)}
        renderItem={renderPanel}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={SCREEN_W}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* SKIP — founder law: no funnel, no paywall behind the stories, so no
          one is forced to re-read what they already know. Straight to the blocks. */}
      {!isLastPanel && (
        <TouchableOpacity
          onPress={onComplete}
          style={{ position: 'absolute', top: Platform.OS === 'android' ? 46 : 58, right: 20, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: MUTED }}>SKIP →</Text>
        </TouchableOpacity>
      )}

      {/* Progress dots — hidden on North Star */}
      {!isLastPanel && (
        <View style={styles.dotsWrap} pointerEvents="none">
          {FIRST_OPEN_PANELS.slice(0, -1).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, {
                width: i === activeIndex ? 12 : 6,
                backgroundColor: i === activeIndex ? BLUE : 'rgba(255,255,255,0.25)',
              }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  captionWrap: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  caption: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
