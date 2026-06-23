// Trigger a test LowTrack webhook
// Usage: node scripts/trigger-lowtrack.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fetch = require('node-fetch');

const endpoint = process.env.VITE_LOWTRAK_ENDPOINT || 'https://lowtrack.com.br/api/webhook';
const token = process.env.VITE_LOWTRAK_API_KEY || process.env.LOWTRAK_API_KEY;

if (!token) {
  console.error('LowTrack API token not set in environment variables (VITE_LOWTRAK_API_KEY or LOWTRAK_API_KEY).');
  process.exit(1);
}

// Example payload – adjust fields as needed for your use case
const payload = {
  event: 'sale.approved',
  transaction_id: 'test-12345',
  reference: 'ref-67890',
  amount: 1000,
  method: 'Evolux Pay',
  status: 'Concluído',
  customer: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890'
  },
  user_id: 'test_user'
};

fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Mozilla/5.0 (Node.js)'
  },
  body: JSON.stringify(payload)
})
  .then(res => {
    console.log('LowTrack response status:', res.status, res.ok ? 'OK' : 'Error');
    return res.text();
  })
  .then(text => console.log('Response body:', text))
  .catch(err => console.error('Error sending LowTrack webhook:', err));
