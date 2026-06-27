import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let rawUrl = process.env.VITE_SUPABASE_URL || '';
rawUrl = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
if (rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace(/\/rest\/v1$/, '');
}

let supabaseUrl = 'https://placeholder.supabase.co';
if (rawUrl) {
    if (!rawUrl.startsWith('http')) {
        rawUrl = 'https://' + rawUrl;
    }
    try {
        const parsed = new URL(rawUrl);
        supabaseUrl = parsed.origin; 
    } catch (e) {}
}
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, '');

console.log("URL:", supabaseUrl);
console.log("KEY:", supabaseAnonKey?.substring(0, 5) + "...");

const supabase = createClient(supabaseUrl, supabaseAnonKey || 'placeholder-key');

async function run() {
    const { data, error } = await supabase.from('transactions').select('*');
    console.log("ERROR:", error);
}
run();
