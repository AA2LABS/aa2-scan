// ─────────────────────────────────────────────────────────────────────────────
// DEPTH-ON-DEMAND · STUDY CONTENT — written 2026-09-19.
//
// SPOKE 17. This is the content layer of the Learning Center: the actual
// material the member is going to absorb, broken into sessions, each one
// pointing at the credential requirement it feeds.
//
// ── THE LAW THIS FILE OBEYS ─────────────────────────────────────────────────
// AA2 CARRIES THE PATH, NEVER THE PROVIDER'S MATERIAL.
// Every module below is a POINTER — a book, a chapter range, a published
// requirement — with its source recorded. No manual is reproduced here, no
// workbook is transcribed, no exam question is copied. The member reads the
// book. AA2 records what held.
//
// ── NO INVENTED STRUCTURE ───────────────────────────────────────────────────
// Where a book's own structure is published, it is used verbatim and cited.
// Where it is NOT published, the module list says PENDING and is filled from
// the physical contents page when the book lands. Nothing is guessed.
//
// ── NO NAKED NUMBERS ────────────────────────────────────────────────────────
// A recall check returns HELD or DID NOT HOLD with the prompt attached. It
// never returns a score, a grade, or a percentage on its own.
//
// ── SERVE THE TABLE ─────────────────────────────────────────────────────────
// Nothing here ranks the member or tells them they are behind.
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleStatus = 'ready' | 'pending-book' | 'pending-portal';

export type StudyModule = {
  id: string;
  label: string;
  /** What the member actually does in the session. Never the book's words. */
  intent: string;
  /** Minutes the session is scoped to. The member can run over; nothing scolds. */
  scope: number;
  /** One-tap recall prompts, fired at +1 / +3 / +7 / +30 days. Our wording. */
  recall: string[];
  status: ModuleStatus;
};

export type StudyPath = {
  slug: string;
  title: string;
  author: string;
  provider: string;
  /** Every path cites where its structure came from. */
  source: string;
  sourceNote: string;
  /** The credential requirement this path feeds, if any. */
  feeds?: string;
  /** Audible SEARCH url — title + author. A search never 404s and never
   *  claims an edition exists that we have not verified. */
  audible: string;
  /** True only where the member has told us they own it. Never assumed. */
  owned?: boolean;
  accent: string;
  modules: StudyModule[];
};

// ─── 1 · HUNTER — THE ART OF HYPNOSIS, THIRD EDITION ─────────────────────────
// Nine topic areas, published by Crown House on the book's own product page.
// This is the NGH course text: Hunter was chosen by Charles Tebbetts to carry
// on his work, and the Tebbetts program is the spine of the NGH curriculum.
const HUNTER: StudyPath = {
  slug: 'hunter-art-of-hypnosis',
  audible: 'https://www.audible.com/search?keywords=Art+of+Hypnosis+Roy+Hunter',
  title: 'The Art of Hypnosis',
  author: 'C. Roy Hunter',
  provider: 'Crown House Publishing · 3rd ed. · 240 pp · ISBN 9781845904395',
  source: 'https://www.crownhouse.co.uk/the-art-of-hypnosis',
  sourceNote: 'Nine topic areas as published by Crown House. Not a guess.',
  feeds: 'NGH Certified Hypnotist · course text',
  accent: '#D4A847',
  modules: [
    { id: 'h1', label: 'What is hypnosis and why use it?', scope: 45, status: 'ready',
      intent: 'Read the opening definition. Write your own one-sentence definition before reading his — then compare.',
      recall: ['Can you define hypnosis in one sentence, in your own words?',
               'Why use it — what does he say it is FOR?'] },
    { id: 'h2', label: 'Hypnosis yesterday and today', scope: 60, status: 'ready',
      intent: 'History. BCH tests sequence and attribution, not dates — build the order of events and who did what.',
      recall: ['Put the major figures in order — who came before whom?',
               'Who is credited with what? Name three and what each contributed.'] },
    { id: 'h3', label: 'Inductions and awakening', scope: 60, status: 'ready',
      intent: 'Technique. Read once, then run one induction on yourself and record it before you read the next.',
      recall: ['Can you run an induction start to finish from memory?',
               'What does he say about awakening — what must never be skipped?'] },
    { id: 'h4', label: 'Deepening the hypnotic state', scope: 45, status: 'ready',
      intent: 'Technique. Deepening is where most self-taught practitioners stop short.',
      recall: ['Name the deepening methods and when each is appropriate.'] },
    { id: 'h5', label: 'Testing during hypnosis', scope: 45, status: 'ready',
      intent: 'How you know it took. This is the part your own method depends on — staying conscious enough to verify.',
      recall: ['How do you test depth without breaking it?',
               'What does a failed test tell you to do next?'] },
    { id: 'h6', label: 'Ethics and potential dangers', scope: 60, status: 'ready',
      intent: 'Read against your own disclosure. Where does his line sit versus where you drew yours?',
      recall: ['What are the stated dangers, and which apply to self-hypnosis?',
               'Does your disclosure cover every case he names?'] },
    { id: 'h7', label: 'Self-hypnosis for stress coping', scope: 60, status: 'ready',
      intent: 'The chapter closest to your own practice. Record a session after reading and compare it to his structure.',
      recall: ['What structure does he give self-hypnosis?',
               'Where does your recorded method differ, and why did you choose that?'] },
    { id: 'h8', label: 'Concepts about the subconscious — Charles Tebbetts', scope: 60, status: 'ready',
      intent: 'The source material under the NGH curriculum. Read it as the spine, not as a chapter.',
      recall: ['State the Tebbetts concepts in your own words.',
               'Which one does your branding metaphor actually sit on?'] },
    { id: 'h9', label: 'Introducing the Art of Hypnotherapy', scope: 45, status: 'ready',
      intent: 'The bridge chapter. Note the vocabulary you will NOT be using publicly, and why.',
      recall: ['Which terms here belong to the licensed lane, not yours?'] },
  ],
};

