import { createClient } from '@supabase/supabase-js';

// Ultra-safe extraction of base URL in case user pastes the REST URL or includes quotes
let rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
rawUrl = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');

// If the user accidentally provided the /rest/v1 endpoint or similar, strip it out
if (rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace(/\/rest\/v1$/, '');
}

// Default to a placeholder if the URL is completely empty or invalid
let supabaseUrl = 'https://placeholder.supabase.co';
if (rawUrl) {
    if (!rawUrl.startsWith('http')) {
        rawUrl = 'https://' + rawUrl;
    }
    try {
        const parsed = new URL(rawUrl);
        supabaseUrl = parsed.origin; // Only keep the origin (e.g. https://xyz.supabase.co)
    } catch (e) {
        console.warn('VITE_SUPABASE_URL is not a valid URL:', rawUrl);
    }
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, '');

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
