# AI Studio Agent Instructions

## Supabase Initialization
When configuring `@supabase/supabase-js`, **always** sanitize the `VITE_SUPABASE_URL` environment variable before passing it to `createClient`. Users frequently paste the REST endpoint (`https://<ref>.supabase.co/rest/v1`) instead of the base Project URL. 

To prevent the `Invalid path specified in request URL` (PGRST125) error caused by duplicate paths (`/rest/v1/rest/v1`), implement the following sanitization in your `supabase.ts` or `supabase.js` file:

```typescript
let rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
rawUrl = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');

if (rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace(/\/rest\/v1$/, '');
}

// Fallback logic
let supabaseUrl = 'https://placeholder.supabase.co';
if (rawUrl) {
    if (!rawUrl.startsWith('http')) {
        rawUrl = 'https://' + rawUrl;
    }
    try {
        const parsed = new URL(rawUrl);
        supabaseUrl = parsed.origin; 
    } catch (e) {
        console.warn('VITE_SUPABASE_URL is not a valid URL:', rawUrl);
    }
}
```
