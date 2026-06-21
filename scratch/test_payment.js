import fetch from 'node-fetch';
const payload = {
  phone: '+258123456789',
  amount: 10,
  client_id: process.env.E2_CLIENT_ID || '',
  client_secret: process.env.E2_CLIENT_SECRET || ''
};
fetch('http://localhost:5174/api/e2payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
