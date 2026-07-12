export type LetterType =
  | "approval"
  | "denial"
  | "request_for_information"
  | "deadline_notice"
  | "inspection_notice"
  | "unknown";

export type RiskFlag =
  | "denial_or_appeal"
  | "homelessness"
  | "medical_emergency"
  | "abuse_or_unsafe_home"
  | "disability_accommodation"
  | "immigration_sensitive";

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  retrievedAt: string;
  trustTier: 1 | 2 | 3 | 4;
}

export interface PolicyRule {
  id: string;
  topic: string;
  statement: string;
  appliesWhen?: string[];
  sourceIds: string[];
}

export interface PolicyPack {
  id: string;
  name: string;
  jurisdiction: string;
  disasterType: string;
  version: string;
  sources: SourceRecord[];
  rules: PolicyRule[];
}

export interface Deadline {
  label: string;
  text: string;
  source: "uploaded_letter" | "policy_pack";
}

export interface LetterAnalysis {
  letterType: LetterType;
  summary: string;
  detectedDeadlines: Deadline[];
  detectedRequests: string[];
  injectionWarnings: string[];
  needsHumanReview: boolean;
}

export interface CaseContext {
  county: string;
  disasterType: "wildfire";
  riskFlags: RiskFlag[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: "human_review" | "deadline" | "evidence" | "source_review";
  reason: string;
  sourceIds: string[];
}

export interface Checklist {
  items: ChecklistItem[];
}

export type EvidenceCategory = "identity" | "occupancy" | "insurance" | "damage";

export interface EvidenceItem {
  label: string;
  status: "missing" | "optional";
  sourceIds: string[];
}

export interface EvidenceGroup {
  category: EvidenceCategory;
  items: EvidenceItem[];
}

export interface EvidencePacket {
  groups: EvidenceGroup[];
}

export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
}

const injectionPatterns = [
  /ignore all previous instructions/i,
  /developer mode/i,
  /system prompt/i,
  /say .* approved/i
];

export const analyzeLetter = (letterText: string): LetterAnalysis => {
  const normalized = letterText.toLowerCase();
  const injectionWarnings = injectionPatterns
    .filter((pattern) => pattern.test(letterText))
    .map((pattern) => `Prompt injection pattern detected: ${pattern.source}`);

  const detectedRequests = [
    normalized.includes("proof of occupancy") ? "proof of occupancy" : "",
    normalized.includes("insurance") ? "insurance information" : ""
  ].filter(Boolean);

  const detectedDeadlines: Deadline[] = [];

  if (normalized.includes("appeal within 60 days")) {
    detectedDeadlines.push({ label: "appeal window", text: "appeal within 60 days", source: "uploaded_letter" });
  }

  if (normalized.includes("respond within 30 days")) {
    detectedDeadlines.push({ label: "response window", text: "respond within 30 days", source: "uploaded_letter" });
  }

  if (normalized.includes("denied") || normalized.includes("denial")) {
    return {
      letterType: "denial",
      summary: "This letter appears to deny the request and asks for careful human review before next steps.",
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: true
    };
  }

  if (normalized.includes("request for information") || normalized.includes("additional information")) {
    return {
      letterType: "request_for_information",
      summary: "This letter appears to request more information before a decision can be made.",
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: false
    };
  }

  if (normalized.includes("inspection") || normalized.includes("inspector")) {
    return {
      letterType: "inspection_notice",
      summary: "This letter appears to describe an inspection step.",
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: false
    };
  }

  if (detectedDeadlines.length > 0 || normalized.includes("deadline")) {
    return {
      letterType: "deadline_notice",
      summary: "This letter appears to include a response deadline.",
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: false
    };
  }

  if (normalized.includes("approved") || normalized.includes("approval")) {
    return {
      letterType: "approval",
      summary: "This letter appears to approve assistance and should still be reviewed for amounts, dates, and next steps.",
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: false
    };
  }

  return {
    letterType: "unknown",
    summary: "This letter needs human review because OpenRelief could not classify it safely.",
    detectedDeadlines,
    detectedRequests,
    injectionWarnings,
    needsHumanReview: true
  };
};

