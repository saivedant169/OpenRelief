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
const caseStorageKey = "openrelief:v1:case";
const casesStorageKey = "openrelief:v1:cases";
const sampleFileName = "Sample_FEMA_Denial.txt";
const acceptedFileExtensions = [".txt", ".pdf", ".png", ".jpg", ".jpeg"];
const maxUploadSizeBytes = 10 * 1024 * 1024;
const pdfExtractionMessage = "Could not extract PDF text. Paste extracted text below.";
const imageExtractionMessage = "Image OCR is not available yet. Paste extracted text below.";
const letterTypeLabels: Record<LetterType, string> = {
  approval: "Approval",
  denial: "Claim denial",
  request_for_information: "Request for information",
  deadline_notice: "Deadline notice",
  inspection_notice: "Inspection notice",
  unknown: "Needs review"
};

type SavedDraft = {
  letterText?: string;
  fileName?: string;
  intakeText?: string;
};

type EvidenceSummaryItem = {
  label: string;
  sourceIds: string[];
};

type ChecklistSummaryItem = Pick<ChecklistItem, "id" | "title" | "category" | "reason">;

type ChecklistStatus = "todo" | "done";

type ChecklistStatusMap = Record<string, ChecklistStatus>;

type SavedCaseSummary = {
  id: string;
  title: string;
  letterType: LetterType;
  letterText: string;
  fileName: string;
  intakeText: string;
  deadlines: Deadline[];
  missingEvidence: EvidenceSummaryItem[];
  checklistItems: ChecklistSummaryItem[];
  checklistStatuses: ChecklistStatusMap;
  riskFlags: string[];
  summary: string;
  notes: string;
};

const readSavedDraft = (): SavedDraft => {
  try {
    const saved = window.localStorage.getItem(caseStorageKey);
    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved) as SavedDraft;
    return {
      letterText: typeof parsed.letterText === "string" ? parsed.letterText : undefined,
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : undefined,
      intakeText: typeof parsed.intakeText === "string" ? parsed.intakeText : undefined
    };
  } catch {
    return {};
  }
};

const isLetterType = (value: unknown): value is LetterType =>
  typeof value === "string" && value in letterTypeLabels;

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isEvidenceSummaryItem = (value: unknown): value is EvidenceSummaryItem => {
  const candidate = value as Partial<EvidenceSummaryItem> | null;
  return !!candidate && typeof candidate.label === "string" && isStringList(candidate.sourceIds);
};

const isDeadline = (value: unknown): value is Deadline => {
  const candidate = value as Partial<Deadline> | null;
  return !!candidate && typeof candidate.label === "string" && typeof candidate.text === "string";
};

const isChecklistSummaryItem = (value: unknown): value is ChecklistSummaryItem => {
  const candidate = value as Partial<ChecklistSummaryItem> | null;
  return (
    !!candidate &&
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.reason === "string"
  );
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
      typeof candidate.title !== "string" ||
      !isLetterType(candidate.letterType) ||
      typeof candidate.letterText !== "string" ||
      typeof candidate.fileName !== "string" ||
      typeof candidate.intakeText !== "string" ||
      !isStringList(candidate.riskFlags) ||
      typeof candidate.summary !== "string"
    ) {
      return [];
    }

    const restoredAnalysis = analyzeLetter(candidate.letterText);
    const missingEvidence =
      Array.isArray(candidate.missingEvidence) && candidate.missingEvidence.every(isEvidenceSummaryItem)
        ? candidate.missingEvidence
        : extractMissingEvidence(buildEvidencePacket(restoredAnalysis.detectedRequests));
    const deadlines =
      Array.isArray(candidate.deadlines) && candidate.deadlines.every(isDeadline)
        ? candidate.deadlines
        : restoredAnalysis.detectedDeadlines;
    const checklistItems =
      Array.isArray(candidate.checklistItems) && candidate.checklistItems.every(isChecklistSummaryItem)
        ? candidate.checklistItems
        : createChecklist(
            {
              county: "Los Angeles",
              disasterType: "wildfire",
              riskFlags: detectRiskFlags(candidate.intakeText, restoredAnalysis)
            },
            restoredAnalysis,
            californiaWildfirePolicyPack
          ).items.map(({ id, title, category, reason }) => ({ id, title, category, reason }));
    const checklistStatuses = normalizeChecklistStatuses(checklistItems, candidate.checklistStatuses);

    return [
      {
        id: candidate.id,
        title: candidate.title,
        letterType: candidate.letterType,
        letterText: candidate.letterText,
        fileName: candidate.fileName,
        intakeText: candidate.intakeText,
        deadlines,
        missingEvidence,
        checklistItems,
        checklistStatuses,
        riskFlags: candidate.riskFlags,
        summary: candidate.summary,
        notes: typeof candidate.notes === "string" ? candidate.notes : ""
      }
    ];
  });
};

