import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiModel = (modelName: string = "gemini-3.1-pro-preview") => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  const ai = new GoogleGenAI({ apiKey: key });
  return ai;
};

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export const chatWithGrounding = async (
  message: string,
  history: ChatMessage[] = [],
  location?: { lat: number; lng: number }
) => {
  const ai = getGeminiModel("gemini-2.5-flash"); 
  if (!ai) {
    return {
      text: "Gemini API key is not configured. Please add GEMINI_API_KEY to your secrets.",
      groundingChunks: [],
    };
  }
  
  const tools: any[] = [{ googleMaps: {} }, { googleSearch: {} }];
  
  const config: any = {
    tools,
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng,
        },
      },
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: "user", parts: [{ text: message }] }
    ],
    config,
  });

  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
};
