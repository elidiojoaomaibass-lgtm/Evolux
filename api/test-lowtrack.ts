export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const endpoint = process.env.VITE_LOWTRAK_ENDPOINT || process.env.LOWTRAK_ENDPOINT || 'https://api.lowtrak.com/sales';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transaction_id: 'test_lt_' + Date.now(),
        amount: 1500,
        status: 'Concluído',
        user_id: 'user_test'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `LowTrack API Error: ${text}` });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Test LowTrack Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