export const createChecklist = (
  caseContext: CaseContext,
  letter: LetterAnalysis,
  policyPack: PolicyPack
): Checklist => {
  const items: ChecklistItem[] = [];

  if (letter.needsHumanReview || caseContext.riskFlags.length > 0) {
    items.push({
      id: "human-review",
      title: "Request human review",
      category: "human_review",
      reason: "Denial, appeal, or risk flags should be reviewed by a qualified helper.",
      sourceIds: ["fema-appeals"]
    });
  }

  if (letter.detectedDeadlines.length > 0) {
    items.push({
      id: "review-deadline",
      title: "Confirm the response deadline",
      category: "deadline",
      reason: "The uploaded letter contains deadline language.",
      sourceIds: ["fema-appeals"]
    });
  }

  if (letter.detectedRequests.includes("proof of occupancy")) {
    items.push({
      id: "collect-occupancy",
      title: "Collect proof of occupancy",
      category: "evidence",
      reason: "The letter asks for residence documentation.",
      sourceIds: ["fema-documents"]
    });
  }

  if (letter.detectedRequests.includes("insurance information")) {
    items.push({
      id: "collect-insurance",
      title: "Collect insurance information",
      category: "evidence",
      reason: "The letter mentions insurance review.",
      sourceIds: ["fema-documents"]
    });
  }

  items.push({
    id: "review-sources",
    title: "Review official sources",
    category: "source_review",
    reason: `Use the ${policyPack.name} source list before relying on policy details.`,
    sourceIds: policyPack.sources.map((source) => source.id)
  });

  return { items };
};

export const buildEvidencePacket = (requests: string[]): EvidencePacket => ({
  groups: [
    {
      category: "identity",
      items: [{ label: "Photo ID or replacement ID note", status: "optional", sourceIds: ["fema-documents"] }]
    },
    {
      category: "occupancy",
      items: [
        {
          label: "Lease, mortgage, utility bill, or other occupancy proof",
          status: requests.includes("proof of occupancy") ? "missing" : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "insurance",
      items: [
        {
          label: "Insurance claim status or denial note",
          status: requests.includes("insurance information") ? "missing" : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "damage",
      items: [{ label: "Damage photos, receipts, or repair estimates", status: "optional", sourceIds: ["fema-documents"] }]
    }
  ]
});

export const validatePolicyPack = (policyPack: PolicyPack): PolicyValidationResult => {
  const sourceIds = new Set(policyPack.sources.map((source) => source.id));
  const errors = policyPack.rules.flatMap((rule) => {
    if (rule.sourceIds.length === 0) {
      return [`Policy rule ${rule.id} has no sourceIds.`];
    }

    const missingSources = rule.sourceIds.filter((sourceId) => !sourceIds.has(sourceId));
    if (missingSources.length > 0) {
      return [`Policy rule ${rule.id} references missing sources: ${missingSources.join(", ")}.`];
    }

    return [];
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const createCaseExport = (
  letter: LetterAnalysis,
  checklist: Checklist,
  evidencePacket: EvidencePacket,
  policyPack: PolicyPack
): string => {
  const checklistLines = checklist.items.map((item) => `- ${item.title}: ${item.reason}`).join("\n");
  const evidenceLines = evidencePacket.groups
    .map((group) => {
      const items = group.items.map((item) => `  - ${item.label} (${item.status})`).join("\n");
      return `${group.category}\n${items}`;
    })
    .join("\n\n");
  const sourceLines = policyPack.sources
    .map((source) => `- ${source.title}: ${source.url} (retrieved ${source.retrievedAt})`)
    .join("\n");

  return [
    "OpenRelief packet",
    "",
    "Safety note: this is not a government decision or legal advice.",
    "",
    `Letter type: ${letter.letterType}`,
    `Summary: ${letter.summary}`,
    "",
    "Checklist",
    checklistLines,
    "",
    "Evidence packet outline",
    evidenceLines,
    "",
    "Sources",
    sourceLines
  ].join("\n");
};
