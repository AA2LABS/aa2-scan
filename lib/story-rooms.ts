// ─── lib/story-rooms.ts ──────────────────────────────────────────────────────
// THE CONTENT OF THE SEVEN ROOMS. Assembled 2026-10-27 from sealed canon only.
// Every founder line is verbatim. Nothing here is invented.

import type { StoryContent } from '@/components/StoryRoom';

export const STORY_ROOMS: Record<string, StoryContent> = {

  aa2: {
    number: '01', title: 'THE AA2 STORY', subtitle: 'I AM THE RECEIPT', accent: '#1BB8FF',
    blocks: [
      { kind: 'lede', text: 'It did not begin as AA2. It began as MINUS7, and the founder’s own words mark the moment: “You know what that is? Minus 7? That’s the birth of AA2.”' },
      { kind: 'body', text: 'Minus7’s founding rule was seven ingredients or fewer equals clean. Minus seven. The name was the threshold — a subtraction, a ceiling, a thing you stay under.\n\nAA² is ADAPTIVE ADVANTAGE, SQUARED. A multiplication. An exponent. A thing that compounds. He renamed a subtraction into an exponent, and the product followed the name.' },
      { kind: 'law', label: 'THE THESIS IN ONE LINE', text: 'MINUS7 COMPOUNDED A SCORE. AA2 COMPOUNDS A BASELINE.\n\nA score is the system’s opinion of you. A baseline is you.' },
      { kind: 'list', label: 'WHAT HE KILLED ON PURPOSE', items: [
        'THE SCORE — the single mechanic the entire Minus7 system was built on, deleted. No naked numbers. Measured, not judged.',
        'BRANDS PAYING FOR ELIGIBILITY — a brand could once pay to affect its own CLEAN rating. That is selling the verdict. The verdict is never for sale; depth is.',
        'DATA REVENUE — raw data is never stored. The only way to keep that promise is to not hold the data at all.',
        'THE BEHAVIOR GATE — community access by score became ZERO SHAME.',
        '“FAKE IT” — the early build map said fake the scanning, fake the partnerships. He stopped faking anything and made the refusal to fake it the product.',
      ] },
      { kind: 'body', text: 'The hinge is findable to the exact section. In the Minus7 Android plan, under Samsung Watch Integration: “Watch provides: heart rate, movement state, stress indicators. Diggi observes, does not act. No health claims. No coaching yet.”\n\nThat is the moment the body enters the system. Before it, Minus7 is a scanner with a memory. After it, there is a heartbeat in the architecture — and the section is headed AA². Minus7 named its successor inside its own final chapter.' },
      { kind: 'law', label: 'N=1 · THE EPISTEMOLOGY', text: 'AA2 makes exactly one kind of claim: this is what your body did, and here is what you said was happening. That is a receipt, not a prediction.\n\nMETHOD OVER CREDENTIAL — “I didn’t study it, I instrumented it. Here’s the receipt.”' },
    ],
    seal: 'Aware. Adapt. Advance.',
  },

  scanner: {
    number: '02', title: 'THE SCANNER', subtitle: 'S.C.A.N. · SAFETY CLARIFIER ADAPTIVE NERVE', accent: '#1BB8FF',
    blocks: [
      { kind: 'lede', text: 'It is not a food scanner. It is a life-contact scanner — and it answers one question: is this safe, aligned and appropriate for this human or animal, right now?' },
      { kind: 'body', text: 'It sits before purchase, consumption, exposure, travel, care decisions, training and trust. Most systems operate after the real-world contact point. AA2 intercepts before.' },
      { kind: 'law', label: 'THE CHEMICAL DOCTRINE', text: 'Chemicals are silent actors. They do not announce intent. They reveal themselves only through the body.\n\nMost systems stop at “this contains X.” AA2 begins at “what does X do over time to this biology, in this context?”' },
      { kind: 'list', label: 'THE FIVE PRINCIPLES', items: [
        'EXPOSURE > LABEL — a “safe” ingredient becomes unsafe through repetition, timing or combination.',
        'CUMULATIVE LOAD MATTERS — stacking across days, weeks, environments and stress states.',
        'BIOSIGNAL IS THE JUDGE — if the body reacts, the doctrine updates. No debate.',
        'CHILDREN, ANIMALS AND STRESSED ADULTS ARE NOT MINI ADULTS — sensitivity scales dynamically.',
        'CHEMICALS AFFECT LEARNING, TRUST AND BEHAVIOR — this is not wellness. This is performance, safety and future alignment.',
      ] },
      { kind: 'list', label: 'THE SIX-STEP FLOW', items: [
        'The scan occurs — food, product, menu, environment, animal feed, medication.',
        'Ingredient translation — chemical names become human meaning.',
        'Exposure context applied — age, species, stress state, recent load, sleep debt.',
        'Biosignal history cross-check — delayed reactions, subtle inflammation, mood changes.',
        'Intent alignment check — does this help or hinder what you said you wanted?',
        'Guidance delivered — not shame, not fear. Clear options.',
      ] },
      { kind: 'law', label: 'THE THREE VERDICTS', text: 'ALL CLEAR · TAKE NOTICE · PAY ATTENTION. Never a score. Never a grade.' },
      { kind: 'body', text: 'The floor is a phone camera. A member who owns nothing but a cell phone receives full pre-contact interception: the allergen verdict at the shelf, the Chemical Doctrine read, the plain-language translation, the alternative without shame.' },
    ],
    seal: 'The Allergy Scanner is not about allergies. It is about trusting your environment again.',
  },

  concierge: {
    number: '03', title: 'THE CONCIERGE', subtitle: 'CLARIFIER BASELINE · THE 30/60/90 DAY ARC', accent: '#E05252',
    blocks: [
      { kind: 'lede', text: 'The host who knows your name. Ask for anything — he routes you to the right intelligence, and he remembers everything.' },
      { kind: 'law', label: 'WHY THE CLARIFIER EXISTS', text: 'Devices measure signals. Only the human knows the meaning.\n\nThe body reports arousal and stress with the same raw signals. A promotion and a panic attack look identical to a wrist. Only context separates them.\n\nThe device reports. AA2 never diagnoses. The member supplies the meaning.' },
      { kind: 'founder', text: 'Uh oh, we’re running a little low on get up and go today. What’s going on? You know me — I’ll never assume. I’ll let you tell me.' },
      { kind: 'law', label: 'THE VOICE LAW', text: 'Observe and ask — never label and score. Name the signal plainly, admit AA2 does not know why, hand it back.\n\nThe same shape is required on good days, or the voice becomes a nag that only shows up when things are bad.' },
      { kind: 'list', label: 'THE CLOCK — THE FOUNDER’S OWN TIMELINE', items: [
        '30 DAYS — a functional baseline. Anomalies become detectable.',
        '60 DAYS — a confident baseline. The heart-rate-variability range is established.',
        '90 DAYS — the membrane is no longer learning. It is knowing.',
        'BEYOND 90 — every scan, incident and trip deepens the picture permanently.',
      ] },
      { kind: 'founder', text: 'Know this 30-60-90 is not anyone else’s timeline, it’s mine. It’s everyone’s timeline when labbing for results.' },
      { kind: 'law', label: 'ZERO SHAME IS THE MECHANISM', text: 'It is not kindness bolted on. Shame makes people lie to health applications — they skip the log, hide the drink, downplay the night. A membrane fed lies produces confident garbage.\n\nThe absence of judgment is the precondition for accurate input.' },
    ],
    seal: 'Calm is trained, not chased. Safety is not silence. Safety is certainty.',
  },

  equalizer: {
    number: '04', title: 'THE EQUALIZER', subtitle: 'PRODUCE · MEAT · SPECIES · FORAGER · APOTHECARY', accent: '#1D9E75',
    blocks: [
      { kind: 'lede', text: 'The immune system. It monitors continuously, detects before symptoms, is never alarmist and never silent about real danger.' },
      { kind: 'body', text: 'The immune system is distributed throughout the entire body — not located in one place. That is why the Equalizer appears in every tab, every species scan, every domain. It is not a feature. It is a systemic function.' },
      { kind: 'law', label: 'LAW ONE · THE FLOOR IS A PHONE CAMERA', text: 'The peasant’s child gets the same allergen verdict at the same shelf in the same second as the prince’s child, because the allergen guard reads the MEMBRANE, not the subscription tier.' },
      { kind: 'law', label: 'LAW TWO · THE CEILING BUYS DEPTH, NEVER WORTH', text: 'The full-stack member gets a longer baseline, a sharper Clarifier, finer recovery truth. But the verdict layer — the “this will hurt your child” layer — is identical at every tier.\n\nNo life-safety function is ever a premium feature. Ever.' },
      { kind: 'founder', text: 'This goes from a person with only a cell phone to someone who has a full stack and travels the world. BOTH have a child with peanut allergies. One’s a prince, one’s a peasant. AA2 wants both to live and thrive.' },
      { kind: 'law', label: 'THE RECORD LINE', text: 'SAME PEANUT. SAME VERDICT. SAME SECOND. THE MEMBRANE DOES NOT CHECK THE CROWN.' },
      { kind: 'list', label: 'WHAT THE EQUALIZER DOES — FIVE HUMAN FUNCTIONS', items: [
        'Guard the Vault — Aware Dollars, every saved item, subscription recovery.',
        'Pill Clarifier — fifteen databases, five cross-references, interaction check.',
        'Apothecary Intelligence — still alive and safe, synergy pairs, off-grid dispensary.',
        'Co-sign Dossiers — security audit, single-exit route flag, seal approval.',
        'Environmental Awareness — location-based threat, early warning.',
      ] },
      { kind: 'body', text: 'Exactly five, because five is anatomically correct. The brain does not perform the functions of the organs — it coordinates them. If the organ does not do it, the panel does not show it.' },
    ],
    seal: 'Nothing passes without clearance. Speaks only in emergencies.',
  },

  chauffeur: {
    number: '05', title: 'THE CHAUFFEUR', subtitle: 'THE DOSSIER · ONE WAY IN, ONE WAY OUT', accent: '#1BB8FF',
    blocks: [
      { kind: 'lede', text: 'The cerebellum. It does not think — it coordinates. It does not decide what to do; it sequences and routes how to get there safely.' },
      { kind: 'body', text: 'He compiles the Dossier. The Equalizer clears it. One compiles, one clears — the same chain of command the Budtender has with the Equalizer. The one who wants and the one who approves are never the same voice.' },
      { kind: 'list', label: 'THE EIGHT MANDATORY SECTIONS', items: [
        'ROUTE & WAYPOINTS — safe stops, fuel, rest, timing, weather.',
        'ONE WAY IN / ONE WAY OUT — egress risk. Any leg, town, canyon, island or venue with a single access route is flagged. State the alternate exit, or state there is none.',
        'ENVIRONMENTAL INTELLIGENCE — local danger reports, civil unrest indicators, construction, crime heat, rideshare deviation risk, border notes.',
        'AVOIDANCES — named areas, roads and times.',
        'EMERGENCY SERVICES — nearest hospital, urgent care, pharmacy, per leg.',
        'AFICIONADO — lounges and premium venues, with smoking legality.',
        'DISPENSARIES — the verified cannabis layer only. Never invent a dispensary or a legal status.',
        'RETAIL LOOP — cleared grocery, market and pharmacy options that fit the membrane.',
      ] },
      { kind: 'law', label: 'THE CO-SIGN', text: 'The Dossier may never be marked cleared while any single-egress leg is unresolved. One line: CO-SIGNED · CLEARED, or HELD · ONE WAY IN / ONE WAY OUT.' },
      { kind: 'body', text: 'The system knows the child on the trip scales differently than the adults, knows the family dog is not coming, ties altitude guidance to the wearable on the wrist, and prints a paper failsafe for when there is no signal.' },
      { kind: 'law', label: 'WHY PAPER', text: 'The page needs no battery. When the signal stops, when the phone dies, when the member is in a country whose network they do not trust — the compiled Dossier, the allergy card and the In Case of Emergency sheet still work.' },
    ],
    seal: 'Compiled before departure. Read on the way out. Carried on the trip. Annotated on return.',
  },

  chef: {
    number: '06', title: 'THE CHEF', subtitle: 'SCAN → RECIPE → SHOP → COOKBOOK', accent: '#C49A2A',
    blocks: [
      { kind: 'lede', text: 'Biology-first meals built from what you actually bought.' },
      { kind: 'law', label: 'THE CHEF OUTPUT LAW', text: 'Exactly three specific numbered recipes on every food scan, formatted 1. 2. 3. Never null. Never empty.' },
      { kind: 'body', text: 'He reads your dietary approach and your allergies before he speaks — generic without the membrane, personal with it. He becomes The Sommelier on Grown Folks and the Cosmo Chemist on Personal Care, and the Chef label is permanently banned from the Species and Personal Care tabs.' },
      { kind: 'law', label: 'LIVE FEED IS NOT A SOCIAL WALL', text: 'It is the shared-presence cooking layer. A member connects by call to someone anywhere in the world, switches to live view, and now they cook together through the glasses — each seeing the other’s hands and pan in real time, with the recipe and the membrane’s allergies and substitutions live in the same session.\n\nOnly AA2 has this.' },
      { kind: 'list', label: 'THE NO NEGATIVE ZONE', items: [
        'No ads ever, in any form.',
        'No politics ever, in any direction.',
        'No shame, no blame — only suggestions aligned with stated goals.',
        'No social media feed, no anger algorithm.',
        'Enforcement is interception before contact, not a reporting queue after damage — the same doctrine as the scanner, applied to words.',
      ] },
    ],
    seal: 'AA2 feeds off goals — not fear.',
  },

  cookbook: {
    number: '07', title: 'THE COOKBOOK', subtitle: 'AA2 INTERNATIONAL LIVE COOKING RECIPES', accent: '#C49A2A',
    blocks: [
      { kind: 'lede', text: '“Save to your cookbook” is Chef doctrine. Every recipe a member saves compiles into their own International Live Cooking Recipes collection.' },
      { kind: 'law', label: 'A SAVE INTO A VOID IS A DEAD END', text: 'The viewing screen must exist. Grouped by cuisine, newest first, delete with confirm.\n\nSave confirmation: ✓ SAVED TO YOUR COOKBOOK · VIEW →. On failure: ⚠ NOT SAVED — RETRY. Every save either confirms visibly or offers a retry. Never silent, never into a void.' },
      { kind: 'body', text: 'The empty state says what it is and what to do about it: “Your cookbook is empty. Save a recipe from any scan.” No fake entries, no sample recipes, no filler. A blank is a truthful blank.' },
      { kind: 'law', label: 'THE TRANSMISSION', text: 'Labels teach labels. A seven-year-old learns the shorthand by watching a parent write on a jar. A nanny reads the family protocol sheet on day one. A grown child inherits the household operating manual.\n\nThe membrane spreads without AA2 speaking.' },
    ],
    seal: 'Truth before checkout. Not regret after.',
  },
};
