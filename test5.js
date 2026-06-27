async function run() {
    try {
        const res = await fetch('https://supabase.com/dashboard/project/abcde/rest/v1/transactions');
        console.log(res.status);
        console.log(await res.text());
    } catch(e) {
        console.error(e.message);
    }
}
run();
