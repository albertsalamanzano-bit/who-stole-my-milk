import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const BAD_WORDS = [
  'puto',
  'puta',
  'mierda',
  'gilipollas',
  'cabron',
  'cabrón',
  'pene',
  'polla',
  'coño',
  'hijoputa',
  'joder',
  'maricon',
  'maricón',
  'zorra',
  'subnormal'
];

export function sanitizeText(str) {
  if (!str) return '';
  let clean = str.trim().replace(/\s+/g, ' ');
  BAD_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(regex, '***');
  });
  return clean;
}

export function cleanStatementText(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/^[«"'“”]+|[»"'“”]+$/g, '')
    .replace(/[\.…]+$/g, '')
    .trim();
}

export const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};
