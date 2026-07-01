const url = process.env.VITE_SUPABASE_URL + '/rest/v1/transactions?select=*&order=createdat.desc&limit=2';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

fetch(url, {
  headers: {
    'apikey': anonKey,
    'Authorization': 'Bearer ' + anonKey
  }
}).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
