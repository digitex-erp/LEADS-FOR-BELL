// --- Multi-AI Provider Factory for Bell24h ---
// Prioritizes NVIDIA Minimax, falls back to DeepSeek, then Gemini.

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const AI_CONFIG = {
  minimax: {
    model: 'minimaxai/minimax-m2.5',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    key: import.meta.env.VITE_NVIDIA_MINIMAX_KEY
  },
  deepseek: {
    model: 'deepseek-ai/deepseek-v3',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    key: import.meta.env.VITE_NVIDIA_DEEPSEEK_KEY
  }
};

async function callNvidiaNIM(provider: 'minimax' | 'deepseek', prompt: string, history: ChatMessage[] = []) {
  const config = AI_CONFIG[provider];
  if (!config.key || config.key.includes("YOUR_")) throw new Error(`${provider} key missing`);

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
    if (AI_CONFIG.minimax.key && !AI_CONFIG.minimax.key.includes("YOUR_")) {
      console.log("⚡ AI Engine: Using Minimax-m2.5...");
      return await callNvidiaNIM('minimax', message, history);
    }
    
    // 2. Try Backup: DeepSeek
    if (AI_CONFIG.deepseek.key && !AI_CONFIG.deepseek.key.includes("YOUR_")) {
      console.log("🧠 AI Engine: Using DeepSeek-v3...");
      return await callNvidiaNIM('deepseek', message, history);
    }

    // 3. Fallback: Gemini (if available)
    // For now, let's just return a demo response to prevent crashes
    console.warn("⚠️ AI Engine: No keys found. Entering Demo Mode.");
    return {
      text: "Bell24h AI is in Demo Mode. To activate real-time intelligence, please configure VITE_NVIDIA_MINIMAX_KEY in your environment.",
      reasoning: null
    };

  } catch (error: any) {
    console.error("❌ AI Orchestrator Error:", error);
    
    // Auto-fallback to DeepSeek if Minimax failed
    if (AI_CONFIG.deepseek.key && !message.includes("fallback_active")) {
      try {
        console.log("🔄 Automatic Fallback: Switching to DeepSeek...");
        return await callNvidiaNIM('deepseek', message + " (fallback_active)", history);
      } catch (e) {
        return { text: "Critical AI failure. Please check your provider quotas." };
      }
    }

    return { text: `Service unreachable: ${error.message}. Site remains active.` };
  }
};

// RFQ Extraction Utility - Maps voice transcript to structured fields
export const generateRFQ = async (transcript: string) => {
  const prompt = `You are a procurement expert. Analyze this industrial voice transcript and extract RFQ details.
  Transcript: "${transcript}"
  
  Return ONLY a valid JSON object:
  {
    "title": "Clear requirement title",
    "quantity": "Amount with units",
    "specifications": "Technical details",
    "category": "One of: Steel, Chemicals, Electronics, Textiles, Agriculture"
  }`;
  
  try {
    const result = await chatWithGrounding(prompt);
    // Parse the JSON from the markdown-wrapped or raw response
    const jsonStr = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("RFQ Extraction failed:", e);
    return {
      title: "Manual RFQ Entry",
      quantity: "Unknown",
      specifications: transcript,
      category: "General"
    };
  }
};
