/** Compass v2 — GRI/ESRS-inspired double materiality */
export type {
  CompassSector,
  CompassV2Input,
  CompassV2Result,
  MaterialityTopicDef,
  ScoredTopic,
} from "@/lib/compass/types";
export { computeMaterialityV2, computeMaterialityV2 as computeMateriality } from "@/lib/compass/scoring";
export { getTopicsForSector, SECTOR_LABELS, defaultRatings } from "@/lib/compass/topic-library";
export {
  bubbleOffset,
  bubbleSizePx,
  combinedMaterialityLevel,
  groupSurveyCoordinates,
  isPriorityQuadrant,
  SEVERITY_COLORS,
  severityColorLevel,
  severityLevelFromRating,
  severityStyles,
  topicBubblePreviewStyle,
} from "@/lib/compass/matrix-visual";