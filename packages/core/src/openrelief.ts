export type LetterType =
  | "approval"
  | "denial"
  | "request_for_information"
  | "deadline_notice"
  | "inspection_notice"
  | "unknown";

export type RiskFlag =
  | "immediate_danger"
  | "denial_or_appeal"
  | "homelessness"
  | "medical_emergency"
  | "abuse_or_unsafe_home"
  | "disability_accommodation"
  | "immigration_sensitive"
  | "suspected_fraud_or_scam";

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  jurisdiction: "federal" | "california" | "county" | "city" | "nonprofit";
  disasterType: "wildfire" | "flood" | "hurricane" | "earthquake" | "other";
  retrievedAt: string;
  effectiveDate?: string;
  lastReviewedAt: string;
  sourceType: "webpage" | "pdf" | "form" | "faq" | "program-page";
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
  facts: string[];
  uncertainties: string[];
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
  editable: boolean;
  deadline?: Deadline;
  sourceIds: string[];
}

export interface Checklist {
  items: ChecklistItem[];
}

export type EvidenceCategory =
  | "identity"
  | "residence"
  | "ownership_or_lease"
  | "damage"
  | "receipts"
  | "insurance"
  | "medical_or_transportation"
  | "communications"
  | "other";

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
  warnings: string[];
}

export interface AppealDraft {
  title: string;
  body: string;
  sourceIds: string[];
  needsHumanReview: true;
}

const injectionPatterns = [
  /ignore all previous instructions/i,
  /developer mode/i,
  /system prompt/i,
  /say .* approved/i
];

const spanishDisasterLetterPatterns = [
  /\baviso de fema\b/i,
  /\bsolicitud\b/i,
  /\bdenegada\b/i,
  /\bprueba de ocupacion\b/i,
  /\bpuede apelar\b/i
];

