import { Company, upsertCompany } from "./supabase";
import { MASTER_CATEGORIES } from "../constants/categories";

const MOCK_COMPANY_NAMES = [
  "Bharat", "Indo", "Global", "Apex", "Swift", "Zenith", "Royal", "Elite", "Prime", "Super"
];

const MOCK_COMPANY_SUFFIXES = [
  "Industries", "Enterprises", "Solutions", "Technologies", "Manufacturing", "Logistics", "Systems", "Group", "Corp", "Limited"
];

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];

export async function simulateLeads(categoryName: string, count: number = 10): Promise<void> {
  const category = MASTER_CATEGORIES.find(c => c.name === categoryName);
  if (!category) throw new Error(`Category ${categoryName} not found.`);

  for (let i = 0; i < count; i++) {
    const name = `${MOCK_COMPANY_NAMES[Math.floor(Math.random() * MOCK_COMPANY_NAMES.length)]} ${MOCK_COMPANY_SUFFIXES[Math.floor(Math.random() * MOCK_COMPANY_SUFFIXES.length)]}`;
    const subCategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    
    // Generate a random GST-like string
    const gst = `29${Math.random().toString(36).substring(2, 12).toUpperCase()}1Z5`;

    const lead: Partial<Company> = {
      name,
      main_category: category.name,
      sub_category: subCategory,
      city,
      gst_number: gst,
      status: 'new',
      industry: category.name,
      lead_score: Math.floor(Math.random() * 40) + 30, // Base score 30-70
      tags: ['Simulated', category.name]
    };

    await upsertCompany(lead);
  }
}
