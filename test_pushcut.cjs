const url = "https://api.pushcut.io/cVW3dbwXxGaQ6g5LDO2x1/notifications/MinhaNotifica%C3%A7%C3%A3o1";
async function test() {
  console.log("Testing fetch to:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'sale_approved',
        timestamp: new Date().toISOString(),
        transaction_id: "test1234",
        reference: "test1234",
        amount: 1,
        method: 'e-Mola',
        customer: { name: "Test", email: "test@test.com", phone: "877575186" },
        status: "Concluído"
      })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