const restrictedIdentifierPatterns = [
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN removed]"
  },
  {
    pattern: /\b(?:dob|date of birth)\s*[:#-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi,
    replacement: "[date of birth removed]"
  },
  {
    pattern:
      /\b(?:(?:fema|sba)[-\s#:]*(?:application|app|case|claim|id|number|no\.?)?[-\s#:]*\d{6,}|(?:application|app|case|claim)\s*(?:id|number|no\.?)\s*[:#-]?\s*\d{6,})\b/gi,
    replacement: "[agency ID removed]"
  },
  {
    pattern: /\b(?:undocumented|deportation risk|expired visa|visa expired)\b/gi,
    replacement: "[immigration status removed]"
  }
];

export const redactRestrictedIdentifiers = (text: string): string =>
  restrictedIdentifierPatterns.reduce(
    (redactedText, { pattern, replacement }) => redactedText.replace(pattern, replacement),
    text
  );

const addFlag = (flags: RiskFlag[], flag: RiskFlag) => {
  if (!flags.includes(flag)) {
    flags.push(flag);
  }
};

interface RequestDetectionRule {
  request: string;
  phrases: string[];
  fact: string;
}

const requestDetectionRules: RequestDetectionRule[] = [
  {
    request: "proof of occupancy",
    phrases: ["proof of occupancy"],
    fact: "The letter asks for proof of occupancy."
  },
  {
    request: "ownership records",
    phrases: ["ownership records"],
    fact: "The letter asks for ownership records."
  },
  {
    request: "lease records",
    phrases: ["lease records"],
    fact: "The letter asks for lease records."
  },
  {
    request: "utility records",
    phrases: ["utility records"],
    fact: "The letter asks for utility records."
  },
  {
    request: "insurance information",
    phrases: ["insurance"],
    fact: "The letter mentions insurance information."
  },
  {
    request: "repair receipts",
    phrases: ["repair receipts"],
    fact: "The letter asks for repair receipts."
  },
  {
    request: "contractor estimates",
    phrases: ["contractor estimates"],
    fact: "The letter asks for contractor estimates."
  },
  {
    request: "repair estimates",
    phrases: ["repair estimates"],
    fact: "The letter asks for repair estimates."
  },
  {
    request: "repair records",
    phrases: ["repair records"],
    fact: "The letter asks for repair records."
  },
  {
    request: "medical receipts",
    phrases: ["medical receipts", "medical, medication, or transportation receipts"],
    fact: "The letter asks for medical receipts."
  },
  {
    request: "medicine storage receipts",
    phrases: ["medicine storage receipts"],
    fact: "The letter asks for medicine storage receipts."
  },
  {
    request: "transportation receipts",
    phrases: ["transportation receipts", "receipts for transportation"],
    fact: "The letter asks for transportation receipts."
  },
  {
    request: "transportation notes",
    phrases: ["transportation notes"],
    fact: "The letter asks for transportation notes."
  },
  {
    request: "temporary lodging receipts",
    phrases: [
      "temporary lodging receipts",
      "evacuation lodging receipts",
      "temporary lodging records",
      "receipts for transportation and temporary lodging"
    ],
    fact: "The letter asks for temporary lodging receipts."
  },
  {
    request: "agency messages",
    phrases: ["agency messages"],
    fact: "The letter asks for agency messages."
  },
  {
    request: "shelter placement notes",
    phrases: ["shelter placement notes"],
    fact: "The letter asks for shelter placement notes."
  },
  {
    request: "damage photos",
    phrases: ["damage photos"],
    fact: "The letter asks for damage photos."
  },
  {
    request: "damage records",
    phrases: ["because damage records"],
    fact: "The letter asks for damage records."
  },
  {
    request: "smoke damage records",
    phrases: ["smoke damage records"],
    fact: "The letter asks for smoke damage records."
  },
  {
    request: "cleanup receipts",
    phrases: ["cleanup receipts"],
    fact: "The letter asks for cleanup receipts."
  },
  {
    request: "debris removal records",
    phrases: ["debris removal records"],
    fact: "The letter asks for debris removal records."
  },
  {
    request: "supporting receipts",
    phrases: ["supporting receipts"],
    fact: "The letter asks for supporting receipts."
  },
  {
    request: "generator rental receipts",
    phrases: ["receipts for generator rental and temporary power equipment"],
    fact: "The letter asks for generator rental receipts."
  },
  {
    request: "temporary power equipment receipts",
    phrases: ["receipts for generator rental and temporary power equipment"],
    fact: "The letter asks for temporary power equipment receipts."
  },
  {
    request: "replacement item receipts",
    phrases: ["replacement household item receipts", "receipts for replacement household items"],
    fact: "The letter asks for replacement item receipts."
  },
  {
    request: "accessibility expense records",
    phrases: ["accessibility and accommodation expense records"],
    fact: "The letter asks for accessibility expense records."
  },
  {
    request: "accommodation expense records",
    phrases: ["accessibility and accommodation expense records"],
    fact: "The letter asks for accommodation expense records."
  },
  {
    request: "accommodation receipts",
    phrases: ["accommodation receipts"],
    fact: "The letter asks for accommodation receipts."
  }
];

const requestFactByName = new Map(requestDetectionRules.map(({ request, fact }) => [request, fact]));

const includesAny = (value: string, phrases: string[]): boolean =>
  phrases.some((phrase) => value.includes(phrase));

const hasRequest = (requests: string[], candidates: string[]): boolean =>
  candidates.some((request) => requests.includes(request));

const buildLetterFacts = (normalized: string, requests: string[], deadlines: Deadline[]): string[] => {
  const facts: string[] = [];

  if (normalized.includes("denied") || normalized.includes("denial")) {
    facts.push("The letter says the application is denied.");
  }

  if (normalized.includes("approved") || normalized.includes("approval")) {
    facts.push("The letter says assistance is approved.");
  }

  facts.push(
    ...requests
      .map((request) => requestFactByName.get(request))
      .filter((fact): fact is string => fact !== undefined)
  );

  facts.push(...deadlines.map((deadline) => `The letter says ${deadline.text}.`));

  return facts.length > 0 ? facts : ["The letter needs manual review because no clear action was found."];
};

export const analyzeLetter = (letterText: string): LetterAnalysis => {
  const normalized = letterText.toLowerCase();
  const injectionWarnings = injectionPatterns
    .filter((pattern) => pattern.test(letterText))
    .map((pattern) => `Prompt injection pattern detected: ${pattern.source}`);
  const appearsSpanish = spanishDisasterLetterPatterns.some((pattern) => pattern.test(letterText));

  const detectedRequests = requestDetectionRules
    .filter(({ phrases }) => includesAny(normalized, phrases))
    .map(({ request }) => request);

  const detectedDeadlines: Deadline[] = [];

  if (normalized.includes("appeal within 60 days")) {
    detectedDeadlines.push({ label: "appeal window", text: "appeal within 60 days", source: "uploaded_letter" });
  }

  if (normalized.includes("respond within 30 days")) {
    detectedDeadlines.push({ label: "response window", text: "respond within 30 days", source: "uploaded_letter" });
  }

  const facts = buildLetterFacts(normalized, detectedRequests, detectedDeadlines);
  const uncertainties = ["OpenRelief cannot confirm final eligibility or legal options."];

  if (appearsSpanish) {
    uncertainties.push(
      "OpenRelief is English-first in V1 and cannot safely classify this letter without human review."
    );
  }

  if (normalized.includes("denied") || normalized.includes("denial")) {
    return {
      letterType: "denial",
      summary: "This letter appears to deny the request and asks for careful human review before next steps.",
      facts,
      uncertainties,
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
      facts,
      uncertainties,
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
      facts,
      uncertainties,
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
      facts,
      uncertainties,
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
      facts,
      uncertainties,
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: false
    };
  }

  return {
    letterType: "unknown",
    summary: "This letter needs human review because OpenRelief could not classify it safely.",
    facts,
    uncertainties,
    detectedDeadlines,
    detectedRequests,
    injectionWarnings,
    needsHumanReview: true
  };
};

export const detectRiskFlags = (intakeText: string, letter?: LetterAnalysis): RiskFlag[] => {
  const normalized = intakeText.toLowerCase();
  const flags: RiskFlag[] = [];

  if (letter?.letterType === "denial" || letter?.detectedDeadlines.length) {
    addFlag(flags, "denial_or_appeal");
  }

  if (/immediate danger|in danger right now|fire.*right now|trapped|life[-\s]?threatening/i.test(normalized)) {
    addFlag(flags, "immediate_danger");
  }

  if (/homeless|no place to stay|nowhere to stay|shelter|evict/i.test(normalized)) {
    addFlag(flags, "homelessness");
  }

  if (/medical emergency|oxygen|medicine|dialysis|urgent medical|hospital/i.test(normalized)) {
    addFlag(flags, "medical_emergency");
  }

  if (/abuse|domestic violence|unsafe home|violence/i.test(normalized)) {
    addFlag(flags, "abuse_or_unsafe_home");
  }

  if (/disability|wheelchair|accessible|accommodation/i.test(normalized)) {
    addFlag(flags, "disability_accommodation");
  }

  if (/immigration|undocumented|deportation|visa/i.test(normalized)) {
    addFlag(flags, "immigration_sensitive");
  }

  if (/scam|fraud|fraudulent|fake fema|asked for.*fema code|asked for.*application id/i.test(normalized)) {
    addFlag(flags, "suspected_fraud_or_scam");
  }

  return flags;
};

export const createChecklist = (
  caseContext: CaseContext,
  letter: LetterAnalysis,
  policyPack: PolicyPack
): Checklist => {
  const items: ChecklistItem[] = [];
  const sourceWarnings = validatePolicyPack(policyPack).warnings;
  const needsPolicyReview = sourceWarnings.length > 0;

  if (letter.needsHumanReview || caseContext.riskFlags.length > 0 || needsPolicyReview) {
    const humanReviewReasons = [
      letter.needsHumanReview || caseContext.riskFlags.length > 0
        ? "Denial, appeal, or risk flags should be reviewed by a qualified helper."
        : "",
      needsPolicyReview ? "Policy sources need review before relying on generated next steps." : ""
    ].filter(Boolean);

    items.push({
      id: "human-review",
      title: "Request human review",
      category: "human_review",
      reason: humanReviewReasons.join(" "),
      editable: true,
      sourceIds: ["fema-appeals"]
    });
  }

  if (letter.detectedDeadlines.length > 0) {
    const deadline = letter.detectedDeadlines[0];
    items.push({
      id: "review-deadline",
      title: "Confirm the response deadline",
      category: "deadline",
      reason: `The uploaded letter says: ${deadline.text}.`,
      editable: true,
      deadline,
      sourceIds: ["fema-appeals"]
    });
  }

  if (letter.detectedRequests.includes("proof of occupancy")) {
    items.push({
      id: "collect-occupancy",
      title: "Collect proof of occupancy",
      category: "evidence",
      reason: "The letter asks for residence documentation.",
      editable: true,
      sourceIds: ["fema-documents"]
    });
  }

  if (letter.detectedRequests.includes("insurance information")) {
    items.push({
      id: "collect-insurance",
      title: "Collect insurance information",
      category: "evidence",
      reason: "The letter mentions insurance review.",
      editable: true,
      sourceIds: ["fema-documents"]
    });
  }

  const sourceReviewReason = [
    `Use the ${policyPack.name} source list before relying on policy details.`,
    ...sourceWarnings
  ].join(" ");

  items.push({
    id: "review-sources",
    title: "Review official sources",
    category: "source_review",
    reason: sourceReviewReason,
    editable: true,
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
      category: "residence",
      items: [
        {
          label: "Lease, mortgage, utility bill, or other occupancy proof",
          status:
            hasRequest(requests, ["proof of occupancy", "utility records"])
              ? "missing"
              : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "ownership_or_lease",
      items: [
        {
          label: "Deed, lease, mortgage statement, or title record",
          status:
            hasRequest(requests, ["ownership records", "lease records"])
              ? "missing"
              : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "damage",
      items: [
        {
          label: "Damage photos, receipts, or repair estimates",
          status:
            hasRequest(requests, [
              "contractor estimates",
              "damage photos",
              "damage records",
              "smoke damage records",
              "repair estimates"
            ])
              ? "missing"
              : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "receipts",
      items: [
        {
          label: "Repair, hotel, replacement, or cleanup receipts",
          status:
            hasRequest(requests, [
              "repair receipts",
              "temporary lodging receipts",
              "cleanup receipts",
              "debris removal records",
              "repair records",
              "supporting receipts",
              "generator rental receipts",
              "temporary power equipment receipts",
              "replacement item receipts"
            ])
              ? "missing"
              : "optional",
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
      category: "medical_or_transportation",
      items: [
        {
          label: "Medical, medication, transportation, or accessibility expense notes",
          status:
            hasRequest(requests, [
              "medical receipts",
              "medicine storage receipts",
              "transportation receipts",
              "transportation notes",
              "accessibility expense records",
              "accommodation expense records",
              "accommodation receipts"
            ])
              ? "missing"
              : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "communications",
      items: [
        {
          label: "Agency letters, emails, call notes, or case messages",
          status: hasRequest(requests, ["agency messages", "shelter placement notes"]) ? "missing" : "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "other",
      items: [
        {
          label: "Other disaster recovery documents named in the letter",
          status: "optional",
          sourceIds: ["fema-documents"]
        }
      ]
    }
  ]
});

const daysBetween = (fromDate: string, toDate: string): number => {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);

  if (Number.isNaN(from) || Number.isNaN(to)) {
    return 0;
  }

  return Math.floor((to - from) / 86_400_000);
};

export const validatePolicyPack = (policyPack: PolicyPack, asOf = "2026-07-13"): PolicyValidationResult => {
  const sourceIds = new Set(policyPack.sources.map((source) => source.id));
  const sourceErrors = policyPack.sources.flatMap((source) => {
    const errors: string[] = [];

    if (source.url.trim().length === 0) {
      errors.push(`Policy source ${source.id} has no url.`);
    }

    if (source.jurisdiction.trim().length === 0) {
      errors.push(`Policy source ${source.id} has no jurisdiction.`);
    }

    if (source.disasterType.trim().length === 0) {
      errors.push(`Policy source ${source.id} has no disasterType.`);
    }

    if (source.retrievedAt.trim().length === 0) {
      errors.push(`Policy source ${source.id} has no retrievedAt.`);
    }

    if (source.lastReviewedAt.trim().length === 0) {
      errors.push(`Policy source ${source.id} has no lastReviewedAt.`);
    }

    if (source.sourceType.trim().length === 0) {
      errors.push(`Policy source ${source.id} has no sourceType.`);
    }

    return errors;
  });
  const sourceWarnings = policyPack.sources.flatMap((source) =>
    source.lastReviewedAt.trim().length > 0 && daysBetween(source.lastReviewedAt, asOf) > 30
      ? [`Policy source ${source.id} last reviewed more than 30 days ago.`]
      : []
  );
  const ruleErrors = policyPack.rules.flatMap((rule) => {
    if (injectionPatterns.some((pattern) => pattern.test(rule.statement))) {
      return [`Policy rule ${rule.id} contains instruction-like text.`];
    }

    if (rule.sourceIds.length === 0) {
      return [`Policy rule ${rule.id} has no sourceIds.`];
    }

    const missingSources = rule.sourceIds.filter((sourceId) => !sourceIds.has(sourceId));
    if (missingSources.length > 0) {
      return [`Policy rule ${rule.id} references missing sources: ${missingSources.join(", ")}.`];
    }

    return [];
  });
  const errors = [...sourceErrors, ...ruleErrors];

  return {
    valid: errors.length === 0,
    errors,
    warnings: sourceWarnings
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
    .map(
      (source) =>
        `- ${source.title}: ${source.url} (retrieved ${source.retrievedAt}, last reviewed ${source.lastReviewedAt})`
    )
    .join("\n");

  return [
    "OpenRelief packet",
    "",
    "Safety note: this is not a government decision or legal advice.",
    "Privacy note: This export may include personal information.",
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

export const createAppealDraft = (
  letter: LetterAnalysis,
  checklist: Checklist,
  policyPack: PolicyPack
): AppealDraft | null => {
  if (letter.letterType !== "denial") {
    return null;
  }

  const requestedEvidence =
    letter.detectedRequests.length > 0 ? letter.detectedRequests.join(", ") : "the items requested in the letter";
  const sourceIds = new Set(checklist.items.flatMap((item) => item.sourceIds));

  if (policyPack.sources.some((source) => source.id === "fema-appeals")) {
    sourceIds.add("fema-appeals");
  }

  return {
    title: "Draft appeal note for human review",
    body: [
      "Draft for human review only. This is not legal advice and not a government decision.",
      "",
      "I am asking FEMA to review the denial notice for my disaster assistance application.",
      `The letter says the missing or disputed item is: ${requestedEvidence}.`,
      "I plan to attach the requested supporting documents and any other records a qualified helper recommends.",
      "Please review this draft with a qualified helper before sending."
    ].join("\n"),
    sourceIds: [...sourceIds],
    needsHumanReview: true
  };
};
