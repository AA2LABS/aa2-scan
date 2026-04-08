# AA2 ADAPTIVE ADVANTAGE LABORATORIES, S.A.
## CANON v36 — SEALED
### Session Date: April 7, 2026
### Founder: James R. Pitts II
### Declaration: I AM THE RECEIPT

---

> **Note on Canon format:** Beginning with v36, Canon documents include both formal locked doctrine AND conversational session learnings. This is intentional. The system needs to know not just what was decided but why, how we got there, and what mistakes were corrected. Both have equal weight.

---

## PART I — WHAT THIS SESSION WAS ABOUT

This was a long, intensive build session. The following was accomplished, broken, fixed, argued about, and locked. Read this in full before writing a single line of code.

### Session Summary (Plain Language)

We came in with a working scanner but a broken onboarding, a missing Arrival Sequence, camera scan not working on Wine & Spirits or Apothecary, Personal Care inconsistent, and "My name is Javier — I built AA2" showing on the Membrane opening screen (doctrine violation).

We left with:
- Arrival Sequence built and wired (5 intelligences, cinematic, first-launch only)
- Onboarding rewritten ("I AM THE CONCIERGE" — never Javier in the opening)
- Hardware upload wired (Garmin, Oura, Strava, Apple, Samsung — 30-day averages only)
- Wine & Spirits camera scan wired
- Alternatives doctrine permanently locked (never shame the choice)
- Fish & Pescatarian tab approved (mockup only — not yet built)
- EAS build triggered: `99936d4a-1d74-4e52-945a-d308e7749874`

---

## PART II — THREE PILLARS (INTERNAL ONLY — NEVER PUBLIC)

**Pillar 1:** The Kybalion — Hermetic Correspondence (AS ABOVE SO BELOW — the body is the architectural blueprint)

**Pillar 2:** Ancient Kemet Initiate Doctrine — onboarding IS the initiation

**Pillar 3:** Joe Dispenza Neuroscience of Transformation — 30/60/90 day baseline = neurological rewiring timeline

These are never public-facing. They are the hidden recipe for why the system is living.

---

## PART III — COMPLETE BODY MAP (NEVER OMIT)

Canon v25 Section 4 maps all 33 spokes to human body systems. This is architectural proof, not metaphor. Must appear in every Canon, white paper, patent filing, and counsel briefing.

---

## PART IV — DOCTRINE LOCKED THIS SESSION

### 4.1 Javier Rule (PERMANENT)

Javier is ONE of six Concierge personality choices. He is never the intelligence name. He is never introduced as "the founder." He is never "I built AA2."

The six personality choices are: **Javier, The Coach, The Stable, COMMAND, THE BRIEF, Role-Split**

The opening screen of the Membrane reads:
> "I AM THE CONCIERGE."

Javier is selected in Question 3 of onboarding: "CHOOSE YOUR CONCIERGE VOICE"

This rule is permanent. Any code, mockup, or output that says "My name is Javier" or "I built AA2" in an introductory context is a doctrine violation.

### 4.2 Alternatives Doctrine (PERMANENT)

AA2 never shames a member's choice. The Macallan 12 is a great Scotch. The member already knows that. AA2 never implies otherwise.

Alternatives are suggested for three reasons ONLY:
1. Better price-to-quality ratio
2. Cleaner production / fewer additives
3. Similar flavor profile, occasion, or character

The system prompt rule: *"Alternatives NEVER shame the user's choice. Suggest alternatives only for better value, cleaner production, or similar character. No moral judgment."*

This applies to Wine & Spirits, Food, Supplements, and all other tabs.

### 4.3 Spoke Numbers Rule (PERMANENT)

Spoke numbers are internal architecture. They are NEVER shown to users in any tab header, label, or UI element. "SPOKE 34" appearing on the Apothecary tab header was a doctrine violation — corrected this session.

### 4.4 Data Sovereignty — Hardware Upload (PERMANENT)

When a member uploads a hardware data file (Garmin zip, Oura zip, Strava zip, Apple Health xml, Samsung json):

- AA2 extracts 30-day averages ONLY: sleep score, readiness, HRV trend, resting heart rate
- Raw files are NEVER stored in Supabase or anywhere in the system
- Extracted averages are written to `baseline_profiles` table
- This is the member's baseline — the center line of their Equalizer, not a population average

