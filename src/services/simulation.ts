import { Company, upsertCompany } from "./supabase";
import { MASTER_CATEGORIES } from "../constants/categories";
import { INDUSTRY_DATA, MockLead } from "../data/industry_dictionary";

const MOCK_COMPANY_NAMES = [
  "Bharat", "Indo", "Global", "Apex", "Swift", "Zenith", "Royal", "Elite", "Prime", "Super"
];

const MOCK_COMPANY_SUFFIXES = [
  "Industries", "Enterprises", "Solutions", "Technologies", "Manufacturing", "Logistics", "Systems", "Group", "Corp", "Limited"
];

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];

export async function simulateLeads(categoryName: string, count: number = 10): Promise<void> {
  const category = MASTER_CATEGORIES.find(c => c.name === categoryName);
  // We allow simulation even if not in MASTER_CATEGORIES if it's in INDUSTRY_DATA
  const dictionaryLeads = INDUSTRY_DATA[categoryName];

  for (let i = 0; i < count; i++) {
    let lead: Partial<Company>;

    if (dictionaryLeads && dictionaryLeads.length > 0) {
      // Pull from dictionary (looping if count > dictionary length)
      const mock = dictionaryLeads[i % dictionaryLeads.length];
      lead = {
        name: mock.name,
        main_category: categoryName,
        sub_category: category?.subcategories[0] || 'General',
        city: mock.city,
        state: mock.state,
        gst_number: `29${Math.random().toString(36).substring(2, 12).toUpperCase()}1Z5`,
        status: 'new',
        industry: categoryName,
        lead_score: mock.lead_score,
        tags: ['High Quality', 'Dictionary', categoryName]
      };
    } else {
      // Fallback to random generation
      const name = `${MOCK_COMPANY_NAMES[Math.floor(Math.random() * MOCK_COMPANY_NAMES.length)]} ${MOCK_COMPANY_SUFFIXES[Math.floor(Math.random() * MOCK_COMPANY_SUFFIXES.length)]}`;
      const subCategory = category?.subcategories[Math.floor(Math.random() * category.subcategories.length)] || 'General';
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      
      lead = {
        name,
        main_category: categoryName,
        sub_category: subCategory,
        city,
        gst_number: `29${Math.random().toString(36).substring(2, 12).toUpperCase()}1Z5`,
        status: 'new',
        industry: categoryName,
        lead_score: Math.floor(Math.random() * 40) + 30,
        tags: ['Simulated', categoryName]
      };
    }

    await upsertCompany(lead);
  }
}
