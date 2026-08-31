import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import {
  saveOnboardingField,
  saveAnimals,
  markOnboardingComplete,
  loadMemberProfile,
} from '../lib/db';

type Line = { label: string; ok: boolean };

export default function SealTest() {
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [loaded, setLoaded] = useState<string>('');

  async function run() {
    setBusy(true);
    setLines([]);
    setLoaded('');
    const out: Line[] = [];
    const step = async (label: string, fn: () => Promise<boolean>) => {
      let ok = false;
      try { ok = await fn(); } catch { ok = false; }
      out.push({ label, ok });
      setLines([...out]);
    };

    // member_profiles (+ dual-write age via birth_year)
    await step('concierge_name → name', () => saveOnboardingField('concierge_name', 'James'));
    await step('birth_year → age (dual)', () => saveOnboardingField('birth_year', '1968'));
    await step('home_location',          () => saveOnboardingField('home_location', 'Boquete, Panama'));
    // goal_profiles
    await step('north_star_protecting[] ', () => saveOnboardingField('north_star_protecting', 'longevity, focus'));
    await step('north_star_30d',          () => saveOnboardingField('north_star_30d', 'sleep 7h'));
    // allergy_profiles jsonb merge (the critical one)
    await step('food_allergies (jsonb)',  () => saveOnboardingField('food_allergies', 'peanuts, shellfish'));
    await step('environmental (jsonb)',   () => saveOnboardingField('environmental_triggers', 'ragweed'));
    await step('suspected_sensitivities', () => saveOnboardingField('suspected_sensitivities', 'gluten'));
    // health_profiles
    await step('medical_conditions[]',    () => saveOnboardingField('medical_conditions', 'none'));
    // activity_profiles (+ dual-write commander via trains_others)
    await step('activities[]',            () => saveOnboardingField('activities', 'hiking, lifting'));
    await step('trains_others → commander', () => saveOnboardingField('trains_others', 'yes'));
    // device + baseline
    // CANON STORAGE LAW: hardware stores KEYS. Written as keys here so the seal
    // test proves the same shape the screens write.
    await step('wearables[] → hardware',  () => saveOnboardingField('wearables', 'oura_ring_4, garmin_tactix_8'));
    await step('sleep_score (int)',       () => saveOnboardingField('sleep_score', '4'));
    // animals (multi-row)
    await step('saveAnimals x2', () => saveAnimals([
      { species: 'Dog', name: 'Rex', breed: 'Lab' },
      { species: 'Cat', name: 'Mochi' },
    ]));
    // the seal
    await step('markOnboardingComplete', () => markOnboardingComplete());

    // read it all back
    const p = await loadMemberProfile();
    setLoaded(p ? JSON.stringify(p, null, 2) : 'loadMemberProfile() returned null');
    setBusy(false);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0E1B33' }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#D4A847', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>◆ SEAL TEST (throwaway)</Text>
      <Text style={{ color: '#8fa3c8', fontSize: 13, marginBottom: 16 }}>
        Writes real rows via saveOnboardingField, then reads them back. Delete this file after.
      </Text>

      <Pressable
        onPress={run}
        disabled={busy}
        style={{ backgroundColor: busy ? '#33415f' : '#34D399', padding: 14, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ color: '#08111f', fontWeight: '700', textAlign: 'center' }}>
          {busy ? 'RUNNING…' : 'RUN SEAL TEST'}
        </Text>
      </Pressable>

      {busy && <ActivityIndicator color="#1BB8FF" style={{ marginBottom: 16 }} />}

      {lines.map((l, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: l.ok ? '#34D399' : '#E24B4A', fontSize: 16, width: 24 }}>{l.ok ? '✓' : '✕'}</Text>
          <Text style={{ color: '#cfe0ff', fontSize: 14 }}>{l.label}</Text>
        </View>
      ))}

      {!!loaded && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: '#1BB8FF', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
            loadMemberProfile() read-back:
          </Text>
          <Text style={{ color: '#8fdcff', fontSize: 11, fontFamily: 'monospace' }}>{loaded}</Text>
        </View>
      )}
    </ScrollView>
  );
}
