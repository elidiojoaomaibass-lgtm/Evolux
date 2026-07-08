const token = 'RLX_ADMIN_2026';

async function test() {
  const url = 'https://checkout.rlxl.ink/api.php';
  
  const payload = new URLSearchParams({
    action: 'pay',
    phone: '841234567',
    amount: '50',
    nome_cliente: 'Teste'
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    console.log('Status HTTP:', res.status);
    const text = await res.text();
    console.log('Body:', JSON.stringify(text));
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

test();
