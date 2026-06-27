import http from 'http';

http.get('http://127.0.0.1:3000/src/lib/supabase.ts', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(data); });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
