async function run() {
    try {
        const res = await fetch('https://placeholder.supabase.co/rest/v1/transactions?select=%2A');
        console.log(res.status);
        console.log(await res.text());
    } catch(e) {
        console.error(e.message);
    }
}
run();
