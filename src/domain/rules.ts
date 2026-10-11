// Unified collection: every domain definition evaluated, concatenated.
// Thin by design — all domain knowledge lives in domains.ts (data).

import { DOMAIN_DEFS } from './domains';
import { evaluateDomainEvidence } from './domain-engine';
import { yogaEngine } from './yoga-engine';
import type { EvidenceEngine } from './engines';
import type { Evidence, TopicId } from './types';

export const collectEvidence: EvidenceEngine = (input) => {
  const out: Evidence[] = [];
  const yogas = yogaEngine(input.charts.D1, input.aspects);
  for (const domain of Object.keys(DOMAIN_DEFS) as TopicId[]) {
    out.push(...evaluateDomainEvidence(DOMAIN_DEFS[domain], input.charts, input.aspects, yogas));
  }
  return out;
};
