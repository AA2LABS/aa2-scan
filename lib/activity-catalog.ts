// ─── lib/activity-catalog.ts ─────────────────────────────────────────────────
// THE ACTIVITY CATALOG — WHOOP-scale recognition (507 activities).
// Founder law (2026-08-01): the Clarifier needs a list like WHOOP's 500+ —
// when a member names what they were doing, the membrane KNOWS it, files the
// spike as exertion (or its true category), and never mislabels life as
// "stress." Feeds: the Clarifier's brain, the Membrane's ACTIVITIES + Add,
// and onboarding suggestions. No Negative Zone: every activity is valid.

export const ACTIVITY_CATALOG: string[] = [
  // ── TEAM SPORTS (30) ──
  'Soccer', 'Basketball', 'American Football', 'Flag Football', 'Baseball', 'Softball',
  'Ice Hockey', 'Field Hockey', 'Street Hockey', 'Roller Hockey', 'Volleyball', 'Beach Volleyball',
  'Rugby', 'Rugby Sevens', 'Lacrosse', 'Cricket', 'Handball', 'Water Polo',
  'Ultimate Frisbee', 'Futsal', 'Netball', 'Dodgeball', 'Kickball', 'Gaelic Football',
  'Hurling', 'Australian Rules Football', 'Sepak Takraw', 'Korfball', 'Broomball', 'Quidditch/Quadball',
  // ── RACKET & PADDLE (10) ──
  'Tennis', 'Pickleball', 'Padel', 'Badminton', 'Squash', 'Racquetball',
  'Table Tennis', 'Platform Tennis', 'Beach Tennis', 'Speedminton',
  // ── RUNNING (17) ──
  'Running', 'Trail Run', 'Treadmill Run', 'Track Running', 'Sprinting', 'Ultramarathon',
  'Marathon', 'Half Marathon', 'Jogging', 'Interval Running', 'Hill Repeats', 'Fell Running',
  'Orienteering', 'Parkrun', 'Race Walking', 'Rucking', 'Backyard Ultra',
  // ── CYCLING (17) ──
  'Cycling', 'Road Cycling', 'Mountain Biking', 'Gravel Riding', 'Cyclocross', 'Track Cycling',
  'BMX', 'Spin Class', 'Indoor Cycling', 'E-Biking', 'Bikepacking', 'Downhill MTB',
  'Enduro MTB', 'Fat Biking', 'Unicycling', 'Tandem Cycling', 'Handcycling',
  // ── GYM & STRENGTH (48) ──
  'Strength', 'Weightlifting', 'Olympic Weightlifting', 'Powerlifting', 'Bodybuilding', 'CrossFit',
  'HYROX', 'Functional Fitness', 'Circuit Training', 'HIIT', 'Kettlebells', 'Strongman',
  'Calisthenics', 'Bodyweight Training', 'Powerbuilding', 'Deadlift Session', 'Squat Session', 'Bench Session',
  'Grip Training', 'Sandbag Training', 'Sled Work', 'Battle Ropes', 'Assault Bike', 'Rowing Machine',
  'SkiErg', 'Stair Climber', 'Elliptical', 'Jump Rope', 'Plyometrics', 'Mobility Work',
  'Stretching', 'Foam Rolling', 'Core Training', 'Ab Workout', 'Glute Workout', 'Arm Day',
  'Leg Day', 'Back Day', 'Chest Day', 'Shoulder Day', 'Bootcamp', 'F45',
  'Orangetheory', 'Barry\'s Bootcamp', 'TRX/Suspension', 'Resistance Bands', 'Isometrics', 'Machine Circuit',
  // ── COMBAT (24) ──
  'Boxing', 'Kickboxing', 'Muay Thai', 'MMA', 'Brazilian Jiu-Jitsu', 'Judo',
  'Wrestling', 'Karate', 'Taekwondo', 'Kung Fu', 'Krav Maga', 'Aikido',
  'Fencing', 'HEMA', 'Capoeira', 'Sumo', 'Sambo', 'Boxing Bag Work',
  'Sparring', 'Grappling', 'Self-Defense Training', 'Kendo', 'Escrima/Kali', 'Tai Chi Combat',
  // ── WATER (32) ──
  'Swimming', 'Pool Swim', 'Open Water Swim', 'Surfing', 'Bodyboarding', 'Stand-Up Paddleboarding',
  'Kayaking', 'Canoeing', 'Rowing', 'Sculling', 'Whitewater Rafting', 'Kitesurfing',
  'Windsurfing', 'Wing Foiling', 'Sailing', 'Water Skiing', 'Wakeboarding', 'Wakesurfing',
  'Jet Skiing', 'Snorkeling', 'Scuba Diving', 'Freediving', 'Spearfishing', 'Water Aerobics',
  'Aqua Jogging', 'Canyoning', 'Dragon Boat', 'Outrigger Canoe', 'Hydrofoiling', 'Cliff Jumping',
  'River Tubing', 'Flowrider',
  // ── WINTER (26) ──
  'Skiing', 'Alpine Skiing', 'Backcountry Ski', 'Cross-Country Skiing', 'Skate Skiing', 'Ski Touring',
  'Ski Mountaineering', 'Snowboarding', 'Splitboarding', 'Telemark Skiing', 'Snowshoeing', 'Ice Skating',
  'Speed Skating', 'Figure Skating', 'Ice Climbing', 'Sledding', 'Bobsled', 'Luge',
  'Skeleton', 'Curling', 'Biathlon', 'Ice Fishing', 'Snowmobiling', 'Dog Sledding',
  'Winter Hiking', 'Avalanche Training',
  // ── OUTDOOR & WILD (35) ──
  'Hiking', 'Backpacking', 'Thru-Hiking', 'Peak Bagging', 'Mountaineering', 'Rock Climbing',
  'Bouldering', 'Sport Climbing', 'Trad Climbing', 'Via Ferrata', 'Canyoneering', 'Caving',
  'Trail Building', 'Foraging', 'Mushroom Hunting', 'Hunting', 'Bow Hunting', 'Elk Hunting',
  'Deer Hunting', 'Bird Hunting', 'Duck Hunting', 'Fishing', 'Fly Fishing', 'Bass Fishing',
  'Deep Sea Fishing', 'Camping', 'Bushcraft', 'Survival Training', 'Geocaching', 'Birdwatching Walk',
  'Nature Walk', 'Beach Walk', 'Metal Detecting', 'Gold Panning', 'Stargazing Hike',
  // ── RANCH & LABOR (39) ──
  'Ranch Work', 'Farm Work', 'Fencing Repair', 'Hay Bucking', 'Cattle Work', 'Branding',
  'Calving', 'Herding', 'Wood Chopping', 'Firewood Hauling', 'Log Splitting', 'Chainsaw Work',
  'Gardening', 'Landscaping', 'Yard Work', 'Mowing', 'Snow Shoveling', 'Digging',
  'Post Hole Digging', 'Construction Work', 'Roofing', 'Framing', 'Concrete Work', 'Masonry',
  'Demolition', 'Moving Day', 'Warehouse Work', 'Stocking', 'Manual Labor', 'Shed Building',
  'Painting House', 'Pressure Washing', 'Gutter Cleaning', 'Barn Chores', 'Mucking Stalls', 'Feeding Livestock',
  'Tractor Work', 'Welding', 'Auto Mechanics',
  // ── EQUESTRIAN & ANIMAL (26) ──
  'Horseback Riding', 'Trail Riding', 'Dressage', 'Show Jumping', 'Eventing', 'Barrel Racing',
  'Reining', 'Cutting', 'Team Roping', 'Rodeo', 'Polo', 'Endurance Riding',
  'Vaulting', 'Groundwork', 'Lunging', 'Horse Training', 'Dog Walking', 'Dog Running',
  'Canicross', 'Dog Training', 'K9 Training', 'Bikejoring', 'Skijoring', 'Agility Training',
  'Herding Trials', 'Falconry',
  // ── TACTICAL & SERVICE (33) ──
  'Tactical Training', 'Range Day', 'Pistol Training', 'Rifle Training', 'Shotgun Sports', 'Trap Shooting',
  'Skeet Shooting', 'Sporting Clays', 'Archery', '3-Gun', 'Land Navigation', 'Ruck March',
  'Obstacle Course', 'OCR Race', 'Spartan Race', 'Tough Mudder', 'GORUCK', 'Firefighting Training',
  'SAR Training', 'Rappelling', 'Fast Rope', 'Breacher Training', 'Combatives', 'PT Test',
  'Drill', 'Patrol', 'Load Carriage', 'Stress Shoot', 'Force-on-Force', 'Diving Operations',
  'Airborne Operations', 'Cold Water Immersion', 'Heat Acclimation',
  // ── MIND-BODY (33) ──
  'Yoga', 'Hot Yoga', 'Vinyasa Yoga', 'Yin Yoga', 'Restorative Yoga', 'Power Yoga',
  'Ashtanga Yoga', 'Kundalini Yoga', 'Aerial Yoga', 'Pilates', 'Reformer Pilates', 'Mat Pilates',
  'Barre', 'Tai Chi', 'Qigong', 'Meditation', 'Breathwork', 'Wim Hof Breathing',
  'Box Breathing', 'Cold Plunge', 'Ice Bath', 'Sauna Session', 'Steam Room', 'Contrast Therapy',
  'Massage', 'Stretching Session', 'Sound Bath', 'Float Tank', 'Grounding Walk', 'Forest Bathing',
  'Prayer', 'Journaling Session', 'Visualization',
  // ── DANCE & MOVEMENT (30) ──
  'Dancing', 'Ballet', 'Ballroom Dance', 'Salsa', 'Bachata', 'Tango',
  'Swing Dance', 'Hip Hop Dance', 'Breakdancing', 'Contemporary Dance', 'Jazz Dance', 'Tap Dance',
  'Line Dancing', 'Two-Step', 'Zumba', 'Pole Fitness', 'Aerial Silks', 'Trapeze',
  'Acro Yoga', 'Gymnastics', 'Tumbling', 'Cheerleading', 'Parkour', 'Freerunning',
  'Trampoline', 'Slacklining', 'Juggling', 'Hula Hooping', 'Ice Dance', 'Figure Rolling',
  // ── SKATE & WHEELS (10) ──
  'Skateboarding', 'Longboarding', 'Roller Skating', 'Inline Skating', 'Roller Derby', 'Scootering',
  'Onewheel', 'E-Skateboarding', 'Mountain Boarding', 'Land Paddling',
  // ── PRECISION & LEISURE SPORT (19) ──
  'Golf', 'Disc Golf', 'Mini Golf', 'Driving Range', 'Bowling', 'Billiards',
  'Darts', 'Cornhole', 'Horseshoes', 'Bocce', 'Petanque', 'Croquet',
  'Axe Throwing', 'Knife Throwing', 'Shuffleboard', 'Curling (Floor)', 'Lawn Bowling', 'Foosball',
  'Air Hockey',
  // ── MOTOR & ADVENTURE (21) ──
  'Motocross', 'Dirt Biking', 'ATV Riding', 'UTV/Side-by-Side', 'Motorcycling', 'Track Days',
  'Karting', 'Rally Driving', 'Off-Roading', 'Overlanding', 'Paragliding', 'Hang Gliding',
  'Skydiving', 'BASE Jumping', 'Wingsuit', 'Hot Air Ballooning', 'Bungee Jumping', 'Zip Lining',
  'Gliding/Soaring', 'Flying Lessons', 'Drone Racing',
  // ── DAILY LIFE & RECOVERY (32) ──
  'Walking', 'Power Walking', 'Treadmill Walk', 'Incline Walk', 'Commute Walk', 'Stroller Walk',
  'Housework', 'Deep Cleaning', 'Grocery Run', 'Cooking Session', 'Meal Prep', 'Playing with Kids',
  'Playground Session', 'Carrying Baby', 'Babywearing Walk', 'Intimacy', 'Nap', 'Sleep',
  'Red Light Therapy', 'Physical Therapy', 'Rehab Session', 'Chiropractic', 'Acupuncture', 'Cryotherapy',
  'Hyperbaric Session', 'IV Therapy', 'Blood Donation', 'Fasting', 'Standing Desk Day', 'Travel Day',
  'Airport Sprint', 'Errands',
  // ── GAMES & OTHER (25) ──
  'Rock Climbing Gym', 'Ninja Warrior Gym', 'Laser Tag', 'Paintball', 'Airsoft', 'Escape Room',
  'VR Fitness', 'Supernatural VR', 'Beat Saber', 'Ring Fit', 'Esports Session', 'Chess (Timed)',
  'Poker Night', 'Frisbee', 'Catch', 'Wallyball', 'Racquet Tag', 'Spikeball',
  'KanJam', 'Tetherball', 'Four Square', 'Hopscotch', 'Tag with Kids', 'Snow Fort Building',
  'Water Balloon Fight',
];

// Fast lookup + fuzzy contains-match for the Clarifier.
const LOWER = ACTIVITY_CATALOG.map(a => a.toLowerCase());

/** Exact-ish membership (case-insensitive). */
export function isKnownActivity(term: string): boolean {
  return LOWER.includes(term.trim().toLowerCase());
}

/** Find the specific activity a free-text note mentions, longest match wins. */
export function matchActivityInText(text: string): string | null {
  const t = ` ${text.toLowerCase()} `;
  let best: string | null = null;
  for (let i = 0; i < LOWER.length; i++) {
    const a = LOWER[i];
    if (a.length >= 4 && t.includes(a) && (!best || a.length > best.length)) best = ACTIVITY_CATALOG[i];
    else if (a.length < 4 && t.includes(` ${a} `) && !best) best = ACTIVITY_CATALOG[i];
  }
  return best;
}

/** Prefix/substring suggestions for + Add inputs. */
export function suggestActivities(q: string, limit = 6): string[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const starts = ACTIVITY_CATALOG.filter(a => a.toLowerCase().startsWith(t));
  const contains = ACTIVITY_CATALOG.filter(a => !a.toLowerCase().startsWith(t) && a.toLowerCase().includes(t));
  return [...starts, ...contains].slice(0, limit);
}
