const fetch = require('node-fetch');

async function testLowTrack() {
  const merchantLowtrackToken = "lt_d36d2a896e949a623b1ece46048a7098084d02079dc47ec6";
  const body = {
    event: 'sale.approved',
    transaction_id: 'ORD1781723094727',
    reference: 'ORD1781723094727',
    amount: 1,
    method: 'e-Mola',
    status: 'Concluído',
    customer: {
      name: 'HT',
      email: 'joaomaibass1@gmail.com',
      phone: '877575186'
    },
    user_id: 'joaomaibass1@gmail.com'
  };

  console.log("Sending to LowTrack...", JSON.stringify(body, null, 2));

  try {
    const res = await fetch('https://lowtrack.com.br/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${merchantLowtrackToken}`,
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(body)
    });
    
    console.log('Status:', res.status);
    const data = await res.text();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testLowTrack();
