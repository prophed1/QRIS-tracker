import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseAnonKey = 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        console.log({data, error});
    } catch(e) {
        console.error("CAUGHT:", e.message);
    }
}
run();
