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
// 12 recorded sessions, ~1 hour each. 13.0 CE hours. Post-test at 80% for the
// certificate of completion.
//
// THE SESSIONS HAVE NO INDIVIDUAL TITLES. They are labelled "Clinical Hypnosis
// Session One Training" and so on, straight through. There is nothing to fill
// in and this file no longer pretends otherwise.
//
// The ARC below is Yapko's own, stated by him in the opening minutes of
// Session 1: the first few sessions cover fundamentals, basic concepts,
// terminology and theoretical perspectives; the later sessions cover the
// structural elements — methods of induction, producing hypnotic phenomena,
// and the nature of clinical interventions — with special attention to
// anxiety, depression and pain. That is his description of his own course,
// not a table of contents invented here.
const YAPKO: StudyPath = {
  slug: 'yapko-foundations',
  audible: 'https://www.audible.com/search?keywords=Michael+Yapko+Trancework',
  title: 'Foundations of Clinical Hypnosis',
  author: 'Michael D. Yapko, PhD',
  provider: 'PESI / Psychotherapy Networker · NRS001942 · $199.99 · 13.0 CE hrs',
  source: 'https://catalog.psychotherapynetworker.org/sales/pn_c_001942_clinicalhypnosis_organic-827750',
  sourceNote: '12 sessions of roughly an hour each, numbered not titled. CE hours do not apply without a licence; the certificate of completion does, and it is gated behind a post-test at 80%. Transcripts are provided — search them for the terminology discussion.',
  feeds: 'Certificate of completion · post-test at 80%',
  accent: '#1BB8FF',
  modules: [
    { id: 'y1', label: 'Session 01 — foundations, misconceptions, models', scope: 70, status: 'ready',
      intent: 'THE TITLE RULING LIVES HERE, at 21:34–23:47. Yapko: it is "a common mistake… to think of hypnosis as a therapy or even a form of therapy"; he names "individuals and even professional associations who use the term hypnotherapy… and thereby represent hypnosis as the therapy"; then "Hypnosis is not the therapy. Rather, hypnosis is a vehicle." And at 23:47: "Studying hypnosis isn\'t studying a therapy. It\'s studying how to make therapy better." Screenshot it — that is the disclosure page.',
      recall: ['Why is Hypnotist the accurate title and Hypnotherapist the inaccurate one?',
               'What is hypnosis a vehicle FOR?',
               'Name three of the misconceptions he corrects.'] },
    { id: 'y2', label: 'Session 02 — neuroscience, suggestion structures, language', scope: 65, status: 'ready',
      intent: 'He states the next session at the close of Session 1: the neuroscience of hypnosis, suggestion structures, and how language shapes emotions and perceptions.',
      recall: ['How does suggestion structure change the response?',
               'What does the neuroscience actually show?'] },
    { id: 'y3', label: 'Session 03 — concepts and theoretical perspectives', scope: 65, status: 'ready',
      intent: 'The competing models. The BCH examiners honour any theory "clearly and logically presented" — so pick the one you can defend and know why.',
      recall: ['Name the main theoretical perspectives.',
               'Which one matches what you actually believe, and why?'] },
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `y${i + 4}`,
      label: `Session 0${i + 4} — structure: induction and hypnotic phenomena`,
      intent: 'Technique block. Watch once, then run it on yourself and record it before moving on. Reading about an induction is not knowing one.',
      scope: 65,
      recall: ['Can you run this without the video?',
               'What went differently when you did it than when he did it?'],
      status: 'ready' as ModuleStatus,
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `y${i + 9}`,
      label: `Session ${String(i + 9).padStart(2, '0')} — clinical intervention: anxiety, depression, pain`,
      intent: 'His stated speciality. Watch for WHAT he does, not what he treats — the structure is yours to use; the diagnosis is not your lane.',
      scope: 65,
      recall: ['What is the structure of the intervention?',
               'Which part of this belongs to the licensed lane, and which is method?'],
      status: 'ready' as ModuleStatus,
    })),
  ],
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


