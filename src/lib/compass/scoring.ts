import type { EcoActionType } from "@/lib/eco-actions";
import { getTopicsForSector } from "@/lib/compass/topic-library";
import type { CompassV2Input, CompassV2Result, ScoredTopic } from "@/lib/compass/types";

function avg(nums: number[]): number {
  if (nums.length === 0) return 3;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function clamp(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n * 10) / 10));
}

function goalImpactBoost(topicId: string, goals: string[]): number {
  let b = 0;
  if (goals.includes("carbon") && ["ghg_emissions", "energy", "supplier_env"].includes(topicId)) b += 1;
  if (goals.includes("reporting") && ["governance", "anti_corruption", "public_policy"].includes(topicId)) b += 1;
  if (goals.includes("community") && ["local_communities", "diversity", "occupational_health"].includes(topicId)) b += 1;
  return b;
}

function goalFinancialBoost(topicId: string, goals: string[]): number {
  if (goals.includes("reporting") && ["governance", "anti_corruption", "ghg_emissions"].includes(topicId)) return 1;
  return 0;
}

function orgSizeBoost(orgSize: CompassV2Input["orgSize"], topicId: string): number {
  if (orgSize !== "enterprise") return 0;
  if (["governance", "anti_corruption", "supplier_env", "customer_privacy"].includes(topicId)) return 1;
  return 0;
}

function regionImpactBoost(region: CompassV2Input["region"], topicId: string): number {
  if (region !== "th") return 0;
  if (["local_communities", "occupational_health", "water"].includes(topicId)) return 0.5;
  return 0;
}

function interestBoost(interests: string[] | undefined, tags: string[] | undefined): number {
  if (!interests?.length || !tags?.length) return 0;
  return interests.some((i) => tags.includes(i)) ? 0.5 : 0;
}

function maturityBoost(maturity: CompassV2Input["maturity"], topicId: string): number {
  if (maturity === "start" && ["waste", "energy", "governance"].includes(topicId)) return 0.5;
  return 0;
}

export function computeMaterialityV2(input: CompassV2Input): CompassV2Result {
  const topics = getTopicsForSector(input.sector);

  const scored: ScoredTopic[] = topics.map((t) => {
    const stakeholder = input.stakeholderRatings[t.id] ?? 3;
    const financial = input.financialRatings[t.id] ?? 3;

    const surveyImpact = clamp(stakeholder);
    const surveyFinancial = clamp(financial);

    const adjustedSectorImpact = clamp(
      avg([
        t.sectorPrior.impact + goalImpactBoost(t.id, input.goals),
        t.sectorPrior.impact + regionImpactBoost(input.region, t.id),
        t.sectorPrior.impact + interestBoost(input.profileInterests, t.interestTags),
        t.sectorPrior.impact + maturityBoost(input.maturity, t.id),
      ]),
    );

    const adjustedSectorFinancial = clamp(
      avg([
        t.sectorPrior.financial + goalFinancialBoost(t.id, input.goals),
        t.sectorPrior.financial + orgSizeBoost(input.orgSize, t.id),
      ]),
    );

    const impactScore = clamp(0.75 * stakeholder + 0.25 * adjustedSectorImpact);
    const financialScore = clamp(0.75 * financial + 0.25 * adjustedSectorFinancial);

    const materialityIndex = Math.round(impactScore * financialScore * 10) / 10;
    const isMaterial = (impactScore >= 3 && financialScore >= 3) || materialityIndex >= 12;

    return {
      ...t,
      surveyImpact,
      surveyFinancial,
      impactScore,
      financialScore,
      materialityIndex,
      isMaterial,
    };
  });

  scored.sort((a, b) => b.materialityIndex - a.materialityIndex);

  const materialTopics = scored.filter((t) => t.isMaterial).slice(0, 5);

  const actionSet = new Set<EcoActionType>();
  for (const t of materialTopics.length ? materialTopics : scored.slice(0, 3)) {
    t.actionHints.forEach((a) => actionSet.add(a));
  }

  return {
    version: 2,
    assessedAt: new Date().toISOString(),
    sector: input.sector,
    topics: scored,
    materialTopics,
    suggestedActions: [...actionSet].slice(0, 3),
    frameworkNote: {
      gri: "GRI Universal Standards & Topic Standards",
      esrs: "ESRS E/S/G (double materiality methodology)",
    },
  };
}
