import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileText,
  HelpCircle,
  Lock,
  ShieldCheck,
  Upload
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  analyzeLetter,
  buildEvidencePacket,
  createAppealDraft,
  createCaseExport,
  createChecklist,
  detectRiskFlags,
  redactRestrictedIdentifiers,
  type ChecklistItem,
  type Deadline,
  type EvidencePacket,
  type LetterAnalysis,
  type LetterType
} from "../../../packages/core/src/openrelief";
import { californiaWildfirePolicyPack } from "../../../packages/policy-packs/california-wildfire";
import { extractImageText, extractPdfText, readTextFile } from "./documentExtraction";
import "./styles.css";

const sampleLetter = `FEMA Notice
Your application is denied because proof of occupancy is missing.
You may appeal within 60 days from the date of this letter.`;

const steps = [
  ["Start", "Create a new case"],
  ["Intake", "Survivor information"],
  ["Letter", "Review and edit letter"],
  ["Checklist", "Next steps and tasks"],
  ["Evidence", "Documents and photos"],
  ["Export", "Save or print packet"]
];

const sourceById = new Map(californiaWildfirePolicyPack.sources.map((source) => [source.id, source]));
const storageKeyPrefix = "openrelief:v1:";
const caseStorageKey = "openrelief:v1:case";
const casesStorageKey = "openrelief:v1:cases";
const localCaseIdPrefix = "OR-CA-2026-";
const sampleFileName = "Sample_FEMA_Denial.txt";
const textFileExtensions = [".txt"];
const pdfFileExtensions = [".pdf"];
const imageFileExtensions = [".png", ".jpg", ".jpeg"];
const acceptedFileTypes = [
  { extensions: textFileExtensions, mimeTypes: ["text/plain"] },
  { extensions: pdfFileExtensions, mimeTypes: ["application/pdf"] },
  { extensions: [".png"], mimeTypes: ["image/png"] },
  { extensions: [".jpg", ".jpeg"], mimeTypes: ["image/jpeg"] }
];
const maxUploadSizeBytes = 10 * 1024 * 1024;
const maxLetterTextLength = 50_000;
const maxOptionalTextLength = 10_000;
const maxCaseArchiveTextLength = 100_000;
const pdfExtractionMessage = "Could not extract PDF text. Paste extracted text below.";
const imageExtractionMessage = "Could not extract image text. Paste extracted text below.";
const letterLengthMessage = "Letter text too long. Keep extracted text under 50,000 characters.";
const caseArchiveLengthMessage = "Saved cases JSON too long. Keep archives under 100,000 characters.";
const letterTypeLabels: Record<LetterType, string> = {
  approval: "Approval",
  denial: "Claim denial",
  request_for_information: "Request for information",
  deadline_notice: "Deadline notice",
  inspection_notice: "Inspection notice",
  unknown: "Needs review"
};
const riskFlagLabels: Record<string, string> = {
  immediate_danger: "Immediate danger",
  denial_or_appeal: "Denial or appeal deadline",
  final_eligibility_request: "Final eligibility question",
  homelessness: "Housing instability",
  medical_emergency: "Medical emergency",
  abuse_or_unsafe_home: "Unsafe home or abuse concern",
  disability_accommodation: "Disability accommodation",
  immigration_sensitive: "Immigration-sensitive concern",
  suspected_fraud_or_scam: "Suspected fraud or scam"
};
const deadlineSourceLabels: Record<Deadline["source"], string> = {
  uploaded_letter: "Uploaded letter",
  policy_pack: "Policy pack"
};

type SavedDraft = {
  letterText?: string;
  fileName?: string;
  intakeText?: string;
  availableEvidenceText?: string;
};

type EvidenceSummaryItem = {
  label: string;
  sourceIds: string[];
};

type ChecklistSummaryItem = Pick<
  ChecklistItem,
  "id" | "title" | "category" | "reason" | "editable" | "deadline" | "sourceIds"
>;

type ChecklistStatus = "todo" | "done";

type ChecklistStatusMap = Record<string, ChecklistStatus>;

type CaseQueueSort = "updated" | "deadline" | "escalation" | "missing";

type SavedCaseSummary = {
  id: string;
  title: string;
  letterType: LetterType;
  letterText: string;
  fileName: string;
  intakeText: string;
  availableEvidenceText: string;
  deadlines: Deadline[];
  missingEvidence: EvidenceSummaryItem[];
  checklistItems: ChecklistSummaryItem[];
  checklistStatuses: ChecklistStatusMap;
  riskFlags: string[];
  summary: string;
  notes: string;
  updatedAt: string;
};

const readSavedDraft = (): SavedDraft => {
  try {
    const saved = window.localStorage.getItem(caseStorageKey);
    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved) as SavedDraft;
    return {
      letterText: typeof parsed.letterText === "string" ? redactRestrictedIdentifiers(parsed.letterText) : undefined,
      fileName: typeof parsed.fileName === "string" ? redactRestrictedIdentifiers(parsed.fileName) : undefined,
      intakeText: typeof parsed.intakeText === "string" ? redactRestrictedIdentifiers(parsed.intakeText) : undefined,
      availableEvidenceText:
        typeof parsed.availableEvidenceText === "string"
          ? redactRestrictedIdentifiers(parsed.availableEvidenceText)
          : undefined
    };
  } catch {
    return {};
  }
};

const redactStringList = (items: string[]): string[] => items.map((item) => redactRestrictedIdentifiers(item));

const limitText = (value: string, maxLength: number): string =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

const parseAvailableEvidenceText = (value: string): string[] =>
  redactRestrictedIdentifiers(value)
    .toLowerCase()
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const formatRiskFlag = (flag: string): string => riskFlagLabels[flag] ?? flag;

