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
  | "final_eligibility_request"
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
  | "funeral"
  | "communications"
  | "other";

export interface EvidenceItem {
  label: string;
  status: "missing" | "available" | "optional";
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
  /disregard (?:all )?(?:previous )?instructions/i,
  /override (?:safety rules|source checks|human review)/i,
  /bypass (?:safety rules|source checks|human review)/i,
  /developer mode/i,
  /system prompt/i,
  /say .* approved/i,
  /(?:^|[\n.?!]\s*)(?:please\s+)?(?:(?:ignore|disregard|do not respond to|throw away|discard|skip) (?:the )?(?:fema|official|agency) (?:letter|notice|request)|(?:there is )?no need to (?:respond|reply) to (?:the )?(?:fema|official|agency) (?:letter|notice|request))/i,
  /\b(?:wait|delay|hold off|postpone|defer|put off)(?:\s+(?:to|before))?\s+(?:respond|reply|responding|replying) to (?:the )?(?:fema|official|agency) (?:letter|notice|request)\b/i,
  /(?:ask for|share|provide|send|enter|include|upload|give).*(?:payment codes?|full bank numbers?|bank numbers?|bank account numbers?|routing numbers?|full ssn|ssn|social security numbers?|dob|d\.?\s*o\.?\s*b\.?|date of birth|birth\s*date|immigration status|visa status|full application id|fema codes?|access codes?|door codes?|entry codes?|verification codes?|passwords?|pins?|otps?|passcodes?)/i
];

const spanishDisasterLetterPatterns = [
  /\baviso de fema\b/i,
  /\bsolicitud\b/i,
  /\bdenegada\b/i,
  /\bprueba de ocupacion\b/i,
  /\bpuede apelar\b/i
];

const monthNamePattern =
  "(?:january|february|march|april|may|june|july|august|september|october|november|december)";
const dateValuePattern = `(?:${monthNamePattern}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}-\\d{1,2}-\\d{1,2})`;
const responseWithinDaysPattern = /\b(?:respond|reply|send|submit|provide)(?:\s+[a-z][a-z-]*){0,6}\s+within\s+\d{1,3}\s+(?:calendar\s+|business\s+)?days\b/i;
const responseByDatePattern = new RegExp(
  `\\b(?:respond|reply|send|submit|provide)(?:\\s+[a-z][a-z-]*){0,6}\\s+(?:by|no later than)\\s+${dateValuePattern}\\b`,
  "i"
);
const passiveResponseByDatePattern = new RegExp(
  `\\b(?:(?:documents?|records?|receipts?|response) must be received|(?:documents?|records?|receipts?|response) (?:is|are) due) (?:by|no later than) ${dateValuePattern}\\b`,
  "i"
);
const appealWithinDaysPattern = /\b(?:you have\s+\d{1,3}\s+(?:calendar\s+|business\s+)?days(?:\s+from\s+(?:the\s+)?date\s+of\s+(?:this\s+)?letter)?\s+to\s+appeal|appeal must be (?:submitted|received|filed) within\s+\d{1,3}\s+(?:calendar\s+|business\s+)?days|file an appeal within\s+\d{1,3}\s+(?:calendar\s+|business\s+)?days)\b/i;
const appealByDatePattern = new RegExp(
  `\\b(?:appeal (?:must be (?:received|submitted|filed|postmarked|mailed)|(?:is|are) due)|(?:file|submit|send|mail) (?:an|your|the) appeal) (?:by|no later than) ${dateValuePattern}\\b`,
  "i"
);