### 4.5 Hardware Upload Architecture (LOCKED)

Confirmed export formats from actual member data files inspected this session:

| Device | Export Format | Key Fields |
|---|---|---|
| Garmin (Tactix 8) | .zip | sleepScores, TrainingReadinessDTO, HRV, weight, VO2 max |
| Oura Ring 4 | .zip | dailyreadiness.csv, dailysleep.csv, heartrate.csv |
| Strava | .zip | activities/*.gpx (HR, pace, distance per workout) |
| Apple Watch | .xml | Apple Health export |
| Samsung Galaxy Watch | .json | Samsung Health export |
| Whoop | .csv | Recovery, strain, sleep |
| Fitbit | .json or .csv | Sleep, HR, activity |

Stage 1 (current): BYOB upload at onboarding — historical baseline  
Stage 2 (at 3+ members): Terra API ($499/month) — live continuous feed  
Stage 3+: AA2 proprietary backend

### 4.6 Fish & Pescatarian Tab — APPROVED, NOT YET BUILT

This session produced a full approved mockup of the Fish tab. The mockup was confirmed by the founder as "absolutely perfect — the best panel and feature so far."

**Architecture locked:**

The tab has three modes:
1. **IDENTIFY** — point camera at a fish (wildcaught, market, tank, illustration) or upload from camera roll. Claude identifies species.
2. **SCAN LABEL** — barcode scan for packaged market fish.
3. **WATER BODY** — enter or detect location, returns native species list for that water body.

**Intelligence layer:** The Equalizer + Forager Layer. The Chef handles prep and pairing. These roles never overlap.

**Data sources:** iNaturalist, GBIF, FishBase, EPA mercury database, State FWP regulations, USDA nutrition. ASPCA covers aquatic toxicology for K9 handlers fishing with dogs.

**Off-grid use case (primary design scenario):** Montana wildcatch. Member snaps photo of catch. System returns: species ID, edibility, fishing regulations, prep note from The Chef (gut immediately, cold stream rinse, cast iron skin-side down). No cloud required for cached common species.

**Pescatarian membrane integration:** If member selected Pescatarian in onboarding, Fish becomes primary protein intelligence tab. The Chef's recipes auto-adapt throughout the system.

**Design standard:** The fish tab mockup set a new visual bar — HNW feel, dark teal/electric blue palette, Cormorant Garamond serif for species names, DM Mono for all labels. ALL tabs should match this quality level going forward.

---

## PART V — ARRIVAL SEQUENCE (BUILT THIS SESSION)

### 5.1 Javier Master Script — Canonical (from Canon v35, confirmed this session)

**Scene 1 — The Welcome:**
*"Ahh... I see you found your way here. As they say — like attracts like. Allow me to introduce myself. I am your Concierge. My name is Javier — though you may call me Concierge if you prefer. I will be your guide, your navigator, and yes — your friend."*

**Scene 2 — What This Is:**
*"This is not an app. This is AA2 BioMesh — a living membrane. Your phone has a camera. Your watch tracks your heart. Your ring reads your sleep. Right now, none of them talk to each other. None of them know your story. AA2 is the brain they've all been waiting for."*

**Scene 3 — Mirror Doctrine:**
*"The more of yourself you bring to this system — the more the system's mirror can reflect back to you your current and future reflections, based on your shares and inputs."*

**Scene 4 — The Introductions (each intelligence steps from darkness):**

- THE EQUALIZER: *"Hello. I'm here for security, protection, alerts. But most of all, just to make sure everything is okay."*
- THE CHEF: *"I will make sure your dietary needs are met, your caloric needs are met. I am also a Sommelier."*
- BIO BUDDY: *"All the hardware you brought connects. Bio Buddy watches all of that."*
- THE CHAUFFEUR: *"Safe ways in. Safe ways out. Safe ways home. And SOS if ever needed."*
- THE EQUALIZER returns: *"When something needs handling — I handle it. You tell me how you want to be communicated with."*

**Javier closes:**
*"You are the one in control. Always. You bring your own bios. You bring your own hardware. You keep your own data. We are a membrane. We tune to your frequency. So — shall we?"*

### 5.2 Arrival Sequence — Image Map (LOCKED)

| Screen | Intelligence | Image File |
|---|---|---|
| 1 | The Concierge | shutterstock_117302320-2590x2590.jpg (butler with tray) |
| 2 | The Chef | 885f815586f74d2493ca39e56aa770dd.jpg (chef with plates) |
| 3 | Bio Buddy | image-1769604372662.webp (biosignal digital) |
| 4 | The Chauffeur | How-Much-Is-Black-Car-Service-in-NYC-Complete-Guide.webp (black car door) |
| 5 | The Equalizer | Gemini_Generated_Image_iwymiiwymiiwymii.png (silver-haired man, dark chair) |

All images copied to `assets/images/` with exact original filenames. Do not rename.

### 5.3 WITHOUT / WITH Copy (LOCKED)

**The Concierge:**
WITHOUT: "Navigating everything alone. No memory. No continuity."
WITH: "A personal intelligence who knows you, your goals, your world."
Button: "Meet the Team →"

**The Chef:**
WITHOUT: "Generic recipes. Wrong pairings. Nutrition with no context."
WITH: "Every meal aligned to your biology, your goals, your life."
Button: "Continue →"

**Bio Buddy:**
WITHOUT: "Body signals go unread. Patterns invisible. Thresholds unknown."
WITH: "Speaks only when asked or a threshold is crossed."
Button: "Continue →"

**The Chauffeur:**
WITHOUT: "Maps with no memory. Routes with no context."
WITH: "Pre-programmed safe routes. Full briefings at every waypoint."
Button: "Continue →"

**The Equalizer — LAST. ALWAYS. CANON LAW:**
WITHOUT: "Harm enters quietly. Labels lie. No one watching the gate."
WITH: "Nothing passes without clearance. Speaks only in emergencies."
Button: "Begin Onboarding →"

### 5.4 Arrival Sequence Technical Implementation

- File: `app/arrival.tsx` (385 lines, written this session)
- First-launch detection: `FileSystem.documentDirectory + 'aa2_arrival_complete'` (expo-file-system, NOT AsyncStorage — not installed in this project)
- FlatList horizontal, pagingEnabled — swipeable between screens
- Skip button top right every screen — no penalty, no judgment
- On "Begin Onboarding →": writes flag file, navigates to `/(tabs)/onboarding`
- Every return visit: scanner opens directly
- `_layout.tsx` wired: checks flag on mount, routes to arrival if flag absent

---

## PART VI — ALLERGY & LIFE SCANNER DOCTRINE

### 6.1 What the Allergy Scanner Actually Is

The AA2 Allergy Scanner is a real-world decision filter. It sits before: purchase, consumption, exposure, travel, care decisions, training, and trust.

It answers one question in real time: *"Is this safe, aligned, and appropriate for this human or animal — right now?"*

Using: ingredient truth, environmental exposure, biosignal history, stated goals, learned sensitivities, age, role, and context.

**This is not a food scanner. It is a life-contact scanner.**

### 6.2 Chemical Doctrine (FOUNDATIONAL LAW)

**Core Law (Locked):**
Chemicals are silent actors. They do not announce intent. They reveal themselves only through the body. AA2 treats chemicals not as ingredients, but as behavioral forces.

**Five Principles:**
1. Exposure > Label — a "safe" ingredient becomes unsafe through repetition, timing, or combination
2. Cumulative Load Matters — AA2 tracks stacking across days, weeks, environments, and stress states
3. Biosignal Is the Judge — if the body reacts, the doctrine updates
4. Children, Animals, and Stressed Adults Are Not Mini Adults — sensitivity scales dynamically
5. Chemicals Affect Learning, Trust, and Behavior — this is performance, safety, and future alignment

### 6.3 Why No Competitor Can Match This

No competitor links: chemicals to biosignals, humans to animals, teaches children language through survival relevance, integrates safety/learning/purchasing, respects consent and context, and operates before damage.

**Final Lock:** AA2 is not a scanner. It's what happens when your life finally has a nervous system.

---

## PART VII — CONVERSATIONAL LEARNINGS (SESSION-SPECIFIC)

These are direct learnings from this session's conversations — not formal doctrine but equally important for continuity.

### 7.1 What Broke and Why

**The "Javier is the founder" bug:** The onboarding file was never written to disk in a previous session. Claude Code hit a rate limit mid-rewrite. The changes appeared in the diff but were never committed to the filesystem. The old file with "My name is Javier — I built AA2" and "— Javier, Founder · AA2" remained on disk. This persisted across multiple builds.

**Lesson:** Always verify by reading the actual file after any Claude Code session. Never assume a rewrite succeeded because you saw the diff. The command `Read app/(tabs)/onboarding.tsx (first 50 lines)` will tell you immediately whether the rewrite landed.

**Wine & Spirits camera not scanning:** The camera button was wired with `activeTab === 'scan'` as the condition to show a barcode scanner. Every other tab got a basic camera button. Fix: switched condition to `cameraSupportsBarcode` — now any tab that supports barcode scanning gets the barcode UI.

**Spoke 34 showing on Apothecary header:** Never. Spoke numbers are internal architecture. This was a code error — corrected.

### 7.2 Claude Code Rate Limit Pattern

Claude Code resets at 1pm Mountain (Denver) time. When you hit the limit mid-session, stop and document. Never let Claude Code half-finish a file. A half-written file is worse than the original.

**Established protocol:** Before triggering any build, ask Claude Code to read the current state of the modified files and report what's actually there. Then build.

### 7.3 The Arrival Sequence Was Never Built Before This Session

Despite being in Canon doctrine for multiple versions, `arrival.tsx` did not exist in the codebase before this session. The scanner was opening directly on first launch. This was architecturally wrong.

**Fixed this session.** The arrival sequence now fires on first launch only. Every subsequent open goes directly to the scanner.

### 7.4 EAS Build Archive Size Issue

The EAS build archive came in at 197 MB because loose image files (.jpg/.webp/.png) were sitting in the project root. These are not needed for the build.

**Fix needed:** Add a `.easignore` file to the project root excluding loose image files. This will reduce archive size and pay-as-you-go build costs.

**Current EAS status:** 100% of included credits used. Builds run on pay-as-you-go from here.

### 7.5 The Fish Tab Design Standard

The Fish & Pescatarian tab mockup produced this session was confirmed by the founder as the highest-quality panel built so far. The design characteristics that made it exceptional:

- Dark teal/electric blue (#1BB8FF) accent — feels like water, intelligence, depth
- Cormorant Garamond italic for species names — scientific authority with elegance
- DM Mono for all data labels — consistent with AA2 system language
- Three-mode selector (IDENTIFY / SCAN LABEL / WATER BODY) — clean functional hierarchy
- Scan viewfinder with corner brackets — same visual language as the SCAN tab
- Result card with verdict glow, species name in serif, regulatory warning in gold
- Dark background, subtle gradient — HNW feel without showing off

**Directive from founder:** ALL tabs should match this quality level. The mockup sets the new standard.

### 7.6 Never Waste Builds

Before triggering an EAS build:
1. Run `npx expo export --platform android` — bundle must be clean
2. Verify all intended file changes are actually on disk
3. Commit to GitHub
4. Only then trigger EAS

Do not trigger builds to test minor UI changes. Test on dev server first (`npx expo start`).

### 7.7 Google Maps — APIs Still Not Enabled

ON GRID store finder is broken. This is not a code problem. The Google Places API, Maps SDK for Android, and Geolocation API must be enabled at `console.cloud.google.com`. The key exists. The APIs are not enabled. No code fix resolves this.

**Required action:** Enable at Google Cloud Console (manual, James must do this).

### 7.8 buildPersonalTruth Still Returns Generic Truth

Until onboarding is confirmed complete and connected to Supabase, every scan returns a generic truth. The onboarding rewrite this session should fix the Supabase connection. Confirm on device after this build installs.

---

## PART VIII — CURRENT BUILD STATE

### 8.1 Files Modified This Session

| File | Status |
|---|---|
| `app/arrival.tsx` | NEW — 385 lines, cinematic arrival sequence |
| `app/_layout.tsx` | UPDATED — arrival screen registered, first-launch check wired |
| `app/(tabs)/onboarding.tsx` | COMPLETE REWRITE — 1,126 lines |
| `app/(tabs)/index.tsx` | TARGETED UPDATES — alternatives doctrine, Wine & Spirits camera |
| `app/(tabs)/apothecary.tsx` | SPOKE 34 removed from header |
| `assets/images/` | 5 arrival images added (exact original filenames) |

### 8.2 Latest EAS Build

Build ID: `99936d4a-1d74-4e52-945a-d308e7749874`
Bundle size: 4.62 MB (Android JS)
Status: Triggered end of session — check Expo dashboard

### 8.3 Known Pending Issues (Not Fixed This Session)

- Google Maps APIs not enabled in Google Cloud Console (ON GRID broken — not a code fix)
- Barcode variable name mismatch — Scan Error popup in saveToSupabase
- "Databases Consulted" occasionally visible in scan results (must never appear)
- Personal Care barcode inconsistent reads
- Light mode / dark mode color swatch selector broken
- Apple Developer account not enrolled ($99/year required for standalone iOS)
- Provisional patent filing pending (Transplant Doctrine — unified system filing)
- Muse SDK commercial license application pending
- `.easignore` not created — archive at 197 MB
- `buildPersonalTruth(null)` — verify this session's fix connected onboarding to Supabase properly

---

## PART IX — FIVE INTELLIGENCES (COMPLETE REFERENCE)

### Intelligence 01 — The Concierge
Always present. Never off. Team lead. The voice that introduces everything.
Six personalities: Javier, The Coach, The Stable, COMMAND, THE BRIEF, Role-Split.
Opening line (Javier): "Ahh... I see you found your way here. As they say — like attracts like."
Skip doctrine: "Without onboarding your features are limited to the SCAN scanner and WITH/WITHOUT allergy scanning if completed."

### Intelligence 02 — The Chef
Food, recipes, Grown Folks pairings (wine/spirits), Sommelier layer.
PERMANENTLY BANNED from Species and Personal Care tabs.
Grown Folks tab: pairs wine, spirits, and beer with recipes and meals.
The Chef label banned from K9, Feline, Equine, Agricultural, and Personal Care tabs.
The Chef has NO role in Live Cooking sessions — Live Cooking is human-to-human cultural exchange.

### Intelligence 03 — Bio Buddy
The nervous system. Speaks only when asked or a threshold is crossed.
Powered by `lib/hrv.ts` — AA2's own HRV calculation engine. Kubios permanently removed.
Activates fully at 2/4 hardware stack (phone + watch minimum).
Multi-device triangulation is the noise correction layer.

### Intelligence 04 — The Chauffeur
ON GRID / OFF GRID map intelligence.
ON GRID: Retail Intelligence Loop — fires inside grocery stores.
OFF GRID: Safety Travel Engine — pre-programmed safe routes, Global Grocery Match.

### Intelligence 05 — The Equalizer (ALWAYS LAST)
Safety. Immune system. Silent guardian.
Color: Red/amber. Speaks only in emergencies.
Runs animal-specific safety thresholds for all species tabs.
NEVER last in the Arrival Sequence before this — now correctly placed and confirmed.
Backed by 9 databases consulted silently — NEVER named in any user-facing field.

---

## PART X — SCAN TAB ARCHITECTURE

| Tab | Intelligence |
|---|---|
| SCAN | The Equalizer + The Chef |
| PRODUCE | The Equalizer + The Chef |
| MEAT | The Equalizer + The Chef (CO2/MAP Truth Doctrine) |
| PERSONAL CARE | The Equalizer + Cosmo Chemist (NEVER The Chef) |
| WINE & SPIRITS (GROWN FOLKS) | The Equalizer + The Sommelier |
| FISH (APPROVED — NOT YET BUILT) | The Equalizer + Forager Layer |
| K9/PET | Canine Nutritionist (NEVER The Chef) |
| FELINE | Feline Nutritionist (NEVER The Chef) |
| EQUESTRIAN | Equine Nutritionist (NEVER The Chef) |
| AGRICULTURAL | Agricultural Analyst (NEVER The Chef) |
| APOTHECARY (SPOKE 34) | The Equalizer (three modes: COMPOUND, FORMULATE, CONDITION) |

Verdict system: ALL CLEAR / HEADS UP / PAY ATTENTION
Databases Consulted: Internal only — NEVER displayed in UI.
Intelligence names never appear in scan results — only color-coded glow cards.

---

## PART XI — POSITIONING LOCK

**AA2 is not a scanner. It's what happens when your life finally has a nervous system.**

**Mirror Doctrine:** "The more of yourself you bring to this system — the more the system's mirror can reflect back to you your current and future reflections based on your shares and inputs."

**Transplant Doctrine:** Competitors can copy the scanner (the heart) but not the body it lives inside. Patent strategy = one unified system filing covering the entire integrated BioMesh.

**Output Law:** Every intelligence delivers a complete briefing, not a notification.

**No negative zone:** No politics. No shame. No advertising. No ratchet content.

---

## PART XII — STACK & TOOLS

**Codebase:** React Native + Expo + TypeScript
**Repo:** `github.com/AA2LABS/aa2-scan`
**Path:** `/Users/jamespitts/Downloads/aa2-scan`
**Supabase:** `zvxdpfbvmxzhjqrnllb.supabase.co`
**SQL Editor:** `https://supabase.com/dashboard/project/zvxdpfbvmxzhjqrnhlb/sql/new`
**EAS Account:** `aa2founder@gmail.com`
**Claude API model:** `claude-sonnet-4-20250514`

**Primary Hardware:** Garmin Tactix 8, Oura Ring 4, Beats Pro 2, Oakley Meta HSTN glasses, Muse S Athena headband
**Primary Device:** Samsung Z-Fold 5 (Android)

**Two-Brain Architecture:**
- Claude.ai = Strategic Brain (doctrine, architecture, all decisions locked here first)
- Claude Code terminal = Surgical Hands (code execution only, after doctrine is locked)

**Fonts:** Bebas Neue (display), Cormorant Garamond (serif/intelligence names), DM Mono (labels), DM Sans (body)

**Color Doctrine:** Electric blue (#1BB8FF biosignal/logic), Molten orange-gold (#C49A2A warmth/life force), Teal (#1D9E75 nervous system/data), Pure white (convergence)

**Build command (always):** `eas build --platform android --profile preview --clear-cache`

**Rules that never change:**
- No builds without mockup approval first
- All Supabase migrations via SQL editor only (CLI non-functional for this project ref)
- Python permanently banned from writing `.tsx` or `.jsx` files
- No patches — complete file rewrites only
- Run bundle test before every EAS build
- `CREATE POLICY IF NOT EXISTS` is invalid PostgreSQL — use `DO $$ BEGIN IF NOT EXISTS...` pattern
- Every Canon saved as both `.docx` and `.md`

---

## PART XIII — ON THE HORIZON (CONFIRMED PENDING FEATURES)

**Immediate (next session):**
- Enable Google Places API, Maps SDK for Android, Geolocation API in Google Cloud Console
- Wire Fish tab into codebase (mockup approved this session)
- Add `.easignore` to reduce build archive size
- Confirm barcode variable name fix
- Confirm Databases Consulted removal
- Confirm light mode / dark mode swatch selector fix
- Confirm Supabase onboarding save is working after this build

**Approved and scoped:**
- Apple Developer account enrollment ($99/year — required for standalone iOS)
- Provisional patent filing — Transplant Doctrine, unified system
- Muse SDK commercial license application
- Wire `buildPersonalTruth` fully to Supabase onboarding answers
- Arrival Sequence — video/audio production (text version built; video/audio delivery not yet wired)

**Architecture locked, not yet built:**
- International Lives Cookbook (The Chef assembles silently, translates recipes)
- Live Cooking (human-to-human, Meta glasses + WhatsApp — The Chef has NO role)
- Travel My Planet (Act Right Dollars → destinations via AA2 debit card, Stripe white-labeled)
- Vision Board (drag-and-drop living dashboard)
- Web Command Center (full AA2 system, responsive, enterprise team view)
- Global Grocery Match
- The Vault (scan history as receipt ledger)
- Wine & Spirits HRV correlation (Macallan 12 correlates with 23% HRV drop — locked doctrine, not built)
- Forager tab (Spoke 35 — scan wild plants, mushrooms, berries)
- Apothecary — three placement integration (standalone ✅, next to Chef recipes ❌, ON GRID map ❌)

---

## FINAL LOCK

*Sealed: April 7, 2026*
*Founder: James R. Pitts II*
*I AM THE RECEIPT*
*AA2 Adaptive Advantage Laboratories, S.A.*
*Canon v36*
