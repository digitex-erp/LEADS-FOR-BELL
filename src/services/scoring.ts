import { Company } from './supabase';
import { HIGH_PRIORITY_CATEGORIES } from '../constants/categories';

export interface ScoringCriteria {
  industryWeights: Record<string, number>;
  locationWeights: Record<string, number>;
  hasWebsiteBonus: number;
  hasGSTBonus: number;
}

const DEFAULT_CRITERIA: ScoringCriteria = {
  industryWeights: {
    'SaaS': 20,
    'Logistics': 15,
    'Manufacturing': 10,
    'Renewables': 18,
    'Retail': 5,
  },
  locationWeights: {
    'Bangalore': 10,
    'Mumbai': 8,
    'Delhi': 8,
    'Pune': 7,
  },
  hasWebsiteBonus: 10,
  hasGSTBonus: 15,
};

/**
 * Calculates a lead score from 0 to 100 based on weighted criteria:
 * - GST Verified: +30 pts
 * - Category Match: +25 pts
 * - Contact Person Name available: +15 pts
 * - Interaction in last 7 days: +20 pts
 * - Location Proximity: +10 pts
 */
export const calculateLeadScore = (company: any): number => {
  let score = 0;

  // 1. GST Verified (+30 pts)
  if (company.gst_number && company.gst_number.length === 15) {
    score += 30;
  }

  // 2. Category Match (+25 pts)
  // Assuming 'industry' is the category. If it's present, we consider it a match for now.
  if (company.industry) {
    score += 25;
  }

  // 3. Contact Person Name available (+15 pts)
  // We check if there's a contact name in the company object or if we have contacts
  if (company.contact_name || (company.contacts && company.contacts.length > 0)) {
    score += 15;
  }

  // 4. Interaction in last 7 days (+20 pts)
  if (company.last_interaction) {
    const lastInteraction = new Date(company.last_interaction);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      score += 20;
    }
  }

  // 5. Location Proximity (+10 pts)
  // For now, if city is present, we give the bonus. 
  // In a real app, this would compare against a target location.
  if (company.city) {
    score += 10;
  }

  // 6. High Priority Category Bonus (+40 pts)
  if (company.main_category && HIGH_PRIORITY_CATEGORIES.includes(company.main_category)) {
    score += 40;
  }

  return Math.min(100, score);
};
