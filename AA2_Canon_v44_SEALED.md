# AA2 ADAPTIVE ADVANTAGE LABORATORIES, S.A.
## CANON v44
### COMPLETE SYSTEM DOCTRINE — SEALED
**April 13, 2026**
James R. Pitts II | Founder | Customer #1
**I AM THE RECEIPT**

> *"AA2 is not a scanner. It is what happens when your life finally has a nervous system."*

---

## WHAT'S NEW IN v44 — SESSION SUMMARY

This Canon supersedes v43 (sealed April 12, 2026). All v43 doctrine carries forward unchanged unless explicitly updated below. Read this section first in any new session.

---

## 1. BUILD STATUS — APRIL 13, 2026

### stories.tsx — WRITTEN AND COMMITTED
- Commit: `c8f0a5f`
- 7-door home screen. Vertical scroll. Full-width cards.
- 5 SVG graphic doors (Scanner, Concierge, Equalizer, Chauffeur, Chef)
- 2 photo doors (AA2 Story: 17789.png / Cookbook: 17786.png)
- BUILD MY MEMBRANE CTA anchors bottom
- **STATUS: Committed. NOT yet built to APK.**

### TWO BLOCKERS BEFORE NEXT BUILD
1. `assets/images/17789.png` — MISSING from assets folder
2. `assets/images/17786.png` — MISSING from assets folder
- These images exist in the repo root but need to be moved to `assets/images/`
- Build will fail on `require()` calls until resolved
- `app/biomarkers.tsx` — exists, untracked. Must be committed before build.

### Recent Commits (most recent first)
- `c8f0a5f` — feat: 7-door stories screen — Canon v43
- `be98e6b` — Fix biomarker-manager crash on launch
- `3a5ec0a` — Commit uncommitted onboarding and layout changes
- `6f88131` — Concierge voice message + Cookbook panel added to preview sequence
- `867270f` — Arrival: useWindowDimensions replaces static Dimensions

### Last Confirmed Working Build
- `1cc5df91` at expo.dev/accounts/aa2labs/projects/aa2-scan/builds/1cc5df91-9515-4563-8a78-51d076e86ce7
- Contains: Concierge voice message, Cookbook Panel 14, biomarker-manager.tsx committed

---

## 2. COFFEE INTELLIGENCE — NEW SPOKE ADDITION

### Origin
Conceived April 13, 2026 during active session. James Pitts is negotiating acquisition of a coffee-growing property in Panama. AA2 scanner was represented to the seller as capable of scanning coffee. This section locks the architecture that makes that true.

### Status
**CONCEPT — NOT YET BUILT.** `lib/coffee.ts` is the next file after build blockers are cleared.

### Where Coffee Lives in the Stack
Coffee intelligence is NOT a new tab. It extends three existing spokes:

| Spoke | Extension |
|-------|-----------|
| Spoke 35 — Forager | Plant identification adds coffee cherry, green bean, roasted bean |
| Spoke 28 — Agricultural | Coffee is an agricultural crop — variety, origin, yield, processing method |
| Spoke 1 — S.C.A.N. | Barcode scan of packaged coffee returns full 4-layer intelligence card |

### The Four-Layer Coffee Intelligence Architecture

**Layer 1 — Botanical / Variety**
- Source: World Coffee Research Varieties Catalog (55 Arabica / 47 Robusta profiles)
- Returns: Variety name, lineage, altitude range, disease resistance, cup quality potential
- AA2 equivalent: ASPCA DB for plants — authoritative, species-specific

**Layer 2 — Sensory / Flavor**
- Source: SCA Coffee Taster's Flavor Wheel + Sensory Lexicon (110 descriptors)
- Returns: Flavor profile in standardized language — jasmine, bergamot, stone fruit, etc.
- AA2 equivalent: Chef layer for coffee — The Concierge describes the cup before it's brewed

**Layer 3 — Quality / Evaluation**
- Source: SCA Value Assessment framework + Coffee Quality Institute Q-grader standards
- Returns: Q-grade score, specialty threshold (80+), exceptional threshold (90+)
- AA2 equivalent: Severity card system — INFO and ACT RIGHT tiers for coffee

**Layer 4 — Origin / Market / Chain**
- Source: International Coffee Organization trade data + farm-level traceability
- Returns: Country, region, cooperative or estate, export grade, harvest year
- AA2 equivalent: WHERE TO BUY + provenance layer

### The Coffee Scan Card — Standard Format
```
[BRAND / FARM NAME]
────────────────────────────────
VARIETY        [Species / Cultivar]
ORIGIN         [Region, Country]
ELEVATION      [meters]
PROCESS        [washed / natural / honey]
HARVEST        [year]

FLAVOR PROFILE
  [Descriptor 1] · [Descriptor 2] · [Descriptor 3]
  [Finish] · [Body]

Q-GRADE        [score or "pending"]

MEMBRANE NOTE  [Personalized biosignal context
               if clarifier data exists for
               this member's coffee response]
```

---

## 3. PLANT TO CUP — FOUNDING COFFEE VENTURE

### Identity
- **Company:** Plant to Cup
- **Shop:** Off-Grid Grinds
- **Signature blend:** 3 to 1 (three parts Geisha, one part espresso base)
- **Origin:** Panama (property under negotiation, Chiriquí region)
- **Status:** Concept stage. Recipe not yet finalized. Property not yet acquired.

### Doctrine Lock
Plant to Cup is AA2's **first Agricultural Partner and founding lab.** The relationship between Plant to Cup and AA2 is not sponsorship — it is the proof of concept for the entire agricultural intelligence spoke.

James Pitts drinking 3 to 1 and recording the response through AA2's Clarifier engine = **the founding biosignal experiment.** This is Canon. This is locked.

