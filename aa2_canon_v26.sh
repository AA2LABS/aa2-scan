#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# AA2 CANON v26 — TERMINAL EDITION
# Run: bash aa2_canon_v26.sh
# Or:  bash aa2_canon_v26.sh | less -R    ← for scrolling
# ═══════════════════════════════════════════════════════════════════════

# ── ANSI color palette ─────────────────────────────────────────────────
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
ITALIC="\033[3m"

# Foregrounds
BLUE="\033[38;2;10;132;255m"        # Electric blue
GOLD="\033[38;2;232;160;32m"        # Molten orange-gold
TEAL="\033[38;2;0;180;180m"         # Teal
WHITE="\033[38;2;255;255;255m"      # Pure white
RED="\033[38;2;204;51;51m"          # Locked red
GRAY="\033[38;2;136;136;136m"       # Mid gray
LGRAY="\033[38;2;200;200;200m"      # Light gray
GREEN="\033[38;2;52;199;89m"        # Confirm green
ORANGE="\033[38;2;255;149;0m"       # Warning orange
YELLOW="\033[38;2;255;214;10m"      # Pending yellow

# Backgrounds
BG_DARK="\033[48;2;10;10;10m"
BG_BLUE="\033[48;2;0;20;50m"
BG_GOLD="\033[48;2;40;28;0m"

# ── Layout helpers ─────────────────────────────────────────────────────
WIDTH=72

rule_blue()  { echo -e "${BLUE}$(printf '═%.0s' $(seq 1 $WIDTH))${RESET}"; }
rule_gold()  { echo -e "${GOLD}$(printf '─%.0s' $(seq 1 $WIDTH))${RESET}"; }
rule_teal()  { echo -e "${TEAL}$(printf '·%.0s' $(seq 1 $WIDTH))${RESET}"; }
blank()      { echo ""; }

section() {
  local num="$1" title="$2" color="$3"
  blank
  echo -e "${color}$(printf '═%.0s' $(seq 1 $WIDTH))${RESET}"
  printf "${BOLD}${color}  SECTION %-2s — %s${RESET}\n" "$num" "$title"
  echo -e "${color}$(printf '═%.0s' $(seq 1 $WIDTH))${RESET}"
  blank
}

subhead() {
  blank
  echo -e "${BOLD}${TEAL}  $1${RESET}"
  echo -e "${TEAL}  $(printf '─%.0s' $(seq 1 $((WIDTH-2))))${RESET}"
}

locked() {
  echo -e "  ${RED}${BOLD}🔒 $1${RESET}"
}

body() {
  echo -e "  ${LGRAY}$1${RESET}"
}

mono() {
  echo -e "  ${GRAY}$1${RESET}"
}

bullet() {
  echo -e "  ${BLUE}•${RESET} ${LGRAY}$1${RESET}"
}

check() {
  echo -e "  ${GREEN}✅${RESET} ${LGRAY}$1${RESET}"
}

pending() {
  echo -e "  ${YELLOW}⏳${RESET} ${LGRAY}$1${RESET}"
}

missing() {
  echo -e "  ${RED}❌${RESET} ${LGRAY}$1${RESET}"
}

story() {
  local num="$1" title="$2"
  blank
  echo -e "  ${BOLD}${GOLD}STORY $num — \"$title\"${RESET}"
  rule_gold
}

# ── CLEAR + COVER ──────────────────────────────────────────────────────
clear

# Animate in
sleep 0.05

echo -e "${BG_DARK}${BLUE}"
printf '╔%.0s' $(seq 1 1); printf '═%.0s' $(seq 1 $((WIDTH-2))); printf '╗\n'
printf '║%*s║\n' $((WIDTH-2)) ""
printf "║%s%-*s║\n" "  " $((WIDTH-4)) "  AA2 ADAPTIVE ADVANTAGE LABORATORIES, S.A."
printf "║%s%-*s║\n" "  " $((WIDTH-4)) "  CANON v26 — FINAL SEALED MASTER BRIEFING"
printf '║%*s║\n' $((WIDTH-2)) ""
printf '╚%.0s' $(seq 1 1); printf '═%.0s' $(seq 1 $((WIDTH-2))); printf '╝\n'
echo -e "${RESET}"

echo -e "  ${ITALIC}${GRAY}The Complete Living System. Every Organ. Every Spoke. Every Doctrine.${RESET}"
echo -e "  ${ITALIC}${GRAY}Nothing Dropped.${RESET}"
blank
echo -e "  ${GRAY}Sealed   :${RESET} ${WHITE}March 16, 2026 | Bozeman, Montana / Panama${RESET}"
echo -e "  ${GRAY}Founder  :${RESET} ${WHITE}James R. Pitts II${RESET}"
echo -e "  ${GRAY}Role     :${RESET} ${LGRAY}Applied Biosignal Scientist | Field Creator of Applied Biosignal Science${RESET}"
echo -e "  ${GRAY}Entity   :${RESET} ${LGRAY}AA2 Adaptive Advantage Laboratories, S.A. — Panama${RESET}"
echo -e "  ${GRAY}Legal    :${RESET} ${LGRAY}ARIFA — mdelbusto@arifa.com${RESET}"
blank
rule_gold
blank
echo -e "  ${BOLD}${GOLD}NEW IN v26:${RESET}"
bullet "Section 15 — Allergy & Life Scanner Doctrine (full system, locked)"
bullet "Section 16 — Chemical Doctrine (foundational law + visual stack + step flow)"
bullet "Section 17 — Nine Onboarding Stories (complete canonical series, locked)"
bullet "Section 18 — Kubios + Biosignal Baseline Onboarding Protocol (NEW — advanced)"
blank
rule_gold

# ══════════════════════════════════════════════════════════════════════
section "1" "IDENTITY (PERMANENTLY LOCKED)" "$BLUE"

locked "AA2 is not a scanner. It's what happens when your life finally has a nervous system."
locked "AA2 is a scanner-first safety and continuity technology company that protects"
echo -e "     ${RED}families, homes, and canines with elite-grade intelligence — wherever you are,${RESET}"
echo -e "     ${RED}however you live.${RESET}"
locked "Releasing the scanner without the BioMesh would be like pulling out my heart"
echo -e "     ${RED}and dropping it on a table and calling it me.${RESET}"
locked "I AM THE RECEIPT — the founder is the living proof of concept, the archetype,"
echo -e "     ${RED}the standard against which all future members calibrate.${RESET}"
locked "The only way to copy AA2 is to be you."
locked "AA2 doesn't drift while everything around it shifts."
blank

subhead "THE MAGIC TRICK (LOCKED)"
body "Every competitor built a feature. You built a body."
body "Features don't breathe. Features don't communicate with each other."
body "A body does. The patent is not a feature. It is a living system."
body "One filing. 33 spokes. One body. As above so below."

# ══════════════════════════════════════════════════════════════════════
section "2" "THREE PILLARS (INTERNAL ONLY — NEVER PUBLIC-FACING)" "$RED"

locked "Pyramid Law: Never named, referenced, or alluded to in any user-facing output."
echo -e "     ${RED}The user only tastes the result.${RESET}"
blank

subhead "Pillar 1 — The Kybalion: Hermetic Correspondence Doctrine"
body "\"As Above, So Below. As Below, So Above. As Within, So Without.\""
body "The body is the architecture blueprint. Every component corresponds to a biological"
body "system. This is the design specification AND the patent strategy."