// ─── THE SHELF — THE MEMBER'S ACTUAL LIBRARY ─────────────────────────────────
// Catalogued 2026-09-19 from the member's own Audible and Kindle libraries.
// Forty-five Audible titles plus the print shelf. Nothing here is a guess or a
// recommendation — every row is a book the member holds.
//
// Titles were read off the member's library screenshots. Where a spine was cut
// off in the capture it was LEFT OUT rather than guessed at, so this list is a
// floor, not a ceiling — the member corrects it, it never corrects the member.
//
// Every link is an Audible SEARCH. No specific audio edition has been verified
// for any title, and a search does not pretend one exists.
//
// THE PILLARS SHELF is not a category AA2 invented for this file. Pillar 1 of
// the Canon is the Kybalion and Pillar 2 is Ancient Kemet initiate doctrine —
// and the Kybalion, the Hermetica, three volumes of Metu Neter, the Emerald
// Tablets and the Secret Teachings were already on this shelf. The library
// predates the file that names it.
export type ShelfKey =
  | 'path' | 'memory' | 'pillars' | 'body' | 'build' | 'tech' | 'field' | 'rest';

export const SHELF_NAMES: Record<ShelfKey, string> = {
  path:    'THE PATH · credential material',
  memory:  'MEMORY & LEARNING',
  pillars: 'THE PILLARS · hermetic, kemetic, contemplative',
  body:    'THE BODY · anatomy, sleep, food, terminology',
  build:   'THE BUILD · business, offer, capital',
  tech:    'TECHNICAL',
  field:   'FIELD · flight, ground, language',
  rest:    'REST · memoir, fiction, the long way round',
};

export type ShelfItem = {
  title: string; author: string;
  format: 'audible' | 'print' | 'both';
  shelf: ShelfKey; audible: string; note?: string;
};