### The 3 to 1 Experiment — What It Actually Is
The recipe is not finished. That is not a problem. That is the point.

Each development session is a scan entry:
- Ratio tested
- Water temperature
- Vessel material (ceramic, glass, clay — all documented)
- Grind level
- Brew method
- Clarifier response after consumption

The recipe that wins is not just the one that tastes best. It is the one James's biology responds to best. The data builds the recipe. AA2 owns that process.

**No coffee company has ever developed a recipe this way. This is the first.**

### Lab Session Log Format
```
PLANT TO CUP · LAB SESSION [NNN]
────────────────────────────────
DATE           [date]
BLEND          3 to 1 · Draft v[N]
RATIO          [X:Y Geisha / espresso]
WATER TEMP     [°C]
VESSEL         [material]
GRIND          [level]
BREW METHOD    [method]

CLARIFIER RESPONSE
  Focus:       [logged]
  Energy:      [logged]
  Stomach:     [logged]
  HRV delta:   [from Oura]
  Notes:       [member input]

STATUS         Recipe in development.
               Biosignal response being recorded.
```

---

## 4. THE COLLECTIVE — GROUP BIOSIGNAL EXPERIMENT

### Concept — LOCKED, NOT YET BUILT
The Collective is AA2's group experiment layer. Multiple members consume the same stimulus — same product, same ratio, same conditions — and AA2 records how each person's biology responds differently based on their own personal baseline.

**The cup is the constant. The human is the variable.**

### How It Works
1. Founder creates an experiment — defines the stimulus (e.g., 3 to 1, Draft v3, 94°C, ceramic)
2. Beta group members opt in
3. Each member scans the same product on their own device
4. Clarifier fires within each member's window after consumption
5. Responses aggregate into a group feed — anonymized by default, opt-in to share identity
6. Feed shows collective biological response in real time

### What the Feed Shows
- Individual response cards (anonymous unless member opts in)
- Group averages: HRV delta, focus score, energy score, stomach response
- Outliers flagged: "2 of 9 members reported mild stomach warmth — may indicate sensitivity to this roast level"
- Version comparison: Draft v2 vs. Draft v3 — which version the group's biology preferred

### Connection to Pillar 3
Joe Dispenza Neuroscience of Transformation — 30/60/90 day baseline = neurological rewiring timeline — is Canon Pillar 3. Plant to Cup Lab Series is the first real-world proof of that pillar running in a group context. The coffee is the stimulus. The Clarifier is the measurement. The Collective is the cohort.

This is internal doctrine. Dispenza's name never appears in user-facing output.

### Connection to Live Cooking / International Feed
The Collective uses the same feed architecture as Live Cooking international sessions — already in Canon. Members post, share, compare. The difference is the data being shared is biological, not culinary. Both are opt-in. Both are member-owned.

---

## 5. FILES TO BUILD — UPDATED PRIORITY ORDER

| # | File | Status | Blocker |
|---|------|--------|---------|
| 0 | Move 17789.png + 17786.png to assets/images/ | BLOCKER | Must do first |
| 0 | Commit app/biomarkers.tsx | BLOCKER | Must do first |
| 1 | EAS build — stories.tsx | NEXT BUILD | After blockers cleared |
| 2 | lib/coffee.ts | NEXT CODE | After build confirmed |
| 3 | app/story-aa2.tsx | PENDING | 9 intro panels |
| 4 | app/story-scanner.tsx | PENDING | 16 panels — Jaylen + Denise |
| 5 | app/story-chauffeur.tsx | PENDING | Kelly 8 panels |
| 6 | app/story-chef.tsx | PENDING | 4 step panels |
| 7 | app/story-cookbook.tsx | PENDING | 2 panels |
| 8 | app/story-concierge.tsx | PENDING | Clarifier doctrine |
| 9 | app/story-equalizer.tsx | PENDING | Scanner tab previews |
| 10 | Wire stories.tsx into onboarding.tsx | PENDING | Replace preview_panels step |
| 11 | The Collective — group feed architecture | FUTURE | After coffee scanner confirmed |

---

## 6. ALL v43 DOCTRINE CARRIES FORWARD

The following sections from Canon v43 are unchanged and fully active:

- Project Identity & Permanent Locks (Section 1)
- Three Pillars — Internal Doctrine (Section 2)
- What This System Is (Section 3)
- Primary Hardware Stack (Section 4)
- Tech Stack & Build Rules (Section 5)
- App Flow — Complete Sequence (Section 6)
- Scanner Architecture — S.C.A.N. (Section 7)
- Species Architecture (Section 8)
- The Membrane — 8-Block Question Architecture (Section 9)
- The Clarifier Engine (Section 10)
- Act Right Dollars — Financial Doctrine (Section 11)
- The Chauffeur — Kelly's Story (Section 12)
- The Storybook — 44-Panel HTML (Section 13)
- Permanent Doctrine Locks (Section 16)

---

## 7. PERMANENT DOCTRINE LOCKS — v44 ADDITIONS

| Rule | What It Means |
|------|---------------|
| Plant to Cup is AA2's founding lab | Not a sponsor. The proof of concept. |
| 3 to 1 recipe is built through biosignal data | Not taste alone. AA2 builds the recipe. |
| James Pitts is Patient Zero for coffee intelligence | Every cup he drinks is a data point. |
| The Collective is opt-in only | No member's biological data is shared without explicit consent. |
| Coffee intelligence lives in Forager + Agricultural | Not a new tab. Extension of existing spokes. |
| Lab sessions are Canon entries | Every development session gets logged in the system. |
| Dispenza's name never appears in user-facing output | Internal doctrine reference only. |

---

**AA2 CANON v44 — SEALED — APRIL 13, 2026**
James R. Pitts II | Founder | Customer #1
**I AM THE RECEIPT**