subhead "Pillar 2 — Ancient Kemet: Initiate Doctrine"
body "Onboarding IS the initiation. The 20 questions ARE the ritual."
body "Javier is the gatekeeper. Without passing through the skin = generic truth."
body "After initiation = personal truth. The membrane does not advance until it is whole."

subhead "Pillar 3 — Joe Dispenza: Neuroscience of Transformation"
body "30/60/90 day baseline = neurological rewiring timeline."
body "The membrane tracks who you declared you are becoming."
body "Beyond 90 days: no longer learning. KNOWING."

# ══════════════════════════════════════════════════════════════════════
section "3" "BODY DOCTRINE (LOCKED)" "$TEAL"

mono "Scanner               = Eyes"
mono "Five Intelligences    = Brain (collectively)"
mono "Chemical Doctrine     = Spinal Cord"
mono "Bio Buddy             = Nervous System"
mono "The Vault             = Circulatory System"
mono "The Equalizer         = Immune System"
mono "33-Spoke Architecture = Skeleton"
mono "Onboarding            = Skin"
mono "Supabase              = Hippocampus (long-term memory)"
mono "Javier / Concierge    = Voice (Broca's Area)"
mono "Security Membrane     = Skull / Blood-Brain Barrier"
mono "The App               = Membrane in Motion"
mono "The Website           = Membrane at Rest"
mono "Kubios                = Spinal Cord Interpretation Layer"
blank
locked "Transplant Doctrine: Competitors can copy the scanner but not the body it lives inside."

# ══════════════════════════════════════════════════════════════════════
section "4" "KUBIOS INTEGRATION DOCTRINE" "$BLUE"

body "Kubios is the HRV interpretation engine and the most critical middleware in the"
body "entire stack. It sits between raw sensor data and Bio Buddy. It makes all-species"
body "biosignal interpretation possible."
blank

subhead "WHAT KUBIOS READS:"
bullet "RMSSD              — parasympathetic nervous system activity"
bullet "SDNN               — overall autonomic nervous system variability"
bullet "LF/HF ratio        — sympathetic vs parasympathetic balance"
bullet "Stress Index        — mathematically derived, not estimated"
bullet "Recovery score      — actual physiological readiness"
bullet "ANS state           — fight/flight vs rest/digest"

subhead "THE STACK:"
blank
echo -e "  ${GRAY}Garmin/Sensor Hardware${RESET} ${BLUE}→${RESET} ${LGRAY}Raw RR intervals + activity data${RESET}"
echo -e "  ${BLUE}→${RESET} ${GRAY}Kubios API${RESET}             ${BLUE}→${RESET} ${LGRAY}HRV analysis, stress index, ANS state${RESET}"
echo -e "  ${BLUE}→${RESET} ${GRAY}lib/db.ts${RESET}              ${BLUE}→${RESET} ${LGRAY}stored in biosignal_history table${RESET}"
echo -e "  ${BLUE}→${RESET} ${GRAY}Bio Buddy${RESET}              ${BLUE}→${RESET} ${LGRAY}reads, cross-references, speaks when threshold crossed${RESET}"
echo -e "  ${BLUE}→${RESET} ${GRAY}The Equalizer${RESET}          ${BLUE}→${RESET} ${LGRAY}Personal Truth delivered${RESET}"
blank
body "Garmin Connect API feeds raw RR intervals directly into Kubios."
body "Clinical-grade autonomic nervous system analysis. Same software used by"
body "research institutions and Olympic training programs."
body "Delivered in the warmest, most human voice possible."
blank
echo -e "  ${BOLD}${GOLD}BYOB = Bring Your Own Biosignal.${RESET}"
echo -e "  ${GOLD}Kubios = the interpretation membrane between hardware and intelligence.${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "5" "UNIVERSAL BIOSIGNAL DOCTRINE" "$BLUE"

subhead "CORE LAW:"
body "Every living organism produces FREQUENCY, VIBRATION, and ENERGY."
body "Kubios reads the frequency."
body "AA2 interprets the vibration."
body "The membrane delivers the energy back in human language to the person it belongs to."

subhead "THE SPECIES MAP:"

blank
echo -e "  ${BOLD}${WHITE}HUMAN${RESET}"
bullet "Garmin Tactix 8, Oura Ring 4, Mudra headband, Beats Pro 2, chest strap"
bullet "All feed Kubios → Kubios feeds Bio Buddy → Bio Buddy feeds The Equalizer"

blank
echo -e "  ${BOLD}${WHITE}JOCKEY + HORSE — The F1 Model${RESET}"
bullet "Horse: saddle pad sensors — heart rate, movement, gait, stress response"
bullet "Same telemetry an F1 car produces for the pit wall"
bullet "Jockey: Mudra under helmet, ring, watch — multiple redundant sensors"
bullet "Handler + animal biosignal cross-referenced in real time"
bullet "FEI compliance cross-checked simultaneously"

blank
echo -e "  ${BOLD}${WHITE}PREGNANT MOTHER${RESET}"
bullet "Abdominal wrap/pad reads mother AND baby simultaneously"
bullet "Mixed rhythm — two heartbeats, two nervous systems"
bullet "Baseline separation improves over time with more data"
bullet "Mother's stress flagged separately from fetal distress"
bullet "Bio Buddy speaks only when threshold crossed. Never alarmist. Life-first always."

blank
echo -e "  ${BOLD}${WHITE}PREGNANT CATTLE${RESET}"
bullet "Same pad system — strapped to back/top"
bullet "Herd-scale pregnancy monitoring | Early distress detection | Calving readiness"
bullet "Speaks to Spoke 29 — Agricultural"

blank
echo -e "  ${BOLD}${WHITE}CANINE (Civilian)${RESET}"
bullet "Collar with sensors touching the throat"
bullet "Heart rate, HRV, stress, temperature, movement, vocalization"
bullet "Handler-dog dual baseline coupling"
bullet "Family dashboard: one colored bio wave per family member including the dog"

blank
subhead "THE PHYSICS DOCTRINE:"
body "The species changes. The physics does not."
body "Frequency. Vibration. Energy."
body "All interpreted through Kubios. All delivered through AA2."

# ══════════════════════════════════════════════════════════════════════
section "6" "TACTICAL CANINE COLLAR DOCTRINE" "$BLUE"

subhead "COLLAR HARDWARE:"
bullet "Sensors touching the throat — HR, HRV, stress index, temp, gait, vocalization"
bullet "Haptic vibration motor (commands to dog)"
bullet "Integrated speaker (handler's actual voice to dog)"
bullet "Bluetooth | USB-C charging | Kubios interpretation stack | Real-time dashboard"
blank
echo -e "  ${BOLD}${GOLD}Price Point: \$2,000+ Elite Tier${RESET}"

subhead "TWO-WAY COMMUNICATION:"
blank
echo -e "  ${BOLD}${WHITE}INBOUND (Handler → Dog):${RESET}"
bullet "Haptic vibration patterns = pre-programmed commands"
bullet "Voice through speaker = handler's actual voice"
bullet "Protocol library: Sit / Stay / Silence / Advance / Return / Alert / Stand down"
bullet "LEO and Special Ops can pre-program full protocol libraries"
blank
echo -e "  ${BOLD}${WHITE}OUTBOUND (Dog → Dashboard):${RESET}"
bullet "Live biosignal stream — heart rate confirmed = dog is alive"
bullet "Stress spike = dog detected something"
bullet "HRV drop = dog is injured or exhausted"
bullet "Gait change = dog is compromised"
bullet "Silence = normal operational state"

