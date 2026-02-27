import { Company } from './supabase';

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
 * Calculates a lead score from 0 to 100
 */
export const calculateLeadScore = (company: Partial<Company>, criteria: ScoringCriteria = DEFAULT_CRITERIA): number => {
  let score = 30; // Base score

  // Industry weight
  if (company.industry && criteria.industryWeights[company.industry]) {
    score += criteria.industryWeights[company.industry];
  }

  // Location weight
  if (company.city && criteria.locationWeights[company.city]) {
    score += criteria.locationWeights[company.city];
  }

  // Enrichment bonuses
  if (company.website) score += criteria.hasWebsiteBonus;
  if (company.gst_number) score += criteria.hasGSTBonus;

  // Cap at 100
  return Math.min(100, score);
};
