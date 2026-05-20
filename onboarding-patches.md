# AA2 onboarding.tsx — Scanner-vs-Stack Surgery

Three patches. Zero rewrites. Zero features removed.

---

## PATCH 1 — Scanner-vs-stack visual on north_star_intro screen

### FIND this block (around line 458-472):

```tsx
      {/* ── NORTH STAR INTRO ─────────────────────────────────────────────── */}
      {step === 'north_star_intro' && (
        <ScrollView contentContainerStyle={st.northWrap} keyboardShouldPersistTaps="handled">
          <Text style={st.northQuote}>
            "The more of yourself you bring to this system — the more the system's mirror can reflect back to you."
          </Text>
          <Text style={st.northSub}>
            5 MINUTES. 8 QUESTIONS. ONE MEMBRANE.
          </Text>
          <TouchableOpacity style={st.northBtn} onPress={() => setStep('briefing_1')} activeOpacity={0.85}>
            <Text style={st.northBtnText}>BUILD MY MEMBRANE →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
```

### REPLACE with:

```tsx
      {/* ── NORTH STAR INTRO ─────────────────────────────────────────────── */}
      {step === 'north_star_intro' && (
        <ScrollView contentContainerStyle={st.northWrap} keyboardShouldPersistTaps="handled">
          <Text style={st.northQuote}>
            "The more of yourself you bring to this system — the more the system's mirror can reflect back to you."
          </Text>
          <Text style={st.northSub}>
            5 MINUTES. 8 QUESTIONS. ONE MEMBRANE.
          </Text>

          {/* ── SCANNER VS SCANNER WITH STACK ─────────────────────────── */}
          <View style={st.pathCard}>
            <Text style={st.pathLabel}>TWO WAYS IN · SAME MEMBRANE</Text>
            <View style={st.pathRow}>
              <View style={[st.pathCol, { borderColor: BLUE }]}>
                <Text style={[st.pathTitle, { color: BLUE }]}>SCANNER</Text>
                <Text style={st.pathBody}>
                  Your phone is the membrane. Scanner, Equalizer, Chef, Chauffeur — all active Day 1.
                </Text>
              </View>
              <View style={[st.pathCol, { borderColor: BLUE_BORDER }]}>
                <Text style={[st.pathTitle, { color: BLUE }]}>SCANNER + STACK</Text>
                <Text style={st.pathBody}>
                  Phone plus anything you wear. Bio Buddy wakes up. The dashboard deepens channel by channel.
                </Text>
              </View>
            </View>
            <Text style={st.pathFoot}>
              You don't choose. Answer the same questions. Your stack declares itself in Block 5.
            </Text>
          </View>

          <TouchableOpacity style={st.northBtn} onPress={() => setStep('briefing_1')} activeOpacity={0.85}>
            <Text style={st.northBtnText}>BUILD MY MEMBRANE →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
```

---

## PATCH 2 — Block 5 briefing text

### FIND (around line 507):

```tsx
      {step === 'briefing_5' && (
        <BriefingCard
          blockLabel="BLOCK 5 · HARDWARE"
          text="Tell me what is connected. The more signal I receive, the more precise I become. But even without hardware, the membrane works. Start with what you have."
          onBegin={() => setStep('block_5')}
        />
      )}
```

### REPLACE with:

```tsx
      {step === 'briefing_5' && (
        <BriefingCard
          blockLabel="BLOCK 5 · HARDWARE"
          text="Two paths. Scanner-only: phone is the membrane, full system active. Scanner with stack: every device you wear deepens the picture. You pick nothing here. Tell me what's on your wrist, in your drawer, or nothing at all — all three are valid answers."
          onBegin={() => setStep('block_5')}
        />
      )}
```

---

## PATCH 3 — Dynamic stack confirmation under Block 5 wearables

### FIND the wearables field group (around line 975-985):

```tsx
            <View style={st.fieldGroup}>
              <FieldLabel text="WHICH WEARABLES DO YOU USE?" />
              <ChipSelector
                options={['Garmin','Oura Ring','Apple Watch','Whoop','Fitbit','Polar','Samsung Watch','None']}
                selected={wearables}
                multi
                onSelect={toggleWearable}
              />
            </View>
```

### REPLACE with:

