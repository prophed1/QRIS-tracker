const url = "https://placeholder.supabase.co/rest/v1/transactions?select=%2A";
fetch(url).then(r => r.text()).then(console.log).catch(console.error);