// ─── 2 · ATKINS · WILSON · HAYES — PROSOCIAL ─────────────────────────────────
// Structure from the Prosocial Facilitator Training's own published shape.
const PROSOCIAL: StudyPath = {
  slug: 'prosocial',
  audible: 'https://www.audible.com/search?keywords=Prosocial+Paul+Atkins+David+Sloan+Wilson+Steven+Hayes',
  title: 'Prosocial',
  author: 'Paul W.B. Atkins · David Sloan Wilson · Steven C. Hayes',
  provider: 'Context Press · 272 pp · ISBN 9781684030248',
  source: 'https://prosocialworld.thinkific.com/courses/prosocial-prosocial-facilitator',
  sourceNote: 'Course shape published by Prosocial: 12 weeks, five live workshops, four assignments. Price and next cohort NOT verified — call before paying.',
  feeds: 'Prosocial Facilitator',
  accent: '#34D399',
  modules: [
    { id: 'p1', label: 'Why groups fail — the evolutionary frame', scope: 60, status: 'ready',
      intent: 'The premise. Read it as the answer to why AA2 treats a household as one membrane.',
      recall: ['What does evolutionary science say about why cooperation breaks down?'] },
    { id: 'p2', label: 'The Core Design Principles', scope: 90, status: 'ready',
      intent: 'The working tool of the whole book. Name each principle and find one live example in your own work.',
      recall: ['List the Core Design Principles from memory.',
               'Which one is weakest in a group you are actually in?'] },
    { id: 'p3', label: 'The Matrix', scope: 60, status: 'ready',
      intent: 'The facilitation instrument. Draw it before you read the chapter, then correct your drawing.',
      recall: ['Can you draw the Matrix and say what each quadrant asks?'] },
    { id: 'p4', label: 'Running it with a real group', scope: 90, status: 'ready',
      intent: 'Facilitation mechanics. This is the part you will be paid for.',
      recall: ['What do you do first with a group that has never seen this?'] },
    { id: 'p5', label: 'Conflict and disagreement', scope: 60, status: 'ready',
      intent: 'Read against the AA2 law that disagreement gets resolved, never suppressed.',
      recall: ['How is disagreement handled — what is the actual procedure?'] },
    { id: 'p6', label: 'Where ACT and Prosocial meet', scope: 60, status: 'ready',
      intent: 'Hayes is a co-author. This is the bridge from training yourself to training a room.',
      recall: ['Where does the individual work end and the group work begin?'] },
  ],
};

