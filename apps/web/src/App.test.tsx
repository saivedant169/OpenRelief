import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("OpenRelief web workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("turns a sample denial letter into review, checklist, evidence, and sources", async () => {
    render(<App />);

    expect(screen.getByText("OpenRelief")).toBeInTheDocument();
    expect(screen.getByText("Local only")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByText("Claim denial")).toBeInTheDocument();
    expect(screen.getByText("Request human review")).toBeInTheDocument();
    expect(screen.getByText("Collect proof of occupancy")).toBeInTheDocument();
    expect(screen.getByText("Evidence packet outline")).toBeInTheDocument();
    expect(screen.getByText("Appeal FEMA's Decision")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Letter facts" })).toBeInTheDocument();
    expect(screen.getByText("The letter says appeal within 60 days.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Needs review" })).toBeInTheDocument();
    expect(screen.getByText("OpenRelief cannot confirm final eligibility or legal options.")).toBeInTheDocument();
    expect(screen.getByText("https://www.fema.gov/assistance/individual/after-applying/appeals")).toBeInTheDocument();
    expect(screen.getAllByText(/retrieved 2026-07-13/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/last reviewed 2026-07-13/i).length).toBeGreaterThan(0);

    const deadlinesCard = screen.getByRole("heading", { name: "Deadlines" }).closest("article");
    expect(deadlinesCard).not.toBeNull();
    expect(within(deadlinesCard as HTMLElement).getByText("Source: Uploaded letter")).toBeInTheDocument();

    const checklistCard = screen.getByRole("heading", { name: "Next-step checklist" }).closest("article");
    expect(checklistCard).not.toBeNull();
    expect(within(checklistCard as HTMLElement).getAllByText("Editable").length).toBeGreaterThan(0);
    expect(within(checklistCard as HTMLElement).getByText("Deadline: appeal within 60 days")).toBeInTheDocument();
    expect(within(checklistCard as HTMLElement).getByText("Deadline source: Uploaded letter")).toBeInTheDocument();
    expect(within(checklistCard as HTMLElement).getAllByText(/Source: /).length).toBeGreaterThan(0);
    expect(within(checklistCard as HTMLElement).getAllByText(/Documents Needed for FEMA Assistance/).length).toBeGreaterThan(0);

    const evidenceCard = screen.getByRole("heading", { name: "Evidence packet outline" }).closest("article");
    expect(evidenceCard).not.toBeNull();
    expect(within(evidenceCard as HTMLElement).getAllByText(/Source: /).length).toBeGreaterThan(0);
    expect(within(evidenceCard as HTMLElement).getAllByText(/Documents Needed for FEMA Assistance/).length).toBeGreaterThan(0);
  });

  it("shows safety boundary before upload", () => {
    render(<App />);

    expect(
      screen.getByText(
        "OpenRelief helps organize and explain paperwork. It is not a government agency, official eligibility decision, or legal advice."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Extraction quality: Manual review required. Review before analysis.")
    ).toBeInTheDocument();
  });

  it("shows start actions for letter review and evidence checklist", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Review a letter" })).toHaveAttribute("href", "#help");
    expect(screen.getByRole("link", { name: "Build evidence checklist" })).toHaveAttribute(
      "href",
      "#evidence-input"
    );
    expect(document.querySelector("#help")).toBeInTheDocument();
    expect(document.querySelector("#evidence-input")).toBeInTheDocument();
  });

  it("shows skippable basic context without restricted identifiers", async () => {
    render(<App />);

    const context = screen.getByRole("region", { name: "Basic context" });
    expect(within(context).getByText("Why we ask: this shapes checklist order.")).toBeInTheDocument();
    expect(within(context).getByLabelText("Disaster type")).toHaveDisplayValue("Skip for now");
    expect(within(context).getByLabelText("Housing status")).toHaveDisplayValue("Skip for now");
    expect(within(context).getByLabelText("Insurance status")).toHaveDisplayValue("Skip for now");
    expect(within(context).getByLabelText("Letter type if known")).toHaveDisplayValue("Skip for now");
    expect(within(context).getByText("Checks letter classification.")).toBeInTheDocument();
    expect(within(context).getByText("Raises urgent review.")).toBeInTheDocument();
    expect(within(context).getByText("Marks replacement tasks.")).toBeInTheDocument();
    expect(within(context).queryByLabelText(/ssn|social security|full application/i)).not.toBeInTheDocument();

    await userEvent.type(within(context).getByLabelText("County/city"), "Pasadena");
    expect(screen.getByLabelText("Immediate needs and risks")).toHaveValue("County/city: Pasadena");

    await userEvent.click(within(context).getByRole("button", { name: "Skip county/city" }));
    expect(screen.getByLabelText("Immediate needs and risks")).toHaveValue("");
  });

  it("captures optional letter context and known deadline escalation", async () => {
    render(<App />);

    const context = screen.getByRole("region", { name: "Basic context" });
    await userEvent.selectOptions(within(context).getByLabelText("Letter type if known"), "Request for information");
    await userEvent.type(within(context).getByLabelText("Deadline if known"), "Tomorrow");
    await userEvent.type(within(context).getByLabelText("Documents lost"), "Lease and receipts");

    expect(screen.getByLabelText("Immediate needs and risks")).toHaveValue(
      [
        "Letter type if known: Request for information",
        "Deadline if known: Tomorrow",
        "Documents lost: Lease and receipts"
      ].join("\n")
    );

    await userEvent.click(within(context).getByRole("button", { name: "Skip documents lost" }));
    expect((screen.getByLabelText("Immediate needs and risks") as HTMLTextAreaElement).value).not.toContain(
      "Documents lost"
    );

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved." }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    const riskList = screen.getByLabelText("High-risk flags");
    expect(within(riskList).getByText("Denial or appeal deadline")).toBeInTheDocument();
  });

  it("shows visible human support path before upload", () => {
    render(<App />);

    const support = screen.getByRole("region", { name: "Human support" });
    expect(support).toBeInTheDocument();
    expect(within(support).getByText(/Need urgent help/)).toBeInTheDocument();
    expect(within(support).getByText(/qualified disaster case worker/)).toBeInTheDocument();
    expect(within(support).getByRole("link", { name: "Go to letter upload" })).toHaveAttribute("href", "#help");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "#human-support");
    expect(support).not.toHaveTextContent(/hotline|911|988/i);
  });

  it("accepts dropped text letters into editable review", async () => {
    render(<App />);

    const uploadRegion = screen.getByRole("region", { name: "Upload letter" });
    const file = new File(["FEMA Notice\nYour application is approved for rental assistance."], "dropped-letter.txt", {
      type: "text/plain"
    });

    fireEvent.drop(uploadRegion, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByLabelText("Extracted letter text")).toHaveValue(
        "FEMA Notice\nYour application is approved for rental assistance."
      );
    });
    expect(screen.getByText("dropped-letter.txt")).toBeInTheDocument();
  });

  it("shows manual paste fallback tied to editable letter text", () => {
    render(<App />);

    expect(screen.getByText("Upload or paste letter (PDF, JPG, PNG, TXT)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paste text manually" })).toHaveAttribute(
      "href",
      "#extracted-letter-text"
    );
    expect(document.querySelector("#extracted-letter-text")).toBeInTheDocument();
    expect(screen.getByLabelText("Extracted letter text")).not.toBeDisabled();
    expect(screen.getByLabelText("Extracted letter text")).not.toHaveAttribute("readonly");
  });

  it("shows export text and requires confirmation before clearing local work", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    expect(screen.getByText("This export may include personal information.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download packet text/i })).toBeDisabled();
    const exportContents = screen.getByRole("list", { name: "Export packet contents" });
    expect(within(exportContents).getByText("Case summary")).toBeInTheDocument();
    expect(within(exportContents).getByText("Checklist")).toBeInTheDocument();
    expect(within(exportContents).getByText("Evidence outline")).toBeInTheDocument();
    expect(within(exportContents).getByText("Source appendix")).toBeInTheDocument();
    expect(within(exportContents).getByText("Uploaded files are not included in V1.")).toBeInTheDocument();
    expect(within(exportContents).getByRole("checkbox", { name: "Case summary" })).toBeChecked();
    expect(within(exportContents).getByRole("checkbox", { name: "Checklist" })).toBeChecked();
    expect(within(exportContents).getByRole("checkbox", { name: "Evidence outline" })).toBeChecked();
    expect(within(exportContents).getByRole("checkbox", { name: "Source appendix" })).toBeChecked();
    expect(
      within(exportContents).getByRole("checkbox", { name: "Uploaded files are not included in V1." })
    ).not.toBeChecked();
    expect(
      within(exportContents).getByRole("checkbox", { name: "Uploaded files are not included in V1." })
    ).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /create packet text/i }));

    const exportField = screen.getByLabelText("Export packet text") as HTMLTextAreaElement;
    expect(exportField.value).toContain("OpenRelief packet");
    expect(exportField.value).toContain("This export may include personal information.");
    expect(exportField.value).toContain("Deadlines\n- appeal window: appeal within 60 days");

    const createObjectUrl = vi.fn(() => "blob:openrelief-packet");
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });

    await userEvent.click(screen.getByRole("button", { name: /download packet text/i }));

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:openrelief-packet");

    await userEvent.click(screen.getByRole("button", { name: /clear local data/i }));

    expect(screen.getByLabelText("Extracted letter text")).not.toHaveValue("");
    expect(screen.getByRole("button", { name: /confirm clear local data/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /confirm clear local data/i }));

    expect(screen.getByLabelText("Extracted letter text")).toHaveValue("");
    expect(screen.queryByText("Claim denial")).not.toBeInTheDocument();
  });

  it("labels approval analysis without denial wording", async () => {
    render(<App />);

    const letterField = screen.getByLabelText("Extracted letter text");
    await userEvent.clear(letterField);
    await userEvent.type(letterField, "FEMA Notice\nYour application is approved for rental assistance.");
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("heading", { name: "Approval" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Claim denial" })).not.toBeInTheDocument();
    expect(screen.getByText("Source check")).toBeInTheDocument();

    const deadlinesCard = screen.getByRole("heading", { name: "Deadlines" }).closest("article");
    expect(deadlinesCard).not.toBeNull();
    expect(within(deadlinesCard as HTMLElement).getByText("No deadline found")).toBeInTheDocument();
  });

  it("clears stale analysis after manual letter edits", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    expect(screen.getByText("Claim denial")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });

    expect(screen.queryByText("Claim denial")).not.toBeInTheDocument();
    expect(screen.getByText("Ready to review")).toBeInTheDocument();
  });

  it("caps manual letter text before analysis", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "x".repeat(50_001) }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Letter text too long. Keep extracted text under 50,000 characters."
    );
    expect(screen.queryByRole("region", { name: "Letter analysis results" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(
      screen.queryByText("Letter text too long. Keep extracted text under 50,000 characters.")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approval" })).toBeInTheDocument();
  });

  it("caps optional workflow text fields", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Evidence already available"), {
      target: { value: "e".repeat(10_001) }
    });
    fireEvent.change(screen.getByLabelText("Immediate needs and risks"), {
      target: { value: "i".repeat(10_001) }
    });

    expect(screen.getByLabelText("Evidence already available")).toHaveValue("e".repeat(10_000));
    expect(screen.getByLabelText("Immediate needs and risks")).toHaveValue("i".repeat(10_000));
  });

  it("adds immediate need choices to intake risk flags", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Housing" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Medical" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Food" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Safety" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Disability accommodation" }));

    const intakeField = screen.getByLabelText("Immediate needs and risks");
    expect(intakeField).toHaveValue(
      [
        "No place to stay.",
        "Need medication.",
        "Need food assistance.",
        "Unsafe living situation.",
        "Need disability accommodation."
      ].join("\n")
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Food" }));
    expect((intakeField as HTMLTextAreaElement).value).not.toContain("Need food assistance.");

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    const riskList = screen.getByLabelText("High-risk flags");
    expect(within(riskList).getByText("Housing instability")).toBeInTheDocument();
    expect(within(riskList).getByText("Medical emergency")).toBeInTheDocument();
    expect(within(riskList).getByText("Unsafe home or abuse concern")).toBeInTheDocument();
    expect(within(riskList).getByText("Disability accommodation")).toBeInTheDocument();
  });

  it("persists displaced housing context to escalation flags", async () => {
    render(<App />);

    await userEvent.selectOptions(screen.getByLabelText("Housing status"), "Displaced");
    expect(screen.getByLabelText("Immediate needs and risks")).toHaveValue("Housing status: Displaced");

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    const riskList = screen.getByLabelText("High-risk flags");
    expect(within(riskList).getByText("Housing instability")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("openrelief:v1:case")).toContain("Housing status: Displaced");
    });
  });

  it("shows send-by date deadlines from uploaded letters", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: {
        value: "FEMA Notice\nSend the requested records by August 15, 2026 to keep your application moving."
      }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("heading", { name: "Deadline notice" })).toBeInTheDocument();
    expect(screen.getByText("send the requested records by August 15, 2026")).toBeInTheDocument();
    expect(screen.getByText(/The uploaded letter says: send the requested records by August 15, 2026/)).toBeInTheDocument();
  });

  it("shows submit-within-days deadlines from uploaded letters", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: {
        value: "FEMA Notice\nPlease submit requested receipts within 10 days."
      }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("heading", { name: "Deadline notice" })).toBeInTheDocument();
    expect(screen.getByText("submit requested receipts within 10 days")).toBeInTheDocument();
  });

  it("shows a bounded appeal draft for denial letters", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("heading", { name: "Appeal draft" })).toBeInTheDocument();
    expect(screen.getByText("Draft appeal note for human review")).toBeInTheDocument();
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();

    const appealCard = screen.getByRole("heading", { name: "Appeal draft" }).closest("article");
    expect(appealCard).not.toBeNull();
    expect(within(appealCard as HTMLElement).getByText(/Source: /)).toBeInTheDocument();
    expect(within(appealCard as HTMLElement).getByText(/Appeal FEMA's Decision/)).toBeInTheDocument();
  });

  it("marks user-listed available evidence in the packet", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: {
        value: [
          "FEMA Request for Information",
          "Additional information is needed before a decision can be made.",
          "Please send repair receipts."
        ].join("\n")
      }
    });
    fireEvent.change(screen.getByLabelText("Evidence already available"), {
      target: { value: "repair receipts" }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    const evidenceCard = screen.getByRole("heading", { name: "Evidence packet outline" }).closest("article");
    expect(evidenceCard).not.toBeNull();
    expect(
      within(evidenceCard as HTMLElement).getByText("Repair, hotel, replacement, cleanup, or child care records")
    ).toBeInTheDocument();
    expect(within(evidenceCard as HTMLElement).getByText("available")).toBeInTheDocument();
  });

  it("matches natural available evidence wording", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: {
        value: [
          "FEMA Request for Information",
          "Additional information is needed before a decision can be made.",
          "Please send repair receipts."
        ].join("\n")
      }
    });
    fireEvent.change(screen.getByLabelText("Evidence already available"), {
      target: { value: "I have repair receipts" }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    const evidenceCard = screen.getByRole("heading", { name: "Evidence packet outline" }).closest("article");
    expect(evidenceCard).not.toBeNull();
    expect(within(evidenceCard as HTMLElement).getByText("available")).toBeInTheDocument();
  });

  it("matches singular available evidence wording", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: {
        value: [
          "FEMA Request for Information",
          "Additional information is needed before a decision can be made.",
          "Please send repair receipts."
        ].join("\n")
      }
    });
    fireEvent.change(screen.getByLabelText("Evidence already available"), {
      target: { value: "I have a repair receipt" }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    const evidenceCard = screen.getByRole("heading", { name: "Evidence packet outline" }).closest("article");
    expect(evidenceCard).not.toBeNull();
    expect(within(evidenceCard as HTMLElement).getByText("available")).toBeInTheDocument();
  });

  it("adds high-risk intake details to human review", async () => {
    render(<App />);

    const intakeField = screen.getByLabelText("Immediate needs and risks");
    await userEvent.type(intakeField, "No place to stay tonight and need oxygen.");
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getAllByText("Human review").length).toBeGreaterThan(0);
    expect(screen.getByText(/Housing instability/)).toBeInTheDocument();
    expect(screen.getByText(/Medical emergency/)).toBeInTheDocument();
  });

  it("routes legal strategy intake to human review", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.type(screen.getByLabelText("Immediate needs and risks"), "I want a legal strategy to sue FEMA.");
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByText("Request human review")).toBeInTheDocument();
    expect(screen.getByText(/Denial or appeal deadline/)).toBeInTheDocument();
  });

  it("routes submission requests to human review", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.type(
      screen.getByLabelText("Immediate needs and risks"),
      "Can OpenRelief submit my FEMA application for me?"
    );
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByText("Request human review")).toBeInTheDocument();
    expect(screen.getByText(/Denial or appeal deadline/)).toBeInTheDocument();
  });

  it("routes imminent agency deadline intake to human review", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.type(
      screen.getByLabelText("Immediate needs and risks"),
      "FEMA paperwork is due tomorrow and I am not sure what to send."
    );
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByText("Request human review")).toBeInTheDocument();
    expect(screen.getByText(/Denial or appeal deadline/)).toBeInTheDocument();
  });

  it("routes final eligibility requests to source-backed human review", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.type(
      screen.getByLabelText("Immediate needs and risks"),
      "Can you tell me if I am eligible for FEMA assistance?"
    );
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByText("Request human review")).toBeInTheDocument();
    expect(screen.getByText("Final eligibility question")).toBeInTheDocument();
    expect(screen.getByText("OpenRelief cannot confirm final eligibility or legal options.")).toBeInTheDocument();
    expect(screen.getByText("https://www.fema.gov/assistance/individual/after-applying")).toBeInTheDocument();
    expect(screen.queryByText(/you are eligible/i)).not.toBeInTheDocument();
  });

  it("shows emergency guidance without guessing hotlines", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Immediate needs and risks"), {
      target: { value: "There is fire outside right now and I am in immediate danger." }
    });

    const emergencyAlert = screen.getByRole("alert", { name: "Immediate danger guidance" });
    expect(emergencyAlert).toHaveTextContent("If you are in immediate danger, contact local emergency services now.");
    expect(emergencyAlert).not.toHaveTextContent(/hotline|911|988/i);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByText("Immediate danger")).toBeInTheDocument();
  });

  it("keeps topbar support links connected to page sections", () => {
    render(<App />);

    for (const link of screen.getAllByRole("link")) {
      const target = link.getAttribute("href");

      expect(target).toMatch(/^#/);
      expect(document.querySelector(target ?? "")).toBeInTheDocument();
    }
  });

  it("saves analyzed case to a local case queue", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    expect(screen.getByRole("region", { name: "Local case queue" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Current case" })).getByText("OR-CA-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Saved case: Claim denial")).toBeInTheDocument();
    expect(screen.getByText("Missing items: Lease, mortgage, utility bill, or other occupancy proof")).toBeInTheDocument();
    expect(screen.getByText("Escalation: Denial or appeal deadline")).toBeInTheDocument();
    expect(window.localStorage.getItem("openrelief:v1:cases")).toContain("denial_or_appeal");
  });

  it("saves multiple local case snapshots with distinct IDs", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is denied because proof of occupancy is missing." }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    expect(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open saved case OR-CA-2026-002" })).toBeInTheDocument();
    expect(screen.getByText("Saved case: Claim denial")).toBeInTheDocument();
    expect(screen.getByText("Saved case: Approval")).toBeInTheDocument();

    const queue = screen.getByRole("region", { name: "Local case queue" });
    const queueSearch = within(queue).getByLabelText("Search saved cases");
    await userEvent.selectOptions(within(queue).getByLabelText("Sort saved cases"), "deadline");

    expect(
      within(queue)
        .getAllByRole("button", { name: /Open saved case/ })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Open saved case OR-CA-2026-002", "Open saved case OR-CA-2026-001"]);

    await userEvent.selectOptions(within(queue).getByLabelText("Sort saved cases"), "escalation");

    expect(
      within(queue)
        .getAllByRole("button", { name: /Open saved case/ })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Open saved case OR-CA-2026-001", "Open saved case OR-CA-2026-002"]);

    await userEvent.click(within(queue).getByRole("checkbox", { name: "Show escalation cases only" }));

    expect(within(queue).getByText("Saved case: Claim denial")).toBeInTheDocument();
    expect(within(queue).queryByText("Saved case: Approval")).not.toBeInTheDocument();

    await userEvent.click(within(queue).getByRole("checkbox", { name: "Show escalation cases only" }));
    await userEvent.type(queueSearch, "approval");

    expect(within(queue).getByText("Saved case: Approval")).toBeInTheDocument();
    expect(within(queue).queryByText("Saved case: Claim denial")).not.toBeInTheDocument();

    await userEvent.clear(queueSearch);
    await userEvent.type(queueSearch, "no-match");

    expect(within(queue).getByText("No matching saved cases")).toBeInTheDocument();

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;
    const exported = JSON.parse(archiveField.value) as Array<{ id: string; letterType: string }>;

    expect(exported.map((savedCase) => savedCase.id)).toEqual(["OR-CA-2026-002", "OR-CA-2026-001"]);
    expect(exported.map((savedCase) => savedCase.letterType)).toEqual(["approval", "denial"]);
  });

  it("sorts saved cases by unknown letter type", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nThis notice needs staff review." }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: { value: "FEMA Notice\nYour application is approved for rental assistance." }
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    const queue = screen.getByRole("region", { name: "Local case queue" });
    await userEvent.selectOptions(within(queue).getByLabelText("Sort saved cases"), "unknown");

    expect(
      within(queue)
        .getAllByRole("button", { name: /Open saved case/ })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Open saved case OR-CA-2026-001", "Open saved case OR-CA-2026-002"]);
  });

  it("redacts restricted identifiers before local draft storage and saved case export", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Extracted letter text"), {
      target: {
        value: [
          "FEMA Notice",
          "SSN 123-45-6789",
          "FEMA-123456789",
          "Your application is denied because proof of occupancy is missing."
        ].join("\n")
      }
    });
    fireEvent.change(screen.getByLabelText("Immediate needs and risks"), {
      target: { value: "DOB 01/02/1980. Application ID 987654321. App ID ABC-123456. I am undocumented." }
    });

    await waitFor(() => {
      const draft = window.localStorage.getItem("openrelief:v1:case") ?? "";
      expect(draft).not.toContain("123-45-6789");
      expect(draft).not.toContain("FEMA-123456789");
      expect(draft).not.toContain("01/02/1980");
      expect(draft).not.toContain("987654321");
      expect(draft).not.toContain("ABC-123456");
      expect(draft).not.toContain("undocumented");
    });

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;

    expect(archiveField.value).not.toContain("123-45-6789");
    expect(archiveField.value).not.toContain("FEMA-123456789");
    expect(archiveField.value).not.toContain("01/02/1980");
    expect(archiveField.value).not.toContain("987654321");
    expect(archiveField.value).not.toContain("ABC-123456");
    expect(archiveField.value).not.toContain("undocumented");
    expect(archiveField.value).toContain("[SSN removed]");
    expect(archiveField.value).toContain("[agency ID removed]");
    expect(archiveField.value).toContain("[date of birth removed]");
    expect(archiveField.value).toContain("[immigration status removed]");
    expect(archiveField.value).toContain("immigration_sensitive");
  });

  it("opens a saved case snapshot from the local queue", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    const letterField = screen.getByLabelText("Extracted letter text");
    await userEvent.clear(letterField);
    await userEvent.type(letterField, "FEMA Notice\nYour application is approved for rental assistance.");
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("heading", { name: "Approval" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const restoredLetterField = screen.getByLabelText("Extracted letter text") as HTMLTextAreaElement;
    expect(restoredLetterField.value).toContain("proof of occupancy");
    expect(screen.getByRole("heading", { name: "Claim denial" })).toBeInTheDocument();
  });

  it("shows missing evidence with source in opened saved case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });
    const missingEvidenceSection = within(detail)
      .getByRole("heading", { name: "Missing evidence" })
      .closest("section");

    expect(missingEvidenceSection).not.toBeNull();
    expect(within(detail).getByRole("heading", { name: "Missing evidence" })).toBeInTheDocument();
    expect(
      within(missingEvidenceSection as HTMLElement).getByText("Lease, mortgage, utility bill, or other occupancy proof")
    ).toBeInTheDocument();
    expect(
      within(missingEvidenceSection as HTMLElement).getByText(/Documents Needed for FEMA Assistance/)
    ).toBeInTheDocument();
  });

  it("shows checklist sources in opened saved case appendix", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });
    const appendix = within(detail).getByRole("heading", { name: "Source appendix" }).closest("section");

    expect(appendix).not.toBeNull();
    expect(within(appendix as HTMLElement).getByText("Appeal FEMA's Decision")).toBeInTheDocument();
    expect(within(appendix as HTMLElement).getByText("Documents Needed for FEMA Assistance")).toBeInTheDocument();
    expect(within(appendix as HTMLElement).getByText("Disaster Assistance")).toBeInTheDocument();
    expect(
      within(appendix as HTMLElement).getByText("https://www.fema.gov/assistance/individual/after-applying/appeals")
    ).toBeInTheDocument();
    expect(within(appendix as HTMLElement).getAllByText(/retrieved 2026-07-13/i).length).toBeGreaterThan(0);
    expect(within(appendix as HTMLElement).getAllByText(/last reviewed 2026-07-13/i).length).toBeGreaterThan(0);
  });

  it("shows deadline in opened saved case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });

    expect(within(detail).getByRole("heading", { name: "Deadlines" })).toBeInTheDocument();
    expect(within(detail).getByText("appeal within 60 days")).toBeInTheDocument();
    expect(within(detail).getByText("Source: Uploaded letter")).toBeInTheDocument();
  });

  it("shows queue triage summary and escalation flags in case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    const queue = screen.getByRole("region", { name: "Local case queue" });

    expect(within(queue).getByText("Status: Needs review")).toBeInTheDocument();
    expect(within(queue).getByText("Missing: 1")).toBeInTheDocument();
    expect(within(queue).getByText("Missing items: Lease, mortgage, utility bill, or other occupancy proof")).toBeInTheDocument();
    expect(within(queue).getByText(/^Last updated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(within(queue).getByText("Deadline: appeal within 60 days")).toBeInTheDocument();
    expect(within(queue).getByText("Escalation: Denial or appeal deadline")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });

    expect(within(detail).getByRole("heading", { name: "Escalation flags" })).toBeInTheDocument();
    expect(within(detail).getByText("Denial or appeal deadline")).toBeInTheDocument();
    const escalationNotesSection = within(detail).getByRole("heading", { name: "Escalation notes" }).closest("section");
    expect(escalationNotesSection).not.toBeNull();
    expect(within(escalationNotesSection as HTMLElement).getByText("Request human review")).toBeInTheDocument();
    expect(
      within(escalationNotesSection as HTMLElement).getByText(
        "Denial, appeal, or risk flags should be reviewed by a qualified helper."
      )
    ).toBeInTheDocument();
  });

  it("stores case-worker notes locally from case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const notesField = screen.getByLabelText("Case notes");
    await userEvent.type(notesField, "Called survivor about occupancy proof.");

    await waitFor(() => {
      expect(window.localStorage.getItem("openrelief:v1:cases")).toContain(
        "Called survivor about occupancy proof."
      );
    });

    fireEvent.change(notesField, { target: { value: "n".repeat(10_001) } });

    expect(notesField).toHaveValue("n".repeat(10_000));

    const taskNoteField = screen.getByLabelText("Task note for Request human review");
    await userEvent.type(taskNoteField, "Called legal aid contact.");

    await waitFor(() => {
      expect(window.localStorage.getItem("openrelief:v1:cases")).toContain("Called legal aid contact.");
    });

    fireEvent.change(taskNoteField, { target: { value: "t".repeat(10_001) } });

    expect(taskNoteField).toHaveValue("t".repeat(10_000));
  });

  it("shows timeline and checklist in opened saved case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });
    const checklistSection = within(detail).getByRole("heading", { name: "Checklist" }).closest("section");

    expect(within(detail).getByRole("heading", { name: "Summary" })).toBeInTheDocument();
    expect(within(detail).getByText("Letter type")).toBeInTheDocument();
    expect(within(detail).getAllByText("Claim denial").length).toBeGreaterThan(0);
    expect(within(detail).getByText("Status")).toBeInTheDocument();
    expect(within(detail).getByText("This letter appears to deny the request and asks for careful human review before next steps.")).toBeInTheDocument();
    expect(within(detail).getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(within(detail).getByText("Letter analyzed")).toBeInTheDocument();
    expect(within(detail).getByText("Checklist created")).toBeInTheDocument();
    expect(within(detail).getByText("Evidence packet started")).toBeInTheDocument();
    expect(within(detail).getByText(/^Snapshot saved: \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(within(detail).getByText("Deadline tracked: appeal within 60 days")).toBeInTheDocument();
    expect(within(detail).getByRole("heading", { name: "Uploaded letter" })).toBeInTheDocument();
    expect(within(detail).getByText("Sample_FEMA_Denial.txt")).toBeInTheDocument();
    expect(within(detail).getByText("Stored in local browser data only")).toBeInTheDocument();
    expect(checklistSection).not.toBeNull();
    expect(within(detail).getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
    expect(within(checklistSection as HTMLElement).getByText("Request human review")).toBeInTheDocument();
    expect(within(checklistSection as HTMLElement).getByText("Collect proof of occupancy")).toBeInTheDocument();
    expect(within(checklistSection as HTMLElement).getAllByText("Editable").length).toBeGreaterThan(0);
    expect(within(checklistSection as HTMLElement).getByText("Deadline: appeal within 60 days")).toBeInTheDocument();
    expect(within(checklistSection as HTMLElement).getByText("Deadline source: Uploaded letter")).toBeInTheDocument();
    expect(within(checklistSection as HTMLElement).getAllByText(/Appeal FEMA's Decision/).length).toBeGreaterThan(0);
    expect(
      within(checklistSection as HTMLElement).getAllByText(/Documents Needed for FEMA Assistance/).length
    ).toBeGreaterThan(0);
  });

  it("tracks checklist status in the local case queue", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    const queue = screen.getByRole("region", { name: "Local case queue" });
    expect(within(queue).getByText("Tasks: 0/4 done")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Mark Request human review done" }));

    expect(within(queue).getByText("Tasks: 1/4 done")).toBeInTheDocument();
    expect(window.localStorage.getItem("openrelief:v1:cases")).toContain('"human-review":"done"');
  });

  it("preserves case notes and checklist status when re-saving an opened case", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));
    await userEvent.type(screen.getByLabelText("Case notes"), "Called survivor about occupancy proof.");
    await userEvent.click(screen.getByRole("checkbox", { name: "Mark Request human review done" }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;
    const exported = JSON.parse(archiveField.value) as Array<{
      notes: string;
      checklistStatuses: Record<string, string>;
    }>;

    expect(exported[0]?.notes).toBe("Called survivor about occupancy proof.");
    expect(exported[0]?.checklistStatuses["human-review"]).toBe("done");
  });

  it("exports saved case JSON", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    expect(screen.getByText("Saved-case archives may include personal information.")).toBeInTheDocument();

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;
    const archive = JSON.parse(archiveField.value) as Array<{
      id: string;
      letterType: string;
      letterText: string;
      updatedAt: string;
      checklistItems: Array<{ id: string; editable: boolean; deadline?: { text: string } }>;
    }>;

    expect(archive).toHaveLength(1);
    expect(archive[0]).toMatchObject({
      id: "OR-CA-2026-001",
      letterType: "denial"
    });
    expect(archive[0].letterText).toContain("proof of occupancy");
    expect(archive[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
    expect(archive[0].checklistItems.find((item) => item.id === "human-review")?.editable).toBe(true);
    expect(archive[0].checklistItems.find((item) => item.id === "review-deadline")?.deadline?.text).toBe(
      "appeal within 60 days"
    );
  });

  it("caps saved case archive text before import", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Saved cases JSON"), {
      target: { value: "x".repeat(100_001) }
    });
    await userEvent.click(screen.getByRole("button", { name: /import saved cases/i }));

    expect(screen.getByText("Saved cases JSON too long. Keep archives under 100,000 characters.")).toBeInTheDocument();
    expect(screen.getByText("No saved cases")).toBeInTheDocument();
  });

  it("imports saved case JSON", async () => {
    const archive = JSON.stringify([
      {
        id: "OR-CA-2026-777",
        title: "Claim denial",
        letterType: "denial",
        letterText: [
          "FEMA Notice",
          "Your application is denied because proof of occupancy is missing.",
          "You may appeal within 60 days from the date of this letter."
        ].join("\n"),
        fileName: "Imported_FEMA_Denial.txt",
        intakeText: "No place to stay tonight.",
        deadlines: [{ label: "appeal window", text: "appeal within 60 days", source: "uploaded_letter" }],
        missingEvidence: [
          {
            label: "Lease, mortgage, utility bill, or other occupancy proof",
            sourceIds: ["fema-documents"]
          }
        ],
        checklistItems: [
          {
            id: "human-review",
            title: "Request human review",
            category: "human_review",
            reason: "Imported case needs human review."
          }
        ],
        checklistStatuses: {
          "human-review": "done"
        },
        riskFlags: ["denial_or_appeal"],
        summary: "Imported denial summary.",
        notes: "Imported case note."
      }
    ]);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Saved cases JSON"), { target: { value: archive } });
    await userEvent.click(screen.getByRole("button", { name: /import saved cases/i }));

    expect(screen.getByText("Saved case: Claim denial")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-777" }));

    const letterField = screen.getByLabelText("Extracted letter text") as HTMLTextAreaElement;
    expect(letterField.value).toContain("proof of occupancy");
    expect(screen.getByLabelText("Case notes")).toHaveValue("Imported case note.");
    expect(screen.getByRole("checkbox", { name: "Mark Request human review done" })).toBeChecked();
  });

  it("recomputes imported saved case safety fields from letter text", async () => {
    const archive = JSON.stringify([
      {
        id: "OR-CA-2026-778",
        title: "Approval",
        letterType: "approval",
        letterText: [
          "FEMA Notice",
          "Your application is denied because proof of occupancy is missing.",
          "You may appeal within 60 days from the date of this letter."
        ].join("\n"),
        fileName: "Imported_FEMA_Denial.txt",
        intakeText: "",
        deadlines: [],
        missingEvidence: [],
        checklistItems: [
          {
            id: "review-sources",
            title: "Review official sources",
            category: "source_review",
            reason: "Imported archive omitted review steps.",
            sourceIds: ["fema-documents"]
          }
        ],
        checklistStatuses: {},
        riskFlags: [],
        summary: "Imported archive says assistance is approved.",
        notes: "Preserve local reviewer note."
      }
    ]);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Saved cases JSON"), { target: { value: archive } });
    await userEvent.click(screen.getByRole("button", { name: /import saved cases/i }));

    expect(screen.getByText("Saved case: Claim denial")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;
    const exported = JSON.parse(archiveField.value) as Array<{
      letterType: string;
      summary: string;
      deadlines: Array<{ text: string }>;
      checklistItems: Array<{ id: string; editable: boolean }>;
      riskFlags: string[];
      notes: string;
    }>;

    expect(exported[0]?.letterType).toBe("denial");
    expect(exported[0]?.summary).toContain("deny");
    expect(exported[0]?.deadlines.map((deadline) => deadline.text)).toContain("appeal within 60 days");
    expect(exported[0]?.checklistItems.map((item) => item.id)).toContain("human-review");
    expect(exported[0]?.riskFlags).toContain("denial_or_appeal");
    expect(exported[0]?.notes).toBe("Preserve local reviewer note.");
  });

  it("imports minimal saved case archives by deriving missing safety fields", async () => {
    const archive = JSON.stringify([
      {
        id: "OR-CA-2026-779",
        letterText: [
          "FEMA Notice",
          "Your application is denied because proof of occupancy is missing.",
          "You may appeal within 60 days from the date of this letter."
        ].join("\n")
      }
    ]);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Saved cases JSON"), { target: { value: archive } });
    await userEvent.click(screen.getByRole("button", { name: /import saved cases/i }));

    expect(screen.getByText("Saved case: Claim denial")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;
    const exported = JSON.parse(archiveField.value) as Array<{
      fileName: string;
      letterType: string;
      checklistItems: Array<{ id: string; editable: boolean }>;
      riskFlags: string[];
    }>;

    expect(exported[0]?.fileName).toBe("Imported saved case");
    expect(exported[0]?.letterType).toBe("denial");
    expect(exported[0]?.checklistItems.map((item) => item.id)).toContain("human-review");
    expect(exported[0]?.checklistItems.find((item) => item.id === "human-review")?.editable).toBe(true);
    expect(exported[0]?.riskFlags).toContain("denial_or_appeal");
  });

  it("redacts restricted identifiers from imported saved case metadata", async () => {
    const archive = JSON.stringify([
      {
        id: "OR-FEMA-123456789",
        title: "Claim denial SSN 123-45-6789",
        letterType: "denial",
        letterText: "FEMA Notice\nYour application is denied because proof of occupancy is missing.",
        fileName: "DOB-01-02-1990.txt",
        intakeText: "",
        deadlines: [],
        missingEvidence: [],
        checklistItems: [],
        checklistStatuses: {},
        riskFlags: ["denial_or_appeal"],
        summary: "Summary references FEMA case number 123456789.",
        notes: ""
      }
    ]);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Saved cases JSON"), { target: { value: archive } });
    await userEvent.click(screen.getByRole("button", { name: /import saved cases/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;

    expect(archiveField.value).not.toContain("FEMA-123456789");
    expect(archiveField.value).not.toContain("123-45-6789");
    expect(archiveField.value).not.toContain("01-02-1990");
    expect(archiveField.value).not.toContain("case number 123456789");
    expect(archiveField.value).toContain("[agency ID removed]");
    expect(archiveField.value).toContain("[date of birth removed]");
    expect(archiveField.value).toContain("Claim denial");
  });

  it("redacts restricted identifiers from imported saved case details", async () => {
    const archive = JSON.stringify([
      {
        id: "OR-CA-2026-888",
        title: "Claim denial",
        letterType: "denial",
        letterText: "FEMA Notice\nYour application is denied because proof of occupancy is missing.",
        fileName: "Imported_FEMA_Denial.txt",
        intakeText: "",
        deadlines: [{ label: "DOB 01/02/1990", text: "respond with FEMA-123456789", source: "uploaded_letter" }],
        missingEvidence: [
          {
            label: "SSN 123-45-6789 record",
            sourceIds: ["fema-documents", "FEMA-123456789"]
          }
        ],
        checklistItems: [
          {
            id: "FEMA-123456789",
            title: "Collect DOB 01/02/1990",
            category: "evidence",
            reason: "Use case number 123456789.",
            sourceIds: ["fema-documents", "SSN 123-45-6789"]
          }
        ],
        checklistStatuses: {},
        riskFlags: ["denial_or_appeal", "FEMA-123456789"],
        summary: "Imported denial summary.",
        notes: ""
      }
    ]);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Saved cases JSON"), { target: { value: archive } });
    await userEvent.click(screen.getByRole("button", { name: /import saved cases/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;

    expect(archiveField.value).not.toContain("FEMA-123456789");
    expect(archiveField.value).not.toContain("123-45-6789");
    expect(archiveField.value).not.toContain("01/02/1990");
    expect(archiveField.value).not.toContain("case number 123456789");
    expect(archiveField.value).toContain("Request human review");
    expect(archiveField.value).toContain("fema-appeals");
  });

  it("restores a saved local draft and clears stored data", async () => {
    const savedLetter = "FEMA Notice\nYour application is approved for rental assistance.";
    const { unmount } = render(<App />);
    window.localStorage.setItem("openrelief:v1:future-draft", "sensitive case note");
    window.localStorage.setItem("other-app:key", "keep me");

    const letterField = screen.getByLabelText("Extracted letter text");
    await userEvent.clear(letterField);
    await userEvent.type(letterField, savedLetter);

    await waitFor(() => {
      const stored = window.localStorage.getItem("openrelief:v1:case");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({ letterText: savedLetter });
    });

    unmount();
    render(<App />);

    expect(screen.getByLabelText("Extracted letter text")).toHaveValue(savedLetter);

    await userEvent.click(screen.getByRole("button", { name: /clear local data/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm clear local data/i }));

    expect(window.localStorage.getItem("openrelief:v1:case")).toBeNull();
    expect(window.localStorage.getItem("openrelief:v1:future-draft")).toBeNull();
    expect(window.localStorage.getItem("other-app:key")).toBe("keep me");
    expect(screen.getByLabelText("Extracted letter text")).toHaveValue("");
  });
});
