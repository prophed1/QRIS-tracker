import {createClient} from '@supabase/supabase-js';
try {
    createClient('your-project.supabase.co', 'key');
} catch(e) {
    console.log("THROWN:", e.message);
}