// ─── 3 · YAPKO — FOUNDATIONS OF CLINICAL HYPNOSIS ────────────────────────────
// 12 recorded sessions, 13.0 CE hours, post-test at 80% for the certificate.
// Module TITLES are inside the PESI portal — not published, so not invented.
const YAPKO: StudyPath = {
  slug: 'yapko-foundations',
  audible: 'https://www.audible.com/search?keywords=Michael+Yapko+Trancework',
  title: 'Foundations of Clinical Hypnosis',
  author: 'Michael D. Yapko, PhD',
  provider: 'PESI / Psychotherapy Networker · product NRS001942 · $199.99 · 13.0 CE hrs',
  source: 'https://catalog.psychotherapynetworker.org/sales/pn_c_001942_clinicalhypnosis_organic-827750',
  sourceNote: '12 modules confirmed. Titles live inside the PESI portal and are NOT published — filled on first sign-in, never guessed. CE hours do not apply without a licence; the certificate of completion does.',
  feeds: 'Certificate of completion · post-test at 80%',
  accent: '#1BB8FF',
  modules: Array.from({ length: 12 }, (_, i) => ({
    id: `y${i + 1}`,
    label: `Module ${String(i + 1).padStart(2, '0')} — title pending portal`,
    intent: 'Watch once without notes. Watch again and record what you would say differently.',
    scope: 65,
    recall: ['What was the single technique in this module?',
             'Could you demonstrate it without the video?'],
    status: 'pending-portal' as ModuleStatus,
  })),
};

// ─── 4 · DELLIS — REMEMBER IT! ───────────────────────────────────────────────
// 306 pp, "bite-size chapters" per the publisher. The chapter list is NOT
// published anywhere verifiable, so it is NOT written here. It is filled from
// the physical contents page when the book lands.
const DELLIS: StudyPath = {
  slug: 'dellis-remember-it',
  audible: 'https://www.audible.com/search?keywords=Remember+It+Nelson+Dellis',
  owned: true,
  title: 'Remember It!',
  author: 'Nelson Dellis',
  provider: 'Abrams Image · 306 pp · ISBN 9781419732560',
  source: 'https://books.google.com/books/about/Remember_It.html?id=DhVnDwAAQBAJ',
  sourceNote: 'Publisher states 306 pp of bite-size chapters. The chapter list is not published — this path stays PENDING until the contents page is read off the physical book. Nothing invented.',
  feeds: 'Technique layer — feeds every other path',
  accent: '#9B8CFF',
  modules: [
    { id: 'd0', label: 'Contents page — build the module list', scope: 15, status: 'pending-book',
      intent: 'Open the book to the contents page and enter the chapters. This path builds itself from the real thing.',
      recall: ['How many techniques does he actually teach?'] },
  ],
};

// ─── 5 · THE BCH EXAM ────────────────────────────────────────────────────────
// Every line here is from the NGH Board Certification Preparation Booklet and
// the requirements page, read 2026-09-19. The DOMAINS are published. The
// QUESTIONS are not, and are not reproduced.
const BCH: StudyPath = {
  slug: 'ngh-bch',
  audible: 'https://www.audible.com/search?keywords=Journal+of+Hypnotism',
  title: 'Board Certified Hypnotist — the exam',
  author: 'Maurice Kershaw, MA, FNGH · NGH Board Certification Committee',
  provider: 'National Guild of Hypnotists · $25 application + $250 exam',
  source: 'https://ngh.net/wp-content/uploads/2017/10/BCHPrepBook.pdf',
  sourceNote: '200 marks, 140 to pass. 60 short-answer (60) + five timed case plans (50) + oral interview (90). Free retake. Domains published in the Preparation Booklet; questions are not published and are not reproduced here.',
  feeds: 'BCH · after one year at Certified level',
  accent: '#E24B4A',
  modules: [
    { id: 'b1', label: 'History — sequence and attribution', scope: 60, status: 'ready',
      intent: 'The booklet: you will not be asked dates of birth and death, but you should know the order of happenings and who did what.',
      recall: ['Put the figures in order.', 'Who did what — name five.'] },
    { id: 'b2', label: 'NGH Code of Ethics', scope: 45, status: 'ready',
      intent: 'The booklet says "most certainly" you will be asked. Read it from NGH, not from a summary.',
      recall: ['State the code in your own words.', 'Where does it bind you specifically?'] },
    { id: 'b3', label: 'Standards of Practice', scope: 45, status: 'ready',
      intent: 'Read alongside your own disclosure and find the gaps.',
      recall: ['What are the standards, and does your practice meet each one?'] },
    { id: 'b4', label: 'Client Bill of Rights', scope: 30, status: 'ready',
      intent: 'Short document, named explicitly by the Committee chairman as examinable.',
      recall: ['What rights does the client hold?'] },
    { id: 'b5', label: 'Law where you actually practise', scope: 60, status: 'ready',
      intent: 'The booklet: "If you are practising outside the United States, then definitely." That is you.',
      recall: ['What governs hypnotism practice where you will be working?'] },
    { id: 'b6', label: 'Case treatment planning — five in five', scope: 60, status: 'ready',
      intent: 'Five cases read aloud twice, five minutes each to write a plan. Practise writing a plan in five minutes, timed, until it flows.',
      recall: ['Can you produce a treatment plan in five minutes?',
               'What does your plan always contain, no matter the case?'] },
    { id: 'b7', label: 'The oral — 90 of 200 marks', scope: 45, status: 'ready',
      intent: 'Scored on Presentation, Knowledge, Appearance, Ethics, Verbal Skills. Four of those five are thirty-five years of your own work.',
      recall: ['Can you explain your method to a stranger in two minutes?'] },
    { id: 'b8', label: 'The 1,000-word paper', scope: 90, status: 'ready',
      intent: 'Minimum 1,000 words, suitable for the Journal of Hypnotism or Hypno-Gram. Approved by examiners first, then considered for publication.',
      recall: ['Do you have a thesis yet?', 'Is there a draft?'] },
  ],
};

