import { Company, upsertCompany } from "./supabase";
import { MASTER_CATEGORIES } from "../constants/categories";
import { INDUSTRY_DATA, MockLead } from "../data/industry_dictionary";
import { chatWithGrounding } from "./gemini";

const MOCK_COMPANY_NAMES = [
  "Bharat", "Indo", "Global", "Apex", "Swift", "Zenith", "Royal", "Elite", "Prime", "Super"
];

const MOCK_COMPANY_SUFFIXES = [
  "Industries", "Enterprises", "Solutions", "Technologies", "Manufacturing", "Logistics", "Systems", "Group", "Corp", "Limited"
];

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];

function generateGST(stateCode: string = "29"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let pan = "";
  for (let i = 0; i < 5; i++) pan += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) pan += nums[Math.floor(Math.random() * nums.length)];
  pan += chars[Math.floor(Math.random() * chars.length)];
  return `${stateCode}${pan}1Z5`;
}

export async function simulateLeads(categoryName: string, count: number = 10): Promise<void> {
  const category = MASTER_CATEGORIES.find(c => c.name === categoryName);
  const dictionaryLeads = INDUSTRY_DATA[categoryName];

  for (let i = 0; i < count; i++) {
    let lead: Partial<Company>;

    if (dictionaryLeads && dictionaryLeads.length > 0) {
      const mock = dictionaryLeads[i % dictionaryLeads.length];
      lead = {
        name: mock.name,
        main_category: categoryName,
        sub_category: category?.subcategories[0] || 'General',
        city: mock.city,
        state: mock.state,
        gst_number: generateGST(),
        email: `contact@${mock.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
        status: 'new',
        industry: categoryName,
        lead_score: mock.lead_score,
        tags: ['High Quality', 'Dictionary', categoryName]
      };
    } else {
      const name = `${MOCK_COMPANY_NAMES[Math.floor(Math.random() * MOCK_COMPANY_NAMES.length)]} ${MOCK_COMPANY_SUFFIXES[Math.floor(Math.random() * MOCK_COMPANY_SUFFIXES.length)]}`;
      const subCategory = category?.subcategories[Math.floor(Math.random() * category.subcategories.length)] || 'General';
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      
      lead = {
        name,
        main_category: categoryName,
        sub_category: subCategory,
        city,
        gst_number: generateGST(),
        email: `info@${name.toLowerCase().replace(/\s+/g, '')}.in`,
        phone: `+91 ${8000000000 + Math.floor(Math.random() * 999999999)}`,
        status: 'new',
        industry: categoryName,
        lead_score: Math.floor(Math.random() * 40) + 30,
        tags: ['Simulated', categoryName]
      };
    }

    await upsertCompany(lead);
  }
}
