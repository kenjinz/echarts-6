export type CapabilityClassification =
  | 'Native'
  | 'Native with wiring'
  | 'Workaround'
  | 'Unsupported'
  | 'Inconclusive';

export type EvidenceConfidence = 'High' | 'Medium' | 'Low';
export type ImplementationComplexity = 'Low' | 'Medium' | 'High';

export interface ScorecardRow {
  capabilityId: string;
  capability: string;
  appliesTo: string;
  experiment: string;
  nativeApi: string;
  classification: CapabilityClassification;
  confidence: EvidenceConfidence;
  evidence: string[];
  limitation: string;
  complexity: ImplementationComplexity;
}

