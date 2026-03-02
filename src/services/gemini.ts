// --- Multi-AI Provider Factory ---
// This ensures the site never crashes even if API keys are missing or quotas are hit.

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const AI_CONFIG = {
  minimax: {
    model: 'minimaxai/minimax-m2.5',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    key: import.meta.env.VITE_NVIDIA_API_KEY_MINIMAX
  },
  deepseek: {
    model: 'deepseek-ai/deepseek-v3.2',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    key: import.meta.env.VITE_NVIDIA_API_KEY_DEEPSEEK
  }
};

async function callNvidiaNIM(provider: 'minimax' | 'deepseek', prompt: string, history: ChatMessage[]) {
  const config = AI_CONFIG[provider];
  if (!config.key) throw new Error(`${provider} key missing`);

  const messages = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0].text
    })),
    { role: 'user', content: prompt }
  ];

  const body: any = {
    model: config.model,
    messages,
    stream: false
  };

  if (provider === 'deepseek') {
    body.extra_body = { thinking: true };
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.key}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `${provider} API request failed`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    reasoning: data.choices[0].message.reasoning_content || null
  };
}

export const chatWithGrounding = async (
  message: string,
  history: ChatMessage[] = []
) => {
  try {
    // 1. Try Primary: Minimax
    if (AI_CONFIG.minimax.key) {
      console.log("⚡ AI Engine: Using Minimax-m2.5...");
      return await callNvidiaNIM('minimax', message, history);
    }
    
    // 2. Try Backup: DeepSeek
    if (AI_CONFIG.deepseek.key) {
      console.log("🧠 AI Engine: Using DeepSeek-v3.2...");
      return await callNvidiaNIM('deepseek', message, history);
    }

    // 3. Fallback: Mock/Demo Mode
    console.warn("⚠️ AI Engine: No keys found. Entering Demo Mode.");
    return {
      text: "Intelligence Engine is in Demo Mode. Please configure VITE_NVIDIA_API_KEY_MINIMAX in Vercel to activate real-time leads.",
      groundingChunks: []
    };

  } catch (error: any) {
    console.error("❌ AI Orchestrator Error:", error);
    
    // Auto-fallback if primary failed but backup exists
    if (AI_CONFIG.deepseek.key && !message.includes("fallback_active")) {
      try {
        return await callNvidiaNIM('deepseek', message + " (fallback_active)", history);
      } catch (e) {
        return { text: "Critical AI failure. Please check your NVIDIA NIM quotas." };
      }
    }

    return { text: `Error: ${error.message}. Site remaining live via safety safety net.` };
  }
};

// RFQ Extraction Utility
export const generateRFQ = async (transcript: string) => {
  const prompt = `Extract industrial RFQ details from this transcript: "${transcript}". 
  Return a structured summary with Company, Requirements, Quantity, and Urgency.`;
  return await chatWithGrounding(prompt);
};
