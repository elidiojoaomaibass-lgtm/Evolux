const fetch = require('node-fetch');

async function run() {
  const transaction_id = 'ORD1781723585380';
  const reference = 'ORD1781723585380';
  const amount = 1;
  const payMethod = 'e-Mola';
  const finalStatus = 'Concluído';
  const userId = 'joaomaibass1@gmail.com';
  
  const customerName = 'TV';
  const customerEmail = 'joaomaibass1@gmail.com';
  const phone = '877575186';
  
  const pushcutEndpoint = process.env.VITE_PUSHCUT_ENDPOINT || process.env.PUSHCUT_ENDPOINT || '';
  const pushcutApiKey = process.env.VITE_PUSHCUT_API_KEY || process.env.PUSHCUT_API_KEY || '';

  console.log('Disparando Webhook Local (Simulando Vercel)...');

  // Pushcut (Global)
  if (pushcutEndpoint && pushcutApiKey) {
    console.log('Enviando para Pushcut Global...');
    try {
      const res = await fetch(pushcutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pushcutApiKey}` },
        body: JSON.stringify({ transaction_id, amount, status: finalStatus, user_id: userId }),
      });
      console.log('Pushcut Global:', res.status);
    } catch (e) { console.error(e); }
  }

  // Merchant Webhook (Pushcut)
  const merchantWebhookUrl = "https://api.pushcut.io/cVW3dbwXxGaQ6g5LDO2x1/notifications/MinhaNotificação1";
  console.log('Enviando para Merchant Webhook (Pushcut Cliente)...');
  try {
    const res = await fetch(merchantWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'sale_approved',
        timestamp: new Date().toISOString(),
        transaction_id,
        reference,
        amount,
        method: payMethod,
        customer: { name: customerName, email: customerEmail, phone },
        status: finalStatus
      })
    });
    console.log('Merchant Webhook:', res.status);
  } catch (e) { console.error(e); }

  // LowTrack
  const merchantLowtrackToken = "lt_d36d2a896e949a623b1ece46048a7098084d02079dc47ec6";
  console.log('Enviando para LowTrack...');
  try {
    const res = await fetch('https://lowtrack.com.br/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${merchantLowtrackToken}`,
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        event: 'sale.approved',
        transaction_id,
        reference,
        amount,
        method: payMethod,
        status: finalStatus,
        customer: { name: customerName, email: customerEmail, phone },
        user_id: customerEmail
      }),
    });
    console.log('LowTrack:', res.status, await res.text());
  } catch (e) { console.error(e); }
  
  console.log('Simulação concluída.');
}

run();