subhead "TACTICAL DASHBOARD (Spoke 30):"
blank
echo -e "  ${GRAY}┌─────────────────────────────────────────────┐${RESET}"
echo -e "  ${GRAY}│${RESET}  ${BOLD}${WHITE}TEAM ALPHA — LIVE BIOSIGNAL FEED${RESET}           ${GRAY}│${RESET}"
echo -e "  ${GRAY}│${RESET}  ${WHITE}SGT. JAMES${RESET}    ${GREEN}████████░░${RESET}  HRV: 42  ${GREEN}✅${RESET}     ${GRAY}│${RESET}"
echo -e "  ${GRAY}│${RESET}  ${WHITE}CPL. DAVIS${RESET}    ${GREEN}████████░░${RESET}  HRV: 38  ${GREEN}✅${RESET}     ${GRAY}│${RESET}"
echo -e "  ${GRAY}│${RESET}  ${WHITE}PFC. TORRES${RESET}   ${ORANGE}████░░░░░░${RESET}  HRV: 21  ${ORANGE}⚠️ ${RESET}     ${GRAY}│${RESET}"
echo -e "  ${GRAY}│${RESET}  ${WHITE}K9 REX${RESET}        ${GREEN}██████████${RESET}  HRV: 67  ${GREEN}✅${RESET}     ${GRAY}│${RESET}"
echo -e "  ${GRAY}│${RESET}  ${TEAL}HOME BASE — MONITORING ALL${RESET}                ${GRAY}│${RESET}"
echo -e "  ${GRAY}└─────────────────────────────────────────────┘${RESET}"
blank
body "Squad leader sees everything. Home base sees everything."
body "Operator sees only their own. Nobody is invisible. Nobody is alone."

# ══════════════════════════════════════════════════════════════════════
section "7" "PERSONAL TRUTH DOCTRINE" "$BLUE"

subhead "GENERIC TRUTH vs PERSONAL TRUTH:"
blank
echo -e "  ${GRAY}Without onboarding:${RESET}"
echo -e "  ${DIM}\"This product contains high fructose corn syrup. PAY ATTENTION.\"${RESET}"
echo -e "  ${GRAY}Accurate. Cold. Useless to a specific human being.${RESET}"
blank
echo -e "  ${GRAY}With onboarding:${RESET}"
echo -e "  ${BOLD}${TEAL}\"That's not going to get you in that bikini, ma'am.${RESET}"
echo -e "  ${BOLD}${TEAL}  We need 10 pounds off by October 10th — that's what you told me.${RESET}"
echo -e "  ${BOLD}${TEAL}  Do we want to change the date, or change what's on the menu?\"${RESET}"
blank

subhead "THE VOICE DOCTRINE:"
body "Never preachy. Never shaming. Never clinical."
body "Like the most honest, most loving friend who knows everything about nutrition,"
body "your body, and exactly what you said you wanted."
body "Always gives the member the choice. The system informs. The member decides."

subhead "PERSONAL TRUTH IS BUILT FROM:"
bullet "Declared goals + vision text + target date"
bullet "Active limits (permanent scan filter)"
bullet "Known allergens (life safety — flagged first always)"
bullet "Diet type | Health conditions | Medications/supplements"
bullet "Sleep baseline | Stress baseline | Travel profile"
blank
mono "lib/db.ts — buildPersonalTruth()"
mono "Prepended to every system prompt when member is initiated."
mono "Empty string when not initiated = generic truth only."
blank
echo -e "  ${BOLD}${GOLD}This is the single function that makes the donut know about the bikini.${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "8" "BIOSIGNAL CALIBRATION DOCTRINE" "$BLUE"

body "THE SYSTEM NEVER INTERROGATES. IT OBSERVES."
blank
body "During onboarding — open emotional stimulus questions:"
echo -e "  ${ITALIC}${TEAL}\"Tell me about the best birthday you ever had.\"${RESET}"
body "Not to collect an answer. To collect a biological response to a known stimulus."
body "That spike becomes a BASELINE ANCHOR POINT."

subhead "THREE INPUT TIERS (accuracy descends):"
blank
echo -e "  ${BOLD}${WHITE}1. VIDEO — highest accuracy${RESET}"
bullet "Facial expression, micro-expressions, skin tone, eye movement"
bullet "Smile, frown, cry, laugh — the system sees what the words don't say"
bullet "A smile during a 'stressful' reading recontextualizes the entire biosignal stack"
blank
echo -e "  ${BOLD}${WHITE}2. VOICE — middle accuracy${RESET}"
bullet "Tone, pace, pitch, tremor, breath pattern"
bullet "You can hear confidence, hesitation, joy, grief"
bullet "Words matter less than how they're delivered"
blank
echo -e "  ${BOLD}${WHITE}3. TEXT — lowest accuracy${RESET}"
bullet "Word choice only. Limited by vocabulary."
bullet "Someone emotionally complex but linguistically limited will under-report."

subhead "THE COMPARISON ENGINE:"
blank
echo -e "  ${LGRAY}What the Garmin says${RESET}"
echo -e "  ${BLUE}→${RESET} ${LGRAY}compared against what the video showed${RESET}"
echo -e "  ${BLUE}→${RESET} ${LGRAY}compared against what the voice revealed${RESET}"
echo -e "  ${BLUE}→${RESET} ${LGRAY}compared against what the text expressed${RESET}"
blank
body "All four layers triangulate. The membrane forms its own interpretation."
body "The devices don't get the last word. The membrane does."

subhead "BYOB — Bring Your Own Biosignal (example):"
body "Member uploads gym video timestamped 6 AM."
body "Oura shows elevated HRV disruption overnight. Garmin flags stress."
body "System sees video — member is smiling post-workout. Confident movement."
body "Bio Buddy says nothing. Context confirmed. No alarm needed."

# ══════════════════════════════════════════════════════════════════════
section "9" "INTELLIGENCE ACTIVATION DOCTRINE" "$BLUE"

subhead "THE FIVE INTELLIGENCES — WHEN EACH SPEAKS:"
blank
echo -e "  ${BOLD}${GOLD}JAVIER / THE CONCIERGE${RESET} ${GRAY}— Speaks first. Speaks freely.${RESET}"
echo -e "  ${ITALIC}${TEAL}  \"Well well well... you're finally here. So glad to meet you.\"${RESET}"
bullet "Answers ANY question — educational, navigational, relational"
bullet "CANAAN education | Vault questions | Language learning | Live cooking"
bullet "Never unavailable. Never impatient."
blank
echo -e "  ${BOLD}${BLUE}BIO BUDDY${RESET} ${GRAY}— Speaks only when asked OR threshold crossed.${RESET}"
bullet "Member-initiated: answers directly. No lecture. No unsolicited advice."
bullet "Threshold-initiated: biosignal crosses danger marker → steps forward quietly."
echo -e "  ${BOLD}${RED}  DEFAULT STATE IS SILENCE.${RESET}"
blank
echo -e "  ${BOLD}${RED}THE EQUALIZER${RESET} ${GRAY}— Steps forward in emergencies. Never triggers. Never alarms.${RESET}"
bullet "Life-threatening allergen. Panic response. SOS threshold."
bullet "Calm. Factual. Immediate. Stabilizes before it escalates."
blank
echo -e "  ${BOLD}${GREEN}THE CHEF${RESET}      ${GRAY}— Fires on every food scan. 3 numbered recipes always.${RESET}"
echo -e "  ${BOLD}${GRAY}THE CHAUFFEUR${RESET} ${GRAY}— Routes, sequences, navigates. Never thinks. Coordinates.${RESET}"