const restrictedIdentifierPatterns = [
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[email removed]"
  },
  {
    pattern:
      /\b(?:[Nn]ame|[Ff]ull\s+[Nn]ame|[Ss]urvivor\s+[Nn]ame|[Ss]urvivor|[Aa]pplicant\s+[Nn]ame|[Aa]pplicant|[Cc]o[-\s]?[Aa]pplicant|[Bb]orrower|[Cc]o[-\s]?[Bb]orrower|[Ll]oan\s+[Oo]fficer|[Cc]ontact\s+[Nn]ame|[Ee]mergency\s+[Cc]ontact|[Aa]lternate\s+[Cc]ontact|[Hh]ousehold\s+[Mm]ember\s+[Nn]ame|[Hh]ousehold\s+[Mm]ember|[Cc]hild\s+[Nn]ame|[Cc]hild|[Cc]ase\s+[Ww]orker\s+[Nn]ame|[Cc]ase\s*[Ww]orker|[Tt]enant\s+[Nn]ame|[Tt]enant|[Ll]andlord\s+[Nn]ame|[Ll]andlord|[Cc]ontractor\s+[Nn]ame|[Cc]ontractor|[Pp]roperty\s+[Oo]wner\s+[Nn]ame|[Pp]roperty\s+[Oo]wner|[Ii]nsurance\s+[Aa]djuster|[Cc]laims?\s+[Aa]djuster|[Ii]nsurance\s+[Aa]gent|[Ii]nsured|[Pp]olicy\s*[Hh]older)\s*[:#-]?\s*[A-Z][A-Za-z.'-]+(?:\s+(?:(?:de la|van der|del|de|van|von|da|dos|di|la|le|el|al|bin|ibn|binti)\s+)?[A-Z][A-Za-z.'-]+){1,3}\b/g,
    replacement: "[name removed]"
  },
  {
    pattern: /(?:\+1[-.\s]?)?(?:\(\d{3}\)|\b\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[phone removed]"
  },
  {
    pattern:
      /\b\d{1,6}\s+(?:[A-Z0-9][A-Z0-9.'-]*\s+){1,5}(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|way|court|ct\.?|circle|cir\.?|place|pl\.?)\b(?:\s+(?:apt|unit|suite|ste)\.?\s*[A-Z0-9-]+)?/gi,
    replacement: "[address removed]"
  },
  {
    pattern: /\bp\.?\s*o\.?\s+box\s+#?\s*[A-Z0-9][A-Z0-9-]{0,10}\b/gi,
    replacement: "[address removed]"
  },
  {
    pattern: /\binsurance\s+claim\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[insurance claim removed]"
  },
  {
    pattern: /\b(?:insurance\s+)?policy\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[insurance policy removed]"
  },
  {
    pattern: /\b(?:insurance\s+)?member\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[insurance member removed]"
  },
  {
    pattern: /\b(?:insurance\s+)?group\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[insurance group removed]"
  },
  {
    pattern: /\bagency\s+account\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[agency ID removed]"
  },
  {
    pattern:
      /\b(?:(?:sba|disaster)\s+)?loan\s+(?:application\s+)?(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{4,}\b/gi,
    replacement: "[loan identifier removed]"
  },
  {
    pattern:
      /\b(?:utility|electric|gas|water|power)\s+account\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[utility account removed]"
  },
  {
    pattern:
      /\b(?:hotel|motel|lodging|shelter)\s+(?:confirmation|reservation|booking)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[lodging identifier removed]"
  },
  {
    pattern:
      /\b(?:temporary\s+housing\s+unit|(?:rental\s+)?lease|(?:written\s+)?lease\s+agreement|rental\s+agreement|housing\s+agreement|continued\s+temporary\s+housing\s+assistance\s+(?:application|form|records?)|application\s+for\s+continued\s+temporary\s+housing\s+assistance|continued\s+rental\s+assistance\s+(?:application|form|records?)|ctha\s+(?:application|form|records?)|permanent\s+housing\s+plan(?:\s+records?)?|documentation\s+that\s+rental\s+assistance\s+was\s+used\s+for\s+temporary\s+housing|displacement\s+assistance\s+(?:records?|receipts?)|immediate\s+housing\s+(?:records?|receipts?)|family\s+(?:and|or)\s+friends?\s+stay\s+records?|host\s+stay\s+records?|(?:temporary|available)\s+housing\s+option\s+records?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[housing identifier removed]"
  },
  {
    pattern:
      /\b(?:(?:major\s+)?repair\s+(?:estimate|receipt|record)|(?:maintenance|improvement)\s+receipts?|receipts?\s+for\s+major\s+repairs?(?:\s+or\s+improvements?)?|contractor\s+(?:license|estimate)|hazard\s+mitigation\s+(?:record|receipt|estimate)|mitigation\s+(?:repair|measure)\s+(?:record|receipt|estimate))\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[repair identifier removed]"
  },
  {
    pattern:
      /\b(?:medicine\s+storage\s+receipt|medical\s+transportation\s+trip|dental\s+(?:receipt|bill|estimate|expense\s+record))\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[medical support identifier removed]"
  },
  {
    pattern:
      /\b(?:mechanic\s+(?:receipt|estimate)|vehicle\s+repair\s+(?:receipt|estimate|cost\s+record))\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[vehicle repair identifier removed]"
  },
  {
    pattern:
      /\b(?:(?:agency|case|contractor)\s+messages?|appointment\s+notes?|shelter\s+placement\s+notes?|transitional\s+sheltering\s+assistance\s+(?:records?|notices?|messages?)|tsa\s+(?:records?|notices?|messages?|terms\s+and\s+conditions)|terms\s+and\s+conditions\s+document|(?:hotel\s+)?checkout(?:\s+date)?\s+notice|unsafe\s+home\s+access\s+notes?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[communication identifier removed]"
  },
  {
    pattern:
      /\b(?:accommodation\s+(?:receipts?|notes?)|accessibility\s+(?:expense\s+records?|notes?)|accessibility\s+and\s+accommodation\s+(?:expense\s+records?|notes?)|medical\s+access\s+notes?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[accommodation identifier removed]"
  },
  {
    pattern:
      /\b(?:serious\s+needs\s+(?:assistance\s+)?(?:records?|receipts?)|emergency\s+supplies?\s+receipts?|immediate\s+needs\s+receipts?|water\s+and\s+food\s+receipts?|first\s+aid\s+receipts?|infant\s+formula\s+receipts?|breastfeeding\s+supply\s+receipts?|diaper\s+receipts?|personal\s+hygiene\s+(?:item\s+)?receipts?|fuel\s+for\s+transportation\s+receipts?|generator\s+(?:purchase\s+)?receipt|generator\s+rental\s+receipt|chainsaw\s+(?:rental\s+)?receipt|dehumidifier\s+(?:rental\s+)?receipt|miscellaneous\s+item\s+(?:record|receipt)|temporary\s+power\s+equipment\s+receipt|cleanup\s+receipts?|clean(?:ing)?\s+and\s+sanitiz(?:e|ing)\s+receipts?|(?:cleanup|cleaning)\s+(?:supply|supplies|materials?)\s+receipts?|paid\s+cleanup\s+help\s+receipts?|receipts?\s+(?:from|for)\s+any\s+supplies,\s+materials,?\s+or\s+paid\s+help|receipts?\s+for\s+supplies,\s+materials,?\s+or\s+paid\s+help|replacement\s+(?:(?:household\s+)?items?\s+)?receipts?|receipts?\s+for\s+replacement\s+household\s+items|personal\s+property\s+(?:record|receipt|inventory|list)|(?:appliance|clothing|computer|home\s+furnishing)\s+(?:record|receipt)|(?:occupational\s+tool|educational\s+material)\s+(?:record|receipt)|debris\s+removal\s+record|smoke\s+damage\s+record)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[recovery expense identifier removed]"
  },
  {
    pattern:
      /\b(?:moving\s+(?:receipts?|expense\s+records?|truck\s+rental\s+receipts?)|storage\s+(?:receipts?|unit\s+receipts?|expense\s+records?)|moving\s+and\s+storage\s+(?:records?|receipts?|expense\s+records?)|moving\s+and\s+storing\s+personal\s+property)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[moving storage identifier removed]"
  },
  {
    pattern:
      /\b(?:child\s*care|childcare)\s+(?:receipt|contract|estimate|provider\s+letter)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[child care identifier removed]"
  },
  {
    pattern:
      /\b(?:death\s+certificate|(?:funeral|burial|reburial)\s+(?:receipt|contract|estimate|expense\s+document)|funeral\s+home\s+contract)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[funeral identifier removed]"
  },
  {
    pattern:
      /\b(?:damage\s+(?:record|documentation|photo)|(?:private|privately\s+owned|privately-owned)\s+(?:road|bridge|dock)\s+(?:record|damage\s+record|repair\s+record)|private\s+access\s+damage\s+record|sole\s+access\s+damage\s+record|supporting\s+(?:document|receipt))\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[damage evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:insurance\s+settlement\s+(?:information|records?|letters?)|account\s+listed\s+records?|requested\s+records?|(?:other\s+)?household\s+records?|supporting\s+records?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[record request identifier removed]"
  },
  {
    pattern:
      /\b(?:(?:proof\s+of\s+occupancy|occupancy\s+proof|utility\s+bill|mortgage|deed)(?:\s+(?:records?|statements?))?|(?:property\s+tax|tax\s+assessment|escrow)\s+(?:statements?|records?|receipts?|bills?|analysis|analyses)|tax\s+bills?|homeowners?\s+insurance\s+statements?|(?:real\s+property|structural)\s+insurance\s+(?:documents?|bills?|payment\s+records?)|(?:occupancy|residence|ownership|lease|utility|title)\s+records?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[residence evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:bank\s+statements?|credit\s+card\s+statements?|phone\s+bills?|(?:cable|satellite|cable\/satellite)\s+bills?|medical\s+provider(?:'s)?\s+bills?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[residence evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:voter\s+registration\s+cards?|social\s+service\s+organization\s+documents?|(?:federal|state|federal\s+or\s+state)\s+benefit\s+documents?|mobile\s+home\s+park\s+(?:documents?|letters?)|vehicle\s+registrations?|affidavits?\s+of\s+residency|court\s+(?:documentation|documents?)|school\s+(?:documents?|records?))\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[residence evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:rent\s+receipts?|employer\s+statements?|pay\s+stubs?|public\s+official\s+statements?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[residence evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:manufactured\s+home\s+(?:certificate|title)|mobile\s+home\s+(?:certificate\s+of\s+title|title)|home\s+purchase\s+contract|contract\s+for\s+deed|land\s+installment\s+contract|quitclaim\s+deed|bill\s+of\s+sale|bond\s+for\s+title)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[residence evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:last\s+will\s+and\s+testament|affidavit\s+of\s+heirship|mobile\s+home\s+park\s+(?:ownership\s+)?letter|court\s+ownership\s+document|court\s+(?:documentation|documents?)\s+(?:showing|that\s+states?)\s+ownership|public\s+official\s+(?:ownership\s+)?letter)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[residence evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:photo\s+id\s+note|replacement\s+id\s+note)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[identity evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:insurance\s+(?:status\s+note|denial\s+(?:note|letter)|information\s+record|claim\s+status|policy\s+exclusion)|proof\s+of\s+lack\s+of\s+insurance|policy\s+exclusion\s+record)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[insurance evidence identifier removed]"
  },
  {
    pattern:
      /\b(?:(?:medical|medication|transportation)\s+(?:receipts?|notes?)|(?:temporary\s+lodging|evacuation\s+lodging|lodging\s+expense|short-term\s+lodging|lodging|hotel|motel)\s+(?:receipts?|records?|notes?))\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[medical travel evidence identifier removed]"
  },
  {
    pattern: /\b(?:(?:bank\s+)?account|routing)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*\d{8,17}\b/gi,
    replacement: "[bank identifier removed]"
  },
  {
    pattern:
      /\b(?:credit|debit|prepaid|ebt|benefits)\s+card\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?:\d[ -]?){13,19}\b/gi,
    replacement: "[payment card removed]"
  },
  {
    pattern: /\b(?:ebt|benefits)\s+card\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[payment card removed]"
  },
  {
    pattern:
      /\b(?:password|passcode|otp|pin|(?:access|door|entry|payment|verification)\s+code)\s*[:#-]?\s*[A-Z0-9!@#$%^&*._-]{4,}\b/gi,
    replacement: "[credential removed]"
  },
  {
    pattern:
      /\b(?:(?:medical\s+record|mrn)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*)(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[medical record removed]"
  },
  {
    pattern: /\b(?:medicaid|medicare)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[health identifier removed]"
  },
  {
    pattern:
      /\b(?:ssn|ss\s*#|social security(?:\s+(?:number|card)|\s*#)?)\s*[:#-]?\s*\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/gi,
    replacement: "[SSN removed]"
  },
  {
    pattern:
      /\b(?:itin|tin|ein|individual taxpayer identification number|employer identification number|tax id|tax identification number)\s*[:#-]?\s*(?:\d{3}[-\s]?\d{2}[-\s]?\d{4}|\d{2}[-\s]?\d{7})\b/gi,
    replacement: "[tax identifier removed]"
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN removed]"
  },
  {
    pattern: /\b(?:dob|d\.?\s*o\.?\s*b\.?|date of birth|birth\s*date)\s*[:#-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\b/gi,
    replacement: "[date of birth removed]"
  },
  {
    pattern:
      /\b(?:dob|d\.?\s*o\.?\s*b\.?|date of birth|birth\s*date)\s*[:#-]?\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    replacement: "[date of birth removed]"
  },
  {
    pattern:
      /\b(?:alien registration number|a[-\s]?number|a\s*#|uscis(?:\s+number|\s*#))\s*[:#-]?\s*(?:A[-\s]?)?\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/gi,
    replacement: "[immigration identifier removed]"
  },
  {
    pattern:
      /\b(?:(?:driver(?:'s)?|state)\s+(?:license|id)|federal\s+id|(?:identification|id)\s+card|identification|passport|dl|birth\s+certificate|social\s+security\s+cards?|employer(?:'s)?\s+payroll\s+documents?|military\s+(?:identification(?:\s+card)?|id)|marriage\s+licenses?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    replacement: "[identity document removed]"
  },
  {
    pattern:
      /\b(?:vin|vehicle identification number)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*[A-HJ-NPR-Z0-9]{17}\b/gi,
    replacement: "[vehicle identifier removed]"
  },
  {
    pattern:
      /\b(?:license|licence)\s+plate\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{4,9}\b/gi,
    replacement: "[vehicle identifier removed]"
  },
  {
    pattern: /\b(?:fema|sba)\s+(?:registration|reg\.?)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*\d{6,}\b/gi,
    replacement: "[agency ID removed]"
  },
  {
    pattern:
      /\b(?:(?:fema|sba)[-\s#:]*(?:application|app|case|claim|id|number|no\.?)?[-\s#:]*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,}|(?:application|app|case|claim)\s*(?:(?:id|number|no\.?)\s*)?[:#-]?\s*(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,})\b/gi,
    replacement: "[agency ID removed]"
  },
  {
    pattern: /\b(?:undocumented|deportation risk|expired visa|visa expired|visa status\s*[:#-]?\s*expired)\b/gi,
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
    request: "occupancy records",
    phrases: ["occupancy records"],
    fact: "The letter asks for occupancy records."
  },
  {
    request: "ownership records",
    phrases: ["ownership records"],
    fact: "The letter asks for ownership records."
  },
  {
    request: "proof of ownership",
    phrases: ["proof of ownership"],
    fact: "The letter asks for proof of ownership."
  },
  {
    request: "deed records",
    phrases: ["deed record", "deed records"],
    fact: "The letter asks for deed records."
  },
  {
    request: "deed or title",
    phrases: ["deed or title"],
    fact: "The letter asks for a deed or title."
  },
  {
    request: "deed of trust",
    phrases: ["deed of trust", "deeds of trust"],
    fact: "The letter asks for a deed of trust."
  },
  {
    request: "mortgage statements",
    phrases: ["mortgage statement", "mortgage statements"],
    fact: "The letter asks for mortgage statements."
  },
  {
    request: "mortgage documents",
    phrases: ["mortgage document", "mortgage documents", "mortgage documentation"],
    fact: "The letter asks for mortgage documents."
  },
  {
    request: "escrow analysis",
    phrases: ["escrow analysis", "escrow analyses"],
    fact: "The letter asks for escrow analysis."
  },
  {
    request: "property tax statements",
    phrases: ["property tax statement", "property tax statements", "property tax record", "property tax records"],
    fact: "The letter asks for property tax statements."
  },
  {
    request: "property tax receipts",
    phrases: ["property tax receipt", "property tax receipts"],
    fact: "The letter asks for property tax receipts."
  },
  {
    request: "property tax bills",
    phrases: ["property tax bill", "property tax bills", "tax bill", "tax bills"],
    fact: "The letter asks for property tax bills."
  },
  {
    request: "homeowners insurance statements",
    phrases: [
      "homeowner's insurance statement",
      "homeowner's insurance statements",
      "homeowners insurance statement",
      "homeowners insurance statements",
      "homeowner insurance statement",
      "homeowner insurance statements"
    ],
    fact: "The letter asks for homeowners insurance statements."
  },
  {
    request: "real property insurance records",
    phrases: [
      "real property insurance document",
      "real property insurance documents",
      "real property insurance bill",
      "real property insurance bills",
      "real property insurance payment record",
      "real property insurance payment records",
      "structural insurance document",
      "structural insurance documents",
      "structural insurance bill",
      "structural insurance bills",
      "structural insurance payment record",
      "structural insurance payment records"
    ],
    fact: "The letter asks for real property insurance records."
  },
  {
    request: "escrow statements",
    phrases: ["escrow statement", "escrow statements"],
    fact: "The letter asks for escrow statements."
  },
  {
    request: "tax assessment records",
    phrases: ["tax assessment record", "tax assessment records"],
    fact: "The letter asks for tax assessment records."
  },
  {
    request: "title records",
    phrases: ["title record", "title records"],
    fact: "The letter asks for title records."
  },
  {
    request: "manufactured home titles",
    phrases: [
      "manufactured home certificate or title",
      "manufactured home certificate",
      "manufactured home title",
      "mobile home certificate of title",
      "mobile home title"
    ],
    fact: "The letter asks for manufactured home title records."
  },
  {
    request: "home purchase contracts",
    phrases: ["home purchase contract", "home purchase contracts"],
    fact: "The letter asks for home purchase contracts."
  },
  {
    request: "contract for deed",
    phrases: ["contract for deed", "contracts for deed"],
    fact: "The letter asks for a contract for deed."
  },
  {
    request: "land installment contracts",
    phrases: ["land installment contract", "land installment contracts"],
    fact: "The letter asks for land installment contracts."
  },
  {
    request: "quitclaim deeds",
    phrases: ["quitclaim deed", "quitclaim deeds"],
    fact: "The letter asks for quitclaim deeds."
  },
  {
    request: "bills of sale",
    phrases: ["bill of sale", "bills of sale"],
    fact: "The letter asks for bills of sale."
  },
  {
    request: "bonds for title",
    phrases: ["bond for title", "bonds for title"],
    fact: "The letter asks for bonds for title."
  },
  {
    request: "will or heirship records",
    phrases: ["last will and testament", "affidavit of heirship", "affidavits of heirship"],
    fact: "The letter asks for will or heirship records."
  },
  {
    request: "major repair receipts",
    phrases: [
      "major repair receipt",
      "major repair receipts",
      "maintenance receipt",
      "maintenance receipts",
      "improvement receipt",
      "improvement receipts",
      "receipts for major repairs",
      "receipts for major repairs or improvements"
    ],
    fact: "The letter asks for major repair or improvement receipts."
  },
  {
    request: "mobile home park ownership letters",
    phrases: [
      "mobile home park ownership letter",
      "mobile home park ownership letters",
      "mobile home park letter confirming ownership",
      "mobile home park manager ownership letter",
      "mobile home park owner ownership letter"
    ],
    fact: "The letter asks for mobile home park ownership letters."
  },
  {
    request: "court ownership documents",
    phrases: [
      "court ownership document",
      "court ownership documents",
      "court documentation showing ownership",
      "court documents showing ownership",
      "court documentation that states ownership",
      "court documents that state ownership"
    ],
    fact: "The letter asks for court ownership documents."
  },
  {
    request: "public official ownership letters",
    phrases: [
      "public official ownership letter",
      "public official ownership letters",
      "public official letter showing ownership",
      "public official letters showing ownership",
      "public official letter confirming ownership",
      "public official letters confirming ownership"
    ],
    fact: "The letter asks for public official ownership letters."
  },
  {
    request: "lease records",
    phrases: ["lease records"],
    fact: "The letter asks for lease records."
  },
  {
    request: "lease agreements",
    phrases: [
      "lease agreement",
      "lease agreements",
      "written lease agreement",
      "written lease agreements",
      "rental agreement",
      "rental agreements",
      "lease or rental agreement"
    ],
    fact: "The letter asks for lease agreements."
  },
  {
    request: "housing agreements",
    phrases: ["housing agreement", "housing agreements"],
    fact: "The letter asks for housing agreements."
  },
  {
    request: "utility records",
    phrases: ["utility records"],
    fact: "The letter asks for utility records."
  },
  {
    request: "utility bills",
    phrases: ["utility bill", "utility bills"],
    fact: "The letter asks for utility bills."
  },
  {
    request: "rent receipts",
    phrases: ["rent receipt", "rent receipts"],
    fact: "The letter asks for rent receipts."
  },
  {
    request: "employer statements",
    phrases: ["employer statement", "employer statements", "pay stub", "pay stubs"],
    fact: "The letter asks for employer statements."
  },
  {
    request: "public official statements",
    phrases: ["public official statement", "public official statements"],
    fact: "The letter asks for public official statements."
  },
  {
    request: "bank statements",
    phrases: ["bank statement", "bank statements"],
    fact: "The letter asks for bank statements."
  },
  {
    request: "credit card statements",
    phrases: ["credit card statement", "credit card statements"],
    fact: "The letter asks for credit card statements."
  },
  {
    request: "phone bills",
    phrases: ["phone bill", "phone bills"],
    fact: "The letter asks for phone bills."
  },
  {
    request: "cable or satellite bills",
    phrases: ["cable bill", "cable bills", "satellite bill", "satellite bills", "cable/satellite bill", "cable/satellite bills"],
    fact: "The letter asks for cable or satellite bills."
  },
  {
    request: "medical provider bills",
    phrases: ["medical provider bill", "medical provider bills", "medical provider's bill", "medical provider's bills"],
    fact: "The letter asks for medical provider bills."
  },
  {
    request: "voter registration cards",
    phrases: ["voter registration card", "voter registration cards"],
    fact: "The letter asks for voter registration cards."
  },
  {
    request: "social service organization documents",
    phrases: ["social service organization document", "social service organization documents"],
    fact: "The letter asks for social service organization documents."
  },
  {
    request: "benefit documents",
    phrases: [
      "federal benefit document",
      "federal benefit documents",
      "state benefit document",
      "state benefit documents",
      "federal or state benefit document",
      "federal or state benefit documents"
    ],
    fact: "The letter asks for benefit documents."
  },
  {
    request: "mobile home park documents",
    phrases: [
      "mobile home park document",
      "mobile home park documents",
      "mobile home park letter",
      "mobile home park letters",
      "mobile home park owner",
      "mobile home park manager"
    ],
    fact: "The letter asks for mobile home park documents."
  },
  {
    request: "vehicle registrations",
    phrases: ["motor vehicle registration", "motor vehicle registrations", "vehicle registration", "vehicle registrations"],
    fact: "The letter asks for vehicle registrations."
  },
  {
    request: "affidavits of residency",
    phrases: ["affidavit of residency", "affidavits of residency"],
    fact: "The letter asks for affidavits of residency."
  },
  {
    request: "court documentation",
    phrases: ["court documentation", "court documents"],
    fact: "The letter asks for court documentation."
  },
  {
    request: "school documents",
    phrases: ["local school documents", "school documents", "school records"],
    fact: "The letter asks for school documents."
  },
  {
    request: "account listed records",
    phrases: ["requested records listed in your account"],
    fact: "The letter asks for records listed in the agency account."
  },
  {
    request: "requested records",
    phrases: ["requested records were not received"],
    fact: "The letter asks for requested records."
  },
  {
    request: "other household records",
    phrases: ["other household records"],
    fact: "The letter asks for other household records."
  },
  {
    request: "supporting documents",
    phrases: ["supporting documents were not received"],
    fact: "The letter asks for supporting documents."
  },
  {
    request: "photo id",
    phrases: ["photo id"],
    fact: "The letter asks for photo ID."
  },
  {
    request: "replacement id note",
    phrases: ["replacement id note"],
    fact: "The letter asks for a replacement ID note."
  },
  {
    request: "driver license",
    phrases: ["driver's license", "driver license"],
    fact: "The letter asks for a driver license."
  },
  {
    request: "passport",
    phrases: ["passport"],
    fact: "The letter asks for a passport."
  },
  {
    request: "state id",
    phrases: ["state id", "state-issued id", "state issued id", "state identification card"],
    fact: "The letter asks for a state ID."
  },
  {
    request: "federal id",
    phrases: ["federal id", "federal-issued id", "federal issued id", "federal identification card"],
    fact: "The letter asks for a federal ID."
  },
  {
    request: "birth certificate",
    phrases: ["birth certificate"],
    fact: "The letter asks for a birth certificate."
  },
  {
    request: "social security cards",
    phrases: ["social security card", "social security cards"],
    fact: "The letter asks for Social Security cards."
  },
  {
    request: "employer payroll documents",
    phrases: [
      "employer payroll document",
      "employer payroll documents",
      "employer's payroll document",
      "employer's payroll documents"
    ],
    fact: "The letter asks for employer payroll documents."
  },
  {
    request: "military identification",
    phrases: ["military identification", "military id", "military identification card"],
    fact: "The letter asks for military identification."
  },
  {
    request: "marriage licenses",
    phrases: ["marriage license", "marriage licenses"],
    fact: "The letter asks for marriage licenses."
  },
  {
    request: "insurance information",
    phrases: ["insurance"],
    fact: "The letter mentions insurance information."
  },
  {
    request: "insurance settlement records",
    phrases: [
      "insurance settlement information",
      "insurance settlement record",
      "insurance settlement records",
      "insurance settlement letter",
      "insurance settlement letters"
    ],
    fact: "The letter asks for insurance settlement records."
  },
  {
    request: "insurance denial letters",
    phrases: [
      "insurance denial letter",
      "insurance denial letters",
      "insurance denial",
      "denial from insurance",
      "denial because damage did not exceed the policy deductible"
    ],
    fact: "The letter asks for insurance denial letters."
  },
  {
    request: "proof of lack of insurance",
    phrases: ["proof of lack of insurance", "lack of insurance", "no insurance coverage"],
    fact: "The letter asks for proof of lack of insurance."
  },
  {
    request: "policy exclusion records",
    phrases: ["policy with an exclusion", "policy exclusion", "policy exclusions", "insurance policy exclusion"],
    fact: "The letter asks for policy exclusion records."
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
    request: "contractor license records",
    phrases: ["contractor license records"],
    fact: "The letter asks for contractor license records."
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
    request: "dental records",
    phrases: [
      "dental receipts",
      "dental receipt",
      "dental bills",
      "dental bill",
      "itemized dental bills",
      "dental estimates",
      "dental expense records",
      "medical and dental receipts",
      "medical and dental bills",
      "itemized bills, receipts, or estimates showing medical or dental expenses"
    ],
    fact: "The letter asks for dental records."
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
    request: "vehicle repair records",
    phrases: [
      "vehicle repair records",
      "vehicle repair receipts",
      "vehicle repair receipt",
      "vehicle repair estimates",
      "vehicle repair estimate",
      "vehicle repair costs",
      "mechanic receipts",
      "mechanic receipt",
      "mechanic estimates",
      "mechanic estimate",
      "verification of vehicle repair costs"
    ],
    fact: "The letter asks for vehicle repair records."
  },
  {
    request: "temporary lodging receipts",
    phrases: [
      "temporary lodging receipts",
      "evacuation lodging receipts",
      "temporary lodging records",
      "lodging expense receipts",
      "short-term lodging receipts",
      "hotel receipts",
      "motel receipts",
      "hotel or motel receipts",
      "out-of-pocket lodging receipts",
      "verifiable lodging receipts",
      "receipts for transportation and temporary lodging"
    ],
    fact: "The letter asks for temporary lodging receipts."
  },
  {
    request: "displacement assistance records",
    phrases: [
      "displacement assistance records",
      "displacement assistance receipts",
      "immediate housing records",
      "immediate housing receipts",
      "family and friends stay records",
      "family or friend stay records",
      "host stay records",
      "temporary housing option records",
      "available housing option records"
    ],
    fact: "The letter asks for displacement assistance records."
  },
  {
    request: "continued housing assistance records",
    phrases: [
      "continued temporary housing assistance records",
      "continued temporary housing assistance application",
      "application for continued temporary housing assistance",
      "continued temporary housing assistance form",
      "continued rental assistance records",
      "continued rental assistance application",
      "ctha application",
      "ctha records",
      "permanent housing plan records",
      "permanent housing plan",
      "documentation that rental assistance was used for temporary housing"
    ],
    fact: "The letter asks for continued housing assistance records."
  },
  {
    request: "serious needs records",
    phrases: [
      "serious needs records",
      "serious needs receipts",
      "serious needs assistance records",
      "emergency supply receipts",
      "emergency supplies receipts",
      "immediate needs receipts",
      "water and food receipts",
      "first aid receipts",
      "infant formula receipts",
      "breastfeeding supply receipts",
      "diaper receipts",
      "personal hygiene item receipts",
      "fuel for transportation receipts"
    ],
    fact: "The letter asks for serious needs records."
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
    request: "transitional sheltering assistance records",
    phrases: [
      "transitional sheltering assistance records",
      "transitional sheltering assistance notices",
      "transitional sheltering assistance messages",
      "tsa records",
      "tsa notices",
      "tsa messages",
      "tsa terms and conditions",
      "terms and conditions document",
      "checkout notice",
      "checkout date notice",
      "hotel checkout notice"
    ],
    fact: "The letter asks for transitional sheltering assistance records."
  },
  {
    request: "case messages",
    phrases: ["case messages"],
    fact: "The letter asks for case messages."
  },
  {
    request: "appointment notes",
    phrases: ["appointment notes"],
    fact: "The letter asks for appointment notes."
  },
  {
    request: "contractor messages",
    phrases: ["contractor messages"],
    fact: "The letter asks for contractor messages."
  },
  {
    request: "unsafe home access notes",
    phrases: ["notes about unsafe home access"],
    fact: "The letter asks for unsafe home access notes."
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
    request: "damage documentation",
    phrases: ["damage documentation"],
    fact: "The letter asks for damage documentation."
  },
  {
    request: "hazard mitigation records",
    phrases: [
      "hazard mitigation records",
      "hazard mitigation receipts",
      "hazard mitigation estimates",
      "mitigation repair records",
      "mitigation repair receipts",
      "mitigation repair estimates",
      "mitigation measure records",
      "mitigation measure receipts",
      "mitigation measure estimates",
      "repair and rebuild stronger records",
      "rebuild stronger records"
    ],
    fact: "The letter asks for hazard mitigation records."
  },
  {
    request: "private access records",
    phrases: [
      "private access records",
      "private access damage records",
      "sole access damage records",
      "privately-owned road records",
      "privately owned road records",
      "privately-owned road repair records",
      "privately owned road repair records",
      "private road repair records",
      "private road damage records",
      "private bridge repair records",
      "private bridge damage records",
      "private dock repair records",
      "private dock damage records",
      "bridge repair estimates",
      "dock repair estimates"
    ],
    fact: "The letter asks for private access records."
  },
  {
    request: "smoke damage records",
    phrases: ["smoke damage records"],
    fact: "The letter asks for smoke damage records."
  },
  {
    request: "cleanup receipts",
    phrases: [
      "cleanup receipts",
      "clean and sanitize receipts",
      "cleaning and sanitizing receipts",
      "cleanup supply receipts",
      "cleanup supplies receipts",
      "cleanup material receipts",
      "cleanup materials receipts",
      "cleaning supply receipts",
      "cleaning supplies receipts",
      "cleaning material receipts",
      "cleaning materials receipts",
      "paid cleanup help receipts",
      "receipts from any supplies, materials or paid help",
      "receipts from any supplies, materials, or paid help",
      "receipts for supplies, materials or paid help",
      "receipts for supplies, materials, or paid help"
    ],
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
    request: "miscellaneous item records",
    phrases: [
      "miscellaneous item records",
      "miscellaneous item receipts",
      "generator receipts",
      "generator receipt",
      "generator purchase receipts",
      "chainsaw receipts",
      "chainsaw receipt",
      "chainsaw rental receipts",
      "chainsaw rental receipt",
      "dehumidifier receipts",
      "dehumidifier receipt",
      "dehumidifier rental receipts",
      "dehumidifier rental receipt"
    ],
    fact: "The letter asks for miscellaneous item records."
  },
  {
    request: "replacement item receipts",
    phrases: ["replacement household item receipts", "receipts for replacement household items"],
    fact: "The letter asks for replacement item receipts."
  },
  {
    request: "personal property records",
    phrases: [
      "personal property records",
      "personal property receipts",
      "personal property inventory",
      "personal property list",
      "appliance records",
      "appliance receipts",
      "clothing records",
      "clothing receipts",
      "computer records",
      "computer receipts",
      "occupational tool records",
      "occupational tool receipts",
      "educational material records",
      "educational material receipts",
      "home furnishing records",
      "home furnishing receipts"
    ],
    fact: "The letter asks for personal property records."
  },
  {
    request: "child care records",
    phrases: [
      "child care receipts",
      "childcare receipts",
      "child care receipt",
      "childcare receipt",
      "child care contracts",
      "childcare contracts",
      "child care contract",
      "childcare contract",
      "child care estimates",
      "childcare estimates",
      "child care provider letters",
      "childcare provider letters",
      "child care provider letter",
      "childcare provider letter",
      "letter from the child care provider",
      "signed letter from the child care provider",
      "post-disaster child care receipts or estimates",
      "pre-disaster child care receipts, contract, or signed letter"
    ],
    fact: "The letter asks for child care records."
  },
  {
    request: "moving and storage records",
    phrases: [
      "moving and storage records",
      "moving and storage receipts",
      "moving and storage expense records",
      "moving receipts",
      "moving receipt",
      "moving expense records",
      "moving truck rental receipts",
      "storage receipts",
      "storage receipt",
      "storage unit receipts",
      "storage expense records",
      "moving and storing personal property"
    ],
    fact: "The letter asks for moving and storage records."
  },
  {
    request: "funeral records",
    phrases: [
      "funeral assistance records",
      "funeral expense documents",
      "funeral expense records",
      "funeral receipts",
      "funeral receipt",
      "funeral home contracts",
      "funeral home contract",
      "burial receipts",
      "burial receipt",
      "burial expense estimates",
      "burial estimates",
      "reburial expenses",
      "reburial receipts",
      "death certificate",
      "official death certificate"
    ],
    fact: "The letter asks for funeral records."
  },
  {
    request: "accessibility expense records",
    phrases: ["accessibility and accommodation expense records"],
    fact: "The letter asks for accessibility expense records."
  },
  {
    request: "accessibility notes",
    phrases: ["accessibility and accommodation notes"],
    fact: "The letter asks for accessibility notes."
  },
  {
    request: "accommodation expense records",
    phrases: ["accessibility and accommodation expense records"],
    fact: "The letter asks for accommodation expense records."
  },
  {
    request: "accommodation notes",
    phrases: ["accessibility and accommodation notes", "accommodation notes"],
    fact: "The letter asks for accommodation notes."
  },
  {
    request: "accommodation receipts",
    phrases: ["accommodation receipts"],
    fact: "The letter asks for accommodation receipts."
  },
  {
    request: "medical access notes",
    phrases: ["medical access notes"],
    fact: "The letter asks for medical access notes."
  }
];

const requestFactByName = new Map(requestDetectionRules.map(({ request, fact }) => [request, fact]));

const includesAny = (value: string, phrases: string[]): boolean =>
  phrases.some((phrase) => value.includes(phrase));

const hasRequest = (requests: string[], candidates: string[]): boolean =>
  candidates.some((request) => requests.includes(request));

const evidencePhraseAlternates = (candidate: string): string[] => {
  const normalizedCandidate = candidate.toLowerCase();

  return normalizedCandidate.endsWith("s")
    ? [normalizedCandidate, normalizedCandidate.slice(0, -1)]
    : [normalizedCandidate];
};

const hasAvailableEvidence = (availableEvidence: string[], candidates: string[]): boolean =>
  candidates.some((candidate) =>
    evidencePhraseAlternates(candidate).some((alternate) =>
      availableEvidence.some((item) => item.toLowerCase().includes(alternate))
    )
  );

const evidenceStatus = (
  requests: string[],
  availableEvidence: string[],
  candidates: string[]
): EvidenceItem["status"] => {
  if (hasAvailableEvidence(availableEvidence, candidates)) {
    return "available";
  }

  return hasRequest(requests, candidates) ? "missing" : "optional";
};

const normalizeDeadlineText = (value: string) => {
  const trimmedValue = value.replace(/\s+/g, " ").trim();
  return trimmedValue.charAt(0).toLowerCase() + trimmedValue.slice(1);
};

const hasDeniedApplicationCue = (normalized: string): boolean =>
  /\b(?:your|the)\s+application\s+(?:is|was|has been)\s+denied\b/.test(normalized) ||
  /\b(?:your|the)\s+(?:request|claim|assistance)\s+(?:is|was|has been)\s+denied\b/.test(normalized);

const hasRequestForInformationCue = (normalized: string): boolean =>
  normalized.includes("request for information") || normalized.includes("additional information is needed before");

const buildLetterFacts = (normalized: string, requests: string[], deadlines: Deadline[]): string[] => {
  const facts: string[] = [];

  if (hasDeniedApplicationCue(normalized)) {
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
  const needsInjectionReview = injectionWarnings.length > 0;
  const appearsSpanish = spanishDisasterLetterPatterns.some((pattern) => pattern.test(letterText));

  const detectedRequests = requestDetectionRules
    .filter(({ phrases }) => includesAny(normalized, phrases))
    .map(({ request }) => request);

  const detectedDeadlines: Deadline[] = [];

  if (normalized.includes("appeal within 60 days")) {
    detectedDeadlines.push({ label: "appeal window", text: "appeal within 60 days", source: "uploaded_letter" });
  }

  const appealWithinDaysMatch = appealWithinDaysPattern.exec(letterText);
  if (appealWithinDaysMatch && !detectedDeadlines.some((deadline) => deadline.label === "appeal window")) {
    detectedDeadlines.push({
      label: "appeal window",
      text: normalizeDeadlineText(appealWithinDaysMatch[0]),
      source: "uploaded_letter"
    });
  }

  const appealByDateMatch = appealByDatePattern.exec(letterText);
  if (appealByDateMatch) {
    detectedDeadlines.push({
      label: "appeal date",
      text: normalizeDeadlineText(appealByDateMatch[0]),
      source: "uploaded_letter"
    });
  }

  const responseWithinDaysMatch = responseWithinDaysPattern.exec(letterText);
  if (responseWithinDaysMatch) {
    detectedDeadlines.push({
      label: "response window",
      text: normalizeDeadlineText(responseWithinDaysMatch[0]),
      source: "uploaded_letter"
    });
  }

  const responseByDateMatch = responseByDatePattern.exec(letterText);
  if (responseByDateMatch && !responseByDateMatch[0].toLowerCase().includes("appeal")) {
    detectedDeadlines.push({
      label: "response date",
      text: normalizeDeadlineText(responseByDateMatch[0]),
      source: "uploaded_letter"
    });
  }

  const passiveResponseByDateMatch = passiveResponseByDatePattern.exec(letterText);
  if (passiveResponseByDateMatch) {
    detectedDeadlines.push({
      label: "response date",
      text: normalizeDeadlineText(passiveResponseByDateMatch[0]),
      source: "uploaded_letter"
    });
  }

  const facts = buildLetterFacts(normalized, detectedRequests, detectedDeadlines);
  const uncertainties = ["OpenRelief cannot confirm final eligibility or legal options."];

  if (appearsSpanish) {
    uncertainties.push(
      "OpenRelief is English-first in V1 and cannot safely classify this letter without human review."
    );
  }

  if (hasRequestForInformationCue(normalized)) {
    return {
      letterType: "request_for_information",
      summary: "This letter appears to request more information before a decision can be made.",
      facts,
      uncertainties,
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: needsInjectionReview
    };
  }

  if (hasDeniedApplicationCue(normalized)) {
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

  if (normalized.includes("inspection") || normalized.includes("inspector")) {
    return {
      letterType: "inspection_notice",
      summary: "This letter appears to describe an inspection step.",
      facts,
      uncertainties,
      detectedDeadlines,
      detectedRequests,
      injectionWarnings,
      needsHumanReview: needsInjectionReview
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
      needsHumanReview: needsInjectionReview
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
      needsHumanReview: needsInjectionReview
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
  const hasDenialOrAppealContext =
    /appeal deadline|response deadline|deadline is (?:today|tomorrow)|need to appeal|appeal by|denied assistance|legal strategy|sue fema|lawsuit|legal action/i.test(normalized) ||
    /\b(?:fema|sba|agency|appeal|response|paperwork|documents?|records?).{0,40}\b(?:due (?:today|tomorrow)|due date is (?:today|tomorrow))\b/i.test(normalized) ||
    /(?:openrelief|you) (?:can )?(?:submit|file) (?:my |our )?(?:fema |sba )?(?:application|appeal|claim) for (?:me|us)/i.test(normalized) ||
    /(?:submit|file) (?:my|our) (?:fema |sba )?(?:application|appeal|claim) for (?:me|us)/i.test(normalized);
  const asksForFinalEligibility =
    /\b(?:am i|are we) eligible\b/i.test(normalized) ||
    /\b(?:do i|do we) qualify\b/i.test(normalized) ||
    /\b(?:can|could) (?:you|openrelief) (?:tell|determine|confirm).{0,40}\b(?:eligible|qualify)\b/i.test(normalized) ||
    /\bwill (?:fema|sba|the agency) (?:approve|pay|cover)\b/i.test(normalized) ||
    /\bhow much (?:will|can) (?:fema|sba|the agency) (?:pay|cover|give)\b/i.test(normalized);

  if (letter?.letterType === "denial" || letter?.detectedDeadlines.length || hasDenialOrAppealContext) {
    addFlag(flags, "denial_or_appeal");
  }

  if (asksForFinalEligibility) {
    addFlag(flags, "final_eligibility_request");
  }

  if (/immediate danger|in danger right now|fire.*right now|flames?.{0,40}inside|trapped|cannot evacuate|can't evacuate|cannot leave|can't leave|cannot get out|can't get out|stuck inside|no transportation.{0,80}(?:evacuation order|leave now|evacuat)|smoke.*filling|breathing smoke|carbon monoxide|generator (?:exhaust|fumes?)|(?:roof|ceiling|wall|floor|structure|home|house|building).{0,30}(?:collapsing|caving in|unstable)|(?:collapsing|caving in).{0,30}(?:roof|ceiling|wall|floor|structure|home|house|building)|downed power line|live wire|power line.*sparking|sparking power line|gas leak|life[-\s]?threatening/i.test(normalized)) {
    addFlag(flags, "immediate_danger");
  }

  if (/homeless|no place to stay|nowhere to stay|sleeping outside|staying outside|sleeping in (?:a |our |my )?(?:car|truck|van|vehicle|rv|tent)|staying in (?:a |our |my )?tent|living in (?:a |our |my )?(?:car|truck|van|vehicle|rv|tent)|couch surfing|shelter|evict/i.test(normalized)) {
    addFlag(flags, "homelessness");
  }

  if (/medical emergency|oxygen|medicine|medication|insulin|inhaler|prescriptions?|cpap|dialysis|urgent medical|hospital|cannot breathe|can't breathe|not breathing|unconscious|chest pain|heart attack|bleeding|severe burns?|burn injur(?:y|ies)|seizure|stroke/i.test(normalized)) {
    addFlag(flags, "medical_emergency");
  }

  if (/abuse|domestic violence|unsafe (?:home|living)|violence|cannot safely stay|someone hit me|threatened me|threatening me|stalking|restraining order/i.test(normalized)) {
    addFlag(flags, "abuse_or_unsafe_home");
  }

  if (/disability|wheelchair|walker|cane|blind|low[-\s]vision|deaf|hard[-\s]of[-\s]hearing|accessible|accommodation|service animal|asl interpreter/i.test(normalized)) {
    addFlag(flags, "disability_accommodation");
  }

  if (/immigration|undocumented|deportation|visa|mixed status|asylum/i.test(normalized)) {
    addFlag(flags, "immigration_sensitive");
  }

  if (
    /scam|fraud|fraudulent|fake fema|gift cards?|guarantee.*(?:fema )?approval|pay .*release (?:fema )?funds|bank account number|full bank number|bank numbers?|routing number|ssn|social security number|door codes?|entry codes?|prepaid debit card|wire transfer|processing fee|application fee|expedite fee|verification fee|upfront fee|bitcoin|cryptocurrency|cash app|zelle|venmo|paypal|money order|western union|moneygram|cashier check|asked for.*(?:fema code|application id|payment code|verification code|access code|password|passcode|otp|\bpin\b)/i.test(normalized)
  ) {
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
    const needsInjectionReview = letter.injectionWarnings.length > 0;
    const needsEligibilityReview = caseContext.riskFlags.includes("final_eligibility_request");
    const needsRiskReview = caseContext.riskFlags.some((riskFlag) => riskFlag !== "final_eligibility_request");
    const needsDenialReview = letter.needsHumanReview && letter.letterType === "denial";
    const needsAppealReview = letter.needsHumanReview && letter.detectedDeadlines.length > 0;
    const needsDenialOrAppealReview = needsDenialReview || needsAppealReview || needsRiskReview;
    const needsUnclearLetterReview = letter.needsHumanReview && !needsInjectionReview && !needsDenialOrAppealReview;
    const humanReviewReasons = [
      needsInjectionReview ? "Prompt injection or unsafe instructions should be reviewed by a qualified helper." : "",
      needsUnclearLetterReview ? "Unclear or unsupported letters should be reviewed by a qualified helper." : "",
      needsDenialOrAppealReview
        ? "Denial, appeal, or risk flags should be reviewed by a qualified helper."
        : "",
      needsEligibilityReview ? "Final eligibility questions should be reviewed by a qualified helper." : "",
      needsPolicyReview ? "Policy sources need review before relying on generated next steps." : ""
    ].filter(Boolean);
    const humanReviewSourceIds = needsEligibilityReview ? ["fema-documents", "fema-appeals"] : ["fema-appeals"];

    items.push({
      id: "human-review",
      title: "Request human review",
      category: "human_review",
      reason: humanReviewReasons.join(" "),
      editable: true,
      sourceIds: humanReviewSourceIds
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

export const buildEvidencePacket = (requests: string[], availableEvidence: string[] = []): EvidencePacket => ({
  groups: [
    {
      category: "identity",
      items: [
        {
          label: "Photo ID, passport, birth certificate, or other identity proof",
          status: evidenceStatus(requests, availableEvidence, [
            "photo id",
            "replacement id note",
            "driver license",
            "driver's license",
            "passport",
            "state id",
            "federal id",
            "birth certificate",
            "social security cards",
            "employer payroll documents",
            "military identification",
            "marriage licenses"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "residence",
      items: [
        {
          label: "Lease, mortgage, utility bill, or other occupancy proof",
          status: evidenceStatus(requests, availableEvidence, [
            "proof of occupancy",
            "occupancy records",
            "lease records",
            "lease agreements",
            "housing agreements",
            "utility records",
            "utility bills",
            "rent receipts",
            "continued housing assistance records",
            "employer statements",
            "public official statements",
            "bank statements",
            "credit card statements",
            "phone bills",
            "cable or satellite bills",
            "medical provider bills",
            "voter registration cards",
            "social service organization documents",
            "benefit documents",
            "mobile home park documents",
            "vehicle registrations",
            "affidavits of residency",
            "court documentation",
            "school documents",
            "other household records"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "ownership_or_lease",
      items: [
        {
          label: "Deed, lease, mortgage statement, or title record",
          status: evidenceStatus(requests, availableEvidence, [
            "ownership records",
            "proof of ownership",
            "deed records",
            "deed or title",
            "deed of trust",
            "mortgage statements",
            "mortgage documents",
            "escrow analysis",
            "property tax statements",
            "property tax receipts",
            "property tax bills",
            "homeowners insurance statements",
            "real property insurance records",
            "escrow statements",
            "tax assessment records",
            "title records",
            "manufactured home titles",
            "home purchase contracts",
            "contract for deed",
            "land installment contracts",
            "quitclaim deeds",
            "bills of sale",
            "bonds for title",
            "will or heirship records",
            "major repair receipts",
            "mobile home park ownership letters",
            "court ownership documents",
            "public official ownership letters",
            "lease records",
            "lease agreements",
            "rental agreements"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "damage",
      items: [
        {
          label: "Damage photos, receipts, or repair estimates",
          status: evidenceStatus(requests, availableEvidence, [
            "contractor estimates",
            "contractor license records",
            "damage photos",
            "damage documentation",
            "damage records",
            "hazard mitigation records",
            "private access records",
            "smoke damage records",
            "repair estimates"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "receipts",
      items: [
        {
          label: "Repair, hotel, replacement, cleanup, or child care records",
          status: evidenceStatus(requests, availableEvidence, [
            "repair receipts",
            "temporary lodging receipts",
            "cleanup receipts",
            "debris removal records",
            "repair records",
            "supporting receipts",
            "displacement assistance records",
            "continued housing assistance records",
            "serious needs records",
            "generator rental receipts",
            "temporary power equipment receipts",
            "miscellaneous item records",
            "replacement item receipts",
            "personal property records",
            "child care records",
            "moving and storage records"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "insurance",
      items: [
        {
          label: "Insurance claim status or denial note",
          status: evidenceStatus(requests, availableEvidence, [
            "insurance information",
            "insurance settlement records",
            "insurance denial letters",
            "proof of lack of insurance",
            "policy exclusion records"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "medical_or_transportation",
      items: [
        {
          label: "Medical, dental, medication, transportation, or accessibility expense notes",
          status: evidenceStatus(requests, availableEvidence, [
            "medical receipts",
            "dental records",
            "medicine storage receipts",
            "transportation receipts",
            "transportation notes",
            "vehicle repair records",
            "accessibility expense records",
            "accessibility notes",
            "accommodation expense records",
            "accommodation notes",
            "accommodation receipts",
            "medical access notes"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "funeral",
      items: [
        {
          label: "Funeral, burial, reburial, or death certificate records",
          status: evidenceStatus(requests, availableEvidence, ["funeral records"]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "communications",
      items: [
        {
          label: "Agency letters, emails, call notes, or case messages",
          status: evidenceStatus(requests, availableEvidence, [
            "agency messages",
            "shelter placement notes",
            "transitional sheltering assistance records",
            "case messages",
            "appointment notes",
            "contractor messages",
            "unsafe home access notes"
          ]),
          sourceIds: ["fema-documents"]
        }
      ]
    },
    {
      category: "other",
      items: [
        {
          label: "Other disaster recovery documents named in the letter",
          status: evidenceStatus(requests, availableEvidence, [
            "account listed records",
            "requested records",
            "supporting documents"
          ]),
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

const isIsoCalendarDate = (value: string) => {
  const trimmedValue = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const officialPolicySourceDomains = ["fema.gov", "sba.gov", "disasterassistance.gov", "ca.gov"];
const policyPackJurisdictions = ["California"];
const policyJurisdictions = ["federal", "california", "county", "city", "nonprofit"];
const policyDisasterTypes = ["wildfire", "flood", "hurricane", "earthquake", "other"];
const policySourceTypes = ["webpage", "pdf", "form", "faq", "program-page"];
const policyTrustTiers = [1, 2, 3, 4];
const policyIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const policyVersionPattern = /^\d+\.\d+\.\d+$/;

const parsePolicySourceUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

const isOfficialPolicySourceHost = (host: string) =>
  officialPolicySourceDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));

const duplicateIds = (ids: string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  });

  return [...duplicates];
};

export const validatePolicyPack = (policyPack: PolicyPack, asOf = "2026-07-13"): PolicyValidationResult => {
  const policyPackMetadataErrors = [
    policyPack.id.trim().length === 0 ? "Policy pack has no id." : undefined,
    policyPack.id.trim().length > 0 && !policyIdPattern.test(policyPack.id)
      ? "Policy pack has invalid id."
      : undefined,
    policyPack.name.trim().length === 0 ? "Policy pack has no name." : undefined,
    policyPack.jurisdiction.trim().length === 0 ? "Policy pack has no jurisdiction." : undefined,
    policyPack.jurisdiction.trim().length > 0 && !policyPackJurisdictions.includes(policyPack.jurisdiction.trim())
      ? "Policy pack has invalid jurisdiction."
      : undefined,
    policyPack.disasterType.trim().length === 0 ? "Policy pack has no disasterType." : undefined,
    policyPack.disasterType.trim().length > 0 && !policyDisasterTypes.includes(policyPack.disasterType.trim())
      ? "Policy pack has invalid disasterType."
      : undefined,
    policyPack.version.trim().length === 0 ? "Policy pack has no version." : undefined,
    policyPack.version.trim().length > 0 && !policyVersionPattern.test(policyPack.version.trim())
      ? "Policy pack has invalid version."
      : undefined,
    policyPack.sources.length === 0 ? "Policy pack has no sources." : undefined,
    policyPack.rules.length === 0 ? "Policy pack has no rules." : undefined
  ].filter((error): error is string => error !== undefined);
  const sourceIds = new Set(policyPack.sources.map((source) => source.id));
  const sourceIdErrors = policyPack.sources.flatMap((source) => {
    if (source.id.trim().length === 0) {
      return ["Policy source has no id."];
    }
    return policyIdPattern.test(source.id) ? [] : [`Policy source ${source.id} has invalid id.`];
  });
  const duplicateSourceErrors = duplicateIds(policyPack.sources.map((source) => source.id)).map(
    (sourceId) => `Policy source ${sourceId} is duplicated.`
  );
  const ruleIdErrors = policyPack.rules.flatMap((rule) => {
    if (rule.id.trim().length === 0) {
      return ["Policy rule has no id."];
    }
    return policyIdPattern.test(rule.id) ? [] : [`Policy rule ${rule.id} has invalid id.`];
  });
  const duplicateRuleErrors = duplicateIds(policyPack.rules.map((rule) => rule.id)).map(
    (ruleId) => `Policy rule ${ruleId} is duplicated.`
  );
  const sourceErrors = policyPack.sources.flatMap((source) => {
    const errors: string[] = [];
    const trimmedTitle = source.title.trim();
    const trimmedPublisher = source.publisher.trim();
    const trimmedUrl = source.url.trim();

    if (trimmedTitle.length === 0) {
      errors.push(`Policy source ${source.id} has no title.`);
    }

    if (trimmedPublisher.length === 0) {
      errors.push(`Policy source ${source.id} has no publisher.`);
    }

    if (trimmedUrl.length === 0) {
      errors.push(`Policy source ${source.id} has no url.`);
    } else {
      const parsedUrl = parsePolicySourceUrl(trimmedUrl);
      if (parsedUrl === undefined) {
        errors.push(`Policy source ${source.id} has invalid url.`);
      } else {
        const host = parsedUrl.hostname.toLowerCase().replace(/\.$/, "");
        if (parsedUrl.protocol !== "https:") {
          errors.push(`Policy source ${source.id} must use https.`);
        }
        if (!isOfficialPolicySourceHost(host)) {
          errors.push(`Policy source ${source.id} uses unapproved domain ${host}.`);
        }
      }
    }

    const trimmedJurisdiction = source.jurisdiction.trim();
    if (trimmedJurisdiction.length === 0) {
      errors.push(`Policy source ${source.id} has no jurisdiction.`);
    } else if (!policyJurisdictions.includes(trimmedJurisdiction)) {
      errors.push(`Policy source ${source.id} has invalid jurisdiction.`);
    }

    const trimmedDisasterType = source.disasterType.trim();
    if (trimmedDisasterType.length === 0) {
      errors.push(`Policy source ${source.id} has no disasterType.`);
    } else if (!policyDisasterTypes.includes(trimmedDisasterType)) {
      errors.push(`Policy source ${source.id} has invalid disasterType.`);
    } else if (trimmedDisasterType !== policyPack.disasterType.trim()) {
      errors.push(`Policy source ${source.id} does not match policy pack disasterType.`);
    }

    const trimmedRetrievedAt = source.retrievedAt.trim();
    const trimmedLastReviewedAt = source.lastReviewedAt.trim();

    if (trimmedRetrievedAt.length === 0) {
      errors.push(`Policy source ${source.id} has no retrievedAt.`);
    } else if (!isIsoCalendarDate(trimmedRetrievedAt)) {
      errors.push(`Policy source ${source.id} has invalid retrievedAt.`);
    } else if (daysBetween(asOf, trimmedRetrievedAt) > 0) {
      errors.push(`Policy source ${source.id} has future retrievedAt.`);
    }

    if (trimmedLastReviewedAt.length === 0) {
      errors.push(`Policy source ${source.id} has no lastReviewedAt.`);
    } else if (!isIsoCalendarDate(trimmedLastReviewedAt)) {
      errors.push(`Policy source ${source.id} has invalid lastReviewedAt.`);
    } else if (daysBetween(asOf, trimmedLastReviewedAt) > 0) {
      errors.push(`Policy source ${source.id} has future lastReviewedAt.`);
    }

    const trimmedEffectiveDate = source.effectiveDate?.trim();
    if (
      trimmedEffectiveDate !== undefined &&
      trimmedEffectiveDate.length > 0 &&
      !isIsoCalendarDate(trimmedEffectiveDate)
    ) {
      errors.push(`Policy source ${source.id} has invalid effectiveDate.`);
    } else if (
      trimmedEffectiveDate !== undefined &&
      trimmedEffectiveDate.length > 0 &&
      daysBetween(asOf, trimmedEffectiveDate) > 0
    ) {
      errors.push(`Policy source ${source.id} has future effectiveDate.`);
    }

    const trimmedSourceType = source.sourceType.trim();
    if (trimmedSourceType.length === 0) {
      errors.push(`Policy source ${source.id} has no sourceType.`);
    } else if (!policySourceTypes.includes(trimmedSourceType)) {
      errors.push(`Policy source ${source.id} has invalid sourceType.`);
    }

    if (!policyTrustTiers.includes(source.trustTier)) {
      errors.push(`Policy source ${source.id} has invalid trustTier.`);
    }

    if (injectionPatterns.some((pattern) => pattern.test(`${source.title} ${source.publisher}`))) {
      errors.push(`Policy source ${source.id} contains instruction-like metadata.`);
    }

    return errors;
  });
  const sourceWarnings = policyPack.sources.flatMap((source) =>
    source.lastReviewedAt.trim().length > 0 && daysBetween(source.lastReviewedAt, asOf) > 30
      ? [`Policy source ${source.id} last reviewed more than 30 days ago.`]
      : []
  );
  const ruleErrors = policyPack.rules.flatMap((rule) => {
    const errors: string[] = [];

    if (rule.topic.trim().length === 0) {
      errors.push(`Policy rule ${rule.id} has no topic.`);
    }

    if (rule.statement.trim().length === 0) {
      errors.push(`Policy rule ${rule.id} has no statement.`);
    }

    if (injectionPatterns.some((pattern) => pattern.test(rule.statement))) {
      errors.push(`Policy rule ${rule.id} contains instruction-like text.`);
    }

    if (rule.sourceIds.length === 0) {
      errors.push(`Policy rule ${rule.id} has no sourceIds.`);
    }

    const hasBlankSourceId = rule.sourceIds.some((sourceId) => sourceId.trim().length === 0);
    if (hasBlankSourceId) {
      errors.push(`Policy rule ${rule.id} has blank sourceId.`);
    }

    const invalidSourceIds = rule.sourceIds.filter(
      (sourceId) => sourceId.trim().length > 0 && !policyIdPattern.test(sourceId)
    );
    invalidSourceIds.forEach((sourceId) => {
      errors.push(`Policy rule ${rule.id} has invalid sourceId ${sourceId}.`);
    });

    const missingSources = rule.sourceIds.filter(
      (sourceId) => sourceId.trim().length > 0 && !sourceIds.has(sourceId)
    );
    if (missingSources.length > 0) {
      errors.push(`Policy rule ${rule.id} references missing sources: ${missingSources.join(", ")}.`);
    }

    return errors;
  });
  const errors = [
    ...policyPackMetadataErrors,
    ...sourceIdErrors,
    ...duplicateSourceErrors,
    ...sourceErrors,
    ...ruleIdErrors,
    ...duplicateRuleErrors,
    ...ruleErrors
  ];

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
