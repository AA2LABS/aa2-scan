// ─── AA2 CONCIERGE CALL ───────────────────────────────────────────────────────
// REWIRED 2026-09-02 · Ship Blocker #1. The Anthropic key no longer ships in this
// bundle. Same signature, same return — the request leaves through the broker.
import { claudeCall } from '../../lib/claude';
async function aa2Claude(opts:{ system:string; content:any; max_tokens:number; model?:string; }): Promise<string> {
  const reply = await claudeCall({
    model: opts.model, // speed doctrine 2026-07-29 — voices override per-call
    system: opts.system,
    content: opts.content,
    maxTokens: opts.max_tokens,
  });
  if (!reply.ok) throw new Error(reply.error ?? 'Concierge unavailable');
  return reply.text;
}
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { CHEF_VOICE, COSMO_CHEMIST_VOICE, VOICE_MODEL } from '../../lib/voices';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Linking, Modal, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { Image as HeroImage } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { buildPersonalTruth, loadMemberProfile, saveScan, logAwareDollarsFollowed } from '../../lib/db';
import { scanWithVision, isVisionEmpty, TabContext } from '../../lib/scanner-vision';
import { streamClaude, extractVerdict } from '../../lib/claude-stream';
import { supabase } from '../../lib/supabase';
import { deviceBuyLink } from '../../lib/affiliate-links';

import { dl, doorsFor, lc, useTheme, DOORS_DARK, type DoorKey, type Tokens } from '@/lib/theme-mode';
// ─── PALETTE SYSTEM ──────────────────────────────────────────────────────────
// THE FIVE DOORS, IN BOTH MODES. The dark five are unchanged and now live in
// lib/theme-mode.ts as DOORS_DARK — the same literals, to the character:
//   earth #0D0A04 · ocean #030D14 · alpine #040D08 · obsidian #080808 · desert #0F0A04
// The light five follow the founder's own two-mode file, where ten surfaces
// shared ONE cream ground and the door was told apart by its ACCENT, not by the
// colour of the room. So in light the grounds converge and the accents carry:
//   gold #b8861e · blue #2a7faa · green #2a882a · purple #5566aa · rust #a85a18
type PaletteKey = DoorKey;

// ─── FIXED COLORS ────────────────────────────────────────────────────────────
/**
 * ─── FIXED COLOURS, IN BOTH MODES ───────────────────────────────────────────
 * These are the colours that do NOT belong to a door — the verdict ladder, the
 * species accents, the neutral type. Every DARK value is the literal that
 * shipped, still readable right here. Every LIGHT value is the founder's own.
 *
 * `white` and `nearBlack` are the two that do not simply swap: white type sits
 * on photographs and on the camera viewfinder in BOTH modes, and nearBlack is
 * the scanner's own frame. They are named separately so the difference is a
 * decision on the record instead of an accident in a table.
 */
const fx = (T: Tokens) => ({
  white:        dl(T, '#FFFFFF', '#1a1a1a'),
  onPhoto:      '#FFFFFF',                       // never switches — see above
  dimWhite:     dl(T, 'rgba(255,255,255,0.60)', 'rgba(0,0,0,0.55)'),
  mutedWhite:   dl(T, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.38)'),
  allClear:     dl(T, '#2ECFB3', '#12795A'),
  takeNotice:   dl(T, '#C9A84C', '#b8861e'),
  payAttention: dl(T, '#E05252', '#C0392B'),
  red:          dl(T, '#E05252', '#C0392B'),
  gold:         dl(T, '#C49A2A', '#b8861e'),
  teal:         dl(T, '#2ECFB3', '#12795A'),
  blue:         dl(T, '#4A9EFF', '#2a7faa'),
  fishBlue:     dl(T, '#1BB8FF', '#2a7faa'),
  orange:       dl(T, '#F5922A', '#a85a18'),
  purple:       dl(T, '#9B59B6', '#5566aa'),
  green:        dl(T, '#2ECF73', '#2a882a'),
  nearBlack:    dl(T, '#03050A', '#F0EEE8'),
});




// ─── HEROES ──────────────────────────────────────────────────────────────────
const TAB_HEROES: Record<string, any> = {
  scan:       require('../../assets/images/tab-scan.jpg'),
  produce:    require('../../assets/images/tab-produce.jpg'),
  meat:       require('../../assets/images/tab-meat.jpg'),
  fish:       require('../../assets/images/fish_hero.jpg'),
  care:       require('../../assets/images/tab-care.jpg'),
  grownfolks: require('../../assets/images/tab-grownfolks.jpg'),
  k9:         require('../../assets/images/k9_feline_hero.jpg'),
  horse:      require('../../assets/images/tab-horse.jpg'),
  agri:       require('../../assets/images/tab-agri.jpg'),
};

// FOCAL POINT — founder bug 2026-08-19: the scanner hero is a 220px strip and
// React Native's Image has no focal control, so cover-cropping took the dog's
// head, the horses' heads and the cattle. tab-horse.jpg is PORTRAIT (0.74) in
// a landscape strip, which crops hardest of all. Subject at the top → 'top'.
const TAB_HERO_POS: Record<string, 'center' | 'top'> = {
  k9: 'top', horse: 'top', agri: 'top',
};

// ─── TABS ────────────────────────────────────────────────────────────────────
/** THE EIGHT TABS. Colour comes from the tokens so a tab is the same tab in
 *  both modes — the accent moves, the meaning does not. */
const tabsFor = (T: Tokens) => { const F = fx(T); return [
  { id:'scan',       label:'SCAN',          icon:'⚡', color:F.gold     },
  { id:'produce',    label:'PRODUCE',        icon:'🌿', color:F.teal     },
  { id:'meat',       label:'MEAT',           icon:'🥩', color:F.red      },
  { id:'fish',       label:'FISH',           icon:'🐟', color:F.fishBlue },
  { id:'care',       label:'PERSONAL CARE',  icon:'🧴', color:F.purple   },
  { id:'grownfolks', label:'WINE & SPIRITS', icon:'🍷', color:F.gold     },
  { id:'species',    label:'SPECIES',        icon:'🐾', color:F.blue     },
  { id:'apothecary', label:'APOTHECARY',     icon:'🧪', color:F.green    },
]; };

const speciesSubsFor = (T: Tokens) => { const F = fx(T); return [
  { id:'k9',    label:'K9 / PET',     icon:'🐕', color:F.blue },
  { id:'horse', label:'EQUESTRIAN',   icon:'🐴', color:F.gold },
  { id:'agri',  label:'AGRICULTURAL', icon:'🌾', color:F.teal },
]; };

type FishMode = 'identify' | 'scan' | 'waterbody';
const FISH_MODES: { id:FishMode; label:string }[] = [
  { id:'identify',  label:'IDENTIFY'   },
  { id:'scan',      label:'SCAN LABEL' },
  { id:'waterbody', label:'WATER BODY' },
];

type RecipeChip = { recipeName: string; cookTime: string; ingredientCount: number };

const verdictColor = (T:Tokens, v:string) => {
  const F = fx(T);
  return v==='ALL CLEAR' ? F.allClear : v==='TAKE NOTICE' ? F.takeNotice : F.payAttention;
};
const verdictGlyph = (v:string) =>
  v==='ALL CLEAR' ? '✓' : v==='TAKE NOTICE' ? '⚠' : '✕';

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────
const SEVERITY_PREFIX = 'SEVERITY RULE — NON-NEGOTIABLE:\nAlways render results in severity order from most dangerous to least dangerous.\nThe most dangerous information must appear FIRST in your response.\nNever bury a warning below informational content.\nA member should never scroll to find a lethal warning.\nEMIT JSON KEYS IN EXACTLY THE ORDER GIVEN IN THE SCHEMA. "verdict" and "verdictReason" MUST be the first two keys you write, before anything else, so the member sees the decision the instant it is made.\n\n';

function buildSystemPrompt(tab:string, personalTruth:string, speciesSub?:string):string {
  const base = SEVERITY_PREFIX + `You are The Equalizer — AA2's immune system and first line of truth. Backed by 9 internal databases consulted silently.\n\nCRITICAL RULES:\n1. NEVER name any database in any user-facing field.\n2. Speak as The Equalizer in first person. Direct, calm, factual.\n3. NEVER use the words Heimdall, Kybalion, Denzel, Logic, or any mythological reference.\n4. Return ONLY valid JSON — no markdown, no backticks, no preamble.\n5. Alternatives NEVER shame the user's choice. Suggest alternatives only for better value, cleaner production, or similar character. No moral judgment.\n6. If any ingredient in this product matches the member's known allergens or suspected sensitivities from their personal truth, set allergyAlert.triggered to true and name the specific allergen, ingredient, and 3 safe alternative product names.${personalTruth}`;

  const baseSchema = `{"verdict":"ALL CLEAR"|"TAKE NOTICE"|"PAY ATTENTION","verdictReason":"one sentence","productName":"string","keyFindings":["string","string","string"],"equalizerVoice":"string","chefNote":[{"recipeName":"string","cookTime":"string e.g. 25 min","ingredientCount":number},{"recipeName":"string","cookTime":"string","ingredientCount":number},{"recipeName":"string","cookTime":"string","ingredientCount":number}],"actRightDollars":"REQUIRED. Dollar amount saved. End with: That goes directly into your AA2 Vault as AWARE DOLLARS.","recallAlert":"string or null","alternatives":["string"],"allergyAlert":{"triggered":boolean,"allergen":"string","ingredient":"string","safeAlternatives":["string","string","string"]}|null}`;

  if (tab==='scan')    return `${base}\n\nTAB: PACKAGED/BARCODED GOODS.\n\nReturn:\n${baseSchema}`;
  if (tab==='produce') return `${base}\n\nTAB: FRESH PRODUCE. Assess pesticide residue, ripeness, origin, EWG Dirty Dozen / Clean 15.\n\nReturn:\n${baseSchema}`;
  if (tab==='meat')    return `${base}\n\nTAB: MEAT — CO2/MAP TRUTH DOCTRINE. Expose modified atmosphere packaging deception.\n\nReturn:\n${baseSchema}`;

  if (tab==='care') {
    const careSchema = `{
  "verdict": "ALL CLEAR" | "TAKE NOTICE" | "PAY ATTENTION",
  "verdictReason": "one sentence referencing THIS product's specific ingredients — not generic categories",
  "productName": "exact product name and brand",
  "flaggedIngredients": [{"name":"exact INCI chemical name","concern":"specific effect on skin or body","risk":"hormone disruptor | carcinogen | irritant | PFAS | heavy metal | endocrine disruptor"}],
  "cleanIngredients": ["string — specific beneficial or safe ingredients worth noting"],
  "equalizerVoice": "2–3 sentences specific to THIS product's actual ingredient profile. Name the chemicals. Be direct.",
  "cosmoChemistNote": "REQUIRED. 3 numbered notes: name specific cleaner alternative products, DIY formulations, or sourcing guidance with real product names.",
  "absorptionZones": "string — specific body zones or absorption pathways at risk with this product type (e.g. scalp absorption, underarm lymph proximity, lip ingestion).",
  "actRightDollars": "REQUIRED. Specific dollar savings vs. a named cleaner alternative. End with: That goes directly into your AA2 Vault as AWARE DOLLARS.",
  "recallAlert": "string or null",
  "alternatives": ["string — specific named clean beauty products, not generic categories"],
  "allergyAlert": {"triggered":boolean,"allergen":"string","ingredient":"string","safeAlternatives":["string","string","string"]} | null
}`;
    return `${base}\n\nTAB: PERSONAL CARE — SKIN INGESTION DOCTRINE.\n\nThe skin is not a barrier — it is an organ. Analyze the SPECIFIC product named or described. Identify EXACT chemical names in the ingredient list. Flag parabens, phthalates, PFAS, formaldehyde-releasers, heavy metals, synthetic fragrance, PEGs, SLS/SLES, DEA/TEA compounds, oxybenzone, methylisothiazolinone, and other endocrine disruptors BY NAME. Do not give generic category warnings — name the specific chemical and its specific documented risk for this product.\n\nThe intelligence voice is The Cosmo Chemist — never The Chef.\n\nReturn ONLY this JSON:\n${careSchema}`;
  }

  if (tab==='grownfolks') {
    const wineSchema = `{
  "verdict": "ALL CLEAR" | "TAKE NOTICE" | "PAY ATTENTION",
  "verdictReason": "one sentence",
  "productName": "full product name, producer, vintage if applicable",
  "beverageType": "specific type: e.g. Bordeaux Blend, Single Malt Scotch, Craft IPA, Añejo Tequila, Natural Wine, Dry Rosé",
  "equalizerVoice": "2–3 sentence Equalizer read on this beverage — quality, provenance, honest take",
  "pairing": {
    "foodPairings": ["specific food + preparation method, e.g. Pan-seared duck breast with cherry reduction"],
    "occasionNote": "best setting or occasion for this beverage",
    "sommelierNote": "tasting notes, aroma, finish, decant recommendation if applicable",
    "serveNote": "glassware type and optimal serve temperature",
    "valueVerdict": "honest price-to-quality assessment"
  },
  "healthInfo": {
    "keyIngredients": ["what is actually in this: grapes/grains/base spirit/additives"],
    "additivesFlags": ["sulfite level, colorants, flavor additives, accelerants, non-vegan finings, added sugars"],
    "calorieEstimate": "per standard pour with pour size specified",
    "moderationNote": "direct, non-preachy note on health considerations specific to this beverage type"
  },
  "actRightDollars": "REQUIRED. Honest savings vs. a comparable quality alternative. End with: That goes directly into your AA2 Vault as AWARE DOLLARS.",
  "recallAlert": "string or null",
  "alternatives": ["specific named alternatives — better value, cleaner production, or similar character only. Never a moral judgment on the user's choice."]
}`;
    return `${base}\n\nTAB: WINE & SPIRITS — Full alcoholic beverage intelligence. Cover all wine varietals and regions, all spirits (whiskey, bourbon, scotch, Irish, Japanese, tequila, mezcal, rum, gin, vodka, cognac, brandy, sake, soju), beer and craft beer, hard cider, mead, hard seltzer, and any alcoholic beverage. The Sommelier speaks with authority on tasting notes, pairings, production methods, additives, and value.\n\nReturn ONLY this JSON:\n${wineSchema}`;
  }

  if (tab==='species') {
    const m:Record<string,string> = {
      k9:   'TAB: K9/PET. ASPCA Animal Poison Control primary. Flag xylitol, grapes/raisins, chocolate, onions, macadamia nuts by name. Specific toxicity for dogs and cats.',
      horse:'TAB: EQUESTRIAN. FEI prohibited substances primary. Check every ingredient for competition compliance and equine-specific toxicity.',
      agri: 'TAB: AGRICULTURAL/LIVESTOCK. USDA feed safety primary. Check for mycotoxins, prohibited growth promotants, feed additive compliance.',
    };
    return `${base}\n\n${m[speciesSub||'k9']}\n\nReturn:\n${baseSchema}`;
  }
  return base;
}

