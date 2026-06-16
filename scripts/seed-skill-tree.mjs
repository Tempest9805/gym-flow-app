import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// path, level, tier, slug, name (fallback match), unlock_reps?, unlock_hold_seconds?, prereq slug?, equipment?
const NODES = [
  { path: 'push', level: 1, tier: 'beginner',     slug: 'incline-push-up',       name: 'Incline Push-Up',  reps: 12 },
  { path: 'push', level: 2, tier: 'beginner',     slug: 'push-up',               name: 'Push-Up',          reps: 15, prereq: 'incline-push-up' },
  { path: 'push', level: 3, tier: 'intermediate', slug: 'diamond-push-up',       name: 'Diamond Push-Up',  reps: 12, prereq: 'push-up' },
  { path: 'push', level: 4, tier: 'advanced',     slug: 'archer-push-up',        name: 'Archer Push-Up',   reps: 8,  prereq: 'diamond-push-up' },

  { path: 'pull', level: 1, tier: 'beginner',     slug: 'inverted-row',          name: 'Inverted Row',     reps: 12 },
  { path: 'pull', level: 2, tier: 'intermediate', slug: 'australian-pull-up',    name: 'Australian Pull-Up', reps: 12, prereq: 'inverted-row' },
  { path: 'pull', level: 3, tier: 'advanced',     slug: 'pull-up',               name: 'Pull-Up',          reps: 5,  prereq: 'australian-pull-up', equipment: 'pull_up_bar' },

  { path: 'core', level: 1, tier: 'beginner',     slug: 'plank',                 name: 'Plank',            hold: 45 },
  { path: 'core', level: 2, tier: 'beginner',     slug: 'side-plank',            name: 'Side Plank',       hold: 40, prereq: 'plank' },
  { path: 'core', level: 3, tier: 'intermediate', slug: 'leg-raise',             name: 'Leg Raise',        reps: 15, prereq: 'side-plank' },
  { path: 'core', level: 4, tier: 'advanced',     slug: 'l-sit',                 name: 'L-Sit',            hold: 10, prereq: 'leg-raise' },

  { path: 'legs', level: 1, tier: 'beginner',     slug: 'squat',                 name: 'Squat',            reps: 25 },
  { path: 'legs', level: 2, tier: 'beginner',     slug: 'lunge',                 name: 'Lunge',            reps: 16, prereq: 'squat' },
  { path: 'legs', level: 3, tier: 'intermediate', slug: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', reps: 12, prereq: 'lunge' },
  { path: 'legs', level: 4, tier: 'advanced',     slug: 'pistol-squat',          name: 'Pistol Squat',     reps: 1,  prereq: 'bulgarian-split-squat' },

  { path: 'skill', level: 1, tier: 'intermediate', slug: 'pike-push-up',         name: 'Pike Push-Up',     reps: 8 },
  { path: 'skill', level: 2, tier: 'advanced',     slug: 'handstand-push-up',    name: 'Handstand Push-Up', reps: 3, prereq: 'pike-push-up' },
];

const CHALLENGES = [
  { slug: 'push-up', name: 'Push-Up',   name_en: '100 Push-Ups',          name_es: '100 Push-Ups',          tier: 4, kind: 'volume_reps',  target_reps: 100 },
  { slug: 'plank',   name: 'Plank',     name_en: 'Plank 5 min',           name_es: 'Plancha 5 min',         tier: 4, kind: 'hold_time',    target_seconds: 300 },
  { slug: 'burpee',  name: 'Burpee',    name_en: '100 Burpees in 10 min', name_es: '100 Burpees en 10 min', tier: 4, kind: 'reps_in_time', target_reps: 100, time_window_seconds: 600 },
  { slug: 'l-sit',   name: 'L-Sit',     name_en: 'L-Sit Hold',            name_es: 'L-Sit',                 tier: 1, kind: 'skill',        target_seconds: 10 },
  { slug: 'handstand-push-up', name: 'Handstand Push-Up', name_en: 'Handstand Push-Up', name_es: 'Handstand Push-Up', tier: 1, kind: 'skill', target_reps: 1 },
];

async function loadCatalog() {
  const { data, error } = await supabase.from('exercises').select('id, slug, name_en');
  if (error) throw error;
  const bySlug = new Map();
  const byName = new Map();
  for (const e of data) {
    if (e.slug) bySlug.set(e.slug.toLowerCase(), e.id);
    if (e.name_en) byName.set(e.name_en.toLowerCase(), e.id);
  }
  return { bySlug, byName };
}

function resolve(cat, slug, name) {
  return cat.bySlug.get(slug?.toLowerCase()) ?? cat.byName.get(name?.toLowerCase()) ?? null;
}

async function run() {
  const cat = await loadCatalog();

  const progRows = [];
  const unmatched = [];
  for (const n of NODES) {
    const exercise_id = resolve(cat, n.slug, n.name);
    if (!exercise_id) { unmatched.push(`node ${n.path}/${n.slug}`); continue; }
    progRows.push({
      path: n.path,
      exercise_id,
      level: n.level,
      tier: n.tier,
      unlock_reps: n.reps ?? null,
      unlock_hold_seconds: n.hold ?? null,
      prerequisite_exercise_id: n.prereq ? resolve(cat, n.prereq, n.prereq) : null,
      equipment: n.equipment ?? null,
    });
  }

  const chRows = [];
  for (const c of CHALLENGES) {
    const exercise_id = resolve(cat, c.slug, c.name);
    if (!exercise_id) { unmatched.push(`challenge ${c.slug}`); continue; }
    chRows.push({
      name_en: c.name_en,
      name_es: c.name_es,
      challenge_tier: c.tier,
      kind: c.kind,
      exercise_id,
      target_reps: c.target_reps ?? null,
      target_seconds: c.target_seconds ?? null,
      time_window_seconds: c.time_window_seconds ?? null,
      equipment: null,
      readiness_rule: {
        requirements: [
          { exercise_id, target_reps: c.target_reps ?? null, target_seconds: c.target_seconds ?? null },
        ],
      },
      is_premium: false,
    });
  }

  // Both tables are pure seed content → wipe and reinsert (idempotent).
  await supabase.from('exercise_progressions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (progRows.length) {
    const { error } = await supabase.from('exercise_progressions').insert(progRows);
    if (error) throw error;
  }
  if (chRows.length) {
    const { error } = await supabase.from('challenges').insert(chRows);
    if (error) throw error;
  }

  console.log(`✅  Seeded ${progRows.length} progressions, ${chRows.length} challenges.`);
  if (unmatched.length) {
    console.log('⚠️  Unmatched (add these exercises to the catalog, then re-run):');
    for (const u of unmatched) console.log('   -', u);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
