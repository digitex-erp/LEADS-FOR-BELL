/**
 * Bell24h B2B Pulse Test
 * Run this from your Main Marketplace environment to verify the handshake.
 */

async function testHandshake() {
  const FACTORY_URL = "https://leads-for-bell.vercel.app/api/v1/leads/verified";
  const SECRET_KEY = "PASTE_YOUR_INTERNAL_FEED_KEY_HERE";

  console.log("📡 Initiating B2B Handshake Pulse...");

  try {
    const response = await fetch(FACTORY_URL, {
      method: "GET",
      headers: {
        "x-bell24h-auth": SECRET_KEY,
        "Accept": "application/json"
      }
    });

    if (response.status === 401) {
      console.error("❌ Handshake Failed: Invalid API Key.");
      return;
    }

    const data = await response.json();
    console.log("✅ Handshake Success!");
    console.log(`📊 Factory Status: ${data.factory}`);
    console.log(`🚀 Marketplace Ready Leads: ${data.count}`);
    
    if (data.leads && data.leads.length > 0) {
      console.log("💎 Sample Lead Data:", data.leads[0]);
    } else {
      console.log("ℹ️ Note: No leads approved yet. Go to /suppliers?admin=true to approve some.");
    }

  } catch (error) {
    console.error("❌ Connection Error:", error);
  }
}

// testHandshake();