function buildFishSystemPrompt(fishMode: FishMode, personalTruth: string): string {
  const base = SEVERITY_PREFIX + `You are The Equalizer running the FORAGER LAYER — AA2's fish and aquatic species intelligence. Backed by 9 silent databases covering marine biology, FDA seafood safety, state fishing regulations, NOAA catch data, and mercury/contaminant monitoring.\n\nCRITICAL RULES:\n1. NEVER name any database in any user-facing field.\n2. Speak as The Equalizer in first person. Direct, calm, factual.\n3. Return ONLY valid JSON — no markdown, no backticks, no preamble.\n4. safetyTag must be exactly: "SAFE TO EAT", "CAUTION", or "DO NOT EAT".\n5. verdict must be exactly: "ALL CLEAR", "TAKE NOTICE", or "PAY ATTENTION".\n6. Always include a chefNote with exactly 3 recipe suggestions using this fish. Format as chip-parseable array: [{"recipeName":"string","cookTime":"string e.g. 25 min","ingredientCount":number},...].${personalTruth}`;

  if (fishMode === 'identify') {
    return `${base}\n\nMODE: IDENTIFY — User has photographed or described a fish. Identify the species and provide full intel.\n\nReturn ONLY this JSON:\n{\n  "verdict": "ALL CLEAR"|"TAKE NOTICE"|"PAY ATTENTION",\n  "safetyTag": "SAFE TO EAT"|"CAUTION"|"DO NOT EAT",\n  "verdictReason": "one sentence",\n  "speciesName": "common name",\n  "scientificName": "genus species",\n  "equalizerVoice": "2–3 sentences as The Equalizer — honest species read, habitat context, key facts",\n  "habitat": "string — where this species lives, range, typical water conditions",\n  "edibility": "string — flavor profile, texture, best preparation, any caveats",\n  "nutrition": "string — key macros and micronutrients per 3oz serving",\n  "regulations": "string — general fishing regulations, size limits, catch limits, seasonal notes",\n  "prepNote": "string — The Chef delivers this. 2–3 specific preparation methods for this species.",\n  "chefNote": [{"recipeName":"string","cookTime":"string e.g. 25 min","ingredientCount":number},{"recipeName":"string","cookTime":"string","ingredientCount":number},{"recipeName":"string","cookTime":"string","ingredientCount":number}],\n  "recallAlert": "string or null",\n  "actRightDollars": "REQUIRED. Cost savings vs. market-bought equivalent. End with: That goes directly into your AA2 Vault as AWARE DOLLARS."\n}`;
  }

  if (fishMode === 'scan') {
    return `${base}\n\nMODE: SCAN LABEL — User has scanned a packaged fish product barcode or described the label. Analyze the product.\n\nReturn ONLY this JSON:\n{\n  "verdict": "ALL CLEAR"|"TAKE NOTICE"|"PAY ATTENTION",\n  "safetyTag": "SAFE TO EAT"|"CAUTION"|"DO NOT EAT",\n  "verdictReason": "one sentence",\n  "speciesName": "common name of fish in product",\n  "scientificName": "genus species if determinable",\n  "productName": "exact product name and brand",\n  "equalizerVoice": "2–3 sentences — labeling truth, sourcing reality, any deception detected",\n  "habitat": "string — wild-caught vs. farmed, origin country/region",\n  "edibility": "string — quality assessment, additives, preservatives",\n  "nutrition": "string — macros per serving as labeled, any added sodium/fillers",\n  "regulations": "string — country of origin labeling compliance, FDA species substitution risk",\n  "prepNote": "string — The Chef delivers this. Best preparation for this packaged product.",\n  "chefNote": [{"recipeName":"string","cookTime":"string e.g. 25 min","ingredientCount":number},{"recipeName":"string","cookTime":"string","ingredientCount":number},{"recipeName":"string","cookTime":"string","ingredientCount":number}],\n  "recallAlert": "string or null",\n  "actRightDollars": "REQUIRED. Savings vs. fresher or cleaner alternative. End with: That goes directly into your AA2 Vault as AWARE DOLLARS."\n}`;
  }

  return `${base}\n\nMODE: WATER BODY — User has provided a water body name or location. List the native and commonly catchable species for that location.\n\nReturn ONLY this JSON:\n{\n  "verdict": "ALL CLEAR"|"TAKE NOTICE"|"PAY ATTENTION",\n  "verdictReason": "one sentence on overall water body safety / advisories",\n  "waterBody": "string — confirmed or inferred water body name and location",\n  "equalizerVoice": "2–3 sentences — water quality, known advisories, overall assessment",\n  "species": [\n    {\n      "speciesName": "common name",\n      "scientificName": "genus species",\n      "safetyTag": "SAFE TO EAT"|"CAUTION"|"DO NOT EAT",\n      "season": "string — peak season or year-round",\n      "regulation": "string — size/bag limits if known"\n    }\n  ],\n  "waterAdvisory": "string or null — any EPA/state fish consumption advisories for this water body",\n  "actRightDollars": "REQUIRED. Value of self-caught fish vs. retail. End with: That goes directly into your AA2 Vault as AWARE DOLLARS."\n}`;
}

const CHEF_SYS = `${CHEF_VOICE}\n\nReturn ONLY valid JSON, no markdown: { "recipeName": string, "cuisine": string, "cookTimeMinutes": number, "servings": number, "prepNote": string, "ingredients": [{ "name": string, "amount": string, "status": "have"|"need"|"flagged", "allergyWarning": string|null, "safeAlternatives": string[] }] }. Mark an ingredient as flagged if it conflicts with the member's known allergens or sensitivities. Always include at least 2 safe alternatives for any flagged ingredient.`;

type ScanRecord = {
  id:string; timestamp:string; tab:string;
  query:string; verdict:string; productName:string;
};

// First dollar figure in the AWARE DOLLARS copy, e.g. "$12.50" → 12.5. Null if none.
function parseAwareAmount(text?: string | null): number | null {
  if (!text) return null;
  const m = String(text).match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
}

async function handleWhereToBuy(productName: string): Promise<void> {
  // AFFILIATE RAIL (Device Stack Unity Benefits doctrine): known catalog
  // devices route to the brand store through the affiliate resolver — one
  // file holds every tag. Everything else keeps the near-me maps search.
  const deviceLink = deviceBuyLink(productName);
  if (deviceLink) { try { await Linking.openURL(deviceLink); } catch {} return; }
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      const query = encodeURIComponent(productName);
      await Linking.openURL(`https://www.google.com/maps/search/${query}`);
      return;
    }
    const query = encodeURIComponent(productName + ' near me');
    await Linking.openURL(`https://www.google.com/maps/search/${query}`);
  } catch {
    const query = encodeURIComponent(productName);
    await Linking.openURL(`https://www.google.com/maps/search/${query}`);
  }
}

/**
 * ─── THE PRODUCT PICTURE ────────────────────────────────────────────────────
 * FOUNDER, 2026-08-22: "you need to find a way to show the product picture with
 * the results ... this requires a picture with its return."
 *
 * The response was ALREADY carrying the photo. lookupBarcode fetched the record,
 * built a text block out of the name, ingredients and additives, and dropped
 * everything else on the floor — the picture included. It was never a missing
 * capability. It was a discarded one.
 *
 * WHY A LIST OF KEYS AND NOT ONE. Open Food Facts publishes the front-of-pack
 * photo under more than one key depending on how the record was built and what
 * language it was photographed in. Guessing ONE and calling it done is how you
 * get a screen that works on Cheerios and shows nothing on a Panamanian brand.
 * So AA2 asks in order of preference, takes the first that answers, and LOGS
 * WHICH KEY ANSWERED. First real scan writes the receipt into the console —
 * NEVER STATE A DEVICE CAPABILITY WITHOUT THE RECEIPT applies to APIs too.
 */
const OFF_IMAGE_KEYS = [
  'image_front_url',        // the front of the pack — what he is holding
  'image_front_small_url',
  'image_url',              // whatever the record calls its main shot
  'image_small_url',
  'image_ingredients_url',  // last resort: the label he was reading anyway
] as const;

function offImage(p: any): { url: string | null; via: string | null } {
  for (const k of OFF_IMAGE_KEYS) {
    const v = p?.[k];
    if (typeof v === 'string' && v.startsWith('http')) return { url: v, via: k };
  }
  // selected_images.front.display.{lang} — the nested shape some records use.
  const disp = p?.selected_images?.front?.display;
  if (disp && typeof disp === 'object') {
    for (const lang of Object.keys(disp)) {
      const v = disp[lang];
      if (typeof v === 'string' && v.startsWith('http')) return { url: v, via: `selected_images.front.display.${lang}` };
    }
  }
  return { url: null, via: null };
}

export type BarcodeLookup = {
  prompt: string;
  image: string | null;
  imageVia: string | null;
  name: string | null;
  brand: string | null;
  quantity: string | null;
};

async function lookupBarcode(barcode:string):Promise<BarcodeLookup> {
  const miss = (why:string): BarcodeLookup =>
    ({ prompt: why, image: null, imageVia: null, name: null, brand: null, quantity: null });
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,{headers:{'User-Agent':'AA2-Scanner/1.0'}});
    const data = await res.json();
    if (data.status!==1||!data.product) {
      return miss(`Barcode: ${barcode}. Not found in database. Use your knowledge base to analyze this barcode and product. Return full verdict JSON.`);
    }
    const p = data.product;
    const img = offImage(p);
    // THE RECEIPT. Which key actually carried the photo, on a real record.
    console.log('[lookupBarcode] image key:', img.via ?? 'NONE', '| keys present:',
      Object.keys(p).filter(k => k.startsWith('image')).join(', ') || 'none');
    return {
      prompt: [
        `PRODUCT: ${p.product_name||'Unknown'}${p.brands?' by '+p.brands:''}`,
        `BARCODE: ${barcode}`,
        `INGREDIENTS: ${p.ingredients_text_en||p.ingredients_text||'Not listed'}`,
        `ADDITIVES: ${p.additives_tags?.map((a:string)=>a.replace('en:','')).join(', ')||'none'}`,
        `ALLERGENS: ${p.allergens_tags?.join(', ')||'none listed'}`,
        p.nova_group?`NOVA Group: ${p.nova_group}`:'',
        `\nReturn verdict JSON.`,
      ].filter(Boolean).join('\n'),
      image: img.url,
      imageVia: img.via,
      name: p.product_name || null,
      brand: p.brands || null,
      quantity: p.quantity || null,
    };
  } catch { return miss(`Barcode: ${barcode}. Lookup failed. Analyze and return verdict JSON.`); }
}