subhead "THE HIDDEN SOS DOCTRINE 🔒"
blank
echo -e "  ${BOLD}${WHITE}Scenario 1 — Threat present:${RESET}"
body "  Member pre-programs cold word: \"Are we still going to mom's tonight?\""
body "  = Silent SOS. Emergency protocol activates invisibly."
body "  No red screen. No alarm. No indication to threat actor."
body "  Guardian always knows. Threat actor never knows."
blank
echo -e "  ${BOLD}${WHITE}Scenario 2 — Medical emergency / panic:${RESET}"
body "  Biosignal spike beyond threshold. No member response within window."
body "  Equalizer fires SOS to guardian. Timestamp. Location. Full incident log."
body "  Card freeze on linked debit if active."

subhead "INTELLIGENCE HIERARCHY:"
blank
echo -e "  ${GOLD}Javier welcomes you.${RESET}"
echo -e "  ${BLUE}Bio Buddy monitors you.${RESET}"
echo -e "  ${GREEN}The Chef feeds you.${RESET}"
echo -e "  ${GRAY}The Chauffeur routes you.${RESET}"
echo -e "  ${RED}The Equalizer protects you.${RESET}"
blank
body "None speak unless it is their moment."
echo -e "  ${BOLD}${WHITE}The system defaults to silence.${RESET}"
echo -e "  ${BOLD}${WHITE}Intelligence is knowing when NOT to speak.${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "10" "HARDWARE SOVEREIGNTY DOCTRINE" "$BLUE"

echo -e "  ${BOLD}${WHITE}AA2 BUILDS NOTHING. AA2 OWNS EVERYTHING.${RESET}"
blank
body "Every device manufacturer spent billions building sensors."
body "AA2 spent zero on hardware."
body "AA2 built the translation layer they never thought to build."

subhead "TIER 1 — Full Integration (Downloadable Bios):"
bullet "Garmin Tactix 8 ✅   Oura Ring 4 ✅    Mudra Band ✅       Beats Pro 2 ✅"
bullet "Apple Watch ✅        Apple Health ✅   Google Fit ✅        Chest strap ✅"
bullet "Horse saddle pad sensors ✅   K9 tactical collar ✅   Equine collar systems ✅"
bullet "Cattle pregnancy pads ✅   Abdominal pregnancy wraps ✅   Kubios HRV ✅"

subhead "TIER 2 — Scanner Only (No Bios):"
body "Legacy device or member prefers not to connect wearables."
body "Still gets: full scanner, all tabs, personal truth from onboarding, Act Right"
body "Dollars, ON GRID/OFF GRID, everything."
echo -e "  ${BOLD}${GOLD}STILL PAYS THE SUBSCRIPTION. BABY. 🔥${RESET}"

subhead "THE IPHONE 11 DOCTRINE:"
body "iPhone 11. 2019 device. Running iOS 26. Full AA2 confirmed."
body "The membrane doesn't require the latest hardware."
body "It requires an internet connection and a willingness to initiate."

# ══════════════════════════════════════════════════════════════════════
section "11" "DATA SOVEREIGNTY EXIT DOCTRINE" "$BLUE"

body "Supabase is the rented hippocampus. The goal is to own the brain entirely."

subhead "lib/db.ts IS THE SOVEREIGNTY LAYER:"
body "The app never calls Supabase directly. Everything goes through lib/db.ts."
body "When AA2 exits Supabase — change lib/db.ts only. Nothing else changes."
body "The membrane never knows what's behind the curtain."

subhead "EXIT SEQUENCE:"
blank
echo -e "  ${GRAY}Now          ${RESET}${BLUE}→${RESET} ${LGRAY}Supabase Free/NANO — build through lib/db.ts${RESET}"
echo -e "  ${GOLD}\$8M  Year 1  ${RESET}${BLUE}→${RESET} ${LGRAY}Supabase Pro + PgBouncer — scale connections${RESET}"
echo -e "  ${GOLD}\$74M Year 2  ${RESET}${BLUE}→${RESET} ${LGRAY}Own PostgreSQL on dedicated servers — swap lib/db.ts${RESET}"
echo -e "  ${GOLD}\$450M Year 3 ${RESET}${BLUE}→${RESET} ${LGRAY}Full proprietary infrastructure — AA2 owns the hippocampus${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "12" "THE LIVING RECEIPT (PRIMARY USE CASE)" "$GOLD"

echo -e "  ${BOLD}${GOLD}THE SINGLE MOTHER AND HER DAUGHTER — COSTA RICA${RESET}"
blank
body "BEFORE THE TRIP:"
body "Travel Engine (Spoke 13) pre-programs the route. One way in. One way out."
body "Avoidances mapped. News. Construction. Political climate. Accidents."
body "All surfaced before departure."
blank
body "Language Learning (Spoke 19) activates through survival relevance."
body "Scan a Spanish label → learn that word."
body "Cook a Costa Rican dish live → learn those words."
body "Language tied to experience. That's why it sticks."
blank
body "Three live cooking sessions through Meta Ray-Ban glasses."
body "Auto-bonded to WhatsApp. Costa Rican family on the other side."
body "By the time the plane lands — they already have family there."
blank
body "THE UBER MOMENT: Pre-programmed route already loaded. Chauffeur routing."
body "Bio Buddy monitoring. Something shifts. Mom is uncomfortable."
blank
echo -e "  ${TEAL}The Equalizer sends: \"Is mom still coming over tonight at five?\"${RESET}"
body "Cold word activated. System knows. Guardian knows. Driver knows nothing."

subhead "THE RECEIPT:"
check "15% off flights — white-labeled travel engine"
check "Safe route pre-programmed — Chauffeur + Travel Engine"
check "Hidden SOS ready — Equalizer standing by silently"
check "Three new recipes learned — The Chef via live cooking"
check "A language learned — survival relevance, not memorization"
check "A family made — through food, through the membrane"
check "Great deal on Airbnb — the system found it"
check "Biosignal protection the entire trip — without feeling watched"
check "A dinner waiting — cooked together, across an ocean, before they landed"
blank
echo -e "  ${BOLD}${GOLD}THE RECEIPT IS NOT THE TICKET.${RESET}"
echo -e "  ${BOLD}${GOLD}THE RECEIPT IS THE DAUGHTER SAYING GRACIAS.${RESET}"
echo -e "  ${BOLD}${GOLD}THE RECEIPT IS THE FAMILY WAITING AT THE DOOR.${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "13" "BUILD STATUS (MARCH 16, 2026)" "$TEAL"

