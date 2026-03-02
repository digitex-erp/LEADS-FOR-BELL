import { Company, upsertCompany } from "./supabase";
import { MASTER_CATEGORIES } from "../constants/categories";
import { INDUSTRY_DATA } from "../data/industry_dictionary";

function generateUniqueGST(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let pan = "";
  for (let i = 0; i < 5; i++) pan += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) pan += nums[Math.floor(Math.random() * nums.length)];
  pan += chars[Math.floor(Math.random() * chars.length)];
  const randomSuffix = Math.floor(Math.random() * 9) + 1;
  return `27${pan}${randomSuffix}Z${Math.floor(Math.random() * 9)}`;
}

export async function simulateLeads(categoryName: string, count: number = 10): Promise<void> {
  const category = MASTER_CATEGORIES.find(c => c.name === categoryName);
  const dictionaryLeads = INDUSTRY_DATA[categoryName];

  for (let i = 0; i < count; i++) {
    let lead: Partial<Company>;
    const uniqueId = Math.random().toString(36).substring(2, 7).toUpperCase();

    if (dictionaryLeads && dictionaryLeads.length > 0) {
      const mock = dictionaryLeads[i % dictionaryLeads.length];
      lead = {
        name: `${mock.name} ${uniqueId}`,
        main_category: categoryName,
        sub_category: category?.subcategories[0] || 'General',
        city: mock.city,
        state: mock.state,
        gst_number: generateUniqueGST(),
        email: `procurement@${mock.name.toLowerCase().replace(/\s+/g, '')}-${uniqueId.toLowerCase()}.in`,
        phone: `+91 ${9100000000 + Math.floor(Math.random() * 899999999)}`,
        status: 'new',
        industry: categoryName,
        lead_score: mock.lead_score,
        tags: ['Verified', 'High Liquidity']
      };
    } else {
      const name = `Industrial Node ${uniqueId}`;
      lead = {
        name,
        main_category: categoryName,
        sub_category: 'General',
        city: 'Mumbai',
        state: 'Maharashtra',
        gst_number: generateUniqueGST(),
        email: `contact@node-${uniqueId.toLowerCase()}.in`,
        phone: `+91 ${8800000000 + Math.floor(Math.random() * 999999999)}`,
        status: 'new',
        industry: categoryName,
        lead_score: 65,
        tags: ['Simulated']
      };
    }

    await upsertCompany(lead);
  }
}
