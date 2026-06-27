import type { EcoActionType } from "@/lib/eco-actions";

export type CompassSector = "general" | "manufacturing" | "services" | "construction" | "energy";

export type MaterialityTopicDef = {
  id: string;
  griRef: string;
  esrsRef: string;
  pillar: "E" | "S" | "G";
  label_en: string;
  label_th: string;
  summary_en: string;
  summary_th: string;
  sectorPrior: { impact: number; financial: number };
  actionHints: EcoActionType[];
  interestTags?: string[];
};

export type CompassV2Input = {
  sector: CompassSector;
  orgSize: "solo" | "sme" | "enterprise";
  region: "th" | "global";
  maturity: "start" | "growing" | "advanced";
  goals: string[];
  stakeholderRatings: Record<string, number>;
  financialRatings: Record<string, number>;
  profileInterests?: string[];
};

export type ScoredTopic = MaterialityTopicDef & {
  /** User stakeholder rating (1–5) — matrix Y axis */
  surveyImpact: number;
  /** User financial rating (1–5) — matrix X axis */
  surveyFinancial: number;
  /** Blended score for materiality ranking */
  impactScore: number;
  financialScore: number;
  materialityIndex: number;
  isMaterial: boolean;
};

export type CompassV2Result = {
  version: 2;
  assessedAt: string;
  sector: CompassSector;
  topics: ScoredTopic[];
  materialTopics: ScoredTopic[];
  suggestedActions: EcoActionType[];
  frameworkNote: { gri: string; esrs: string };
};
