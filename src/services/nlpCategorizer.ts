import { GoogleGenAI } from "@google/genai";
import { MASTER_CATEGORIES } from "../constants/categories";

// Safe AI Initialization
const getAI = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!key || key.includes("YOUR_GEMINI_API_KEY") || key.length < 20) return null;
  try {
    return new GoogleGenAI(key);
  } catch (e) {
    console.error("Gemini init failed:", e);
    return null;
  }
};

export interface CategorizationResult {
  mainCategory: string;
  subCategory: string;
  confidence: number;
}

export async function categorizeBusiness(description: string): Promise<CategorizationResult> {
  if (!description || description.trim() === "") {
    return { mainCategory: "Uncategorized", subCategory: "None", confidence: 0 };
  }

  const ai = getAI();
  if (!ai) {
    console.warn("Categorization skipped: No API Key found.");
    return { mainCategory: "Uncategorized", subCategory: "None", confidence: 0 };
  }

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const categoriesList = MASTER_CATEGORIES.map(c => `${c.name} (${c.subcategories.join(", ")})`).join("\n");
    
    const prompt = `
      You are an industrial business classifier. 
      Given the following business description, map it to the most relevant category and subcategory from the provided list.
      
      Business Description: "${description}"
      
      Master Categories and Subcategories:
      ${categoriesList}
      
      Return ONLY a JSON object with the following structure:
      {
        "mainCategory": "The Name of the Main Category",
        "subCategory": "The Name of the Subcategory",
        "confidence": 0.0 to 1.0
      }
      
      If no category fits well, return "Uncategorized" for mainCategory.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const data = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim() || "{}");
    
    const categoryExists = MASTER_CATEGORIES.find(c => c.name === data.mainCategory);
    if (!categoryExists) {
      return { mainCategory: "Uncategorized", subCategory: "None", confidence: data.confidence || 0 };
    }

    return {
      mainCategory: data.mainCategory || "Uncategorized",
      subCategory: data.subCategory || "None",
      confidence: data.confidence || 0
    };
  } catch (error) {
    console.error("Categorization error:", error);
    return { mainCategory: "Uncategorized", subCategory: "None", confidence: 0 };
  }
}
