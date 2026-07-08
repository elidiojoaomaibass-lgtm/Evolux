import fetch from 'node-fetch';

async function testHexmo() {
  try {
    const res = await fetch('https://hexmo.net/api/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log('POST status:', res.status);
    console.log('POST body:', await res.text());
  } catch (err) {
    console.error(err);
  }
}
testHexmo();