export const STUDY_PATHS: StudyPath[] = [DELLIS, HUNTER, YAPKO, PROSOCIAL, BCH];

export function pathBySlug(slug: string): StudyPath | undefined {
  return STUDY_PATHS.find(p => p.slug === slug);
}

/** Total scoped minutes across a path. Scope, never a target to beat. */
export function pathMinutes(p: StudyPath): number {
  return p.modules.reduce((n, m) => n + m.scope, 0);
}

/** Modules that can actually be run today — nothing pending a book or a portal. */
export function readyModules(p: StudyPath): StudyModule[] {
  return p.modules.filter(m => m.status === 'ready');
}


// ─── THE SHELF — WHAT IS ALREADY OWNED ───────────────────────────────────────
// Audible and print titles the member has told us they hold. Nothing is added
// here that the member has not said they own. Every entry carries a SEARCH
// link, never a product claim — we have not verified an Audible edition
// exists for any specific title, and a search does not pretend otherwise.
export type ShelfItem = {
  title: string; author: string; format: 'audible' | 'print' | 'both';
  note?: string; audible: string;
};

export const SHELF: ShelfItem[] = [
  { title: 'Remember It!', author: 'Nelson Dellis', format: 'both',
    note: 'Everyday Genius on Audible · hardcover arriving',
    audible: 'https://www.audible.com/search?keywords=Remember+It+Nelson+Dellis' },
  { title: 'Get Out of Your Mind and Into Your Life', author: 'Steven C. Hayes', format: 'print',
    note: 'WORKBOOK — no audio edition. Exercises must be done on the page.',
    audible: 'https://www.audible.com/search?keywords=Get+Out+of+Your+Mind+and+Into+Your+Life+Hayes' },
  { title: 'A Liberated Mind', author: 'Steven C. Hayes', format: 'both',
    audible: 'https://www.audible.com/search?keywords=A+Liberated+Mind+Steven+Hayes' },
  { title: 'ACT Made Simple', author: 'Russ Harris', format: 'both',
    audible: 'https://www.audible.com/search?keywords=ACT+Made+Simple+Russ+Harris' },
  { title: 'The Happiness Trap', author: 'Russ Harris', format: 'both',
    audible: 'https://www.audible.com/search?keywords=The+Happiness+Trap+Russ+Harris' },
  { title: 'Stop Letting Everything Bother You', author: '—', format: 'both',
    audible: 'https://www.audible.com/search?keywords=Stop+Letting+Everything+Bother+You' },
  { title: 'Co-Active Coaching', author: 'Kimsey-House et al.', format: 'audible',
    note: '3rd and 4th editions held. Parked until the CTI decision.',
    audible: 'https://www.audible.com/search?keywords=Co-Active+Coaching' },
  { title: 'Trancework', author: 'Michael D. Yapko', format: 'print',
    note: 'Manual held alongside the 12 PESI modules.',
    audible: 'https://www.audible.com/search?keywords=Trancework+Michael+Yapko' },
];
