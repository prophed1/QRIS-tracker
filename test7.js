async function run() {
    try {
        const res = await fetch('https://vsndrwghqobejoakmxld.supabase.co/rest/v1/transactions?select=*');
        console.log(res.status);
        console.log(await res.text());
    } catch(e) {
        console.error(e.message);
    }
}
run();
