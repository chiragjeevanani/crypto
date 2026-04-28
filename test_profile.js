const { authService } = require('./frontend/src/modules/auth/services/authService.js');
const fetch = require('node-fetch');

// Polyfill fetch for node
global.fetch = fetch;
// Mock import.meta.env
global.import = { meta: { env: { VITE_API_URL: 'http://localhost:5002/api' } } };

// Or simpler, just use fetch directly
async function test() {
  try {
    console.log("Registering test user...");
    const email = `test_${Date.now()}@example.com`;
    let res = await fetch("http://localhost:5002/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Old Name",
        email: email,
        password: "password123",
      })
    });
    
    let data = await res.json();
    console.log("Register response:", data);
    if (!data.success) throw new Error("Failed to register");
    
    const token = data.token;
    
    console.log("Updating profile...");
    res = await fetch("http://localhost:5002/api/auth/profile", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "New Name",
        bio: "New Bio",
        unallowed_field: "Hacker"
      })
    });
    
    data = await res.json();
    console.log("Update response:", data);
    
    console.log("Fetching Me...");
    res = await fetch("http://localhost:5002/api/auth/me", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    data = await res.json();
    console.log("Me response:", data);
    
  } catch (err) {
    console.error(err);
  }
}

test();
