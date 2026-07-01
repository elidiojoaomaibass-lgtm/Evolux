const fetch = require('node-fetch');

async function testWebhook() {
  const payload = {
    transaction_id: 'test_transaction_123',
    status: 'SUCCESSFUL',
    reference: 'TESTREF123',
    user_id: 'test_user_id'
  };

  try {
    const res = await fetch('http://localhost:5173/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testWebhook();
