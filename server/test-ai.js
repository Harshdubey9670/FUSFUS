async function testAI() {
  try {
    // 1. Get token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) throw new Error("No token returned");
    console.log("Logged in:", token.substring(0, 10));

    // 2. Test update settings
    const settingsRes = await fetch('http://localhost:5000/api/settings', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ ai: { enableAiFeatures: false } })
    });
    const settingsData = await settingsRes.json();
    console.log("Settings Updated:", settingsData.data?.ai);

    // 3. Test AI endpoint
    const aiRes = await fetch('http://localhost:5000/api/ai/caption', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ topic: 'Fitness', tone: 'Witty' })
    });
    const aiData = await aiRes.json();
    console.log("AI Response:", aiData);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testAI();