const formatDeadlineSource = (source: Deadline["source"]): string => deadlineSourceLabels[source];

const currentTimestamp = (): string => new Date().toISOString();

const normalizeSavedCaseUpdatedAt = (value: unknown): string =>
  typeof value === "string" ? limitText(redactRestrictedIdentifiers(value), 64) : "";

const formatSavedCaseUpdatedAt = (updatedAt: string): string => {
  const date = new Date(updatedAt);
  return Number.isNaN(date.getTime()) ? "Not recorded" : updatedAt.slice(0, 16).replace("T", " ");
};

const isChecklistStatus = (value: unknown): value is ChecklistStatus => value === "todo" || value === "done";

const defaultChecklistStatuses = (items: ChecklistSummaryItem[]): ChecklistStatusMap =>
  items.reduce<ChecklistStatusMap>((statuses, item) => {
    statuses[item.id] = "todo";
    return statuses;
  }, {});

const normalizeChecklistStatuses = (items: ChecklistSummaryItem[], value: unknown): ChecklistStatusMap => {
  const candidate =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return items.reduce<ChecklistStatusMap>((statuses, item) => {
    const status = candidate[item.id];
    statuses[item.id] = isChecklistStatus(status) ? status : "todo";
    return statuses;
  }, {});
};

const completedChecklistCount = (savedCase: SavedCaseSummary): number =>
  savedCase.checklistItems.filter((item) => savedCase.checklistStatuses[item.id] === "done").length;

const caseQueueStatus = (savedCase: SavedCaseSummary): string => {
  if (savedCase.riskFlags.length > 0 || savedCase.letterType === "denial" || savedCase.letterType === "unknown") {
    return "Needs review";
  }

  if (savedCase.missingEvidence.length > 0) {
    return "Missing evidence";
  }

  if (savedCase.checklistItems.length > 0 && completedChecklistCount(savedCase) === savedCase.checklistItems.length) {
    return "Checklist complete";
  }

  return "In progress";
};