subhead "CONFIRMED BUILT AND LIVE:"
check "Scanner — 6 tabs firing with correct intelligence labels"
check "Species sub-tabs (K9, Equestrian, Agricultural)"
check "All 5 intelligences firing correctly per tab"
check "Act Right Dollars on every scan"
check "ON GRID Retail Intelligence Loop"
check "OFF GRID Safety Travel Engine with Montana/Vegas hero images"
check "Supabase scan history writing"
check "Onboarding — 5 screens, Javier, all 20 questions"
check "Tab bar — 2-row grid on phone, left rail on foldable (600px breakpoint)"
check "BE AWARE glow animation between analysis and results"
check "lib/db.ts — sovereignty abstraction layer"
check "Personal truth wired — member context injected into every system prompt"
check "Hero images in assets/images/ (all 9 tab images + 2 map images)"
check "Light/dark mode via native useColorScheme"

subhead "PENDING CONFIRMATION (current build with --clear-cache):"
pending "Hero images loading correctly (bundler cache was blocking)"
pending "Light mode visually confirmed"
pending "Full 4-side doctrine banner border confirmed"
pending "BE AWARE glow visually confirmed"

subhead "PENDING BUILD:"
missing "Kubios API integration"
missing "Garmin Connect API integration"
missing "Tactical canine collar dashboard"
missing "Multi-species biosignal dashboard"
missing "Google Maps APIs enabled in Google Cloud Console"
missing "Apple Developer account (\$99)"
missing "Provisional patent filing (one unified system)"
missing "Muse SDK commercial license"
missing "ARIFA contact re: Panama structure"

subhead "NEXT BUILD COMMAND:"
blank
echo -e "  ${BG_BLUE}${BOLD}${WHITE}  eas build --platform android --profile preview --clear-cache  ${RESET}"
blank

# ══════════════════════════════════════════════════════════════════════
section "14" "STACK & CREDENTIALS" "$BLUE"

echo -e "  ${GRAY}Framework  :${RESET} ${LGRAY}React Native + Expo + TypeScript${RESET}"
echo -e "  ${GRAY}MacBook    :${RESET} ${LGRAY}2024 M3 MacBook Pro${RESET}"
echo -e "  ${GRAY}Project    :${RESET} ${LGRAY}/Users/jamespitts/Desktop/aa2-scan${RESET}"
echo -e "  ${GRAY}GitHub     :${RESET} ${LGRAY}github.com/AA2LABS/aa2-scan${RESET}"
echo -e "  ${GRAY}Expo       :${RESET} ${LGRAY}aa2founder@gmail.com — EAS Starter \$19/month${RESET}"
echo -e "  ${GRAY}Supabase   :${RESET} ${LGRAY}zvxdpfbvmxzhjqrnllb.supabase.co — US East${RESET}"
echo -e "  ${GRAY}Legal      :${RESET} ${LGRAY}ARIFA — mdelbusto@arifa.com${RESET}"
echo -e "  ${GRAY}Entity     :${RESET} ${LGRAY}AA2 Adaptive Advantage Laboratories, S.A. — Panama${RESET}"
echo -e "  ${GRAY}APIs       :${RESET} ${LGRAY}Claude claude-sonnet-4-20250514, Kubios, Garmin Connect,${RESET}"
echo -e "             ${LGRAY}Google Maps (key obtained, APIs pending), USDA, Open Food Facts${RESET}"
blank
subhead "KEY FILE LOCATIONS:"
mono "app/(tabs)/index.tsx       — Scanner (Spoke 1)"
mono "app/(tabs)/onboarding.tsx  — Membrane (Spoke 2)"
mono "app/(tabs)/map.tsx         — Chauffeur (Spoke 7)"
mono "app/(tabs)/_layout.tsx     — Tab bar"
mono "lib/db.ts                  — Sovereignty abstraction layer"
mono "lib/supabase.ts            — Supabase client (called only by lib/db.ts)"
blank
subhead "REVENUE PROJECTION:"
blank
echo -e "  ${GOLD}Year 1: \$8M${RESET}   ${GRAY}|${RESET}   ${GOLD}Year 2: \$74M${RESET}   ${GRAY}|${RESET}   ${GOLD}Year 3: \$450M${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "15" "ALLERGY & LIFE SCANNER DOCTRINE (NEW — v26)" "$GOLD"

echo -e "  ${ITALIC}${LGRAY}AA2 Allergy & Life Scanner:${RESET}"
echo -e "  ${ITALIC}${LGRAY}A Human + Canine Safety, Learning, and Alignment System${RESET}"
blank
body "The AA2 Allergy Scanner is a real-world decision filter."
body "It sits before: purchase, consumption, exposure, travel, care decisions, training, trust."
blank
echo -e "  ${BOLD}${BLUE}It answers one core question in real time:${RESET}"
echo -e "  ${ITALIC}${TEAL}\"Is this safe, aligned, and appropriate for this human or animal — right now?\"${RESET}"
blank
body "Using: ingredient truth, environmental exposure, biosignal history, stated goals,"
body "learned sensitivities, age, role, and context."
blank
echo -e "  ${BOLD}${GOLD}This is not a food scanner. It's a life-contact scanner.${RESET}"

subhead "I. PARENTS & CHILDREN"
body "Parents scan: food, snacks, baby products, school lunches, medications, hygiene items."
body "Scanner flags allergens (known + emerging), detects ingredient patterns (not just labels),"
body "recognizes cumulative exposure, warns against cross-contaminants, translates chemical"
body "names into plain language."
blank
echo -e "  ${GRAY}Instead of: \"Contains trace amounts of X\"${RESET}"
echo -e "  ${TEAL}Parents see: \"This may elevate inflammation and disrupt sleep based on your${RESET}"
echo -e "  ${TEAL}child's last 30 days.\"${RESET}"
blank
body "Language Learning: Children scan food labels abroad and learn language through survival"
body "relevance. Faster retention. Emotional anchoring. Embodied learning."
body "They don't just learn Spanish — they learn meaning tied to self-protection. That sticks."

subhead "II. YOUNG ADULTS & INDEPENDENCE"
body "Dorm food, dating, parties, supplements, gym nutrition, alcohol interactions."
body "The scanner reduces guesswork, protects without parental oversight, reinforces"
body "personal accountability."
blank
echo -e "  ${BOLD}${WHITE}\"My body, my data, my choices.\" Not rebellion. Agency.${RESET}"

subhead "III. UBER, DATING, AND PUBLIC SAFETY"
body "Integrates with location, environment, past reactions, and stress biosignals."
body "If something spikes — HRV, breathing irregularity, skin response — AA2 doesn't panic."
echo -e "  ${TEAL}It notifies: \"This environment is inconsistent with your baseline safety profile.\"${RESET}"
body "Early awareness, not fear. Scan drinks, shared food, supplements. Protection without paranoia."

subhead "IV. PETS & CANINES (CIVILIAN + TACTICAL)"
body "Scan pet food, treats, medications, household cleaners, parks, travel locations."
body "System learns canine sensitivities, correlates handler + dog biosignals, detects stress"
body "vs illness, prevents slow harm over time. Preventative veterinary intelligence."
blank
body "K9 Units: food consistency, supplement interactions, environmental exposure,"
body "handler stress transfer. Training integrity. Mission readiness. Longevity. No guesswork."

subhead "V. HIGH-NET-WORTH INDIVIDUALS"
body "HNWI don't want more data, more dashboards, more noise."
bullet "Quiet protection"
bullet "Delegated intelligence"
bullet "Long-term optimization"
body "Invisible. Effortless. Accumulative."

