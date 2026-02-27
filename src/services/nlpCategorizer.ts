import { GoogleGenAI } from "@google/genai";
import { MASTER_CATEGORIES } from "../constants/categories";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CategorizationResult {
  mainCategory: string;
  subCategory: string;
  confidence: number;
}

export async function categorizeBusiness(description: string): Promise<CategorizationResult> {
  if (!description || description.trim() === "") {
    return { mainCategory: "Uncategorized", subCategory: "None", confidence: 0 };
  }

  try {
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Validate that the returned category exists in our master list
    const categoryExists = MASTER_CATEGORIES.find(c => c.name === result.mainCategory);
    if (!categoryExists) {
      return { mainCategory: "Uncategorized", subCategory: "None", confidence: result.confidence || 0 };
    }

    return {
      mainCategory: result.mainCategory || "Uncategorized",
      subCategory: result.subCategory || "None",
      confidence: result.confidence || 0
    };
  } catch (error) {
    console.error("Categorization error:", error);
    return { mainCategory: "Uncategorized", subCategory: "None", confidence: 0 };
  }
}
