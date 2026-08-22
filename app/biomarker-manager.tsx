import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

import { dl, useTheme, type Tokens } from '@/lib/theme-mode';
/**
 * TWO MODES, ONE PALETTE. Every DARK value below is the literal that shipped
 * — still readable in this file, which is how LAW 1 is proved rather than
 * promised. Every LIGHT value is lifted from the founder's own year-old
 * two-mode file, where all ten surfaces sat on ONE cream ground and were
 * told apart by the colour of the type, not the colour of the room.
 */
const pal = (T: Tokens) => ({
  BLUE: dl(T, '#1BB8FF', '#2a7faa'),
  BLUE_DIM: dl(T, 'rgba(27,184,255,0.15)', 'rgba(42,127,170,0.15)'),
  BLUE_BORDER: dl(T, 'rgba(27,184,255,0.40)', 'rgba(42,127,170,0.40)'),
  GREEN: dl(T, '#1D9E75', '#12795A'),
  RED: dl(T, '#E05252', '#C0392B'),
  DARK_BG: dl(T, '#0A0804', '#FAF7F2'),
  WHITE: '#FFFFFF',
  MUTED: dl(T, 'rgba(255,255,255,0.55)', 'rgba(0,0,0,0.55)'),
});

const F = {
  mono:    'DMMono-Regular',
  monoMd:  'DMMono-Medium',
  sans:    'DMSans-Regular',
  serifIt: 'CormorantGaramond-Italic',
  display: 'BebasNeue-Regular',
};

const ALL_ACTIVITIES = [
  'Running','Trail Running','Track',
  'Treadmill','Virtual Run',
  'Cycling','Mountain Bike','Road Bike',
  'Gravel','Indoor Bike','E-Bike',
  'Swimming','Pool Swim','Open Water',
  'SUP','Kayak','Row','Sail','Surf',
  'Windsurf','Kitesurf','Dive','Snorkel',
  'Ski','Snowboard','Backcountry Ski',
  'Nordic Ski','Snowshoe',
  'Climb','Bouldering','Indoor Climb',
  'Strength','HIIT','Pilates',
  'Yoga','Barre','Cardio',
  'Soccer','Basketball','Baseball',
  'Hockey','Volleyball','Rugby',
  'Football','Lacrosse',
  'Tennis','Pickleball','Squash',
  'Racquetball','Padel',
  'Golf','Hunt','Fish',
  'Martial Arts','Boxing','MMA',
  'Wrestling',
  'Skydive','Paraglide','Hang Glide',
  'BASE Jump',
  'Triathlon','Duathlon','Walk','Hike',
  'Breathwork','Meditation','Tactical',
];

interface Props {
  embedded?: boolean;
  onSave?: () => void;
}