```tsx
            <View style={st.fieldGroup}>
              <FieldLabel text="WHICH WEARABLES DO YOU USE?" />
              <ChipSelector
                options={['Garmin','Oura Ring','Apple Watch','Whoop','Fitbit','Polar','Samsung Watch','None']}
                selected={wearables}
                multi
                onSelect={toggleWearable}
              />
              {(() => {
                const hasStack = wearables.filter(w => w !== 'None').length > 0;
                return (
                  <Text style={{
                    fontFamily: F.mono,
                    fontSize: 10,
                    color: hasStack ? GREEN : MUTED,
                    marginTop: 10,
                    letterSpacing: 1,
                    fontStyle: hasStack ? 'normal' : 'italic',
                  }}>
                    {hasStack
                      ? '✓ SCANNER + STACK PATH — BIO BUDDY ACTIVATES WITH YOUR FIRST DATA'
                      : 'Scanner path active. Phone is the membrane. Add devices anytime.'}
                  </Text>
                );
              })()}
            </View>
```

---

## PATCH 4 — Add new styles to the StyleSheet

### FIND the end of the `st = StyleSheet.create({` block — just before the final `});` (around line 1499):

```tsx
  completeBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 13,
    color: '#03050A',
    letterSpacing: 2,
  },
});
```

### REPLACE with:

```tsx
  completeBtnText: {
    fontFamily: 'DMMono-Medium',
    fontSize: 13,
    color: '#03050A',
    letterSpacing: 2,
  },

  // Scanner vs Scanner+Stack path card
  pathCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: BLUE_BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    backgroundColor: CARD_BG,
  },
  pathLabel: {
    fontFamily: 'DMMono-Regular',
    fontSize: 9,
    color: BLUE,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
  },
  pathRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pathCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  pathTitle: {
    fontFamily: 'DMMono-Medium',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  pathBody: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: MUTED,
    lineHeight: 16,
  },
  pathFoot: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
  },
});
```

---

## Verification checklist — before you build

Run these commands in terminal from `/Users/jamespitts/Downloads/aa2-scan` and confirm each returns exactly what's expected.

```bash
# 1. Confirm file length increased by ~55 lines
wc -l "app/(tabs)/onboarding.tsx"
# Expected: roughly 1556 lines (was 1501 + ~55 added)

# 2. Confirm no Javier leaked in anywhere
grep -i "javier" "app/(tabs)/onboarding.tsx"
# Expected: NO OUTPUT

# 3. Confirm scanner-vs-stack doctrine is present
grep "TWO WAYS IN" "app/(tabs)/onboarding.tsx"
# Expected: one match

# 4. Confirm Block 5 briefing has the new text
grep "Two paths. Scanner-only" "app/(tabs)/onboarding.tsx"
# Expected: one match

# 5. Confirm dynamic stack line is wired
grep "SCANNER + STACK PATH — BIO BUDDY" "app/(tabs)/onboarding.tsx"
# Expected: one match

# 6. Confirm all 4 original Block 7 voices still there
grep -E "The Coach|The Stable|COMMAND|THE BRIEF" "app/(tabs)/onboarding.tsx" | wc -l
# Expected: 4 or more lines
```

If all 6 checks pass:

```bash
# Local bundle test first — catches errors before burning an EAS build
npx expo export --platform android

# If clean, commit just this one file
git add "app/(tabs)/onboarding.tsx"
git commit -m "onboarding: scanner-vs-scanner-with-stack doctrine visible in UI"
git push origin HEAD

# Then the EAS build
eas build --platform android --profile preview --clear-cache
```

---

## What this surgery does NOT touch

- `preview-panels.tsx` — untouched
- `biomarker-manager.tsx` — untouched
- `saveField()` helper — untouched
- `profiles` table schema — untouched
- Auth flow — untouched
- N/A chips on Block 4 (allergies, medications, conditions, supplements) — untouched
- Activity grid — untouched
- Progress bar calculation (27 fields) — untouched
- Concierge voice options (4 existing: The Coach, The Stable, COMMAND, THE BRIEF) — untouched
- North Star block 8 three questions — untouched
- membrane_complete screen + embedded BiomarkerManager — untouched
- Every field, every saveField call, every existing chip set — untouched

---

## What this surgery DOES add

- The scanner-vs-scanner-with-stack doctrine is now **visible on the north_star_intro screen** — the member sees both paths named before they begin
- The Block 5 briefing text **names the two paths explicitly** and validates all three answer types (device on wrist, in drawer, or nothing)
- The Block 5 wearables chip selector now shows a **live confirmation line below the chips** that changes color and copy depending on whether devices are selected — green "✓ SCANNER + STACK PATH" when hardware is present, muted italic "Scanner path active" when blank or "None" is selected
- Four new styles added at the bottom of the StyleSheet — `pathCard`, `pathLabel`, `pathRow`, `pathCol`, `pathTitle`, `pathBody`, `pathFoot`

Total: ~55 lines added. Zero lines removed. Zero existing features disturbed.