export const SHELF: ShelfItem[] = [
  { title: 'The Art of Hypnosis', author: 'C. Roy Hunter', format: 'print', shelf: 'path', audible: 'https://www.audible.com/search?keywords=The+Art+of+Hypnosis+C+Roy+Hunter' },
  { title: 'Prosocial', author: 'Atkins · Wilson · Hayes', format: 'print', shelf: 'path', audible: 'https://www.audible.com/search?keywords=Prosocial+Atkins+Wilson+Hayes' },
  { title: 'Trancework', author: 'Michael D. Yapko', format: 'print', shelf: 'path', audible: 'https://www.audible.com/search?keywords=Trancework+Michael+D+Yapko' },
  { title: 'Process-Oriented Hypnosis', author: 'Michael D. Yapko', format: 'audible', shelf: 'path', audible: 'https://www.audible.com/search?keywords=Process+Oriented+Hypnosis+Michael+D+Yapko' },
  { title: 'Get Out of Your Mind and Into Your Life', author: 'Steven C. Hayes', format: 'print', shelf: 'path', audible: 'https://www.audible.com/search?keywords=Get+Out+of+Your+Mind+and+Into+Your+Life+Steven+C+Hayes' },
  { title: 'A Liberated Mind', author: 'Steven C. Hayes', format: 'both', shelf: 'path', audible: 'https://www.audible.com/search?keywords=A+Liberated+Mind+Steven+C+Hayes' },
  { title: 'ACT Made Simple', author: 'Russ Harris', format: 'audible', shelf: 'path', audible: 'https://www.audible.com/search?keywords=ACT+Made+Simple+Russ+Harris' },
  { title: 'The Happiness Trap', author: 'Russ Harris', format: 'audible', shelf: 'path', audible: 'https://www.audible.com/search?keywords=The+Happiness+Trap+Russ+Harris' },
  { title: 'Co-Active Coaching (4th ed.)', author: 'Kimsey-House et al.', format: 'audible', shelf: 'path', audible: 'https://www.audible.com/search?keywords=Co+Active+Coaching+4th+ed+Kimsey+House+et+al' },
  { title: 'Remember It!', author: 'Nelson Dellis', format: 'both', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Remember+It+Nelson+Dellis' },
  { title: 'Everyday Genius', author: 'Nelson Dellis', format: 'audible', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Everyday+Genius+Nelson+Dellis' },
  { title: 'Limitless (Expanded)', author: 'Jim Kwik', format: 'audible', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Limitless+Expanded+Jim+Kwik' },
  { title: 'Deep Work', author: 'Cal Newport', format: 'print', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Deep+Work+Cal+Newport' },
  { title: 'Thinking in Bets', author: 'Annie Duke', format: 'audible', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Thinking+in+Bets+Annie+Duke' },
  { title: 'Stop Letting Everything Affect You', author: 'Daniel Chidiac', format: 'both', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Stop+Letting+Everything+Affect+You+Daniel+Chidiac' },
  { title: 'Atomic Habits', author: 'James Clear', format: 'audible', shelf: 'memory', audible: 'https://www.audible.com/search?keywords=Atomic+Habits+James+Clear' },
  { title: 'The Kybalion', author: 'Three Initiates', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=The+Kybalion+Three+Initiates' },
  { title: 'The Hermetica', author: 'Freke & Gandy', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=The+Hermetica+Freke+Gandy' },
  { title: 'The Secret Teachings of All Ages', author: 'Manly P. Hall', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=The+Secret+Teachings+of+All+Ages+Manly+P+Hall' },
  { title: 'Compendium of the Emerald Tablets', author: 'Billy Carson', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Compendium+of+the+Emerald+Tablets+Billy+Carson' },
  { title: 'Metu Neter Vol. 4 — The Ausarian Resurrection', author: 'Ra Un Nefer Amen', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Metu+Neter+Vol+4+The+Ausarian+Resurrection+Ra+Un+Nefer+Amen' },
  { title: 'Metu Neter Vol. 5 — Health & Longevity', author: 'Ra Un Nefer Amen', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Metu+Neter+Vol+5+Health+Longevity+Ra+Un+Nefer+Amen' },
  { title: 'Metu Neter Vol. 6 — The Ra Initiation System', author: 'Ra Un Nefer Amen', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Metu+Neter+Vol+6+The+Ra+Initiation+System+Ra+Un+Nefer+Amen' },
  { title: 'Hermetic Magic', author: 'Stephen Edred Flowers', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Hermetic+Magic+Stephen+Edred+Flowers' },
  { title: 'Ye Are Gods', author: 'Annalee Skarin', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Ye+Are+Gods+Annalee+Skarin' },
  { title: 'The Bhagavad Gita', author: 'Paramahansa Yogananda', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=The+Bhagavad+Gita+Paramahansa+Yogananda' },
  { title: 'Inner Engineering', author: 'Sadhguru', format: 'audible', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Inner+Engineering+Sadhguru' },
  { title: 'Power vs. Force', author: 'David R. Hawkins', format: 'audible', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Power+vs+Force+David+R+Hawkins' },
  { title: 'Numerology', author: 'Harish Johari', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Numerology+Harish+Johari' },
  { title: 'Project 369', author: 'David Kasneci', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Project+369+David+Kasneci' },
  { title: 'Don\'t Bite the Hook', author: 'Pema Chodron', format: 'audible', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=Don+t+Bite+the+Hook+Pema+Chodron' },
  { title: 'F**k It Therapy', author: 'John C. Parkin', format: 'print', shelf: 'pillars', audible: 'https://www.audible.com/search?keywords=F+k+It+Therapy+John+C+Parkin' },
  { title: 'Eat Smarter', author: 'Shawn Stevenson', format: 'audible', shelf: 'body', audible: 'https://www.audible.com/search?keywords=Eat+Smarter+Shawn+Stevenson' },
  { title: 'Sleep Smarter', author: 'Shawn Stevenson', format: 'audible', shelf: 'body', audible: 'https://www.audible.com/search?keywords=Sleep+Smarter+Shawn+Stevenson' },
  { title: 'The 3-Day Effect', author: 'Florence Williams', format: 'audible', shelf: 'body', audible: 'https://www.audible.com/search?keywords=The+3+Day+Effect+Florence+Williams' },
  { title: 'Anatomy & Physiology for Dummies', author: 'Erin Odya', format: 'print', shelf: 'body', audible: 'https://www.audible.com/search?keywords=Anatomy+Physiology+for+Dummies+Erin+Odya' },
  { title: 'College Level Anatomy & Physiology', author: 'audiolearn', format: 'print', shelf: 'body', audible: 'https://www.audible.com/search?keywords=College+Level+Anatomy+Physiology+audiolearn' },
  { title: 'Medical Terminology for Dummies', author: 'Henderson & Dorsey', format: 'both', shelf: 'body', audible: 'https://www.audible.com/search?keywords=Medical+Terminology+for+Dummies+Henderson+Dorsey' },
  { title: 'Medical Terminology', author: 'Matt Clark', format: 'print', shelf: 'body', audible: 'https://www.audible.com/search?keywords=Medical+Terminology+Matt+Clark' },
  { title: 'Memorizing Pharmacology', author: 'Tony Guerra', format: 'both', shelf: 'body', audible: 'https://www.audible.com/search?keywords=Memorizing+Pharmacology+Tony+Guerra' },
  { title: 'HESI Admission Assessment Exam Review', author: 'Elsevier', format: 'print', shelf: 'body', audible: 'https://www.audible.com/search?keywords=HESI+Admission+Assessment+Exam+Review+Elsevier' },
  { title: '$100M Offers', author: 'Alex Hormozi', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=100M+Offers+Alex+Hormozi' },
  { title: 'Million Dollar Weekend', author: 'Noah Kagan', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Million+Dollar+Weekend+Noah+Kagan' },
  { title: 'The Millionaire Fastlane', author: 'MJ DeMarco', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=The+Millionaire+Fastlane+MJ+DeMarco' },
  { title: 'Profit First', author: 'Mike Michalowicz', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Profit+First+Mike+Michalowicz' },
  { title: 'Scaling Up', author: 'Verne Harnish', format: 'print', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Scaling+Up+Verne+Harnish' },
  { title: 'DotCom Secrets', author: 'Russell Brunson', format: 'print', shelf: 'build', audible: 'https://www.audible.com/search?keywords=DotCom+Secrets+Russell+Brunson' },
  { title: 'Start with Why', author: 'Simon Sinek', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Start+with+Why+Simon+Sinek' },
  { title: 'Speak Like a CEO', author: 'Suzanne Bates', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Speak+Like+a+CEO+Suzanne+Bates' },
  { title: 'Create Something Awesome', author: 'Roberto Blake', format: 'print', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Create+Something+Awesome+Roberto+Blake' },
  { title: 'Put Your Ass Where Your Heart Wants to Be', author: 'Steven Pressfield', format: 'print', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Put+Your+Ass+Where+Your+Heart+Wants+to+Be+Steven+Pressfield' },
  { title: 'The 4-Hour Workweek', author: 'Tim Ferriss', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=The+4+Hour+Workweek+Tim+Ferriss' },
  { title: 'The Power of Broke', author: 'Daymond John', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=The+Power+of+Broke+Daymond+John' },
  { title: 'Money Master the Game', author: 'Tony Robbins', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Money+Master+the+Game+Tony+Robbins' },
  { title: 'Think and Grow Rich', author: 'Napoleon Hill', format: 'print', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Think+and+Grow+Rich+Napoleon+Hill' },
  { title: 'Freakonomics', author: 'Levitt & Dubner', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Freakonomics+Levitt+Dubner' },
  { title: 'You Are a Badass', author: 'Jen Sincero', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=You+Are+a+Badass+Jen+Sincero' },
  { title: 'You Are a Badass at Making Money', author: 'Jen Sincero', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=You+Are+a+Badass+at+Making+Money+Jen+Sincero' },
  { title: 'Oneness vs. the 1%', author: 'Vandana Shiva', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=Oneness+vs+the+1+Vandana+Shiva' },
  { title: 'The Art of War', author: 'Sun Tzu', format: 'audible', shelf: 'build', audible: 'https://www.audible.com/search?keywords=The+Art+of+War+Sun+Tzu' },
  { title: 'Solutions Architect\'s Handbook', author: 'Saurabh Shrivastava', format: 'audible', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=Solutions+Architect+s+Handbook+Saurabh+Shrivastava' },
  { title: 'Programming: Python Crash Course', author: 'Steve Blair', format: 'both', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=Programming+Python+Crash+Course+Steve+Blair' },
  { title: 'Ethical Hacking', author: 'Zach Codings', format: 'both', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=Ethical+Hacking+Zach+Codings' },
  { title: 'Hunting Cyber Criminals', author: 'Vinny Troia', format: 'print', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=Hunting+Cyber+Criminals+Vinny+Troia' },
  { title: 'Mastering the CCNA', author: 'Christopher Parker', format: 'audible', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=Mastering+the+CCNA+Christopher+Parker' },
  { title: 'CCENT/CCNA Official Cert Guides', author: 'Cisco Press', format: 'print', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=CCENT+CCNA+Official+Cert+Guides+Cisco+Press' },
  { title: 'Network Warrior', author: 'Gary A. Donahue', format: 'print', shelf: 'tech', audible: 'https://www.audible.com/search?keywords=Network+Warrior+Gary+A+Donahue' },
  { title: 'Pilot\'s Handbook of Aeronautical Knowledge', author: 'FAA', format: 'print', shelf: 'field', audible: 'https://www.audible.com/search?keywords=Pilot+s+Handbook+of+Aeronautical+Knowledge+FAA' },
  { title: 'Airman Knowledge Testing Supplement 2026', author: 'FAA', format: 'print', shelf: 'field', audible: 'https://www.audible.com/search?keywords=Airman+Knowledge+Testing+Supplement+2026+FAA' },
  { title: 'All New Square Foot Gardening', author: 'Mel Bartholomew', format: 'print', shelf: 'field', audible: 'https://www.audible.com/search?keywords=All+New+Square+Foot+Gardening+Mel+Bartholomew' },
  { title: 'Madrigal\'s Magic Key to Spanish', author: 'Margarita Madrigal', format: 'print', shelf: 'field', audible: 'https://www.audible.com/search?keywords=Madrigal+s+Magic+Key+to+Spanish+Margarita+Madrigal' },
  { title: 'English Grammar for Dummies', author: 'Geraldine Woods', format: 'print', shelf: 'field', audible: 'https://www.audible.com/search?keywords=English+Grammar+for+Dummies+Geraldine+Woods' },
  { title: 'Can\'t Hurt Me', author: 'David Goggins', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Can+t+Hurt+Me+David+Goggins' },
  { title: 'Never Finished', author: 'David Goggins', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Never+Finished+David+Goggins' },
  { title: 'Year of Yes', author: 'Shonda Rhimes', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Year+of+Yes+Shonda+Rhimes' },
  { title: 'The Mother of Black Hollywood', author: 'Jenifer Lewis', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=The+Mother+of+Black+Hollywood+Jenifer+Lewis' },
  { title: 'My Name Is Prince', author: 'Randee St. Nicholas', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=My+Name+Is+Prince+Randee+St+Nicholas' },
  { title: 'The Life and Adventures of James Beckwourth', author: 'James P. Beckwourth', format: 'print', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=The+Life+and+Adventures+of+James+Beckwourth+James+P+Beckwourth' },
  { title: 'The Alchemist', author: 'Paulo Coelho', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=The+Alchemist+Paulo+Coelho' },
  { title: 'Good Omens', author: 'Pratchett & Gaiman', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Good+Omens+Pratchett+Gaiman' },
  { title: 'Artemis', author: 'Andy Weir', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Artemis+Andy+Weir' },
  { title: 'The Dispatcher', author: 'John Scalzi', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=The+Dispatcher+John+Scalzi' },
  { title: 'The City of Lost Fortunes', author: 'Bryan Camp', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=The+City+of+Lost+Fortunes+Bryan+Camp' },
  { title: 'Gather the Fortunes', author: 'Bryan Camp', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Gather+the+Fortunes+Bryan+Camp' },
  { title: 'Junk', author: 'Les Bohem', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Junk+Les+Bohem' },
  { title: 'The Adventures of Tom Stranger', author: 'Larry Correia', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=The+Adventures+of+Tom+Stranger+Larry+Correia' },
  { title: 'Even Tree Nymphs Get the Blues', author: 'Molly Harper', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Even+Tree+Nymphs+Get+the+Blues+Molly+Harper' },
  { title: 'Proof of Love', author: 'Chisa Hutchinson', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Proof+of+Love+Chisa+Hutchinson' },
  { title: 'Riley Mack', author: 'Chris Grabenstein', format: 'audible', shelf: 'rest', audible: 'https://www.audible.com/search?keywords=Riley+Mack+Chris+Grabenstein' },
];

/** Books on one shelf. */
export function shelf(k: ShelfKey): ShelfItem[] { return SHELF.filter(b => b.shelf === k); }

/** Counts, for the Learning Center header. Real numbers, never rounded up. */
export const SHELF_COUNT = SHELF.length;
export const AUDIBLE_COUNT = SHELF.filter(b => b.format !== 'print').length;

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN TRAIN TOOLS — added 2026-09-22.
//
// SPOKE 17. The paths above are what the member READS. This is what the member
// RUNS: short practices with a start and a stop, each one repeatable, each one
// measurable if an instrument is on.
//
// ── THE SAME LAW, STATED FOR TOOLS ──────────────────────────────────────────
// AA2 CARRIES THE PATH, NEVER THE PROVIDER'S MATERIAL.
// Every tool below is a POINTER to the author's own free download page. AA2
// does not host the audio, does not reproduce the worksheet, and does not
// transcribe the exercise. The member downloads it from the author, keeps
// their own copy, and AA2 records what it did to them.
//
// ── WHOSE WORK THIS IS ──────────────────────────────────────────────────────
// Dr Russ Harris publishes these free at actmindfully.com.au. His name stays
// on every row. The member is told where it came from before they run it.
//
// ── THE COUPLING NOBODY ELSE HAS ────────────────────────────────────────────
// A practice run with no instrument leaves a feeling. The same practice run
// with the stack on leaves a record. That is the only thing AA2 adds here,
// and it is the whole reason these sit inside the Learning Center.
// ─────────────────────────────────────────────────────────────────────────────

export type ToolKind = 'audio' | 'worksheet' | 'pack';

export type BrainTool = {
  id: string;
  name: string;
  author: string;
  kind: ToolKind;
  /** Minutes the practice itself runs. Null for a worksheet with no clock. */
  minutes: number | null;
  /** What it does, in AA2's words. Never the author's script. */
  what: string;
  /** How the member runs it here — the AA2 protocol around someone else's tool. */
  how: string;
  /** What to wear if they want a record instead of a memory. Never required. */
  instrument?: string;
  /** The member's own downloaded copy, by filename, in their own vault folder. */
  file?: string;
  /** The author's own free page. Always where the member gets it. */
  source: string;
  sourceNote: string;
  accent: string;
};

const HARRIS_AUDIO  = 'https://www.actmindfully.com.au/free-stuff/free-audio/';
const HARRIS_SHEETS = 'https://www.actmindfully.com.au/free-stuff/extra-bits-ebooks-worksheets-and-handouts/';
const HARRIS = 'Dr Russ Harris · actmindfully.com.au · free';

export const BRAIN_TRAIN_TOOLS: BrainTool[] = [
  {
    id: 'anchor-40',
    name: 'Dropping Anchor · 40 seconds',
    author: 'Dr Russ Harris',
    kind: 'audio',
    minutes: 1,
    accent: '#D49A4A',
    what: 'The short one. A way to get steady on the spot, without leaving the room you are standing in.',
    how: 'This is the one you run in the moment — before the call, in the parking lot, between claims. Run it the same way every time so the reps are comparable.',
    instrument: 'Nothing. This one is meant to work with your hands full.',
    file: 'Drop_Anchor_40_seconds.mp3',
    source: HARRIS_AUDIO,
    sourceNote: HARRIS,
  },
  {
    id: 'anchor-7',
    name: 'Dropping Anchor · 7 minutes',
    author: 'Dr Russ Harris',
    kind: 'audio',
    minutes: 7,
    accent: '#D49A4A',
    what: 'The full-length version of the same practice. Long enough for the body to actually follow.',
    how: 'The trainable one. Same time of day, same chair, same posture. What changes over weeks is you, not the recording.',
    instrument: 'The Crown, if you want the record. Sit two minutes before you press play and two minutes after, and the before and after belong to the same session.',
    file: 'Drop_Anchor_7_minutes.mp3',
    source: HARRIS_AUDIO,
    sourceNote: HARRIS,
  },
  {
    id: 'join-the-dots',
    name: 'Join The DOTS',
    author: 'Dr Russ Harris',
    kind: 'worksheet',
    minutes: null,
    accent: '#8FA8C8',
    what: 'An inventory of what you do to get away from what you feel, and what it costs you when you do it.',
    how: 'Fill it once on a calm day and once on a hard day. The gap between the two is the finding — and it is yours, not a score anyone hands you.',
    file: 'Join_The_Dots_Worksheet_Russ_Harris.pdf',
    source: HARRIS_SHEETS,
    sourceNote: HARRIS,
  },
  {
    id: 'values-checklist',
    name: 'A Values Checklist',
    author: 'Dr Russ Harris',
    kind: 'worksheet',
    minutes: null,
    accent: '#7FA86B',
    what: 'A list to choose from when the question is what actually matters to you, and the blank page is not helping.',
    how: 'This is the one that feeds the Intent and Goals layer. What the member picks here is what every later reading gets measured against.',
    file: 'A_Values_Checklist_Russ_Harris.pdf',
    source: HARRIS_SHEETS,
    sourceNote: HARRIS,
  },
  {
    id: 'extra-bits',
    name: 'ACT Made Simple · The Extra Bits · 2024',
    author: 'Dr Russ Harris',
    kind: 'pack',
    minutes: null,
    accent: '#C08A5E',
    what: 'The author’s own companion pack to the textbook, chapter by chapter.',
    how: 'Read it beside the chapter you are on, never ahead of it. It is the practice half of the book you already own.',
    file: 'ACT_Made_Simple_The_Extra_Bits_Russ_Harris_2024.pdf',
    source: HARRIS_SHEETS,
    sourceNote: HARRIS,
  },
];

export const TOOL_COUNT = BRAIN_TRAIN_TOOLS.length;

export function toolsOfKind(k: ToolKind): BrainTool[] {
  return BRAIN_TRAIN_TOOLS.filter(t => t.kind === k);
}

export const TOOL_KIND_NAMES: Record<ToolKind, string> = {
  audio: 'RUN IT · AUDIO',
  worksheet: 'WORK IT · ON PAPER',
  pack: 'BESIDE THE BOOK',
};