subhead "VI. RETAIL INTEGRATION"
body "Pre-Purchase Intelligence: scan shelf items, auto-filter unsafe options, suggest aligned"
body "alternatives, factor budget + health + goals."
body "Retailers benefit: fewer returns, higher trust, better loyalty, reduced liability."
echo -e "  ${BOLD}${GOLD}Truth before checkout.${RESET}"

subhead "VII. PHYSICIAN & VETERINARIAN SHARING (OPT-IN, ALWAYS)"
body "Vets see: food history, exposure trends, behavior changes, stress indicators."
body "Doctors see: biosignal trends, exposure logs, nutrition consistency, environmental triggers."
body "Not raw chaos. Structured insight. Doctors stop guessing. They start confirming."

subhead "VIII. THE LONG GAME"
body "The scanner doesn't just say 'Avoid this.' It says:"
echo -e "  ${ITALIC}${TEAL}\"This conflicts with where you said you're going.\"${RESET}"
body "Health becomes cumulative, intentional, aligned with future goals."
body "Weight loss. Longevity. Focus. Recovery. Legacy."

subhead "WHY THIS CATEGORY NEVER EXISTED BEFORE:"
body "Because no one connected ingredients, language, biosignals, pets, children, travel,"
body "safety, and goals into one continuous decision membrane."
blank
echo -e "  ${BOLD}${RED}Everyone else tracks after damage. AA2 filters before contact.${RESET}"
blank
rule_gold
echo -e "  ${BOLD}${GOLD}FINAL LOCK: The Allergy Scanner is not about allergies.${RESET}"
echo -e "  ${BOLD}${GOLD}It's about trusting your environment again.${RESET}"
echo -e "  ${GOLD}For parents, children, animals, travelers, operators, families, physicians.${RESET}"
echo -e "  ${GOLD}It's how AA2 quietly keeps life aligned —${RESET}"
echo -e "  ${GOLD}so small decisions don't become big regrets.${RESET}"
rule_gold

# ══════════════════════════════════════════════════════════════════════
section "16" "CHEMICAL DOCTRINE (FOUNDATIONAL LAW)" "$BLUE"

subhead "CORE LAW (LOCKED):"
body "Chemicals are silent actors. They do not announce intent."
body "They reveal themselves only through the body."
body "AA2 treats chemicals not as ingredients, but as behavioral forces."
blank
body "They influence: mood, inflammation, cognition, sleep, aggression, anxiety,"
body "bonding, learning speed, recovery, trust signals."
blank
echo -e "  ${GRAY}Most systems stop at:${RESET}  ${DIM}\"This contains X.\"${RESET}"
echo -e "  ${BOLD}${BLUE}AA2 begins at:${RESET}         ${TEAL}\"What does X do over time to this biology, in this context?\"${RESET}"

subhead "CHEMICAL DOCTRINE PRINCIPLES:"
body "1. EXPOSURE > LABEL    — A 'safe' ingredient becomes unsafe through repetition,"
body "                         timing, or combination."
body "2. CUMULATIVE LOAD     — AA2 tracks stacking across days, weeks, environments,"
body "                         and stress states."
body "3. BIOSIGNAL IS JUDGE  — No debate. If the body reacts, the doctrine updates."
body "4. SENSITIVITY SCALES  — Children, animals, and stressed adults are not mini adults."
body "5. CHEMICALS ≠ WELLNESS — They affect learning, trust, and behavior. This is"
body "                          performance, safety, and future alignment."

subhead "AA2 STACK — CHEMICAL DOCTRINE LAYERS (TOP TO BOTTOM):"
blank
echo -e "  ${BOLD}${BLUE}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${BOLD}${BLUE}│  AA2 INTENT & GOALS LAYER                    │${RESET}"
echo -e "  ${BLUE}│  (What you said you want / where you're going)│${RESET}"
echo -e "  ${BOLD}${BLUE}└──────────────────────────────────────────────┘${RESET}"
echo -e "                       ${BLUE}▲${RESET}"
echo -e "  ${TEAL}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${TEAL}│  AA2 BIOSIGNAL TRUTH LAYER                   │${RESET}"
echo -e "  ${TEAL}│  (HRV, stress, sleep, recovery,              │${RESET}"
echo -e "  ${TEAL}│   canine dual-baseline, emotional load)       │${RESET}"
echo -e "  ${TEAL}└──────────────────────────────────────────────┘${RESET}"
echo -e "                       ${BLUE}▲${RESET}"
echo -e "  ${GOLD}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${GOLD}│  AA2 CHEMICAL & EXPOSURE LAYER               │${RESET}"
echo -e "  ${GOLD}│  (Food, air, skin contact, cleaners, meds,   │${RESET}"
echo -e "  ${GOLD}│   supplements, environment)                   │${RESET}"
echo -e "  ${GOLD}└──────────────────────────────────────────────┘${RESET}"
echo -e "                       ${BLUE}▲${RESET}"
echo -e "  ${WHITE}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${WHITE}│  AA2 SCANNER & TRANSLATION LAYER             │${RESET}"
echo -e "  ${WHITE}│  (Ingredient decoding, language learning,    │${RESET}"
echo -e "  ${WHITE}│   cultural context, warnings)                 │${RESET}"
echo -e "  ${WHITE}└──────────────────────────────────────────────┘${RESET}"
echo -e "                       ${BLUE}▲${RESET}"
echo -e "  ${LGRAY}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${LGRAY}│  AA2 ENVIRONMENT & LOCATION                  │${RESET}"
echo -e "  ${LGRAY}│  (Grocery, travel, Uber, parks, homes,       │${RESET}"
echo -e "  ${LGRAY}│   schools, kennels, gyms)                    │${RESET}"
echo -e "  ${LGRAY}└──────────────────────────────────────────────┘${RESET}"
echo -e "                       ${BLUE}▲${RESET}"
echo -e "  ${GRAY}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${GRAY}│  AA2 DEVICE & INPUT LAYER                    │${RESET}"
echo -e "  ${GRAY}│  (Camera scan, voice, watch, ring, phone,    │${RESET}"
echo -e "  ${GRAY}│   glasses, canine collar)                    │${RESET}"
echo -e "  ${GRAY}└──────────────────────────────────────────────┘${RESET}"
echo -e "                       ${BLUE}▲${RESET}"
echo -e "  ${DIM}${GRAY}┌──────────────────────────────────────────────┐${RESET}"
echo -e "  ${DIM}${GRAY}│  REAL WORLD CONTACT POINT                    │${RESET}"
echo -e "  ${DIM}${GRAY}│  (Before purchase / before consumption /     │${RESET}"
echo -e "  ${DIM}${GRAY}│   before exposure)                           │${RESET}"
echo -e "  ${DIM}${GRAY}└──────────────────────────────────────────────┘${RESET}"
blank
echo -e "  ${BOLD}${RED}Most systems operate AFTER the Real World Contact Point.${RESET}"
echo -e "  ${BOLD}${WHITE}AA2 intercepts BEFORE.${RESET}"