export default function BiomarkerManager({
  embedded = false,
  onSave,
}: Props) {
  const T = useTheme();
  const bm = useMemo(() => makeBm(T), [T]);
  const C = pal(T);

  const [active,  setActive]  = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [userId,  setUserId]  = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data } = await supabase
          .from('profiles')
          .select('activities, activities_history')
          .eq('id', user.id)
          .single();

        if (data?.activities)         setActive(data.activities);
        if (data?.activities_history) setHistory(data.activities_history);
      } catch {}
    })();
  }, []);

  const toggleActivity = async (activity: string) => {
    if (!userId) return;

    const isActive = active.includes(activity);
    const now = new Date().toISOString();

    const newActive: string[] = isActive
      ? active.filter(a => a !== activity)
      : [...active, activity];

    const newHistory: any[] = [
      ...history,
      { activity, action: isActive ? 'deactivated' : 'activated', timestamp: now },
    ];

    setActive(newActive);
    setHistory(newHistory);

    try {
      await supabase
        .from('profiles')
        .update({ activities: newActive, activities_history: newHistory, updated_at: now })
        .eq('id', userId);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            activities: active,
            activities_history: history,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave?.();
    } catch {}
    setSaving(false);
  };

  const inactiveActivities = ALL_ACTIVITIES.filter(a => !active.includes(a));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.DARK_BG }}
      nestedScrollEnabled
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: embedded ? 0 : Platform.OS === 'android' ? 56 : 64,
        paddingBottom: 100,
      }}
    >
      {!embedded && (
        <>
          <Text style={bm.eyebrow}>ACTIVE BIOMARKERS</Text>
          <Text style={bm.subtitle}>
            Your activity profile shapes how the membrane reads your biosignals. Keep it current.
          </Text>
        </>
      )}

      {/* ── Active activities ── */}
      <Text style={bm.sectionLabel}>CURRENTLY ACTIVE — {active.length} ACTIVITIES</Text>
      <Text style={bm.sectionNote}>
        Tap to deactivate. The membrane stops using it as a biosignal reference immediately.
      </Text>

      <View style={bm.grid}>
        {active.length === 0 && (
          <Text style={bm.emptyNote}>No active activities. Add some below.</Text>
        )}
        {active.map(activity => (
          <TouchableOpacity
            key={activity}
            onPress={() => toggleActivity(activity)}
            style={bm.activeChip}
            activeOpacity={0.7}
          >
            <Text style={bm.activeChipText}>{activity}</Text>
            <Text style={bm.chipX}>×</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={bm.divider} />

      {/* ── Add activities ── */}
      <Text style={bm.sectionLabel}>ADD ACTIVITIES</Text>
      <Text style={bm.sectionNote}>
        Tap to activate. The membrane begins building your biosignal signature for this activity.
      </Text>

      <View style={bm.grid}>
        {(showAll ? inactiveActivities : inactiveActivities.slice(0, 12)).map(activity => (
          <TouchableOpacity
            hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
            key={activity}
            onPress={() => toggleActivity(activity)}
            style={bm.inactiveChip}
            activeOpacity={0.7}
          >
            <Text style={bm.inactiveChipText}>+ {activity}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {inactiveActivities.length > 12 && (
        <TouchableOpacity
          hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
          onPress={() => setShowAll(prev => !prev)}
          style={{ alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.BLUE, letterSpacing: 2 }}>
            {showAll ? 'SHOW LESS ↑' : `SHOW ALL ${inactiveActivities.length} ACTIVITIES ↓`}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <>
          <View style={bm.divider} />
          <Text style={bm.sectionLabel}>BIOMARKER HISTORY</Text>
          <Text style={bm.sectionNote}>
            The membrane remembers when activities changed. This shapes longitudinal biosignal analysis.
          </Text>
          {history.slice(-5).reverse().map((h, i) => (
            <View key={i} style={bm.histRow}>
              <View style={[bm.histDot, { backgroundColor: h.action === 'activated' ? C.GREEN : C.RED }]} />
              <Text style={bm.histActivity}>{h.activity}</Text>
              <Text style={bm.histAction}>{h.action === 'activated' ? 'ADDED' : 'REMOVED'}</Text>
            </View>
          ))}
        </>
      )}

      {/* ── Save button (non-embedded only) ── */}
      {!embedded && (
        <TouchableOpacity
          style={[bm.saveBtn, { opacity: saving ? 0.6 : 1, backgroundColor: saved ? C.GREEN : C.BLUE }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#03050A" />
            : <Text style={bm.saveBtnText}>{saved ? 'SAVED ✓' : 'SAVE BIOMARKERS →'}</Text>
          }
        </TouchableOpacity>
      )}

      <Text style={bm.docNote}>
        Sold your bike? Remove Cycling.{'\n'}
        Took up archery? Add it.{'\n'}
        The membrane recalibrates immediately.
      </Text>
    </ScrollView>
  );
}

const makeBm = (T: Tokens) => {
  const { BLUE, BLUE_DIM, BLUE_BORDER, GREEN, RED, DARK_BG, WHITE, MUTED } = pal(T);
  return StyleSheet.create({
  eyebrow: {
    fontFamily: 'DMMono-Regular',
    fontSize: 9,
    color: BLUE,
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'DMMono-Medium',
    fontSize: 10,
    color: WHITE,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionNote: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: dl(T, 'rgba(29,158,117,0.15)', 'rgba(18,121,90,0.15)'),
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeChipText: {
    fontFamily: 'DMMono-Regular',
    fontSize: 11,
    color: GREEN,
  },
  chipX: {
    fontFamily: 'DMMono-Regular',
    fontSize: 14,
    color: GREEN,
    lineHeight: 16,
  },
  inactiveChip: {
    borderWidth: 1,
    borderColor: BLUE_BORDER,
    backgroundColor: BLUE_DIM,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inactiveChipText: {
    fontFamily: 'DMMono-Regular',
    fontSize: 11,
    color: MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: dl(T, 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.03)'),
    marginVertical: 20,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),
  },
  histDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  histActivity: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: WHITE,
    flex: 1,
  },
  histAction: {
    fontFamily: 'DMMono-Regular',
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
  },
  emptyNote: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: MUTED,
    fontStyle: 'italic',
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 13,
    color: dl(T, '#03050A', '#F0EEE8'),
    letterSpacing: 2,
  },
  docNote: {
    fontFamily: 'DMMono-Regular',
    fontSize: 10,
    color: MUTED,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 20,
    marginTop: 8,
  },
});
};
