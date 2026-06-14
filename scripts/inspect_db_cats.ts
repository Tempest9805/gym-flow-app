import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data, error } = await supabase.from('exercises').select('category, equipment, type');
  if (error) {
    console.error(error);
    return;
  }
  
  const categories = new Set();
  const equipment = new Set();
  const types = new Set();

  data.forEach(d => {
    if (d.category) categories.add(d.category);
    if (d.equipment) equipment.add(d.equipment);
    if (d.type) types.add(d.type);
  });

  console.log('--- Categories ---');
  console.log(Array.from(categories));
  
  console.log('--- Equipment ---');
  console.log(Array.from(equipment));

  console.log('--- Types ---');
  console.log(Array.from(types));
}

inspect();