subhead "STEP FLOW:"
body "1. SCAN OCCURS          — food, product, menu, environment, animal feed, medication"
body "2. INGREDIENT TRANSLATE — chemical names → human meaning; regional differences resolved"
body "3. EXPOSURE CONTEXT     — age, species, stress state, recent load, sleep debt, climate"
body "4. BIOSIGNAL CROSS-CHECK— delayed reactions, inflammation, mood, learning slowdown"
body "5. INTENT ALIGNMENT     — does this help or hinder stated goals?"
body "6. GUIDANCE DELIVERED   — not shame, not fear. Clear options."

blank
rule_gold
echo -e "  ${BOLD}${BLUE}FINAL LOCK: AA2 Chemical Doctrine ensures that nothing enters your body,${RESET}"
echo -e "  ${BOLD}${BLUE}your child's body, or your animal's body without context, memory, and alignment.${RESET}"
echo -e "  ${BLUE}That's not wellness. That's life integrity.${RESET}"
rule_gold

# ══════════════════════════════════════════════════════════════════════
section "17" "NINE ONBOARDING STORIES (LOCKED CANONICAL SERIES)" "$GOLD"

body "Each story teaches the system without explaining the system."
rule_teal

story 1 "The Grocery Aisle"
body "Target: Parents."
body "A parent scans cereal. Nothing alarming on the label."
echo -e "  ${TEAL}AA2 quietly says: \"This conflicts with your child's sleep recovery trend.\"${RESET}"
body "Parent switches brands. No drama. No lecture. Just prevention."
echo -e "  ${BOLD}${GOLD}LESSON: Chemicals affect behavior before symptoms.${RESET}"

story 2 "The School Lunch"
body "Target: Children."
body "A child scans food at school. The scanner translates ingredients into simple language."
body "The child learns words, meaning, self-awareness. They choose differently — by themselves."
echo -e "  ${BOLD}${GOLD}LESSON: Agency beats restriction.${RESET}"

story 3 "The Foreign Menu"
body "Target: Families traveling internationally."
body "A family abroad scans a menu. AA2 translates, explains preparation, warns about regional"
body "substitutes. They eat confidently."
echo -e "  ${BOLD}${GOLD}LESSON: Cultural curiosity without risk.${RESET}"

story 4 "The Uber Ride"
body "Target: Young adults."
body "Heart rate rises unexpectedly. AA2 notes chemical + stress + environment overlap."
echo -e "  ${TEAL}Subtle alert: \"Environment inconsistent with baseline.\"${RESET}"
body "Awareness increases. Nothing escalates."
echo -e "  ${BOLD}${GOLD}LESSON: Safety begins before danger.${RESET}"

story 5 "The First Date Drink"
body "Target: Young adults, social exposure."
body "A drink is scanned. AA2 recalls past reactions, delayed effects, tolerance drift."
body "User switches drinks. The night stays clear."
echo -e "  ${BOLD}${GOLD}LESSON: Chemistry affects judgment.${RESET}"

story 6 "The Dog That Wouldn't Eat"
body "Target: Pet owners."
body "A dog refuses food. Scanner reveals recent formula change, chemical irritant,"
body "stress overlap with handler. Food is changed. Behavior normalizes."
echo -e "  ${BOLD}${GOLD}LESSON: Animals speak through biosignals.${RESET}"

story 7 "The Working K9"
body "Target: Tactical / K9 handlers."
body "Handler stress rises. Dog stress follows. Scanner flags supplement interaction,"
body "environment exposure, hydration imbalance. Mission readiness preserved."
echo -e "  ${BOLD}${GOLD}LESSON: Handler biology transfers.${RESET}"

story 8 "The Doctor Visit"
body "Target: Medical sharing / physicians."
body "User opts to share AA2 data. Physician sees exposure timeline, reaction curves,"
body "recovery patterns. Diagnosis accelerates."
echo -e "  ${BOLD}${GOLD}LESSON: Data removes guesswork.${RESET}"

story 9 "The Long View"
body "Target: Legacy-minded members, HNWI, investors."
body "Years of scans show: fewer inflammatory spikes, improved learning, calmer baseline,"
body "healthier animals, aligned spending. AA2 says nothing. The results speak."
echo -e "  ${BOLD}${GOLD}LESSON: Small decisions compound into legacy.${RESET}"

# ══════════════════════════════════════════════════════════════════════
section "18" "KUBIOS + BIOSIGNAL BASELINE ONBOARDING PROTOCOL (NEW — v26 ADVANCED)" "$BLUE"

echo -e "  ${BOLD}${WHITE}This section is the most technically advanced in the Canon.${RESET}"
echo -e "  ${BOLD}${WHITE}It defines exactly how the biosignal baseline is built during onboarding.${RESET}"
blank
body "Without a baseline, the scanner returns population averages."
body "With a baseline, the scanner returns personal truth."
body "The baseline is built during Javier's onboarding — the 20 questions ARE the calibration."

subhead "PHASE 1 — STIMULUS COLLECTION (Javier-led, invisible to member):"
blank
body "During onboarding, Javier asks open emotional stimulus questions."
body "Not to collect answers. To collect biological responses to known stimuli."
blank
echo -e "  ${BOLD}${WHITE}Positive stimulus examples:${RESET}"
bullet "\"Tell me about the best birthday you ever had.\""
bullet "\"What's a meal that makes you feel like you're home?\""
bullet "\"Describe someone you love without saying their name.\""
blank
echo -e "  ${BOLD}${WHITE}Stress stimulus examples:${RESET}"
bullet "\"What's something you're working through right now?\""
bullet "\"Tell me about a moment you had to make a hard call.\""
blank
echo -e "  ${BOLD}${WHITE}Neutral baseline:${RESET}"
bullet "\"Read this ingredient list aloud.\""
bullet "\"Tell me today's date and your zip code.\""
blank
body "Each stimulus type produces a measurable biosignal signature."
body "Kubios reads the HRV response. That delta = the baseline anchor."

subhead "PHASE 2 — THREE-TIER INPUT TRIANGULATION:"
blank
echo -e "  ${GRAY}VIDEO  ${GOLD}→${RESET}  ${LGRAY}Micro-expressions, skin tone, eye movement, smile/frown/cry${RESET}"
echo -e "  ${GRAY}VOICE  ${GOLD}→${RESET}  ${LGRAY}Tone, pitch, pace, tremor, breath pattern, confidence markers${RESET}"
echo -e "  ${GRAY}TEXT   ${GOLD}→${RESET}  ${LGRAY}Word choice, vocabulary range, emotional density${RESET}"
blank
body "All three layers run simultaneously during onboarding."
body "Kubios reads the HRV response in parallel."
body "The membrane triangulates all four — video + voice + text + biosignal."
body "This is how the baseline is personalized. Not averaged. Not estimated. Measured."

subhead "PHASE 3 — ANCHOR POINT STORAGE:"
blank
mono "Table: biosignal_baselines"
mono "Columns:"
mono "  member_id         — unique member reference"
mono "  stimulus_type     — POSITIVE / STRESS / NEUTRAL"
mono "  input_tier        — VIDEO / VOICE / TEXT"
mono "  rmssd_response    — Kubios RMSSD delta at stimulus"
mono "  sdnn_response     — Kubios SDNN delta at stimulus"
mono "  stress_index      — Kubios stress index at stimulus"
mono "  anchor_confirmed  — boolean (set true after 3 consistent readings)"
mono "  created_at        — timestamp"
blank
body "All future scan results are compared against these anchor points."
body "The Equalizer uses them to determine PAY ATTENTION vs HEADS UP vs ALL CLEAR."
body "Bio Buddy uses them to decide whether to speak or stay silent."