const savedCaseUpdatedTime = (savedCase: SavedCaseSummary): number => {
  const timestamp = Date.parse(savedCase.updatedAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const compareSavedCases = (sort: CaseQueueSort, left: SavedCaseSummary, right: SavedCaseSummary): number => {
  if (sort === "deadline") {
    const deadlineDelta = Number(right.deadlines.length > 0) - Number(left.deadlines.length > 0);
    if (deadlineDelta !== 0) {
      return deadlineDelta;
    }
  }

  if (sort === "escalation") {
    const escalationDelta = Number(right.riskFlags.length > 0) - Number(left.riskFlags.length > 0);
    if (escalationDelta !== 0) {
      return escalationDelta;
    }
  }

  if (sort === "missing") {
    const missingDelta = right.missingEvidence.length - left.missingEvidence.length;
    if (missingDelta !== 0) {
      return missingDelta;
    }
  }

  return savedCaseUpdatedTime(right) - savedCaseUpdatedTime(left);
};

const redactDeadline = (deadline: Deadline): Deadline => ({
  ...deadline,
  label: redactRestrictedIdentifiers(deadline.label),
  text: redactRestrictedIdentifiers(deadline.text)
});

const redactEvidenceSummaryItem = (item: EvidenceSummaryItem): EvidenceSummaryItem => ({
  label: redactRestrictedIdentifiers(item.label),
  sourceIds: redactStringList(item.sourceIds)
});

const redactChecklistSummaryItem = (item: ChecklistSummaryItem): ChecklistSummaryItem => ({
  ...item,
  id: redactRestrictedIdentifiers(item.id),
  title: redactRestrictedIdentifiers(item.title),
  reason: redactRestrictedIdentifiers(item.reason),
  ...(item.deadline ? { deadline: redactDeadline(item.deadline) } : {}),
  sourceIds: redactStringList(item.sourceIds)
});

const extractMissingEvidence = (packet: EvidencePacket): EvidenceSummaryItem[] =>
  packet.groups.flatMap((group) =>
    group.items
      .filter((item) => item.status === "missing")
      .map((item) => ({ label: item.label, sourceIds: item.sourceIds }))
  );

const normalizeSavedCases = (parsed: unknown): SavedCaseSummary[] => {
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((item) => {
    const candidate = item as Partial<SavedCaseSummary> | null;
    if (
      !candidate ||
      typeof candidate.id !== "string" ||
      typeof candidate.letterText !== "string"
    ) {
      return [];
    }

    const sanitizedLetterText = redactRestrictedIdentifiers(candidate.letterText);
    const sanitizedIntakeText = limitText(
      redactRestrictedIdentifiers(typeof candidate.intakeText === "string" ? candidate.intakeText : ""),
      maxOptionalTextLength
    );
    const sanitizedFileName = redactRestrictedIdentifiers(
      typeof candidate.fileName === "string" ? candidate.fileName : "Imported saved case"
    );
    const sanitizedAvailableEvidenceText = limitText(
      redactRestrictedIdentifiers(
        typeof candidate.availableEvidenceText === "string" ? candidate.availableEvidenceText : ""
      ),
      maxOptionalTextLength
    );
    const sanitizedId = redactRestrictedIdentifiers(candidate.id);
    const sanitizedNotes = limitText(
      redactRestrictedIdentifiers(typeof candidate.notes === "string" ? candidate.notes : ""),
      maxOptionalTextLength
    );
    const sanitizedUpdatedAt = normalizeSavedCaseUpdatedAt(candidate.updatedAt);
    const restoredAnalysis = analyzeLetter(sanitizedLetterText);
    const restoredRiskFlags = detectRiskFlags(sanitizedIntakeText, restoredAnalysis);
    const restoredChecklist = createChecklist(
      {
        county: "Los Angeles",
        disasterType: "wildfire",
        riskFlags: restoredRiskFlags
      },
      restoredAnalysis,
      californiaWildfirePolicyPack
    );
    const missingEvidence = extractMissingEvidence(
      buildEvidencePacket(restoredAnalysis.detectedRequests, parseAvailableEvidenceText(sanitizedAvailableEvidenceText))
    ).map(redactEvidenceSummaryItem);
    const deadlines = restoredAnalysis.detectedDeadlines.map(redactDeadline);
    const checklistItems = restoredChecklist.items
      .map(({ id, title, category, reason, editable, deadline, sourceIds }) => ({
        id,
        title,
        category,
        reason,
        editable,
        ...(deadline ? { deadline } : {}),
        sourceIds
      }))
      .map(redactChecklistSummaryItem);
    const checklistStatuses = normalizeChecklistStatuses(checklistItems, candidate.checklistStatuses);

    return [
      {
        id: sanitizedId,
        title: letterTypeLabels[restoredAnalysis.letterType],
        letterType: restoredAnalysis.letterType,
        letterText: sanitizedLetterText,
        fileName: sanitizedFileName,
        intakeText: sanitizedIntakeText,
        availableEvidenceText: sanitizedAvailableEvidenceText,
        deadlines,
        missingEvidence,
        checklistItems,
        checklistStatuses,
        riskFlags: redactStringList(restoredRiskFlags),
        summary: redactRestrictedIdentifiers(restoredAnalysis.summary),
        notes: sanitizedNotes,
        updatedAt: sanitizedUpdatedAt
      }
    ];
  });
};

const parseSavedCasesJson = (json: string): SavedCaseSummary[] => normalizeSavedCases(JSON.parse(json) as unknown);

const parseLocalCaseIdNumber = (id: string): number => {
  if (!id.startsWith(localCaseIdPrefix)) {
    return 0;
  }

  const parsed = Number(id.slice(localCaseIdPrefix.length));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

const nextLocalCaseId = (savedCases: SavedCaseSummary[]): string => {
  const nextNumber = Math.max(0, ...savedCases.map((savedCase) => parseLocalCaseIdNumber(savedCase.id))) + 1;
  return `${localCaseIdPrefix}${String(nextNumber).padStart(3, "0")}`;
};

const clearOpenReliefLocalStorage = () => {
  const keysToRemove = Array.from({ length: window.localStorage.length }, (_value, index) => window.localStorage.key(index))
    .filter((key): key is string => typeof key === "string" && key.startsWith(storageKeyPrefix));

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
};

const hasFileExtension = (file: File, extensions: string[]) => {
  const normalizedName = file.name.toLowerCase();
  return extensions.some((extension) => normalizedName.endsWith(extension));
};

const isAcceptedFile = (file: File) => {
  const normalizedType = file.type.toLowerCase();

  return acceptedFileTypes.some(
    ({ extensions, mimeTypes }) =>
      hasFileExtension(file, extensions) && (normalizedType === "" || mimeTypes.includes(normalizedType))
  );
};

const readSavedCases = (): SavedCaseSummary[] => {
  try {
    const saved = window.localStorage.getItem(casesStorageKey);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as unknown;
    return normalizeSavedCases(parsed);
  } catch {
    return [];
  }
};

export const App = () => {
  const [savedDraft] = useState(readSavedDraft);
  const [savedCases, setSavedCases] = useState(readSavedCases);
  const [letterText, setLetterText] = useState(savedDraft.letterText ?? sampleLetter);
  const [intakeText, setIntakeText] = useState(limitText(savedDraft.intakeText ?? "", maxOptionalTextLength));
  const [availableEvidenceText, setAvailableEvidenceText] = useState(
    limitText(savedDraft.availableEvidenceText ?? "", maxOptionalTextLength)
  );
  const [analysis, setAnalysis] = useState<LetterAnalysis | null>(null);
  const [exportText, setExportText] = useState("");
  const [clearArmed, setClearArmed] = useState(false);
  const [activeSavedCaseId, setActiveSavedCaseId] = useState<string | null>(null);
  const [fileName, setFileName] = useState(savedDraft.fileName ?? sampleFileName);
  const [fileError, setFileError] = useState("");
  const [letterError, setLetterError] = useState("");
  const [caseArchiveText, setCaseArchiveText] = useState("");
  const [caseArchiveError, setCaseArchiveError] = useState("");
  const [caseQueueSearch, setCaseQueueSearch] = useState("");
  const [caseQueueEscalationsOnly, setCaseQueueEscalationsOnly] = useState(false);
  const [caseQueueSort, setCaseQueueSort] = useState<CaseQueueSort>("updated");

  useEffect(() => {
    if (letterText === "" && fileName === "No file selected") {
      return;
    }

    window.localStorage.setItem(
      caseStorageKey,
      JSON.stringify({
        letterText: redactRestrictedIdentifiers(letterText),
        fileName: redactRestrictedIdentifiers(fileName),
        intakeText: redactRestrictedIdentifiers(intakeText),
        availableEvidenceText: redactRestrictedIdentifiers(availableEvidenceText)
      })
    );
  }, [availableEvidenceText, fileName, intakeText, letterText]);

  useEffect(() => {
    if (savedCases.length === 0) {
      window.localStorage.removeItem(casesStorageKey);
      return;
    }

    window.localStorage.setItem(casesStorageKey, JSON.stringify(savedCases));
  }, [savedCases]);

  const riskFlags = useMemo(() => detectRiskFlags(intakeText, analysis ?? undefined), [analysis, intakeText]);
  const hasImmediateDanger = riskFlags.includes("immediate_danger");

  const caseContext = useMemo(
    () => ({
      county: "Los Angeles",
      disasterType: "wildfire" as const,
      riskFlags
    }),
    [riskFlags]
  );

  const checklist = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return createChecklist(caseContext, analysis, californiaWildfirePolicyPack);
  }, [analysis, caseContext]);

  const availableEvidence = useMemo(() => parseAvailableEvidenceText(availableEvidenceText), [availableEvidenceText]);
  const evidencePacket = useMemo(
    () => buildEvidencePacket(analysis?.detectedRequests ?? [], availableEvidence),
    [analysis, availableEvidence]
  );
  const appealDraft = useMemo(() => {
    if (!analysis || !checklist) {
      return null;
    }

    return createAppealDraft(analysis, checklist, californiaWildfirePolicyPack);
  }, [analysis, checklist]);

  const applyExtractedLetterText = (text: string) => {
    setLetterText(limitText(text, maxLetterTextLength));
    setLetterError(text.length > maxLetterTextLength ? letterLengthMessage : "");
  };

  const handleAnalyze = () => {
    if (letterText.length > maxLetterTextLength) {
      setLetterError(letterLengthMessage);
      setAnalysis(null);
      setExportText("");
      return;
    }

    setLetterError("");
    setAnalysis(analyzeLetter(letterText));
    setExportText("");
    setClearArmed(false);
    setActiveSavedCaseId(null);
  };

  const handleCreatePacketText = () => {
    if (!analysis || !checklist) {
      return;
    }

    setExportText(createCaseExport(analysis, checklist, evidencePacket, californiaWildfirePolicyPack));
    setClearArmed(false);
  };

  const handleDownloadPacketText = () => {
    if (!exportText) {
      return;
    }

    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentCaseId}-packet.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setClearArmed(false);
  };

  const handleSaveCaseSnapshot = () => {
    if (!analysis || !checklist) {
      return;
    }

    const checklistItems = checklist.items.map(({ id, title, category, reason, editable, deadline, sourceIds }) => ({
      id,
      title,
      category,
      reason,
      editable,
      ...(deadline ? { deadline } : {}),
      sourceIds
    }));
    const snapshotId = activeSavedCaseId ?? nextLocalCaseId(savedCases);
    const updatedAt = currentTimestamp();
    setSavedCases((current) => {
      const existingCase = current.find((savedCase) => savedCase.id === snapshotId);
      const snapshot: SavedCaseSummary = {
        id: snapshotId,
        title: letterTypeLabels[analysis.letterType],
        letterType: analysis.letterType,
        letterText: redactRestrictedIdentifiers(letterText),
        fileName: redactRestrictedIdentifiers(fileName),
        intakeText: redactRestrictedIdentifiers(intakeText),
        availableEvidenceText: redactRestrictedIdentifiers(availableEvidenceText),
        deadlines: analysis.detectedDeadlines,
        missingEvidence: extractMissingEvidence(evidencePacket),
        checklistItems,
        checklistStatuses: normalizeChecklistStatuses(checklistItems, existingCase?.checklistStatuses),
        riskFlags,
        summary: analysis.summary,
        notes: existingCase?.notes ?? "",
        updatedAt
      };

      return [snapshot, ...current.filter((item) => item.id !== snapshot.id)].slice(0, 10);
    });
    setActiveSavedCaseId(snapshotId);
    setClearArmed(false);
  };

  const handleExportSavedCases = () => {
    setCaseArchiveText(JSON.stringify(savedCases, null, 2));
    setCaseArchiveError("");
    setClearArmed(false);
  };

  const handleImportSavedCases = () => {
    if (caseArchiveText.length > maxCaseArchiveTextLength) {
      setCaseArchiveError(caseArchiveLengthMessage);
      return;
    }

    try {
      const importedCases = parseSavedCasesJson(caseArchiveText);
      if (importedCases.length === 0) {
        setCaseArchiveError("No valid saved cases found.");
        return;
      }

      const importedIds = new Set(importedCases.map((savedCase) => savedCase.id));
      setSavedCases((current) =>
        [...importedCases, ...current.filter((savedCase) => !importedIds.has(savedCase.id))].slice(0, 10)
      );
      setCaseArchiveText(JSON.stringify(importedCases, null, 2));
      setCaseArchiveError("");
      setClearArmed(false);
      setActiveSavedCaseId(null);
    } catch {
      setCaseArchiveError("Saved cases JSON could not be read.");
    }
  };

  const handleSavedCaseNotes = (notes: string) => {
    if (!activeSavedCaseId) {
      return;
    }

    const updatedAt = currentTimestamp();
    setSavedCases((current) =>
      current.map((savedCase) =>
        savedCase.id === activeSavedCaseId
          ? { ...savedCase, notes: limitText(redactRestrictedIdentifiers(notes), maxOptionalTextLength), updatedAt }
          : savedCase
      )
    );
    setClearArmed(false);
  };

  const handleChecklistStatus = (savedCaseId: string, itemId: string, checked: boolean) => {
    const updatedAt = currentTimestamp();
    setSavedCases((current) =>
      current.map((savedCase) =>
        savedCase.id === savedCaseId
          ? {
              ...savedCase,
              checklistStatuses: {
                ...savedCase.checklistStatuses,
                [itemId]: checked ? "done" : "todo"
              },
              updatedAt
            }
          : savedCase
      )
    );
    setClearArmed(false);
  };

  const handleOpenSavedCase = (savedCase: SavedCaseSummary) => {
    setLetterText(savedCase.letterText);
    setIntakeText(limitText(savedCase.intakeText, maxOptionalTextLength));
    setAvailableEvidenceText(limitText(savedCase.availableEvidenceText, maxOptionalTextLength));
    setFileName(savedCase.fileName);
    setFileError("");
    setLetterError("");
    setAnalysis(analyzeLetter(savedCase.letterText));
    setExportText("");
    setClearArmed(false);
    setActiveSavedCaseId(savedCase.id);
  };

  const handleClearLocalData = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }

    setLetterText("");
    setIntakeText("");
    setAvailableEvidenceText("");
    setAnalysis(null);
    setExportText("");
    setSavedCases([]);
    setClearArmed(false);
    setActiveSavedCaseId(null);
    setFileName("No file selected");
    setFileError("");
    setLetterError("");
    setCaseArchiveText("");
    setCaseArchiveError("");
    clearOpenReliefLocalStorage();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAcceptedFile(file)) {
      setFileError("Unsupported file type. Upload TXT, PDF, JPG, or PNG.");
      setClearArmed(false);
      setActiveSavedCaseId(null);
      event.target.value = "";
      return;
    }

    if (file.size > maxUploadSizeBytes) {
      setFileError("File too large. Upload a file under 10 MB.");
      setClearArmed(false);
      setActiveSavedCaseId(null);
      event.target.value = "";
      return;
    }

    setFileError("");
    setFileName(redactRestrictedIdentifiers(file.name));
    setClearArmed(false);
    setActiveSavedCaseId(null);
    setAnalysis(null);
    setExportText("");
    setLetterError("");
    if (file.type.startsWith("text/") || hasFileExtension(file, textFileExtensions)) {
      applyExtractedLetterText(await readTextFile(file));
      return;
    }

    if (file.type === "application/pdf" || hasFileExtension(file, pdfFileExtensions)) {
      const extractedText = await extractPdfText(file);
      applyExtractedLetterText(extractedText);
      if (!extractedText.trim()) {
        setFileError(pdfExtractionMessage);
      }
      return;
    }

    if (file.type.startsWith("image/") || hasFileExtension(file, imageFileExtensions)) {
      const extractedText = await extractImageText(file);
      applyExtractedLetterText(extractedText);
      if (!extractedText.trim()) {
        setFileError(imageExtractionMessage);
      }
      return;
    }

    setLetterText("");
    setFileError(imageExtractionMessage);
  };

  const sourceIds = checklist ? [...new Set(checklist.items.flatMap((item) => item.sourceIds))] : [];
  const visibleSavedCases = useMemo(() => {
    const search = caseQueueSearch.trim().toLowerCase();
    return savedCases.filter((savedCase) => {
      if (caseQueueEscalationsOnly && savedCase.riskFlags.length === 0) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        savedCase.id,
        savedCase.title,
        caseQueueStatus(savedCase),
        savedCase.deadlines[0]?.text ?? "",
        ...savedCase.riskFlags.map(formatRiskFlag)
      ].some((value) => value.toLowerCase().includes(search));
    }).sort((left, right) => compareSavedCases(caseQueueSort, left, right));
  }, [caseQueueEscalationsOnly, caseQueueSearch, caseQueueSort, savedCases]);
  const activeSavedCase = savedCases.find((savedCase) => savedCase.id === activeSavedCaseId) ?? null;
  const currentCaseId = activeSavedCase?.id ?? nextLocalCaseId(savedCases);
  const activeCaseSourceIds = activeSavedCase
    ? [
        ...new Set([
          ...activeSavedCase.missingEvidence.flatMap((item) => item.sourceIds),
          ...activeSavedCase.checklistItems.flatMap((item) => item.sourceIds)
        ])
      ]
    : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <ShieldCheck aria-hidden="true" />
          <span>OpenRelief</span>
        </div>
        <div className="local-status" id="privacy">
          <Check aria-hidden="true" />
          <strong>Local only</strong>
          <span>All data stays on this device</span>
        </div>
        <nav aria-label="Support navigation">
          <a href="#help">
            <HelpCircle aria-hidden="true" />
            Help
          </a>
          <a href="#privacy">
            <Lock aria-hidden="true" />
            Privacy
          </a>
        </nav>
      </header>

      <div className="workspace">
        <aside className="step-rail" aria-label="Workflow steps">
          {steps.map(([title, detail], index) => (
            <div className={`step ${index === 2 ? "active" : index < 2 ? "done" : ""}`} key={title}>
              <span className="step-index">{index < 2 ? <Check aria-hidden="true" /> : index + 1}</span>
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
            </div>
          ))}
          <section className="case-card" aria-label="Current case">
            <strong>Current case</strong>
            <dl>
              <div>
                <dt>Case ID</dt>
                <dd>{currentCaseId}</dd>
              </div>
              <div>
                <dt>Incident</dt>
                <dd>California wildfire</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>Browser local</dd>
              </div>
            </dl>
          </section>
          <section className="case-card" aria-label="Local case queue">
            <strong>Local case queue</strong>
            {savedCases.length > 0 ? (
              <>
                <label className="queue-search">
                  <span>Search cases</span>
                  <input
                    aria-label="Search saved cases"
                    value={caseQueueSearch}
                    onChange={(event) => setCaseQueueSearch(event.target.value)}
                  />
                </label>
                <label className="queue-sort">
                  <span>Sort cases</span>
                  <select
                    aria-label="Sort saved cases"
                    value={caseQueueSort}
                    onChange={(event) => setCaseQueueSort(event.target.value as CaseQueueSort)}
                  >
                    <option value="updated">Last updated</option>
                    <option value="deadline">Deadline</option>
                    <option value="escalation">Escalation flags</option>
                    <option value="missing">Missing evidence</option>
                  </select>
                </label>
                <label className="queue-filter">
                  <input
                    type="checkbox"
                    checked={caseQueueEscalationsOnly}
                    onChange={(event) => setCaseQueueEscalationsOnly(event.target.checked)}
                  />
                  Show escalation cases only
                </label>
                {visibleSavedCases.length > 0 ? (
                  <ul className="saved-cases">
                    {visibleSavedCases.map((savedCase) => (
                      <li key={savedCase.id}>
                        <button
                          aria-label={`Open saved case ${savedCase.id}`}
                          className="queue-row"
                          type="button"
                          onClick={() => handleOpenSavedCase(savedCase)}
                        >
                          <strong>Saved case: {savedCase.title}</strong>
                          <span>Status: {caseQueueStatus(savedCase)}</span>
                          <span>Missing: {savedCase.missingEvidence.length}</span>
                          <span>
                            Tasks: {completedChecklistCount(savedCase)}/{savedCase.checklistItems.length} done
                          </span>
                          <span>Last updated: {formatSavedCaseUpdatedAt(savedCase.updatedAt)}</span>
                          <span>Deadline: {savedCase.deadlines[0]?.text ?? "None"}</span>
                          <span>
                            Flags:{" "}
                            {savedCase.riskFlags.length > 0
                              ? savedCase.riskFlags.map(formatRiskFlag).join(", ")
                              : "None"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No matching saved cases</p>
                )}
              </>
            ) : (
              <p>No saved cases</p>
            )}
            <section className="case-archive" aria-label="Saved case archive">
              <p>Saved-case archives may include personal information.</p>
              <label className="case-archive-label">
                <span>Saved cases JSON</span>
                <textarea
                  className="case-archive-textarea"
                  maxLength={maxCaseArchiveTextLength}
                  value={caseArchiveText}
                  onChange={(event) => {
                    setCaseArchiveText(limitText(event.target.value, maxCaseArchiveTextLength + 1));
                    setCaseArchiveError("");
                  }}
                />
              </label>
              <section className="case-archive-actions" aria-label="Saved case archive actions">
                <button
                  className="secondary-action"
                  type="button"
                  disabled={savedCases.length === 0}
                  onClick={handleExportSavedCases}
                >
                  Export saved cases
                </button>
                <button className="secondary-action" type="button" onClick={handleImportSavedCases}>
                  Import saved cases
                </button>
              </section>
              {caseArchiveError ? <p className="archive-error">{caseArchiveError}</p> : null}
            </section>
          </section>
        </aside>

        <main className="main-panel">
          <section className="review-header">
            <div>
              <div className="title-row">
                <FileText aria-hidden="true" />
                <h1>Letter Review</h1>
              </div>
              <p>Upload a letter, review extracted text, and create a safe next-step plan.</p>
              <p>
                OpenRelief helps organize and explain paperwork. It is not a government agency, official eligibility
                decision, or legal advice.
              </p>
              {clearArmed ? (
                <p className="clear-warning">This removes local draft and saved case snapshots from this browser.</p>
              ) : null}
            </div>
            <div className="review-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  setLetterText(sampleLetter);
                  setIntakeText("");
                  setAvailableEvidenceText("");
                  setFileName(sampleFileName);
                  setAnalysis(null);
                  setExportText("");
                  setClearArmed(false);
                  setActiveSavedCaseId(null);
                  setFileError("");
                  setLetterError("");
                }}
              >
                Load sample
              </button>
              <button className="secondary-action danger-action" type="button" onClick={handleClearLocalData}>
                {clearArmed ? "Confirm clear local data" : "Clear local data"}
              </button>
            </div>
          </section>

          <section className="upload-band" id="help" aria-label="Upload letter">
            <div className="upload-icon">
              <Upload aria-hidden="true" />
            </div>
            <div>
              <strong>Upload letter (PDF, JPG, PNG, TXT)</strong>
              <p>PDF text and image OCR run locally in this browser.</p>
            </div>
            <label className="file-control">
              Choose file
              <input type="file" accept=".txt,.pdf,.png,.jpg,.jpeg" onChange={handleFile} />
            </label>
            <span className="file-name">{fileName}</span>
            {fileError ? (
              <p className="upload-error" role="alert">
                {fileError}
              </p>
            ) : null}
          </section>

          <section className="editor-panel">
            <div className="section-heading">
              <div>
                <h2>Evidence already available</h2>
                <p>List documents already found so requested evidence is not treated as missing.</p>
              </div>
              <span className="quality">Optional</span>
            </div>
            <textarea
              aria-label="Evidence already available"
              className="intake-textarea"
              maxLength={maxOptionalTextLength}
              value={availableEvidenceText}
              onChange={(event) => {
                setAvailableEvidenceText(limitText(event.target.value, maxOptionalTextLength));
                setExportText("");
                setClearArmed(false);
                setActiveSavedCaseId(null);
              }}
            />
          </section>

          <section className="editor-panel">
            <div className="section-heading">
              <div>
                <h2>Immediate needs and risks</h2>
                <p>Add urgent needs that should change human review priority.</p>
              </div>
              <span className="quality">Optional</span>
            </div>
            <textarea
              aria-label="Immediate needs and risks"
              className="intake-textarea"
              maxLength={maxOptionalTextLength}
              value={intakeText}
              onChange={(event) => {
                setIntakeText(limitText(event.target.value, maxOptionalTextLength));
                setExportText("");
                setClearArmed(false);
                setActiveSavedCaseId(null);
              }}
            />
            {hasImmediateDanger ? (
              <div className="warning" role="alert" aria-label="Immediate danger guidance">
                <AlertTriangle aria-hidden="true" />
                If you are in immediate danger, contact local emergency services now. Return to paperwork after
                immediate safety needs are handled.
              </div>
            ) : null}
          </section>

          <section className="editor-panel">
            <div className="section-heading">
              <div>
                <h2>Extracted letter text</h2>
                <p>Review and edit before analysis. The document text is untrusted input.</p>
              </div>
              <span className="quality">Manual review required</span>
            </div>
            <textarea
              aria-label="Extracted letter text"
              maxLength={maxLetterTextLength}
              value={letterText}
              onChange={(event) => {
                setLetterText(event.target.value);
                setAnalysis(null);
                setExportText("");
                setLetterError("");
                setClearArmed(false);
                setActiveSavedCaseId(null);
              }}
            />
            {letterError ? (
              <p className="upload-error" role="alert">
                {letterError}
              </p>
            ) : null}
            <div className="panel-footer">
              <span>Local draft, not submitted anywhere</span>
              <button className="primary-action" type="button" onClick={handleAnalyze}>
                Analyze letter
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </section>

          {analysis ? (
            <section className="results-grid" aria-label="Letter analysis results">
              <article className="result-card emphasis">
                <div className="section-heading">
                  <h2>{letterTypeLabels[analysis.letterType]}</h2>
                  <span className={analysis.needsHumanReview ? "risk" : "quality"}>
                    {analysis.needsHumanReview ? "Human review" : "Source check"}
                  </span>
                </div>
                <p>{analysis.summary}</p>
                {analysis.injectionWarnings.length > 0 ? (
                  <div className="warning">
                    <AlertTriangle aria-hidden="true" />
                    Uploaded text included instruction-like language. It was treated as document content only.
                  </div>
                ) : null}
                {riskFlags.length > 0 ? (
                  <div className="risk-list" aria-label="High-risk flags">
                    {riskFlags.map((flag) => (
                      <span key={flag}>{formatRiskFlag(flag)}</span>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="result-card">
                <h2>Deadlines</h2>
                {analysis.detectedDeadlines.length > 0 ? (
                  analysis.detectedDeadlines.map((deadline) => (
                    <div className="data-row" key={deadline.label}>
                      <div>
                        <span>{deadline.label}</span>
                        <span className="item-sources">Source: {formatDeadlineSource(deadline.source)}</span>
                      </div>
                      <strong>{deadline.text}</strong>
                    </div>
                  ))
                ) : (
                  <p>No deadline found</p>
                )}
              </article>

              <article className="result-card">
                <h2>Letter facts</h2>
                <ul className="analysis-list">
                  {analysis.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </article>

              <article className="result-card">
                <h2>Needs review</h2>
                <ul className="analysis-list">
                  {analysis.uncertainties.map((uncertainty) => (
                    <li key={uncertainty}>{uncertainty}</li>
                  ))}
                </ul>
              </article>

              <article className="result-card wide">
                <h2>Next-step checklist</h2>
                <ul className="checklist">
                  {checklist?.items.map((item) => (
                    <li key={item.id}>
                      <span className={`category-dot ${item.category}`} />
                      <div>
                        <strong>{item.title}</strong>
                        {item.editable ? <span className="editable-mark">Editable</span> : null}
                        <p>{item.reason}</p>
                        {item.deadline ? <span>Deadline: {item.deadline.text}</span> : null}
                        {item.deadline ? (
                          <span className="item-sources">Deadline source: {formatDeadlineSource(item.deadline.source)}</span>
                        ) : null}
                        <span className="item-sources">
                          Source:{" "}
                          {item.sourceIds
                            .map((sourceId) => sourceById.get(sourceId)?.title)
                            .filter((title): title is string => Boolean(title))
                            .join(", ")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="result-card wide">
                <h2>Evidence packet outline</h2>
                <div className="evidence-grid">
                  {evidencePacket.groups.map((group) => (
                    <div className="evidence-group" key={group.category}>
                      <strong>{group.category.replaceAll("_", " ")}</strong>
                      {group.items.map((item) => (
                        <p key={item.label}>
                          {item.label}
                          <span>{item.status}</span>
                          <span className="item-sources">
                            Source:{" "}
                            {item.sourceIds
                              .map((sourceId) => sourceById.get(sourceId)?.title)
                              .filter((title): title is string => Boolean(title))
                              .join(", ")}
                          </span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </article>

              {activeSavedCase ? (
                <section className="result-card wide" aria-label="Case detail">
                  <div className="section-heading">
                    <div>
                      <h2>Case detail</h2>
                      <p>Saved local snapshot for case-worker review.</p>
                    </div>
                    <span className="quality">{activeSavedCase.id}</span>
                  </div>
                  <div className="case-detail-grid">
                    <section className="case-detail-section">
                      <h3>Summary</h3>
                      <ul className="case-detail-list">
                        <li>
                          <strong>Letter type</strong>
                          <span>{letterTypeLabels[activeSavedCase.letterType]}</span>
                        </li>
                        <li>
                          <strong>Status</strong>
                          <span>{caseQueueStatus(activeSavedCase)}</span>
                        </li>
                        <li>{activeSavedCase.summary}</li>
                      </ul>
                    </section>
                    <section className="case-detail-section">
                      <h3>Timeline</h3>
                      <ul className="case-detail-list">
                        <li>Letter analyzed</li>
                        <li>Checklist created</li>
                        <li>Snapshot saved</li>
                      </ul>
                    </section>
                    <section className="case-detail-section">
                      <h3>Uploaded letter</h3>
                      <ul className="case-detail-list">
                        <li>
                          <strong>File</strong>
                          <span>{activeSavedCase.fileName}</span>
                        </li>
                        <li>Stored in local browser data only</li>
                      </ul>
                    </section>
                    <section className="case-detail-section">
                      <h3>Checklist</h3>
                      <ul className="case-detail-list">
                        {activeSavedCase.checklistItems.map((item) => (
                          <li key={item.id}>
                            <strong>{item.title}</strong>
                            {item.editable ? <span className="editable-mark">Editable</span> : null}
                            <label className="case-task-status">
                              <input
                                type="checkbox"
                                checked={activeSavedCase.checklistStatuses[item.id] === "done"}
                                onChange={(event) =>
                                  handleChecklistStatus(activeSavedCase.id, item.id, event.target.checked)
                                }
                              />
                              Mark {item.title} done
                            </label>
                            <span>{item.reason}</span>
                            {item.deadline ? <span>Deadline: {item.deadline.text}</span> : null}
                            {item.deadline ? (
                              <span className="item-sources">
                                Deadline source: {formatDeadlineSource(item.deadline.source)}
                              </span>
                            ) : null}
                            <span className="item-sources">
                              Source:{" "}
                              {item.sourceIds
                                .map((sourceId) => sourceById.get(sourceId)?.title)
                                .filter((title): title is string => Boolean(title))
                                .join(", ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="case-detail-section">
                      <h3>Missing evidence</h3>
                      {activeSavedCase.missingEvidence.length > 0 ? (
                        <ul className="case-detail-list">
                          {activeSavedCase.missingEvidence.map((item) => (
                            <li key={item.label}>
                              {item.label}
                              <span className="item-sources">
                                Source:{" "}
                                {item.sourceIds
                                  .map((sourceId) => sourceById.get(sourceId)?.title)
                                  .filter((title): title is string => Boolean(title))
                                  .join(", ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No missing evidence marked</p>
                      )}
                    </section>
                    <section className="case-detail-section">
                      <h3>Deadlines</h3>
                      {activeSavedCase.deadlines.length > 0 ? (
                        <ul className="case-detail-list">
                          {activeSavedCase.deadlines.map((deadline) => (
                            <li key={deadline.label}>
                              <strong>{deadline.label}</strong>
                              <span>{deadline.text}</span>
                              <span className="item-sources">Source: {formatDeadlineSource(deadline.source)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No deadline found</p>
                      )}
                    </section>
                    <section className="case-detail-section">
                      <h3>Escalation flags</h3>
                      {activeSavedCase.riskFlags.length > 0 ? (
                        <ul className="case-detail-list">
                          {activeSavedCase.riskFlags.map((flag) => (
                            <li key={flag}>{formatRiskFlag(flag)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No escalation flags</p>
                      )}
                    </section>
                    <section className="case-detail-section">
                      <h3>Source appendix</h3>
                      <ul className="case-detail-list">
                        {activeCaseSourceIds.map((sourceId) => {
                          const source = sourceById.get(sourceId);
                          if (!source) {
                            return null;
                          }

                          return (
                            <li key={source.id}>
                              <a href={source.url}>{source.title}</a>
                              <span>{source.url}</span>
                              <span>
                                {source.publisher}, retrieved {source.retrievedAt}, last reviewed {source.lastReviewedAt}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                    <section className="case-detail-section case-notes-section">
                      <h3>Notes</h3>
                      <textarea
                        aria-label="Case notes"
                        className="case-notes"
                        maxLength={maxOptionalTextLength}
                        value={activeSavedCase.notes}
                        onChange={(event) => handleSavedCaseNotes(event.target.value)}
                      />
                    </section>
                  </div>
                </section>
              ) : null}

              {appealDraft ? (
                <article className="result-card wide">
                  <div className="section-heading">
                    <h2>Appeal draft</h2>
                    <span className="risk">Human review</span>
                  </div>
                  <strong>{appealDraft.title}</strong>
                  <pre className="draft-text">{appealDraft.body}</pre>
                  <span className="item-sources">
                    Source:{" "}
                    {appealDraft.sourceIds
                      .map((sourceId) => sourceById.get(sourceId)?.title)
                      .filter((title): title is string => Boolean(title))
                      .join(", ")}
                  </span>
                </article>
              ) : null}

              <article className="result-card">
                <h2>Source citations</h2>
                <ul className="sources">
                  {sourceIds.map((sourceId) => {
                    const source = sourceById.get(sourceId);
                    if (!source) {
                      return null;
                    }

                    return (
                      <li key={source.id}>
                        <a href={source.url}>{source.title}</a>
                        <span>{source.url}</span>
                        <span>
                          {source.publisher}, retrieved {source.retrievedAt}, last reviewed {source.lastReviewedAt}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>

              <article className="result-card wide">
                <div className="section-heading">
                  <div>
                    <h2>Export packet</h2>
                    <p>Save plain text for printing or case-worker review.</p>
                    <p>This export may include personal information.</p>
                  </div>
                  <div className="export-actions">
                    <button className="secondary-action" type="button" onClick={handleSaveCaseSnapshot}>
                      Save case snapshot
                    </button>
                    <button className="secondary-action" type="button" onClick={handleCreatePacketText}>
                      Create packet text
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      disabled={!exportText}
                      onClick={handleDownloadPacketText}
                    >
                      Download packet text
                    </button>
                  </div>
                </div>
                <ul className="export-includes" aria-label="Export packet contents">
                  <li>Case summary</li>
                  <li>Checklist</li>
                  <li>Evidence outline</li>
                  <li>Source appendix</li>
                  <li>Uploaded files are not included in V1.</li>
                </ul>
                {exportText ? (
                  <textarea className="export-output" aria-label="Export packet text" value={exportText} readOnly />
                ) : null}
              </article>
            </section>
          ) : (
            <section className="empty-state">
              <h2>Ready to review</h2>
              <p>Run analysis to classify the letter, find deadlines, and build a source-backed checklist.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