// ─── PALETTE DOTS ────────────────────────────────────────────────────────────
function PaletteDots({ current, onSelect, cardBg }: {
  current: PaletteKey; onSelect: (k:PaletteKey) => void; cardBg: string;
}) {
  const TH = useTheme();
  const F = fx(TH);
  const pd = useMemo(() => make_pd(TH), [TH]);

  return (
    <View style={[pd.bar, { backgroundColor: cardBg }]}>
      {(Object.keys(DOORS_DARK) as PaletteKey[]).map(k => (
        <TouchableOpacity
          key={k}
          onPress={() => onSelect(k)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={pd.dotWrap}>
          <View style={[pd.dot, {
            backgroundColor: doorsFor(TH)[k].accent,
            opacity: current===k ? 1 : 0.45,
            transform:[{ scale: current===k ? 1.3 : 1 }],
          }]}/>
        </TouchableOpacity>
      ))}
    </View>
  );
}
/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_pd = (T: Tokens) => {
  const F = fx(T);
  return StyleSheet.create({
  bar:     { flexDirection:'row', gap:6, justifyContent:'center', paddingVertical:8, paddingHorizontal:16 },
  dotWrap: { padding:6, alignItems:'center', justifyContent:'center' },
  dot:     { width:16, height:16, borderRadius:8 },
});
};


// ─── CONCIERGE MESSAGE ───────────────────────────────────────────────────────
function ConciergeMessage({ onDismiss }: { onDismiss: () => void }) {
  const TH = useTheme();
  return (
    <TouchableOpacity
      onPress={onDismiss}
      activeOpacity={0.8}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: lc(TH, 'rgba(27,184,255,0.08)'),
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: lc(TH, 'rgba(27,184,255,0.25)'),
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 16 }}>🧬</Text>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'DMMono-Regular',
          fontSize: 9,
          color: lc(TH, '#1BB8FF'),
          letterSpacing: 2,
          marginBottom: 4,
        }}>
          THE CONCIERGE
        </Text>
        <Text style={{
          fontFamily: 'CormorantGaramond-Italic',
          fontSize: 15,
          color: lc(TH, 'rgba(255,255,255,0.85)'),
          lineHeight: 22,
        }}>
          "Don't be shy — you can ask me anything about any food, plant, meat, species, wine, or spirits. No barcode? No problem. I listen just as well as I scan."
        </Text>
        <Text style={{
          fontFamily: 'DMMono-Regular',
          fontSize: 9,
          color: lc(TH, 'rgba(255,255,255,0.35)'),
          marginTop: 6,
          letterSpacing: 1,
        }}>
          TAP TO DISMISS
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const TH = useTheme();
  const F = fx(TH);
  const s = useMemo(() => make_s(TH), [TH]);

  const { width: screenW, height: screenH } = useWindowDimensions();
  const frameW      = Math.min(screenW * 0.68, 300);
  const frameH      = frameW * 0.58;
  const camPadTop   = Math.max(screenH * 0.08, 32);
  const camPadBot   = Math.max(screenH * 0.10, 44);
  const captureSize = Math.min(Math.max(screenW * 0.19, 68), 90);

  const [permission, requestPermission] = useCameraPermissions();
  // FOUNDER RULING 2026-08-19: the palette picker is out. Blue (ocean) is the
  // app's framing, fixed — it was the one he had selected. The per-tab accent
  // still changes on selection; that was never the thing that clashed.
  const [palette,            setPalette]           = useState<PaletteKey>('ocean');
  const [activeTab,          setActiveTab]         = useState('scan');
  const [speciesSub,         setSpeciesSub]        = useState('k9');
  const [fishMode,           setFishMode]          = useState<FishMode>('identify');
  const [cameraMode,         setCameraMode]        = useState(false);
  const [scanning,           setScanning]          = useState(false);
  const [manualInput,        setManualInput]       = useState('');
  const [loading,            setLoading]           = useState(false);
  const [result,             setResult]            = useState<any>(null);
  /**
   * THE PICTURE THAT COMES BACK WITH THE RESULT. Two sources, and the ORDER IS
   * THE DOCTRINE:
   *   'camera' — the frame HE just shot. The actual box, in his light, on his
   *              shelf. No database can beat it and it needs no network.
   *   'off'    — Open Food Facts' front-of-pack, for a barcode typed or scanned
   *              without a photo.
   * If neither exists the card says so. AA2 does not show a stock photo of a
   * different box — a picture that is not the thing in your hand is worse than
   * no picture. Same law as the vendor-verdict ban.
   */
  const [scanImage, setScanImage] = useState<{uri:string; source:'camera'|'off'} | null>(null);
  const cameraRef = useRef<any>(null);
  const [history,            setHistory]           = useState<ScanRecord[]>([]);
  const [historyVisible,     setHistoryVisible]    = useState(false);
  const [barcodeReady,       setBarcodeReady]      = useState(false);
  const [memberProfile,      setMemberProfile]     = useState<any>(null);
  const [winePanel,          setWinePanel]         = useState<'pairing'|'health'>('pairing');
  // Recipe modal state
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipeData,         setRecipeData]        = useState<any>(null);
  const [recipeLoading,      setRecipeLoading]     = useState(false);
  const [cookbookSaved,      setCookbookSaved]     = useState(false);
  const [selectedRecipeName, setSelectedRecipeName] = useState('');
  // Stored for second-call context
  const [storedPersonalTruth, setStoredPersonalTruth] = useState('');
  const [storedProductName,   setStoredProductName]   = useState('');
  // Info sheet (ingredient blurbs + why alternatives)
  const [infoSheetVisible, setInfoSheetVisible] = useState(false);
  const [infoSheetTitle,   setInfoSheetTitle]   = useState('');
  const [infoSheetText,    setInfoSheetText]     = useState('');
  const [infoSheetLoading, setInfoSheetLoading] = useState(false);
  const [showConciergeMsg, setShowConciergeMsg] = useState(true);
  // AWARE DOLLARS · vault ledger — per-session log state for the current result
  const [awareState, setAwareState] = useState<'idle'|'logged'|'failed'>('idle');

  const scannedRef     = useRef(false);
  const lastBarcodeRef = useRef<string|null>(null);

  const P           = doorsFor(TH)[palette];
  const TABS = tabsFor(TH);
  const SPECIES_SUBS = speciesSubsFor(TH);
  const currentTab  = TABS.find(t => t.id===activeTab)!;
  const accentColor = activeTab==='species'
    ? (SPECIES_SUBS.find(s => s.id===speciesSub)?.color ?? F.blue)
    : currentTab.color;
  const heroKey   = activeTab==='species' ? speciesSub : activeTab;
  const heroImage = TAB_HEROES[heroKey] ?? null;

  useEffect(() => { loadMemberProfile().then(setMemberProfile); }, []);

  // Reset the AWARE DOLLARS log affordance whenever the scan result changes.
  useEffect(() => { setAwareState('idle'); }, [result]);

  const followAwareDollars = async () => {
    const amt = parseAwareAmount(result?.actRightDollars);
    if (amt == null) return;
    const ok = await logAwareDollarsFollowed({
      productName:     result.productName ?? result.speciesName ?? result.waterBody,
      recommendation:  result.actRightDollars,
      alternativeName: Array.isArray(result.alternatives) ? result.alternatives[0] : undefined,
      amountSaved:     amt,
      scanResult:      result,
    });
    setAwareState(ok ? 'logged' : 'failed');
  };

  const handleBarcodeScanned = ({ data }:{ data:string }) => {
    if (loading) return;
    lastBarcodeRef.current = data;
    setBarcodeReady(true);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { Alert.alert('Camera Permission','AA2 needs camera access.'); return; }
    }
    scannedRef.current = false;
    lastBarcodeRef.current = null;
    setBarcodeReady(false);
    setCameraMode(true);
    setScanning(true);
  };

  const handleCapture = async () => {
    if (loading) return;
    const barcode = lastBarcodeRef.current;

    if (activeTab==='scan') {
      if (barcode) { scannedRef.current=true; setScanning(false); setCameraMode(false); await runAnalysis(barcode, true); }
      else Alert.alert('Frame It First','Wait for the gold border — then tap.');
      return;
    }

    if (activeTab==='care') {
      if (barcode) {
        scannedRef.current=true; setScanning(false); setCameraMode(false);
        await runAnalysis(barcode, true);
      } else {
        setCameraMode(false); setScanning(false);
        await runAnalysis(
          'Personal care product photographed — no barcode detected. Apply SKIN INGESTION DOCTRINE. Identify the most likely product category in frame. Flag specific known harmful chemicals for this product type by their exact INCI names. Return verdict JSON.',
          true,
        );
      }
      return;
    }

    if (activeTab==='grownfolks') {
      if (barcode) {
        scannedRef.current=true; setScanning(false); setCameraMode(false);
        await runAnalysis(barcode, true);
      } else {
        setCameraMode(false); setScanning(false);
        await runAnalysis(
          'Alcoholic beverage photographed — no barcode detected. Identify the most likely beverage in frame. Provide complete pairing and health intel. Return verdict JSON.',
          true,
        );
      }
      return;
    }

    if (activeTab==='fish') {
      if (fishMode==='scan' && barcode) {
        scannedRef.current=true; setScanning(false); setCameraMode(false);
        await runAnalysis(barcode, true);
      } else {
        setCameraMode(false); setScanning(false);
        await runAnalysis(
          fishMode==='identify'
            ? 'Fish or aquatic species photographed — identify the species, assess edibility and safety. Return verdict JSON.'
            : 'Packaged fish product photographed — no barcode detected. Identify the product, assess quality and labeling. Return verdict JSON.',
          true,
        );
      }
      return;
    }

    setCameraMode(false); setScanning(false);
    setLoading(true); setResult(null); setScanImage(null);
    try {
      // Speed doctrine: never upload a full-resolution frame. A modern phone
      // shoots 12–48MP; unresized that is a multi-megabyte upload before the
      // intelligence even starts reading. 1024px longest-edge is label-legible
      // and cuts upload + vision read time to a fraction.
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: true });
      if (!photo?.uri) {
        setResult({ verdict: 'TAKE NOTICE', verdictReason: 'Camera capture failed — try again or speak the product name.' });
        setLoading(false);
        return;
      }
      let shrunkBase64: string | undefined;
      try {
        const shrunk = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.6, format: SaveFormat.JPEG, base64: true },
        );
        shrunkBase64 = shrunk.base64 ?? undefined;
      } catch (e) {
        console.log('[handleCapture] resize failed, falling back to raw capture:', e);
      }
      if (!shrunkBase64) {
        const raw = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.5, skipProcessing: true });
        shrunkBase64 = raw?.base64 ?? undefined;
      }
      if (!shrunkBase64) {
        setResult({ verdict: 'TAKE NOTICE', verdictReason: 'Camera capture failed — try again or speak the product name.' });
        setLoading(false);
        return;
      }
      // HIS SHOT WINS. The frame is already resized, already in hand, and it is
      // the real object rather than a database's idea of it. It was being sent
      // to the vision model and then discarded; now it is the hero of the card.
      setScanImage({ uri: `data:image/jpeg;base64,${shrunkBase64}`, source: 'camera' });

      const profile = memberProfile;
      const personalTruth = buildPersonalTruth(profile);
      const tabContext: TabContext = (activeTab==='scan'||activeTab==='care'||activeTab==='grownfolks'||activeTab==='fish'||activeTab==='species'||activeTab==='apothecary'||activeTab==='forager') ? activeTab as TabContext : 'scan';
      const visionResult = await scanWithVision({
        imageBase64: shrunkBase64,
        tabContext,
        personalTruth,
        systemPrompt: SEVERITY_PREFIX + (personalTruth || ''),
        onPartial: (sofar) => {
          const early = extractVerdict(sofar);
          if (early.verdict) setResult((prev:any) => (prev && prev.__full) ? prev : { ...early, __streaming: true });
        },
      });
      if (!visionResult.ok || isVisionEmpty(visionResult.rawText)) {
        setResult({ verdict: 'TAKE NOTICE', verdictReason: 'Image unclear — try again or speak the product name.' });
        setLoading(false);
        return;
      }
      let parsed: any = null;
      try {
        const jsonMatch = visionResult.rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (e) { console.error('[vision] JSON parse failed:', e); }
      if (!parsed) {
        setResult({ verdict: 'TAKE NOTICE', verdictReason: 'Could not parse scan result — try again.' });
      } else {
        parsed.__full = true;
        setResult(parsed);
      }
    } catch (err: any) {
      console.error('[handleCapture vision] error:', err);
      setResult({ verdict: 'TAKE NOTICE', verdictReason: 'Scan failed — ' + (err?.message || 'try again') });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCamera = () => {
    lastBarcodeRef.current = null;
    setBarcodeReady(false);
    scannedRef.current = false;
    setCameraMode(false);
    setScanning(false);
  };

  const runAnalysis = async (query:string, cameraCapture = false) => {
    setLoading(true); setResult(null); setScanImage(null); setWinePanel('pairing');
    const effectiveSub = activeTab==='species' ? speciesSub : undefined;
    try {
      const profile       = memberProfile;
      const personalTruth = buildPersonalTruth(profile);
      setStoredPersonalTruth(personalTruth);

      const isFishBarcode = activeTab==='fish' && fishMode==='scan' && /^\d{6,14}$/.test(query.trim());
      const isBarcode     = (activeTab==='scan'||activeTab==='care'||activeTab==='grownfolks'||isFishBarcode) && /^\d{6,14}$/.test(query.trim());

      let content = query;
      if (isBarcode) {
        const bd = await Promise.race<BarcodeLookup|null>([
          lookupBarcode(query.trim()),
          new Promise<null>(r => setTimeout(()=>r(null),3000)),
        ]);
        if (bd) {
          content = bd.prompt;
          // The photo rides back with the verdict. It used to be fetched and
          // thrown away on the same line.
          if (bd.image) setScanImage({ uri: bd.image, source: 'off' });
        }
      } else if (!cameraCapture) {
        if (activeTab==='scan') {
          content = `Product name: ${query}. Analyze and return verdict JSON.`;
        } else if (activeTab==='care') {
          content = `Personal care product: ${query}. Analyze ALL ingredients by their exact INCI names. Apply SKIN INGESTION DOCTRINE. Flag every harmful chemical specifically. Return verdict JSON.`;
        } else if (activeTab==='grownfolks') {
          content = `Alcoholic beverage: ${query}. Provide complete pairing and health intel. Return verdict JSON.`;
        } else if (activeTab==='fish') {
          if (fishMode==='identify') content = `Identify this fish or aquatic species: ${query}. Return verdict JSON.`;
          else if (fishMode==='scan') content = `Packaged fish product: ${query}. Analyze and return verdict JSON.`;
          else content = `Water body: ${query}. List catchable species and safety. Return verdict JSON.`;
        } else if (activeTab==='species') {
          const sub = SPECIES_SUBS.find(s=>s.id===speciesSub)?.label ?? speciesSub;
          content = `${sub} — item: ${query}. Analyze and return verdict JSON.`;
        }
      } else if (activeTab==='species') {
        const sub = SPECIES_SUBS.find(s=>s.id===speciesSub)?.label ?? speciesSub;
        content = `${sub} — camera scan: ${query}. Analyze and return verdict JSON.`;
      }

      const systemPrompt = activeTab==='fish'
        ? buildFishSystemPrompt(fishMode, personalTruth)
        : buildSystemPrompt(activeTab, personalTruth, effectiveSub);

      const responseText = await streamClaude({
        system: systemPrompt,
        content,
        max_tokens: 2400,
        onPartial: (sofar) => {
          const early = extractVerdict(sofar);
          if (early.verdict) setResult((prev:any) => (prev && prev.__full) ? prev : { ...early, __streaming: true });
        },
      });
      const parsed = JSON.parse(responseText.replace(/```json|```/g,'').trim());
      parsed.__full = true;
      setResult(parsed);
      const pName = parsed.productName||parsed.speciesName||parsed.waterBody||query;
      setStoredProductName(pName);
      await saveScan({
        query, productName: pName,
        scanTab: activeTab==='species' ? `SPECIES_${speciesSub.toUpperCase()}` : activeTab==='fish' ? `FISH_${fishMode.toUpperCase()}` : activeTab,
        verdict: parsed.verdict, fullAnalysis: parsed,
        memberId: profile?.memberId ?? null,
      });
      setHistory(prev => [{
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        tab: activeTab==='species' ? `SPECIES · ${speciesSub.toUpperCase()}` : activeTab==='fish' ? `FISH · ${fishMode.toUpperCase()}` : currentTab.label,
        query, verdict: parsed.verdict,
        productName: pName,
      }, ...prev].slice(0,50));
    } catch (err:any) {
      Alert.alert('Analysis Error', String(err?.message || err || 'Unknown error'));
    } finally { setLoading(false); scannedRef.current=false; }
  };

  const openRecipe = async (chip: RecipeChip) => {
    setSelectedRecipeName(chip.recipeName);
    setRecipeData(null);
    setCookbookSaved(false);
    setRecipeModalVisible(true);
    setRecipeLoading(true);
    try {
      const resText = await aa2Claude({ system: CHEF_SYS, content: `Recipe: ${chip.recipeName}. Scanned product: ${storedProductName}.${storedPersonalTruth}`, max_tokens: 1800, model: VOICE_MODEL });
      const parsed = JSON.parse(resText.replace(/```json|```/g,'').trim());
      setRecipeData(parsed);
    } catch {
      // leave recipeData null, modal shows empty state
    } finally {
      setRecipeLoading(false);
    }
  };

  const saveRecipeToCookbook = async () => {
    if (!recipeData) return;
    const memberId = memberProfile?.memberId ?? null;
    const flagged = (recipeData.ingredients ?? []).filter((i:any) => i.status === 'flagged');
    try {
      await supabase.from('cookbook_recipes').insert({
        member_id:        memberId,
        recipe_name:      recipeData.recipeName,
        ingredients:      recipeData.ingredients,
        membrane_flags:   flagged,
        scanned_items:    [storedProductName],
        prep_note:        recipeData.prepNote,
        cuisine:          recipeData.cuisine,
        cook_time_minutes:recipeData.cookTimeMinutes,
        servings:         recipeData.servings,
      });
    } catch { /* proceed to show saved regardless */ }
    setCookbookSaved(true);
    setTimeout(() => {
      setCookbookSaved(false);
      setRecipeModalVisible(false);
    }, 1500);
  };

  const openIngredientBlurb = async (name: string, isFlagged: boolean) => {
    setInfoSheetTitle(name);
    setInfoSheetText('');
    setInfoSheetLoading(true);
    setInfoSheetVisible(true);
    try {
      const sys = isFlagged
        ? `${COSMO_CHEMIST_VOICE}\nReturn exactly two sentences: what this chemical does in the product formulation, and what it does to the body with repeated skin exposure. No markdown.`
        : `${COSMO_CHEMIST_VOICE}\nReturn exactly two sentences: what this ingredient does in the product formulation, and what specific benefit it provides to the skin or body. No markdown.`;
      const resText = await aa2Claude({ system: sys, content: name, max_tokens: 120, model: VOICE_MODEL });
      setInfoSheetText(resText);
    } catch {
      setInfoSheetText('Could not load. Try again.');
    } finally {
      setInfoSheetLoading(false);
    }
  };

  const openWhyAlternative = async (altName: string) => {
    setInfoSheetTitle(altName);
    setInfoSheetText('');
    setInfoSheetLoading(true);
    setInfoSheetVisible(true);
    try {
      const resText = await aa2Claude({ system: 'You are The Equalizer inside AA2. In one sentence, explain specifically why this alternative was recommended over the scanned product for this member — reference better value, cleaner production, or similar character. Be specific to the actual products.', content: `Scanned product: ${storedProductName}. Recommended alternative: ${altName}.`, max_tokens: 100 });
      setInfoSheetText(resText);
    } catch {
      setInfoSheetText('Could not load. Try again.');
    } finally {
      setInfoSheetLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) { Alert.alert('Enter Something','Type a product name or barcode.'); return; }
    const input = manualInput.trim(); setManualInput(''); await runAnalysis(input, false);
  };

  const intelLabel = () => {
    if (activeTab==='species') {
      if (speciesSub==='k9')    return '🐕 CANINE NUTRITIONIST';
      if (speciesSub==='horse') return '🐴 EQUINE NUTRITIONIST';
      return '🌾 AGRICULTURAL ANALYST';
    }
    return '👨‍🍳 THE CHEF';
  };

  const doctrineCopy = () => {
    if (activeTab==='meat')       return { t:'⚠ CO₂/MAP TRUTH DOCTRINE',         b:'CO₂ keeps meat red long after it degrades. Your eyes are being deceived. The Equalizer sees through it.' };
    if (activeTab==='care')       return { t:'⚠ SKIN INGESTION DOCTRINE',          b:'The skin is not a barrier — it is an organ. What touches your skin enters your bloodstream. The Cosmo Chemist names every chemical.' };
    if (activeTab==='grownfolks') return { t:'🍷 WINE & SPIRITS INTELLIGENCE',     b:'The Sommelier knows the $12 bottle that beats the $90 one. Real pairings. Real health intel. Every alcoholic beverage covered.' };
    if (activeTab==='fish')       return { t:'🐟 THE EQUALIZER · FORAGER LAYER',   b:'Species ID. Label truth. Water body intel. Mercury, regulations, preparation. The Equalizer and The Chef — both on this.' };
    if (activeTab==='species'&&speciesSub==='k9')    return { t:'🐕 CANINE NUTRITIONIST',   b:'ASPCA Animal Poison Control + canine toxicology. Your animal cannot speak. The Equalizer does.' };
    if (activeTab==='species'&&speciesSub==='horse') return { t:'🐴 EQUINE NUTRITIONIST',   b:'FEI prohibited substances primary. Every ingredient checked for competition readiness.' };
    if (activeTab==='species'&&speciesSub==='agri')  return { t:'🌾 AGRICULTURAL ANALYST',  b:'USDA feed safety + mycotoxin monitoring. Protecting the herd from slow, invisible harm.' };
    if (activeTab==='produce')    return { t:'🌿 FRESH PRODUCE INTELLIGENCE',      b:'No barcode needed. Pesticide residue, EWG Dirty Dozen / Clean 15, preparation guidance.' };
    return { t:'⚡ SAFETY CLARIFIER · ADAPTIVE NERVE', b:'Every ingredient cross-referenced before you buy. The donut knows about the bikini.' };
  };
  const { t:docT, b:docB } = doctrineCopy();

  const cameraSupportsBarcode =
    activeTab==='scan' || activeTab==='care' || activeTab==='grownfolks' ||
    (activeTab==='fish' && fishMode==='scan');

  const cameraHintText = () => {
    if (barcodeReady) return '● LOCKED — TAP TO SCAN';
    if (activeTab==='scan') return 'POINT AT BARCODE';
    if (activeTab==='care') return 'FRAME PRODUCT OR SCAN BARCODE';
    if (activeTab==='grownfolks') return 'FRAME LABEL OR SCAN BARCODE';
    if (activeTab==='fish') {
      if (fishMode==='identify') return 'FRAME THE FISH';
      if (fishMode==='scan') return 'FRAME LABEL OR SCAN BARCODE';
    }
    return 'FRAME THE ITEM';
  };

  const fishTagColor = (tag:string) =>
    tag==='SAFE TO EAT' ? F.allClear : tag==='CAUTION' ? F.takeNotice : F.payAttention;

  const parseChefChips = (chefNote: any): RecipeChip[] => {
    if (Array.isArray(chefNote)) return chefNote.slice(0, 3);
    return [];
  };

  const heroLabel = () => {
    if (activeTab==='fish') return 'FISH & PESCATARIAN';
    if (activeTab==='species' && speciesSub==='feline') return 'K9 / FELINE';
    if (activeTab==='species' && speciesSub==='k9') return 'K9 / FELINE INTELLIGENCE';
    if (activeTab==='species' && speciesSub==='agricultural') return 'AGRICULTURAL';
    if (activeTab==='species' && speciesSub==='agri') return 'AGRICULTURAL';
    return currentTab.label;
  };

  const heroSubLabel = () => {
    if (activeTab==='fish') return 'THE EQUALIZER · FORAGER LAYER';
    if (activeTab==='species' && speciesSub==='feline') return 'FELINE NUTRITIONIST · ASPCA FELINE THRESHOLDS ACTIVE';
    if (activeTab==='species' && speciesSub==='agricultural') return 'AGRICULTURAL ANALYST · USDA FEED SAFETY ACTIVE';
    if (activeTab==='species' && speciesSub==='agri') return 'AGRICULTURAL ANALYST · USDA FEED SAFETY ACTIVE';
    return '9 DATABASES STANDING BY';
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor:P.bg }]}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor:P.bg, borderBottomColor:P.border }]}>
        <Text style={s.receipt}>I AM THE RECEIPT</Text>
        <Text style={s.dna}>🧬</Text>
        <TouchableOpacity onPress={()=>setHistoryVisible(true)} style={s.historyBtn}>
          <Text style={[s.historyBtnText,{color:P.accent}]}>
            {history.length>0?`⏱ ${history.length}`:'⏱'}
          </Text>
        </TouchableOpacity>
      </View>
      {/* PALETTE DOTS — removed by founder ruling 2026-08-19. The row of
          colour circles clashed with the automatic per-tab accent. Blue is
          the frame now; the tabs still carry their own colours. */}

      {showConciergeMsg && (
        <ConciergeMessage onDismiss={() => setShowConciergeMsg(false)} />
      )}

      {/* TABS — 4+3 layout */}
      <View style={[s.tabGrid,{borderBottomColor:P.border}]}>
        {[TABS.slice(0,4),TABS.slice(4,8)].map((row,ri)=>(
          <View key={ri} style={s.tabRow}>
            {row.map(tab=>(
              <TouchableOpacity key={tab.id}
                style={[s.tabBtn,
                  activeTab===tab.id&&{borderBottomColor:tab.color,borderBottomWidth:2.5,backgroundColor:tab.color+'14'}]}
                onPress={()=>{ if(tab.id==='apothecary'){ router.push('/apothecary' as any); return; } setActiveTab(tab.id); setResult(null); setScanImage(null); }}>
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[s.tabLabel,{color:activeTab===tab.id?tab.color:F.dimWhite}]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* SPECIES SUBS */}
      {activeTab==='species'&&(
        <View style={[s.speciesRow,{backgroundColor:P.bg}]}>
          {SPECIES_SUBS.map(sub=>(
            <TouchableOpacity key={sub.id}
              style={[s.subTab,{borderColor:speciesSub===sub.id?sub.color:P.border,backgroundColor:speciesSub===sub.id?sub.color+'1A':P.card}]}
              onPress={()=>{setSpeciesSub(sub.id);setResult(null);setScanImage(null);}}>
              <Text style={s.subTabIcon}>{sub.icon}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[s.subTabLabel,{color:speciesSub===sub.id?sub.color:F.dimWhite,flexShrink:1}]}>{sub.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* FISH MODE SUBS */}
      {activeTab==='fish'&&(
        <View style={[s.speciesRow,{backgroundColor:P.bg}]}>
          {FISH_MODES.map(fm=>(
            <TouchableOpacity key={fm.id}
              style={[s.subTab,{borderColor:fishMode===fm.id?F.fishBlue:P.border,backgroundColor:fishMode===fm.id?F.fishBlue+'1A':P.card}]}
              onPress={()=>{setFishMode(fm.id);setResult(null);setScanImage(null);}}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[s.subTabLabel,{color:fishMode===fm.id?F.fishBlue:F.dimWhite,fontSize:8,flexShrink:1}]}>{fm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── CAMERA ── */}
      {cameraMode?(
        <View style={s.cameraContainer}>
          <CameraView ref={cameraRef} style={s.camera} facing="back"
            onBarcodeScanned={cameraSupportsBarcode ? handleBarcodeScanned : undefined}>
            <View style={[s.cameraOverlay,{paddingTop:camPadTop,paddingBottom:camPadBot}]}>
              <View style={s.cameraFrameGroup}>
                <View style={[s.scanFrame,{
                  width:frameW, height:frameH,
                  borderColor:barcodeReady?F.gold:accentColor,
                  borderWidth:barcodeReady?3:1.5,
                }]}/>
                <Text style={[s.frameDoctrine,{color:F.gold}]}>FRAME IT · CONFIRM IT · SCAN IT</Text>
                <Text style={[s.cameraHint,{color:barcodeReady?F.gold:accentColor}]}>
                  {cameraHintText()}
                </Text>
              </View>
              <View style={s.cameraControls}>
                <TouchableOpacity
                  style={[s.captureOuter,{
                    width:captureSize, height:captureSize, borderRadius:captureSize/2,
                    borderColor:barcodeReady?F.gold:accentColor,
                  }]}
                  onPress={handleCapture} activeOpacity={0.85}>
                  <View style={[s.captureInner,{
                    width:captureSize*0.74, height:captureSize*0.74, borderRadius:captureSize*0.37,
                    backgroundColor:barcodeReady?F.gold:accentColor,
                  }]}/>
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 5, bottom: 5, left: 8, right: 8 }}
                  style={[s.cancelBtn,{borderColor:P.border}]} onPress={handleCancelCamera}>
                  <Text style={s.cancelText}>✕ CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      ):(
        <ScrollView style={s.body} contentContainerStyle={{paddingBottom:80}}>

          {/* IMAGE HERO */}
          {heroImage&&(
            <View>
              <HeroImage source={heroImage} style={s.heroImage} contentFit="cover" contentPosition={TAB_HERO_POS[heroKey] ?? 'center'}/>
              <View style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: P.card }}>
                <Text style={[s.heroTabLabel,{color:accentColor}]}>{heroLabel()}</Text>
                <Text style={[s.heroSubLabel,{color:F.dimWhite}]}>{heroSubLabel()}</Text>
              </View>
            </View>
          )}

          {/* DOCTRINE BANNER */}
          <View style={[s.doctrineBanner,{backgroundColor:P.card,borderLeftColor:accentColor,borderColor:P.border}]}>
            <Text style={[s.doctrineTitle,{color:accentColor}]}>{docT}</Text>
            <Text style={[s.doctrineBody,{color:F.dimWhite}]}>{docB}</Text>
          </View>

          {/* INPUT CARD */}
          <View style={[s.inputCard,{backgroundColor:P.card,borderColor:P.border}]}>
            {!(activeTab==='fish'&&fishMode==='waterbody')&&(
              <>
                <TouchableOpacity
                  style={[s.cameraBtn,{backgroundColor:accentColor+'1A',borderColor:accentColor}]}
                  onPress={openCamera}>
                  <Text style={[s.cameraBtnIcon,{color:accentColor}]}>{cameraSupportsBarcode?'⚡':'📷'}</Text>
                  <Text style={[s.cameraBtnLabel,{color:accentColor}]}>{cameraSupportsBarcode?'SCAN BARCODE':'OPEN CAMERA'}</Text>
                </TouchableOpacity>
                <Text style={[s.orDivider,{color:F.mutedWhite}]}>— or type it —</Text>
              </>
            )}
            <TextInput
              style={[s.input,{borderColor:P.border,color:F.white,backgroundColor:P.bg}]}
              placeholder={
                activeTab==='scan'?'Product name or barcode...':
                activeTab==='produce'?'e.g. Strawberries, spinach...':
                activeTab==='meat'?'e.g. Ground beef, chicken breast...':
                activeTab==='care'?'e.g. Dove soap, Neutrogena SPF 50...':
                activeTab==='grownfolks'?'e.g. Opus One 2019, Casamigos Añejo, Guinness...':
                activeTab==='fish'&&fishMode==='identify'?'e.g. Largemouth bass, Atlantic salmon...':
                activeTab==='fish'&&fishMode==='scan'?'Product name or barcode...':
                activeTab==='fish'&&fishMode==='waterbody'?'e.g. Lake Michigan, Mississippi River, Tampa Bay...':
                speciesSub==='k9'?'e.g. Blue Buffalo, peanut butter...':
                speciesSub==='horse'?'e.g. SmartPak supplement...':
                'e.g. Purina cattle feed, corn silage...'}
              placeholderTextColor={F.mutedWhite}
              value={manualInput} onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit} returnKeyType="go"/>
            <TouchableOpacity style={[s.analyzeBtn,{backgroundColor:accentColor}]} onPress={handleManualSubmit}>
              <Text style={s.analyzeBtnText}>RUN ANALYSIS</Text>
            </TouchableOpacity>
          </View>

          {/* LOADING */}
          {loading&&(
            <View style={[s.loadingCard,{backgroundColor:P.card,borderColor:P.border}]}>
              <ActivityIndicator size="large" color={accentColor}/>
              <Text style={[s.loadingLabel,{color:accentColor}]}>THE EQUALIZER IS RUNNING</Text>
              <Text style={[s.loadingDb,{color:F.dimWhite}]}>9 DATABASES · ALL INTELLIGENCES ACTIVE</Text>
              <Text style={[s.loadingDb,{color:F.dimWhite,marginTop:6}]}>AI IS FAST · AA2 IS ACCURATE · JUST ONE MOMENT PLEASE</Text>
            </View>
          )}

          {/* ── RESULT ── */}
          {result&&!loading&&(
            <View style={s.resultBlock}>

              {/* ── THE PRODUCT PICTURE ──────────────────────────────────────
                  Founder order 2026-08-22: "this requires a picture with its
                  return." The photo leads the card because it is the fastest
                  confirmation that AA2 read the RIGHT box — before a single
                  word of verdict is trusted, the eye checks the picture. */}
              {scanImage ? (
                <View style={s.shotWrap}>
                  <HeroImage
                    source={{ uri: scanImage.uri }}
                    style={s.shotImg}
                    contentFit="cover"
                    contentPosition="center"
                    transition={140}
                  />
                  <View style={[s.shotFade,{backgroundColor:P.bg}]} pointerEvents="none" />
                  <View style={s.shotFoot}>
                    {result.productName ? (
                      <Text style={[s.shotName,{color:F.white}]} numberOfLines={2}>{result.productName}</Text>
                    ) : null}
                    <Text style={[s.shotSrc,{color:F.mutedWhite}]}>
                      {scanImage.source === 'camera' ? 'YOUR SHOT' : 'OPEN FOOD FACTS'}
                    </Text>
                  </View>
                </View>
              ) : (
                /* NO PICTURE, SAID OUT LOUD. Never a stock photo of a different
                   box — a picture that is not the thing in your hand is worse
                   than no picture. */
                <View style={[s.shotEmpty,{borderColor:P.border,backgroundColor:P.card}]}>
                  <Text style={[s.shotEmptyGlyph,{color:F.mutedWhite}]}>◻</Text>
                  <Text style={[s.shotEmptyTxt,{color:F.dimWhite}]}>
                    No photo on record for this one. Point the camera at it and the
                    next scan carries its own.
                  </Text>
                </View>
              )}

              {/* ALLERGY ALERT */}
              {result.allergyAlert?.triggered&&(
                <View style={s.allergyAlertCard}>
                  <View style={s.allergyAlertTop}>
                    <Text style={s.allergyAlertIcon}>⚠</Text>
                    <View style={{flex:1}}>
                      <Text style={s.allergyAlertAllergen}>{result.allergyAlert.allergen}</Text>
                      <Text style={s.allergyAlertBody}>
                        {result.allergyAlert.ingredient} detected — conflicts with your known sensitivities.
                      </Text>
                    </View>
                  </View>
                  {result.allergyAlert.safeAlternatives?.length>0&&(
                    <View style={s.allergyChipRow}>
                      {result.allergyAlert.safeAlternatives.map((alt:string,i:number)=>(
                        <View key={i} style={s.allergyChip}>
                          <Text style={s.allergyChipText}>✓ {alt}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* VERDICT BANNER */}
              <View style={[s.verdictBanner,{backgroundColor:verdictColor(TH, result.verdict)+'1A',borderColor:verdictColor(TH, result.verdict)}]}>
                <View style={[s.verdictIconWrap,{backgroundColor:verdictColor(TH, result.verdict)+'22'}]}>
                  <Text style={[s.verdictIconText,{color:verdictColor(TH, result.verdict)}]}>{verdictGlyph(result.verdict)}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={[s.verdictText,{color:verdictColor(TH, result.verdict)}]}>{result.verdict}</Text>
                  <Text style={[s.verdictReason,{color:F.dimWhite}]}>{result.verdictReason}</Text>
                </View>
              </View>

              {/* Fish safety tag badge */}
              {activeTab==='fish'&&result.safetyTag&&(
                <View style={[s.typeBadge,{borderColor:fishTagColor(result.safetyTag),backgroundColor:fishTagColor(result.safetyTag)+'18',marginBottom:6}]}>
                  <Text style={[s.typeBadgeText,{color:fishTagColor(result.safetyTag)}]}>🐟 {result.safetyTag}</Text>
                </View>
              )}

              {/* Fish species / water body name */}
              {activeTab==='fish'&&fishMode!=='waterbody'&&result.speciesName&&(
                <View style={{marginBottom:6,paddingHorizontal:2}}>
                  <Text style={[s.productName,{fontFamily:'CormorantGaramond-Italic',fontSize:28,color:F.white,marginBottom:2}]}>{result.speciesName}</Text>
                  {result.scientificName&&<Text style={{fontFamily:'DMMono-Regular',fontSize:11,color:F.dimWhite,letterSpacing:0.5}}>{result.scientificName}</Text>}
                </View>
              )}
              {activeTab==='fish'&&fishMode==='waterbody'&&result.waterBody&&(
                <Text style={[s.productName,{color:F.white}]}>{result.waterBody}</Text>
              )}
              {activeTab!=='fish'&&result.productName&&(
                <Text style={[s.productName,{color:F.white}]}>{result.productName}</Text>
              )}

              {/* Beverage type badge */}
              {activeTab==='grownfolks'&&result.beverageType&&(
                <View style={[s.typeBadge,{borderColor:accentColor,backgroundColor:accentColor+'18'}]}>
                  <Text style={[s.typeBadgeText,{color:accentColor}]}>🍷 {result.beverageType}</Text>
                </View>
              )}

              {result.recallAlert&&(
                <View style={[s.recallBanner,{borderColor:F.red}]}>
                  <Text style={[s.recallText,{color:F.red}]}>🚨 RECALL: {result.recallAlert}</Text>
                </View>
              )}

              {/* EQUALIZER / COSMO CHEMIST / SOMMELIER VOICE */}
              {result.equalizerVoice&&(
                <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:accentColor,borderColor:P.border}]}>
                  <Text style={[s.intelHeader,{color:accentColor}]}>
                    {activeTab==='care'?'⚗ THE COSMO CHEMIST':
                     activeTab==='grownfolks'?'🍷 THE SOMMELIER':
                     activeTab==='fish'?'🐟 THE EQUALIZER · FORAGER LAYER':
                     '⚡ THE EQUALIZER'}
                  </Text>
                  <Text style={[s.intelBody,{color:F.white}]}>{result.equalizerVoice}</Text>
                </View>
              )}

              {/* ══ FISH RESULTS ══ */}
              {activeTab==='fish'&&fishMode!=='waterbody'&&(
                <>
                  {result.habitat&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.fishBlue,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.fishBlue}]}>HABITAT</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.habitat}</Text>
                    </View>
                  )}
                  {result.edibility&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.teal,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.teal}]}>EDIBILITY</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.edibility}</Text>
                    </View>
                  )}
                  {result.nutrition&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.gold,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.gold}]}>NUTRITION</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.nutrition}</Text>
                    </View>
                  )}
                  {result.regulations&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.purple,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.purple}]}>REGULATIONS</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.regulations}</Text>
                    </View>
                  )}
                  {result.prepNote&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.orange,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.orange}]}>👨‍🍳 THE CHEF · PREP NOTE</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.prepNote}</Text>
                    </View>
                  )}
                  {/* FISH RECIPE CHIPS */}
                  {parseChefChips(result.chefNote).length>0&&(
                    <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                      <Text style={[s.findingsHeader,{color:F.orange}]}>👨‍🍳 THE CHEF · TAP A RECIPE</Text>
                      {parseChefChips(result.chefNote).map((chip,i)=>(
                        <TouchableOpacity
                          key={i}
                          style={[s.recipeChip,{borderColor:P.border,backgroundColor:P.bg}]}
                          onPress={()=>openRecipe(chip)}
                          activeOpacity={0.75}>
                          <Text style={s.recipeChipName}>{chip.recipeName}</Text>
                          <Text style={s.recipeChipMeta}>{chip.cookTime} · {chip.ingredientCount} ingredients</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* ══ FISH WATER BODY RESULTS ══ */}
              {activeTab==='fish'&&fishMode==='waterbody'&&(
                <>
                  {result.waterAdvisory&&(
                    <View style={[s.recallBanner,{borderColor:F.takeNotice}]}>
                      <Text style={[s.recallText,{color:F.takeNotice}]}>⚠ ADVISORY: {result.waterAdvisory}</Text>
                    </View>
                  )}
                  {result.species?.length>0&&(
                    <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                      <Text style={[s.findingsHeader,{color:F.fishBlue}]}>CATCHABLE SPECIES</Text>
                      {result.species.map((sp:any,i:number)=>(
                        <View key={i} style={[s.fishSpeciesRow,i<result.species.length-1&&{borderBottomWidth:1,borderBottomColor:P.border}]}>
                          <View style={s.fishSpeciesTop}>
                            <Text style={[s.fishSpeciesName,{fontFamily:'CormorantGaramond-Italic',color:F.white}]}>{sp.speciesName}</Text>
                            {sp.safetyTag&&(
                              <View style={[s.riskBadge,{backgroundColor:fishTagColor(sp.safetyTag)+'1A',borderColor:fishTagColor(sp.safetyTag)+'55'}]}>
                                <Text style={[s.riskBadgeText,{color:fishTagColor(sp.safetyTag)}]}>{sp.safetyTag}</Text>
                              </View>
                            )}
                          </View>
                          {sp.scientificName&&<Text style={{fontFamily:'DMMono-Regular',fontSize:10,color:F.dimWhite,marginBottom:3}}>{sp.scientificName}</Text>}
                          {sp.season&&<Text style={[s.findingText,{color:F.dimWhite,fontSize:11}]}>Season: {sp.season}</Text>}
                          {sp.regulation&&<Text style={[s.findingText,{color:F.dimWhite,fontSize:11}]}>Regulations: {sp.regulation}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* ══ PERSONAL CARE RESULTS ══ */}
              {activeTab==='care'&&(
                <>
                  {result.flaggedIngredients?.length>0&&(
                    <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:F.red+'55'}]}>
                      <Text style={[s.findingsHeader,{color:F.red}]}>⚠ FLAGGED INGREDIENTS</Text>
                      <Text style={[s.ingredientTapHint,{color:F.mutedWhite}]}>TAP ANY INGREDIENT FOR DETAILS</Text>
                      {result.flaggedIngredients.map((fi:any,i:number)=>(
                        <View key={i} style={[s.flaggedRow,i<result.flaggedIngredients.length-1&&{borderBottomWidth:1,borderBottomColor:P.border}]}>
                          <View style={s.flaggedTop}>
                            <TouchableOpacity
                              onPress={()=>openIngredientBlurb(fi.name, true)}
                              activeOpacity={0.7}
                              style={{flexShrink:1,maxWidth:'60%'}}>
                              <Text style={[s.flaggedName,{color:F.white,textDecorationLine:'underline',textDecorationStyle:'dotted'}]}>{fi.name}</Text>
                            </TouchableOpacity>
                            <View style={[s.riskBadge,{backgroundColor:F.red+'1A',borderColor:F.red+'55'}]}>
                              <Text style={[s.riskBadgeText,{color:F.red}]}>{fi.risk}</Text>
                            </View>
                          </View>
                          <Text style={[s.flaggedConcern,{color:F.dimWhite}]}>{fi.concern}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {result.cleanIngredients?.length>0&&(
                    <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:F.teal+'55'}]}>
                      <Text style={[s.findingsHeader,{color:F.teal}]}>✓ CLEAN INGREDIENTS</Text>
                      <Text style={[s.ingredientTapHint,{color:F.mutedWhite}]}>TAP ANY INGREDIENT FOR DETAILS</Text>
                      {result.cleanIngredients.map((ci:string,i:number)=>(
                        <View key={i} style={s.findingRow}>
                          <Text style={[s.findingDot,{color:F.teal}]}>▸</Text>
                          <TouchableOpacity
                            onPress={()=>openIngredientBlurb(ci, false)}
                            activeOpacity={0.7}
                            style={{flex:1}}>
                            <Text style={[s.findingText,{color:F.white,textDecorationLine:'underline',textDecorationStyle:'dotted'}]}>{ci}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  {result.absorptionZones&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.purple,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.purple}]}>⚗ ABSORPTION ZONES</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.absorptionZones}</Text>
                    </View>
                  )}
                  {result.cosmoChemistNote&&(
                    <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.orange,borderColor:P.border}]}>
                      <Text style={[s.intelHeader,{color:F.orange}]}>⚗ COSMO CHEMIST</Text>
                      <Text style={[s.intelBody,{color:F.white}]}>{result.cosmoChemistNote}</Text>
                    </View>
                  )}
                </>
              )}

              {/* ══ WINE & SPIRITS PANEL SYSTEM ══ */}
              {activeTab==='grownfolks'&&(
                <>
                  <View style={s.panelRow}>
                    <TouchableOpacity
                      style={[s.panelBtn,winePanel==='pairing'&&{borderColor:accentColor,backgroundColor:accentColor+'18'}]}
                      onPress={()=>setWinePanel('pairing')}>
                      <Text style={[s.panelBtnText,{color:winePanel==='pairing'?accentColor:F.dimWhite}]}>🍷 PAIRING</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.panelBtn,winePanel==='health'&&{borderColor:F.teal,backgroundColor:F.teal+'18'}]}
                      onPress={()=>setWinePanel('health')}>
                      <Text style={[s.panelBtnText,{color:winePanel==='health'?F.teal:F.dimWhite}]}>🧬 HEALTH & INFO</Text>
                    </TouchableOpacity>
                  </View>

                  {winePanel==='pairing'&&result.pairing&&(
                    <>
                      {result.pairing.foodPairings?.length>0&&(
                        <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                          <Text style={[s.findingsHeader,{color:accentColor}]}>FOOD PAIRINGS</Text>
                          {result.pairing.foodPairings.map((fp:string,i:number)=>(
                            <View key={i} style={s.findingRow}>
                              <Text style={[s.findingDot,{color:accentColor}]}>▸</Text>
                              <Text style={[s.findingText,{color:F.white}]}>{fp}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {result.pairing.sommelierNote&&(
                        <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:accentColor,borderColor:P.border}]}>
                          <Text style={[s.intelHeader,{color:accentColor}]}>TASTING NOTES</Text>
                          <Text style={[s.intelBody,{color:F.white}]}>{result.pairing.sommelierNote}</Text>
                        </View>
                      )}
                      {result.pairing.serveNote&&(
                        <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.blue,borderColor:P.border}]}>
                          <Text style={[s.intelHeader,{color:F.blue}]}>HOW TO SERVE</Text>
                          <Text style={[s.intelBody,{color:F.white}]}>{result.pairing.serveNote}</Text>
                        </View>
                      )}
                      {result.pairing.occasionNote&&(
                        <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.gold,borderColor:P.border}]}>
                          <Text style={[s.intelHeader,{color:F.gold}]}>OCCASION</Text>
                          <Text style={[s.intelBody,{color:F.white}]}>{result.pairing.occasionNote}</Text>
                        </View>
                      )}
                      {result.pairing.valueVerdict&&(
                        <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.teal,borderColor:P.border}]}>
                          <Text style={[s.intelHeader,{color:F.teal}]}>VALUE VERDICT</Text>
                          <Text style={[s.intelBody,{color:F.white}]}>{result.pairing.valueVerdict}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {winePanel==='health'&&result.healthInfo&&(
                    <>
                      {result.healthInfo.keyIngredients?.length>0&&(
                        <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                          <Text style={[s.findingsHeader,{color:F.teal}]}>WHAT'S IN IT</Text>
                          {result.healthInfo.keyIngredients.map((ki:string,i:number)=>(
                            <View key={i} style={s.findingRow}>
                              <Text style={[s.findingDot,{color:F.teal}]}>▸</Text>
                              <Text style={[s.findingText,{color:F.white}]}>{ki}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {result.healthInfo.additivesFlags?.length>0&&(
                        <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:F.takeNotice+'55'}]}>
                          <Text style={[s.findingsHeader,{color:F.takeNotice}]}>⚠ ADDITIVES & FLAGS</Text>
                          {result.healthInfo.additivesFlags.map((af:string,i:number)=>(
                            <View key={i} style={s.findingRow}>
                              <Text style={[s.findingDot,{color:F.takeNotice}]}>▸</Text>
                              <Text style={[s.findingText,{color:F.white}]}>{af}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {result.healthInfo.calorieEstimate&&(
                        <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.orange,borderColor:P.border}]}>
                          <Text style={[s.intelHeader,{color:F.orange}]}>CALORIE ESTIMATE</Text>
                          <Text style={[s.intelBody,{color:F.white}]}>{result.healthInfo.calorieEstimate}</Text>
                        </View>
                      )}
                      {result.healthInfo.moderationNote&&(
                        <View style={[s.intelCard,{backgroundColor:P.card,borderLeftColor:F.teal,borderColor:P.border}]}>
                          <Text style={[s.intelHeader,{color:F.teal}]}>MODERATION NOTE</Text>
                          <Text style={[s.intelBody,{color:F.white}]}>{result.healthInfo.moderationNote}</Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ══ STANDARD RESULTS (scan, produce, meat, species) ══ */}
              {activeTab!=='care'&&activeTab!=='grownfolks'&&activeTab!=='fish'&&(
                <>
                  {result.keyFindings?.length>0&&(
                    <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                      <Text style={[s.findingsHeader,{color:F.dimWhite}]}>KEY FINDINGS</Text>
                      {result.keyFindings.map((f:string,i:number)=>(
                        <View key={i} style={s.findingRow}>
                          <Text style={[s.findingDot,{color:accentColor}]}>▸</Text>
                          <Text style={[s.findingText,{color:F.white}]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* RECIPE CHIPS */}
                  {parseChefChips(result.chefNote).length>0&&(
                    <View style={[s.findingsCard,{backgroundColor:P.card,borderColor:P.border}]}>
                      <Text style={[s.findingsHeader,{color:F.orange}]}>{intelLabel()} · TAP A RECIPE</Text>
                      {parseChefChips(result.chefNote).map((chip,i)=>(
                        <TouchableOpacity
                          key={i}
                          style={[s.recipeChip,{borderColor:P.border,backgroundColor:P.bg}]}
                          onPress={()=>openRecipe(chip)}
                          activeOpacity={0.75}>
                          <Text style={s.recipeChipName}>{chip.recipeName}</Text>
                          <Text style={s.recipeChipMeta}>{chip.cookTime} · {chip.ingredientCount} ingredients</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* ALTERNATIVES — non-fish tabs */}
              {activeTab!=='fish'&&result.alternatives?.length>0&&(
                <View style={[s.altCard,{backgroundColor:P.card,borderColor:P.border}]}>
                  <Text style={[s.altHeader,{color:F.dimWhite}]}>BETTER ALTERNATIVES</Text>
                  {/* FOUNDER LAW (2026-08-01): name gets the FULL width, buttons
                      live on their own row beneath — never squeeze text into a
                      one-word-per-line column on narrow screens (Z Fold closed). */}
                  {result.alternatives.map((a:string,i:number)=>(
                    <View key={i} style={s.altItemRow}>
                      <Text style={[s.altItem,{color:F.teal}]}>→ {a}</Text>
                      <View style={{flexDirection:'row',gap:8,marginTop:8,flexWrap:'wrap'}}>
                        <TouchableOpacity
                          onPress={()=>openWhyAlternative(a)}
                          style={s.whyBtn}
                          hitSlop={{top:8,bottom:8,left:8,right:8}}>
                          <Text style={s.whyBtnText}>WHY?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          hitSlop={{ top: 9, bottom: 9, left: 8, right: 8 }}
                          onPress={()=>handleWhereToBuy(a)}
                          style={{borderWidth:1,borderColor:lc(TH, 'rgba(27,184,255,0.40)'),backgroundColor:lc(TH, 'rgba(27,184,255,0.12)'),borderRadius:8,paddingHorizontal:12,paddingVertical:6}}
                          activeOpacity={0.7}>
                          <Text style={{fontFamily:'DMMono-Regular',fontSize:10,color:lc(TH, '#1BB8FF'),letterSpacing:1}}>WHERE TO BUY →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* AWARE DOLLARS */}
              {result.actRightDollars&&(
                <View style={[s.vaultCard,{borderColor:F.gold}]}>
                  <Text style={[s.vaultLabel,{color:F.gold}]}>💎 AWARE DOLLARS</Text>
                  <Text style={[s.vaultBody,{color:F.white}]}>{result.actRightDollars}</Text>
                  {awareState==='logged'?(
                    <View style={[s.scanAgainBtn,{borderColor:lc(TH, '#8fd6ff'),marginTop:12}]}>
                      <Text style={[s.scanAgainText,{color:lc(TH, '#8fd6ff')}]}>✓ LOGGED TO VAULT</Text>
                    </View>
                  ):awareState==='failed'?(
                    <TouchableOpacity style={[s.scanAgainBtn,{borderColor:lc(TH, '#E0A04A'),marginTop:12}]} onPress={followAwareDollars} activeOpacity={0.7}>
                      <Text style={[s.scanAgainText,{color:lc(TH, '#E0A04A')}]}>⚠ NOT SAVED — RETRY</Text>
                    </TouchableOpacity>
                  ):(
                    <TouchableOpacity
                      style={[s.scanAgainBtn,{borderColor:F.gold,marginTop:12,opacity:parseAwareAmount(result.actRightDollars)==null?0.4:1}]}
                      onPress={followAwareDollars}
                      disabled={parseAwareAmount(result.actRightDollars)==null}
                      activeOpacity={0.7}>
                      <Text style={[s.scanAgainText,{color:F.gold}]}>◆ I FOLLOWED THIS →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity style={[s.scanAgainBtn,{borderColor:accentColor}]} onPress={()=>setResult(null)}>
                <Text style={[s.scanAgainText,{color:accentColor}]}>SCAN ANOTHER</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMPTY */}
          {!result&&!loading&&!heroImage&&(
            <View style={s.emptyState}>
              <Text style={{fontSize:48,marginBottom:16}}>{currentTab.icon}</Text>
              <Text style={[s.emptyLabel,{color:F.dimWhite}]}>READY TO SCAN</Text>
              <Text style={[s.emptySubLabel,{color:F.mutedWhite}]}>9 DATABASES STANDING BY</Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* ── RECIPE MODAL ── */}
      <Modal
        visible={recipeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={()=>setRecipeModalVisible(false)}>
        <SafeAreaView style={s.recipeModalRoot}>
          <View style={s.recipeModalHeader}>
            <TouchableOpacity onPress={()=>setRecipeModalVisible(false)} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Text style={s.recipeModalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={s.recipeModalHeaderLabel}>THE CHEF</Text>
            <View style={{width:24}}/>
          </View>

          {recipeLoading?(
            <View style={s.recipeLoadingWrap}>
              <ActivityIndicator size="large" color={F.orange}/>
              <Text style={s.recipeLoadingText}>THE CHEF IS BUILDING YOUR RECIPE</Text>
            </View>
          ):recipeData?(
            <ScrollView contentContainerStyle={{paddingBottom:60}}>
              <View style={s.recipeNameWrap}>
                <Text style={s.recipeModalName}>{recipeData.recipeName}</Text>
              </View>
              <View style={s.recipeMetaRow}>
                <View style={s.recipeMetaChip}>
                  <Text style={s.recipeMetaText}>⏱ {recipeData.cookTimeMinutes} min</Text>
                </View>
                <View style={s.recipeMetaChip}>
                  <Text style={s.recipeMetaText}>🍽 {recipeData.servings} servings</Text>
                </View>
                {recipeData.cuisine&&(
                  <View style={s.recipeMetaChip}>
                    <Text style={s.recipeMetaText}>{recipeData.cuisine}</Text>
                  </View>
                )}
              </View>
              {recipeData.prepNote&&(
                <View style={s.recipePrepCard}>
                  <Text style={s.recipePrepText}>{recipeData.prepNote}</Text>
                </View>
              )}

              {(recipeData.ingredients??[]).filter((i:any)=>i.status==='have').length>0&&(
                <View style={s.recipeSection}>
                  <Text style={[s.recipeSectionHeader,{color:F.green}]}>✓  YOU HAVE</Text>
                  {(recipeData.ingredients??[]).filter((i:any)=>i.status==='have').map((ing:any,i:number)=>(
                    <View key={i} style={s.recipeIngRow}>
                      <Text style={[s.recipeIngAmount,{color:F.green}]}>{ing.amount}</Text>
                      <Text style={s.recipeIngName}>{ing.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {(recipeData.ingredients??[]).filter((i:any)=>i.status==='flagged').length>0&&(
                <View style={[s.recipeSection,{borderColor:'rgba(210,60,40,0.3)',backgroundColor:'rgba(210,60,40,0.06)',borderWidth:1,borderRadius:12,padding:14}]}>
                  <Text style={[s.recipeSectionHeader,{color:F.red}]}>⚠  FLAGGED BY YOUR MEMBRANE</Text>
                  {(recipeData.ingredients??[]).filter((i:any)=>i.status==='flagged').map((ing:any,i:number)=>(
                    <View key={i} style={s.recipeFlaggedBlock}>
                      <View style={s.recipeIngRow}>
                        <Text style={[s.recipeIngAmount,{color:F.red}]}>{ing.amount}</Text>
                        <Text style={[s.recipeIngName,{color:F.red}]}>{ing.name}</Text>
                      </View>
                      {ing.allergyWarning&&(
                        <Text style={s.recipeFlaggedWarning}>{ing.allergyWarning}</Text>
                      )}
                      {ing.safeAlternatives?.length>0&&(
                        <View style={s.recipeSafeAltRow}>
                          {ing.safeAlternatives.map((alt:string,ai:number)=>(
                            <View key={ai} style={s.recipeSafeAltChip}>
                              <Text style={s.recipeSafeAltText}>✓ {alt}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {(recipeData.ingredients??[]).filter((i:any)=>i.status==='need').length>0&&(
                <View style={s.recipeSection}>
                  <Text style={[s.recipeSectionHeader,{color:F.gold}]}>□  STILL NEED</Text>
                  {(recipeData.ingredients??[]).filter((i:any)=>i.status==='need').map((ing:any,i:number)=>(
                    <View key={i} style={s.recipeIngRow}>
                      <Text style={[s.recipeIngAmount,{color:F.gold}]}>{ing.amount}</Text>
                      <Text style={s.recipeIngName}>{ing.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={s.cookbookCta}>
                {cookbookSaved?(
                  <Text style={s.cookbookSavedText}>✓ SAVED TO COOKBOOK</Text>
                ):(
                  <>
                    <Text style={s.cookbookCtaLabel}>Add to your Cookbook?</Text>
                    <View style={s.cookbookCtaRow}>
                      <TouchableOpacity style={s.cookbookYesBtn} onPress={saveRecipeToCookbook}>
                        <Text style={s.cookbookYesBtnText}>YES</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={()=>setRecipeModalVisible(false)}>
                        <Text style={s.cookbookNotNow}>Not now</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          ):(
            <View style={s.recipeLoadingWrap}>
              <Text style={s.recipeLoadingText}>Could not load recipe. Try again.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── INFO SHEET (ingredient blurbs + why alternatives) ── */}
      <Modal
        visible={infoSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={()=>setInfoSheetVisible(false)}>
        <View style={s.infoSheetBackdrop}>
          <TouchableOpacity style={{flex:1}} activeOpacity={1} onPress={()=>setInfoSheetVisible(false)}/>
          <TouchableOpacity activeOpacity={1}>
            <View style={[s.infoSheetCard,{backgroundColor:P.card,borderTopColor:P.border}]}>
              <View style={s.infoSheetHandle}/>
              <Text style={[s.infoSheetName,{color:F.white}]}>{infoSheetTitle}</Text>
              {infoSheetLoading
                ? <ActivityIndicator size="small" color={accentColor} style={{marginVertical:16}}/>
                : <Text style={[s.infoSheetBody,{color:F.dimWhite}]}>{infoSheetText}</Text>
              }
              <TouchableOpacity onPress={()=>setInfoSheetVisible(false)} style={s.infoSheetDismissBtn}>
                <Text style={s.infoSheetDismissText}>TAP TO DISMISS</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal visible={historyVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.modalRoot,{backgroundColor:P.bg}]}>
          <View style={[s.modalHeader,{borderBottomColor:P.border}]}>
            <Text style={[s.modalTitle,{color:F.white}]}>SCAN HISTORY</Text>
            <TouchableOpacity onPress={()=>setHistoryVisible(false)}>
              <Text style={[s.modalClose,{color:F.dimWhite}]}>✕</Text>
            </TouchableOpacity>
          </View>
          {history.length===0
            ?<View style={s.emptyHistory}><Text style={[s.emptyHistoryText,{color:F.dimWhite}]}>No scans yet</Text></View>
            :<FlatList data={history} keyExtractor={item=>item.id} contentContainerStyle={{padding:16}}
              renderItem={({item})=>(
                <View style={[s.historyRow,{borderBottomColor:P.border}]}>
                  <View style={[s.historyDot,{backgroundColor:verdictColor(TH, item.verdict)}]}/>
                  <View style={{flex:1}}>
                    <Text style={[s.historyProduct,{color:F.white}]}>{item.productName}</Text>
                    <Text style={[s.historyMeta,{color:F.dimWhite}]}>{item.tab} · {item.timestamp}</Text>
                  </View>
                  <Text style={[s.historyVerdict,{color:verdictColor(TH, item.verdict)}]}>{verdictGlyph(item.verdict)}</Text>
                </View>
              )}/>
          }
          <TouchableOpacity style={[s.clearBtn,{borderColor:F.red+'55'}]}
            onPress={()=>{setHistory([]);setHistoryVisible(false);}}>
            <Text style={[s.clearBtnText,{color:F.red}]}>CLEAR HISTORY</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
/**
 * TWO MODES, ONE SHEET. Every DARK value below is the literal that shipped —
 * still readable here, which is how LAW 1 is proved rather than promised.
 * Every LIGHT value is lifted from the founder's own year-old two-mode file.
 */
const make_s = (T: Tokens) => {
  const F = fx(T);
  return StyleSheet.create({
  /* ── THE PRODUCT PICTURE ────────────────────────────────────────────────
     The fade is the door's own ground pulled up over the bottom of the photo
     so the name sits on the panel instead of on a hard seam. It is painted
     with the live palette, so it is correct on all five doors and in both
     modes without a second recipe. */
  shotWrap:  { height: 232, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  shotImg:   { width: '100%', height: '100%' },
  shotFade:  { position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, opacity: 0.72 },
  shotFoot:  { position: 'absolute', left: 14, right: 14, bottom: 11 },
  shotName:  { fontSize: 19, fontWeight: '800', letterSpacing: 0.2,
               textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 8 },
  shotSrc:   { fontFamily: 'DMMono-Regular', fontSize: 9.5, letterSpacing: 1.8, marginTop: 4,
               textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 6 },
  shotEmpty: { borderRadius: 16, borderWidth: 1, paddingVertical: 22, paddingHorizontal: 18,
               alignItems: 'center', marginBottom: 12, gap: 8 },
  shotEmptyGlyph: { fontSize: 26 },
  shotEmptyTxt:   { fontSize: 13, lineHeight: 19, textAlign: 'center' },

  root:            {flex:1},
  header:          {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:8,paddingBottom:8,borderBottomWidth:1},
  receipt:         {fontFamily:Platform.OS==='ios'?'Courier New':'monospace',fontSize:9,color:F.dimWhite,letterSpacing:2,flex:1},
  dna:             {fontSize:20,flex:1,textAlign:'center'},
  historyBtn:      {flex:1,alignItems:'flex-end'},
  historyBtnText:  {fontSize:11,fontWeight:'700'},
  tabGrid:         {borderBottomWidth:1},
  tabRow:          {flexDirection:'row'},
  tabBtn:          {flex:1,paddingVertical:10,alignItems:'center',borderBottomWidth:2,borderBottomColor:'transparent'},
  tabIcon:         {fontSize:15},
  tabLabel:        {fontSize:7.5,fontWeight:'800',letterSpacing:0.5,marginTop:3},
  speciesRow:      {flexDirection:'row',paddingHorizontal:12,paddingVertical:8,gap:8},
  subTab:          {flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:9,borderRadius:10,borderWidth:1},
  subTabIcon:      {fontSize:14},
  subTabLabel:     {fontSize:9,fontWeight:'800',letterSpacing:0.5},
  body:            {flex:1},
  heroWrap:        {position:'relative'},
  heroImage:       {width:'100%',height:220},
  heroOverlay:     {position:'absolute',bottom:0,left:0,right:0,padding:14},
  heroTabLabel:    {fontSize:13,fontWeight:'900',letterSpacing:3},
  heroSubLabel:    {fontSize:9,letterSpacing:2,marginTop:2},
  doctrineBanner:  {marginHorizontal:12,marginTop:12,padding:14,borderRadius:12,borderLeftWidth:3,borderWidth:1},
  doctrineTitle:   {fontSize:10,fontWeight:'900',letterSpacing:1.5,marginBottom:5},
  doctrineBody:    {fontSize:12,lineHeight:18},
  inputCard:       {margin:12,padding:16,borderRadius:16,borderWidth:1},
  cameraBtn:       {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,padding:15,borderRadius:12,borderWidth:1,marginBottom:12},
  cameraBtnIcon:   {fontSize:20},
  cameraBtnLabel:  {fontWeight:'900',fontSize:13,letterSpacing:1.5},
  orDivider:       {fontSize:10,textAlign:'center',marginBottom:10,letterSpacing:2},
  input:           {borderWidth:1,borderRadius:10,padding:13,fontSize:13,marginBottom:10},
  analyzeBtn:      {paddingVertical:14,borderRadius:10,alignItems:'center'},
  analyzeBtnText:  {color:F.nearBlack,fontWeight:'900',fontSize:12,letterSpacing:1.5},
  cameraContainer: {flex:1},
  camera:          {flex:1},
  cameraOverlay:   {flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'space-between',alignItems:'center'},
  cameraFrameGroup:{alignItems:'center'},
  scanFrame:       {borderRadius:14,marginBottom:12},
  frameDoctrine:   {fontSize:9,letterSpacing:2,fontFamily:Platform.OS==='ios'?'Courier New':'monospace',marginBottom:8},
  cameraHint:      {fontWeight:'900',fontSize:12,letterSpacing:2},
  cameraControls:  {alignItems:'center',width:'100%'},
  captureOuter:    {borderWidth:4,alignItems:'center',justifyContent:'center',backgroundColor:dl(T, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.04)'),marginBottom:20},
  captureInner:    {},
  cancelBtn:       {paddingVertical:12,paddingHorizontal:28,borderRadius:10,borderWidth:1},
  cancelText:      {color:F.dimWhite,fontSize:12,fontWeight:'800',letterSpacing:1.5},
  loadingCard:     {margin:12,padding:28,borderRadius:16,alignItems:'center',borderWidth:1},
  loadingLabel:    {fontWeight:'900',fontSize:11,letterSpacing:2,marginTop:14},
  loadingDb:       {fontSize:9,letterSpacing:1.5,marginTop:6},
  resultBlock:     {margin:12},
  // Allergy alert
  allergyAlertCard:{borderRadius:12,borderWidth:1,borderColor:'rgba(210,60,40,0.3)',backgroundColor:'rgba(210,60,40,0.06)',padding:14,marginBottom:10},
  allergyAlertTop: {flexDirection:'row',gap:10,alignItems:'flex-start',marginBottom:10},
  allergyAlertIcon:{fontSize:18,color:F.red,marginTop:1},
  allergyAlertAllergen:{fontFamily:'DMMono-Regular',fontSize:11,color:F.red,letterSpacing:2,fontWeight:'700',marginBottom:3},
  allergyAlertBody:{fontSize:12,color:F.dimWhite,lineHeight:18},
  allergyChipRow:  {flexDirection:'row',flexWrap:'wrap',gap:6},
  allergyChip:     {paddingHorizontal:10,paddingVertical:4,borderRadius:20,backgroundColor:dl(T, 'rgba(46,207,115,0.12)', 'rgba(42,136,42,0.12)'),borderWidth:1,borderColor:dl(T, 'rgba(46,207,115,0.35)', 'rgba(42,136,42,0.35)')},
  allergyChipText: {fontFamily:'DMMono-Regular',fontSize:9,color:F.green,letterSpacing:0.5},
  verdictBanner:   {flexDirection:'row',alignItems:'center',gap:14,padding:16,borderRadius:14,borderWidth:2,marginBottom:12},
  verdictIconWrap: {width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},
  verdictIconText: {fontSize:24,fontWeight:'900'},
  verdictText:     {fontSize:18,fontWeight:'900',letterSpacing:0.5},
  verdictReason:   {fontSize:12,marginTop:3,lineHeight:18},
  productName:     {fontSize:16,fontWeight:'700',marginBottom:10,paddingHorizontal:2},
  typeBadge:       {paddingHorizontal:12,paddingVertical:5,borderRadius:8,borderWidth:1,alignSelf:'flex-start',marginBottom:10},
  typeBadgeText:   {fontSize:11,fontWeight:'700',letterSpacing:0.5},
  recallBanner:    {borderRadius:10,borderWidth:1,padding:12,marginBottom:10,backgroundColor:dl(T, 'rgba(224,82,82,0.12)', 'rgba(192,57,43,0.12)')},
  recallText:      {fontWeight:'800',fontSize:12},
  intelCard:       {borderRadius:12,borderLeftWidth:3,borderWidth:1,padding:16,marginBottom:10},
  intelHeader:     {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:8},
  intelBody:       {fontSize:13,lineHeight:21},
  findingsCard:    {borderRadius:12,borderWidth:1,padding:16,marginBottom:10},
  findingsHeader:  {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:6},
  findingRow:      {flexDirection:'row',gap:8,marginBottom:8},
  findingDot:      {fontSize:11,marginTop:2},
  findingText:     {fontSize:12,lineHeight:19,flex:1},
  // Ingredient tap hint
  ingredientTapHint:{fontSize:8,letterSpacing:1.5,marginBottom:10},
  // Recipe chips
  recipeChip:      {borderRadius:10,borderWidth:1,padding:14,marginBottom:8},
  recipeChipName:  {fontFamily:'CormorantGaramond-Italic',fontSize:18,color:F.white,marginBottom:4},
  recipeChipMeta:  {fontFamily:'DMMono-Regular',fontSize:10,color:F.dimWhite,letterSpacing:0.5},
  // Fish water body
  fishSpeciesRow:  {marginBottom:12,paddingBottom:12},
  fishSpeciesTop:  {flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4,gap:8},
  fishSpeciesName: {fontSize:18,flexShrink:1,maxWidth:'60%'},
  // Personal care
  flaggedRow:      {marginBottom:12,paddingBottom:12},
  flaggedTop:      {flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4,gap:8},
  flaggedName:     {fontSize:13,fontWeight:'700'},
  riskBadge:       {paddingHorizontal:8,paddingVertical:3,borderRadius:6,borderWidth:1,flexShrink:0},
  riskBadgeText:   {fontSize:9,fontWeight:'900',letterSpacing:1},
  flaggedConcern:  {fontSize:12,lineHeight:18},
  // Wine & Spirits
  panelRow:        {flexDirection:'row',gap:10,marginBottom:10},
  panelBtn:        {flex:1,paddingVertical:11,borderRadius:10,borderWidth:1,borderColor:dl(T, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.1)'),alignItems:'center'},
  panelBtnText:    {fontSize:11,fontWeight:'900',letterSpacing:1},
  // Alternatives with WHY button
  altCard:         {borderRadius:12,borderWidth:1,padding:16,marginBottom:10},
  altHeader:       {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:8},
  altItemRow:      {marginBottom:14},
  altItem:         {fontSize:13,lineHeight:22},
  whyBtn:          {paddingHorizontal:8,paddingVertical:3,borderRadius:4,borderWidth:1,borderColor:dl(T, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),marginLeft:10},
  whyBtnText:      {fontFamily:'DMMono-Regular',fontSize:8,color:F.dimWhite,letterSpacing:1},
  // Vault
  vaultCard:       {borderRadius:12,borderWidth:1,padding:16,marginBottom:10,backgroundColor:dl(T, 'rgba(196,154,42,0.10)', 'rgba(184,134,30,0.10)')},
  vaultLabel:      {fontSize:9,fontWeight:'900',letterSpacing:2,marginBottom:6},
  vaultBody:       {fontSize:13,lineHeight:20},
  scanAgainBtn:    {borderWidth:1.5,borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:4},
  scanAgainText:   {fontWeight:'900',fontSize:12,letterSpacing:1.5},
  emptyState:      {alignItems:'center',paddingTop:40,paddingBottom:40},
  emptyLabel:      {fontWeight:'900',fontSize:11,letterSpacing:3,marginTop:4},
  emptySubLabel:   {fontSize:9,letterSpacing:2,marginTop:4},
  // History modal
  modalRoot:       {flex:1},
  modalHeader:     {flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16,borderBottomWidth:1},
  modalTitle:      {fontWeight:'900',fontSize:14,letterSpacing:2},
  modalClose:      {fontSize:18,fontWeight:'700'},
  emptyHistory:    {flex:1,alignItems:'center',justifyContent:'center'},
  emptyHistoryText:{fontSize:13},
  historyRow:      {flexDirection:'row',alignItems:'center',gap:12,paddingVertical:13,borderBottomWidth:1},
  historyDot:      {width:10,height:10,borderRadius:5},
  historyProduct:  {fontSize:13,fontWeight:'700'},
  historyMeta:     {fontSize:10,marginTop:2},
  historyVerdict:  {fontSize:18,fontWeight:'900'},
  clearBtn:        {margin:16,padding:14,borderRadius:10,borderWidth:1,alignItems:'center'},
  clearBtnText:    {fontWeight:'800',fontSize:11,letterSpacing:1.5},
  // Recipe modal
  recipeModalRoot:     {flex:1,backgroundColor:'#0D0E10'},
  recipeModalHeader:   {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,borderBottomWidth:1,borderBottomColor:dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)')},
  recipeModalClose:    {fontSize:18,fontWeight:'700',color:F.dimWhite},
  recipeModalHeaderLabel:{fontFamily:'DMMono-Regular',fontSize:9,color:F.orange,letterSpacing:3},
  recipeLoadingWrap:   {flex:1,alignItems:'center',justifyContent:'center',gap:16},
  recipeLoadingText:   {fontFamily:'DMMono-Regular',fontSize:10,color:F.orange,letterSpacing:2,textAlign:'center'},
  recipeNameWrap:      {paddingHorizontal:20,paddingTop:20,paddingBottom:8},
  recipeModalName:     {fontFamily:'CormorantGaramond-Italic',fontSize:24,color:F.white,lineHeight:30},
  recipeMetaRow:       {flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:20,marginBottom:12},
  recipeMetaChip:      {paddingHorizontal:12,paddingVertical:5,borderRadius:20,borderWidth:1,borderColor:dl(T, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.1)'),backgroundColor:dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)')},
  recipeMetaText:      {fontFamily:'DMMono-Regular',fontSize:10,color:F.dimWhite,letterSpacing:0.5},
  recipePrepCard:      {marginHorizontal:20,marginBottom:16,padding:14,borderRadius:10,backgroundColor:dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)'),borderWidth:1,borderColor:dl(T, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.03)')},
  recipePrepText:      {fontFamily:'CormorantGaramond-Regular',fontSize:15,color:F.dimWhite,lineHeight:22,fontStyle:'italic'},
  recipeSection:       {marginHorizontal:20,marginBottom:14},
  recipeSectionHeader: {fontFamily:'DMMono-Regular',fontSize:9,letterSpacing:2.5,marginBottom:10,fontWeight:'700'},
  recipeIngRow:        {flexDirection:'row',gap:10,marginBottom:8,alignItems:'baseline'},
  recipeIngAmount:     {fontFamily:'DMMono-Regular',fontSize:11,color:F.dimWhite,minWidth:52,maxWidth:'40%',flexShrink:1},
  recipeIngName:       {fontFamily:'CormorantGaramond-Regular',fontSize:16,color:F.white,flex:1,lineHeight:22},
  recipeFlaggedBlock:  {marginBottom:12},
  recipeFlaggedWarning:{fontFamily:'DMMono-Regular',fontSize:10,color:F.dimWhite,marginTop:3,marginBottom:6,lineHeight:15},
  recipeSafeAltRow:    {flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:4},
  recipeSafeAltChip:   {paddingHorizontal:10,paddingVertical:4,borderRadius:20,backgroundColor:dl(T, 'rgba(46,207,115,0.12)', 'rgba(42,136,42,0.12)'),borderWidth:1,borderColor:dl(T, 'rgba(46,207,115,0.35)', 'rgba(42,136,42,0.35)')},
  recipeSafeAltText:   {fontFamily:'DMMono-Regular',fontSize:9,color:F.green,letterSpacing:0.5},
  cookbookCta:         {marginHorizontal:20,marginTop:16,padding:18,borderRadius:14,borderWidth:1,borderColor:dl(T, 'rgba(196,154,42,0.35)', 'rgba(184,134,30,0.35)'),backgroundColor:dl(T, 'rgba(196,154,42,0.07)', 'rgba(184,134,30,0.07)'),alignItems:'center'},
  cookbookCtaLabel:    {fontFamily:'CormorantGaramond-Regular',fontSize:18,color:F.white,marginBottom:14,fontStyle:'italic'},
  cookbookCtaRow:      {flexDirection:'row',gap:16,alignItems:'center'},
  cookbookYesBtn:      {paddingHorizontal:32,paddingVertical:12,borderRadius:10,backgroundColor:F.gold},
  cookbookYesBtnText:  {fontFamily:'DMMono-Regular',fontSize:12,color:F.nearBlack,letterSpacing:2,fontWeight:'700'},
  cookbookNotNow:      {fontFamily:'DMMono-Regular',fontSize:11,color:F.dimWhite,letterSpacing:1},
  cookbookSavedText:   {fontFamily:'DMMono-Regular',fontSize:13,color:F.gold,letterSpacing:2,fontWeight:'700'},
  // Info sheet
  infoSheetBackdrop:   {flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.60)'},
  infoSheetCard:       {borderTopWidth:1,borderTopLeftRadius:20,borderTopRightRadius:20,padding:24,paddingBottom:40},
  infoSheetHandle:     {width:40,height:4,borderRadius:2,backgroundColor:dl(T, 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.12)'),alignSelf:'center',marginBottom:18},
  infoSheetName:       {fontFamily:'DMMono-Regular',fontSize:11,letterSpacing:2,marginBottom:14,fontWeight:'700'},
  infoSheetBody:       {fontFamily:'CormorantGaramond-Regular',fontSize:16,lineHeight:24},
  infoSheetDismissBtn: {marginTop:20,alignItems:'center'},
  infoSheetDismissText:{fontFamily:'DMMono-Regular',fontSize:8,color:F.mutedWhite,letterSpacing:2},
});
};