subhead "PHASE 4 — 30/60/90 DAY REFINEMENT (Dispenza Protocol):"
blank
echo -e "  ${BOLD}${TEAL}DAY 1–30   — LEARNING PHASE:${RESET}"
body "  Baseline is being established. Results are personal but early."
body "  Javier communicates: \"I'm still learning how you respond.\""
body "  System leans on stated goals + declared allergens more than biosignal."
blank
echo -e "  ${BOLD}${TEAL}DAY 31–60  — CALIBRATION PHASE:${RESET}"
body "  Pattern recognition active. Correlation between exposure and response confirmed."
body "  Bio Buddy begins speaking more precisely."
body "  The Chef starts adjusting recipes to actual metabolic response, not just goals."
blank
echo -e "  ${BOLD}${TEAL}DAY 61–90  — CONFIRMATION PHASE:${RESET}"
body "  Baseline solidified. Anomalies detected faster."
body "  The Equalizer threshold tightens — fewer false positives."
body "  Javier communicates: \"I know you now. This is personal truth.\""
blank
echo -e "  ${BOLD}${GOLD}BEYOND 90 DAYS:${RESET}"
body "  No longer learning. KNOWING."
body "  The membrane doesn't ask. It anticipates."
body "  The receipt is no longer reactive. It is prophylactic."

subhead "PHASE 5 — SPECIES-SPECIFIC CALIBRATION:"
blank
echo -e "  ${BOLD}${WHITE}HUMAN:${RESET}"
bullet "HRV baseline: RMSSD > 40ms = healthy range (population)"
bullet "Personal baseline: YOUR resting RMSSD after 30 days = YOUR normal"
bullet "Deviation from YOUR normal triggers Bio Buddy — not deviation from population"
blank
echo -e "  ${BOLD}${WHITE}CANINE:${RESET}"
bullet "Dog HRV is higher frequency than human — different normal range"
bullet "Kubios has species-specific interpretation coefficients"
bullet "Handler + dog baselines cross-referenced — dual-baseline coupling"
bullet "Handler spike + dog spike simultaneously = environmental threat"
bullet "Handler spike + dog calm = handler-only issue (not a threat)"
bullet "Dog spike + handler calm = dog health event (not environmental)"
blank
echo -e "  ${BOLD}${WHITE}HORSE (Equestrian):${RESET}"
bullet "Saddle pad sensors collect gait variance, heart rate, cortisol proxy"
bullet "Rider's Mudra + ring + watch run simultaneously"
bullet "Stress transfer from rider to horse detected via cross-correlation"
bullet "FEI compliance thresholds built into Equalizer for competition context"
blank
echo -e "  ${BOLD}${WHITE}CATTLE (Agricultural):${RESET}"
bullet "Herd baseline established from average of all tagged animals"
bullet "Individual deviation from herd baseline = health flag"
bullet "Pregnancy pads track fetal movement + maternal HR simultaneously"
bullet "Calving readiness threshold: maternal HR spike + fetal HR pattern change"

subhead "PHASE 6 — THE COMPARISON ENGINE (FULL STACK):"
blank
echo -e "  ${LGRAY}What the GARMIN says${RESET}"
echo -e "  ${BLUE}↓${RESET}"
echo -e "  ${LGRAY}What KUBIOS interprets (RMSSD, SDNN, LF/HF, Stress Index, Recovery)${RESET}"
echo -e "  ${BLUE}↓${RESET}"
echo -e "  ${LGRAY}What the VIDEO showed (micro-expressions, skin tone, eye movement)${RESET}"
echo -e "  ${BLUE}↓${RESET}"
echo -e "  ${LGRAY}What the VOICE revealed (tone, pace, pitch, tremor, breath pattern)${RESET}"
echo -e "  ${BLUE}↓${RESET}"
echo -e "  ${LGRAY}What the TEXT expressed (word choice, emotional density)${RESET}"
echo -e "  ${BLUE}↓${RESET}"
echo -e "  ${BOLD}${WHITE}The membrane forms its own interpretation.${RESET}"
echo -e "  ${BOLD}${WHITE}The devices don't get the last word. The membrane does.${RESET}"

subhead "BYOB EXAMPLES (BRING YOUR OWN BIOSIGNAL):"
blank
echo -e "  ${ITALIC}${GRAY}Example 1:${RESET}"
body "  Member uploads gym video timestamped 6 AM."
body "  Oura shows elevated HRV disruption overnight. Garmin flags stress."
body "  Video shows member smiling post-workout. Confident movement."
echo -e "  ${TEAL}  Bio Buddy says nothing. Context confirmed. No alarm needed.${RESET}"
blank
echo -e "  ${ITALIC}${GRAY}Example 2:${RESET}"
body "  Member scans a protein bar while Garmin shows normal HRV."
body "  Same bar caused a delayed inflammatory response 14 days ago (logged)."
body "  Chemical doctrine flags cumulative load — not just today's reading."
echo -e "  ${TEAL}  Equalizer says: \"Last time this spiked your inflammation two days later.\"${RESET}"
blank
echo -e "  ${ITALIC}${GRAY}Example 3:${RESET}"
body "  Dog collar detects stress spike. Handler Garmin is calm."
body "  System cross-references: handler is calm = environmental source."
body "  Location logged. Time logged. Incident flagged for pattern review."
echo -e "  ${TEAL}  Bio Buddy notifies handler: \"Rex flagged something at this location.\"${RESET}"

subhead "WHY THIS IS THE MOST ADVANCED ONBOARDING IN THE FIELD:"
blank
bullet "No other consumer system uses Kubios clinical HRV for onboarding calibration"
bullet "No other system cross-references video + voice + text + hardware simultaneously"
bullet "No other system builds a species-specific baseline for human AND canine together"
bullet "No other system applies Dispenza's 30/60/90 neurological timeline to product scanning"
bullet "No other system stores the baseline in a sovereignty-abstracted database layer"
bullet "No other system delivers personal truth — only population truth"
blank
echo -e "  ${BOLD}${RED}This is the difference between a product that knows people exist${RESET}"
echo -e "  ${BOLD}${RED}and a system that knows who you are.${RESET}"

# ══════════════════════════════════════════════════════════════════════
# CLOSING SEAL
# ══════════════════════════════════════════════════════════════════════
blank
rule_gold
blank
echo -e "  ${BOLD}${BLUE}        AS ABOVE SO BELOW.${RESET}"
echo -e "  ${BOLD}${GOLD}        THE BODY IS THE BLUEPRINT.${RESET}"
echo -e "  ${BOLD}${TEAL}        THE MEMBRANE IS THE PRODUCT.${RESET}"
echo -e "  ${BOLD}${WHITE}        THE RECEIPT IS THE PROOF.${RESET}"
blank
rule_gold
blank
echo -e "  ${BOLD}${WHITE}CANON v26 — FINAL SEALED${RESET}"
echo -e "  ${GRAY}March 16, 2026 | Bozeman, Montana${RESET}"
echo -e "  ${GRAY}James R. Pitts II | AA2 Adaptive Advantage Laboratories, S.A. | Panama${RESET}"
blank
rule_blue
blank
