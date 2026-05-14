import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportExercises() {
  console.log('Fetching exercises from Supabase...');
  const { data, error } = await supabase
    .from('exercises')
    .select('*');

  if (error) {
    console.error('Error fetching exercises:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No exercises found.');
    return;
  }

  console.log(`Found ${data.length} exercises. Generating CSV...`);

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  const outputPath = path.join(process.cwd(), 'exercises_export.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf8');

  console.log(`Successfully exported exercises to ${outputPath}`);
}

exportExercises().catch(console.error);
