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
  createCaseExport,
  createChecklist,
  type LetterAnalysis
} from "../../../packages/core/src/openrelief";
import { californiaWildfirePolicyPack } from "../../../packages/policy-packs/california-wildfire";
import "./styles.css";

const sampleLetter = `FEMA Notice
Your application is denied because proof of occupancy is missing.
You may appeal within 60 days from the date of this letter.`;

const caseContext = {
  county: "Los Angeles",
  disasterType: "wildfire" as const,
  riskFlags: ["denial_or_appeal" as const]
};

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
const sampleFileName = "Sample_FEMA_Denial.txt";

type SavedDraft = {
  letterText?: string;
  fileName?: string;
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
      fileName: typeof parsed.fileName === "string" ? parsed.fileName : undefined
    };
  } catch {
    return {};
  }
};

export const App = () => {
  const [savedDraft] = useState(readSavedDraft);
  const [letterText, setLetterText] = useState(savedDraft.letterText ?? sampleLetter);
  const [analysis, setAnalysis] = useState<LetterAnalysis | null>(null);
  const [exportText, setExportText] = useState("");
  const [fileName, setFileName] = useState(savedDraft.fileName ?? sampleFileName);

  useEffect(() => {
    if (letterText === "" && fileName === "No file selected") {
      return;
    }

    window.localStorage.setItem(caseStorageKey, JSON.stringify({ letterText, fileName }));
  }, [fileName, letterText]);

  const checklist = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return createChecklist(caseContext, analysis, californiaWildfirePolicyPack);
  }, [analysis]);

  const evidencePacket = useMemo(() => buildEvidencePacket(analysis?.detectedRequests ?? []), [analysis]);

  const handleAnalyze = () => {
    setAnalysis(analyzeLetter(letterText));
    setExportText("");
  };

  const handleCreatePacketText = () => {
    if (!analysis || !checklist) {
      return;
    }

    setExportText(createCaseExport(analysis, checklist, evidencePacket, californiaWildfirePolicyPack));
  };

  const handleClearLocalData = () => {
    setLetterText("");
    setAnalysis(null);
    setExportText("");
    setFileName("No file selected");
    window.localStorage.removeItem(caseStorageKey);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    if (file.type.startsWith("text/")) {
      setLetterText(await file.text());
    }
  };

  const sourceIds = checklist ? [...new Set(checklist.items.flatMap((item) => item.sourceIds))] : [];

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
        </aside>

        <main className="main-panel">
          <section className="review-header">
            <div>
              <div className="title-row">
                <FileText aria-hidden="true" />
                <h1>Letter Review</h1>
              </div>
              <p>Upload a letter, review extracted text, and create a safe next-step plan.</p>
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                setLetterText(sampleLetter);
                setFileName(sampleFileName);
                setAnalysis(null);
                setExportText("");
              }}
            >
              Load sample
            </button>
          </section>

          <section className="upload-band" aria-label="Upload letter">
            <div className="upload-icon">
              <Upload aria-hidden="true" />
            </div>
            <div>
              <strong>Upload letter (PDF, JPG, PNG, TXT)</strong>
              <p>Text files are read directly. PDF and image parsing remain local workflow targets.</p>
            </div>
            <label className="file-control">
              Choose file
              <input type="file" accept=".txt,.pdf,.png,.jpg,.jpeg" onChange={handleFile} />
            </label>
            <span className="file-name">{fileName}</span>
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
                  <h2>Claim denial</h2>
                  <span className="risk">Human review</span>
                </div>
                <p>{analysis.summary}</p>
                {analysis.injectionWarnings.length > 0 ? (
                  <div className="warning">
                    <AlertTriangle aria-hidden="true" />
                    Uploaded text included instruction-like language. It was treated as document content only.
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

              <article className="result-card wide">
                <h2>Next-step checklist</h2>
                <ul className="checklist">
                  {checklist?.items.map((item) => (
                    <li key={item.id}>
                      <span className={`category-dot ${item.category}`} />
                      <div>
                        <strong>{item.title}</strong>
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
                        <span>
                          {source.publisher}, retrieved {source.retrievedAt}
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
                  </div>
                  <div className="export-actions">
                    <button className="secondary-action" type="button" onClick={handleCreatePacketText}>
                      Create packet text
                    </button>
                    <button className="secondary-action danger-action" type="button" onClick={handleClearLocalData}>
                      Clear local data
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
