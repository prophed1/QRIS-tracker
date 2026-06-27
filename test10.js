async function run() {
    try {
        const res = await fetch('https://vsndrwghqobejoakmxld.supabase.co/rest/v1//rest/v1/transactions?select=*', {
            headers: {
                apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzbmRyd2docW9iZWpvYWtteGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDY4MjMsImV4cCI6MjA5NTY4MjgyM30.PqefS8aaH53-PncDH8zNOiDF3guyKVFbin3-x0GUEHY'
            }
        });
        console.log(res.status);
        console.log(await res.text());
    } catch(e) {
        console.error(e.message);
    }
}
run();