const parseSavedCasesJson = (json: string): SavedCaseSummary[] => normalizeSavedCases(JSON.parse(json) as unknown);

const isAcceptedFile = (file: File) => {
  const normalizedName = file.name.toLowerCase();
  return acceptedFileExtensions.some((extension) => normalizedName.endsWith(extension));
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
  const [intakeText, setIntakeText] = useState(savedDraft.intakeText ?? "");
  const [analysis, setAnalysis] = useState<LetterAnalysis | null>(null);
  const [exportText, setExportText] = useState("");
  const [clearArmed, setClearArmed] = useState(false);
  const [activeSavedCaseId, setActiveSavedCaseId] = useState<string | null>(null);
  const [fileName, setFileName] = useState(savedDraft.fileName ?? sampleFileName);
  const [fileError, setFileError] = useState("");
  const [caseArchiveText, setCaseArchiveText] = useState("");
  const [caseArchiveError, setCaseArchiveError] = useState("");

  useEffect(() => {
    if (letterText === "" && fileName === "No file selected") {
      return;
    }

    window.localStorage.setItem(caseStorageKey, JSON.stringify({ letterText, fileName, intakeText }));
  }, [fileName, intakeText, letterText]);

  useEffect(() => {
    if (savedCases.length === 0) {
      window.localStorage.removeItem(casesStorageKey);
      return;
    }

    window.localStorage.setItem(casesStorageKey, JSON.stringify(savedCases));
  }, [savedCases]);

  const riskFlags = useMemo(() => detectRiskFlags(intakeText, analysis ?? undefined), [analysis, intakeText]);

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

  const evidencePacket = useMemo(() => buildEvidencePacket(analysis?.detectedRequests ?? []), [analysis]);
  const appealDraft = useMemo(() => {
    if (!analysis || !checklist) {
      return null;
    }

    return createAppealDraft(analysis, checklist, californiaWildfirePolicyPack);
  }, [analysis, checklist]);

  const handleAnalyze = () => {
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

  const handleSaveCaseSnapshot = () => {
    if (!analysis || !checklist) {
      return;
    }

    const checklistItems = checklist.items.map(({ id, title, category, reason }) => ({ id, title, category, reason }));
    const snapshot: SavedCaseSummary = {
      id: "OR-CA-2026-001",
      title: letterTypeLabels[analysis.letterType],
      letterType: analysis.letterType,
      letterText,
      fileName,
      intakeText,
      deadlines: analysis.detectedDeadlines,
      missingEvidence: extractMissingEvidence(evidencePacket),
      checklistItems,
      checklistStatuses: defaultChecklistStatuses(checklistItems),
      riskFlags,
      summary: analysis.summary,
      notes: ""
    };

    setSavedCases((current) => [snapshot, ...current.filter((item) => item.id !== snapshot.id)].slice(0, 10));
    setClearArmed(false);
  };

  const handleExportSavedCases = () => {
    setCaseArchiveText(JSON.stringify(savedCases, null, 2));
    setCaseArchiveError("");
    setClearArmed(false);
  };

  const handleImportSavedCases = () => {
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

    setSavedCases((current) =>
      current.map((savedCase) => (savedCase.id === activeSavedCaseId ? { ...savedCase, notes } : savedCase))
    );
    setClearArmed(false);
  };

  const handleChecklistStatus = (savedCaseId: string, itemId: string, checked: boolean) => {
    setSavedCases((current) =>
      current.map((savedCase) =>
        savedCase.id === savedCaseId
          ? {
              ...savedCase,
              checklistStatuses: {
                ...savedCase.checklistStatuses,
                [itemId]: checked ? "done" : "todo"
              }
            }
          : savedCase
      )
    );
    setClearArmed(false);
  };

  const handleOpenSavedCase = (savedCase: SavedCaseSummary) => {
    setLetterText(savedCase.letterText);
    setIntakeText(savedCase.intakeText);
    setFileName(savedCase.fileName);
    setFileError("");
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
    setAnalysis(null);
    setExportText("");
    setSavedCases([]);
    setClearArmed(false);
    setActiveSavedCaseId(null);
    setFileName("No file selected");
    setFileError("");
    setCaseArchiveText("");
    setCaseArchiveError("");
    window.localStorage.removeItem(caseStorageKey);
    window.localStorage.removeItem(casesStorageKey);
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
    setFileName(file.name);
    setClearArmed(false);
    setActiveSavedCaseId(null);
    setAnalysis(null);
    setExportText("");
    if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
      setLetterText(await readTextFile(file));
      return;
    }

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const extractedText = await extractPdfText(file);
      setLetterText(extractedText);
      if (!extractedText.trim()) {
        setFileError(pdfExtractionMessage);
      }
      return;
    }

    if (file.type.startsWith("image/")) {
      const extractedText = await extractImageText(file);
      setLetterText(extractedText);
      if (!extractedText.trim()) {
        setFileError(imageExtractionMessage);
      }
      return;
    }

    setLetterText("");
    setFileError(imageExtractionMessage);
  };

  const sourceIds = checklist ? [...new Set(checklist.items.flatMap((item) => item.sourceIds))] : [];
  const activeSavedCase = savedCases.find((savedCase) => savedCase.id === activeSavedCaseId) ?? null;
  const activeCaseSourceIds = activeSavedCase
    ? [...new Set(activeSavedCase.missingEvidence.flatMap((item) => item.sourceIds))]
    : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <ShieldCheck aria-hidden="true" />
          <span>OpenRelief</span>
        </div>
        <div className="local-status">
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
                <dd>OR-CA-2026-001</dd>
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
              <ul className="saved-cases">
                {savedCases.map((savedCase) => (
                  <li key={savedCase.id}>
                    <button
                      aria-label={`Open saved case ${savedCase.id}`}
                      className="queue-row"
                      type="button"
                      onClick={() => handleOpenSavedCase(savedCase)}
                    >
                      <strong>Saved case: {savedCase.title}</strong>
                      <span>Missing: {savedCase.missingEvidence.length}</span>
                      <span>
                        Tasks: {completedChecklistCount(savedCase)}/{savedCase.checklistItems.length} done
                      </span>
                      <span>Deadline: {savedCase.deadlines[0]?.text ?? "None"}</span>
                      <span>Flags: {savedCase.riskFlags.length > 0 ? savedCase.riskFlags.join(", ") : "None"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No saved cases</p>
            )}
            <section className="case-archive" aria-label="Saved case archive">
              <label className="case-archive-label">
                <span>Saved cases JSON</span>
                <textarea
                  className="case-archive-textarea"
                  value={caseArchiveText}
                  onChange={(event) => {
                    setCaseArchiveText(event.target.value);
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
                  setFileName(sampleFileName);
                  setAnalysis(null);
                  setExportText("");
                  setClearArmed(false);
                  setActiveSavedCaseId(null);
                  setFileError("");
                }}
              >
                Load sample
              </button>
              <button className="secondary-action danger-action" type="button" onClick={handleClearLocalData}>
                {clearArmed ? "Confirm clear local data" : "Clear local data"}
              </button>
            </div>
          </section>

          <section className="upload-band" aria-label="Upload letter">
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
                <h2>Immediate needs and risks</h2>
                <p>Add urgent needs that should change human review priority.</p>
              </div>
              <span className="quality">Optional</span>
            </div>
            <textarea
              aria-label="Immediate needs and risks"
              className="intake-textarea"
              value={intakeText}
              onChange={(event) => {
                setIntakeText(event.target.value);
                setExportText("");
                setClearArmed(false);
                setActiveSavedCaseId(null);
              }}
            />
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
              value={letterText}
              onChange={(event) => {
                setLetterText(event.target.value);
                setExportText("");
                setClearArmed(false);
                setActiveSavedCaseId(null);
              }}
            />
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
                      <span key={flag}>{flag}</span>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="result-card">
                <h2>Deadlines</h2>
                {analysis.detectedDeadlines.map((deadline) => (
                  <div className="data-row" key={deadline.label}>
                    <span>{deadline.label}</span>
                    <strong>{deadline.text}</strong>
                  </div>
                ))}
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
                      <h3>Timeline</h3>
                      <ul className="case-detail-list">
                        <li>Letter analyzed</li>
                        <li>Checklist created</li>
                        <li>Snapshot saved</li>
                      </ul>
                    </section>
                    <section className="case-detail-section">
                      <h3>Checklist</h3>
                      <ul className="case-detail-list">
                        {activeSavedCase.checklistItems.map((item) => (
                          <li key={item.id}>
                            <strong>{item.title}</strong>
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
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="case-detail-section">
                      <h3>Missing evidence</h3>
                      {activeSavedCase.missingEvidence.length > 0 ? (
                        <ul className="case-detail-list">
                          {activeSavedCase.missingEvidence.map((item) => (
                            <li key={item.label}>{item.label}</li>
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
                            <li key={flag}>{flag}</li>
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
                  </div>
                </div>
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
