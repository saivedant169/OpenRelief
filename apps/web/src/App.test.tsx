import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("OpenRelief web workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

    const checklistCard = screen.getByRole("heading", { name: "Next-step checklist" }).closest("article");
    expect(checklistCard).not.toBeNull();
    expect(within(checklistCard as HTMLElement).getAllByText("Editable").length).toBeGreaterThan(0);
  });

  it("shows export text and requires confirmation before clearing local work", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    expect(screen.getByText("This export may include personal information.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /create packet text/i }));

    const exportField = screen.getByLabelText("Export packet text") as HTMLTextAreaElement;
    expect(exportField.value).toContain("OpenRelief packet");
    expect(exportField.value).toContain("This export may include personal information.");

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
  });

  it("shows a bounded appeal draft for denial letters", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getByRole("heading", { name: "Appeal draft" })).toBeInTheDocument();
    expect(screen.getByText("Draft appeal note for human review")).toBeInTheDocument();
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
  });

  it("adds high-risk intake details to human review", async () => {
    render(<App />);

    const intakeField = screen.getByLabelText("Immediate needs and risks");
    await userEvent.type(intakeField, "No place to stay tonight and need oxygen.");
    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));

    expect(screen.getAllByText("Human review").length).toBeGreaterThan(0);
    expect(screen.getByText(/homelessness/)).toBeInTheDocument();
    expect(screen.getByText(/medical_emergency/)).toBeInTheDocument();
  });

  it("saves analyzed case to a local case queue", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    expect(screen.getByRole("region", { name: "Local case queue" })).toBeInTheDocument();
    expect(screen.getByText("Saved case: Claim denial")).toBeInTheDocument();
    expect(window.localStorage.getItem("openrelief:v1:cases")).toContain("denial_or_appeal");
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

    expect(within(detail).getByRole("heading", { name: "Missing evidence" })).toBeInTheDocument();
    expect(within(detail).getByText("Lease, mortgage, utility bill, or other occupancy proof")).toBeInTheDocument();
    expect(within(detail).getByText("Documents Needed for FEMA Assistance")).toBeInTheDocument();
  });

  it("shows deadline in opened saved case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });

    expect(within(detail).getByRole("heading", { name: "Deadlines" })).toBeInTheDocument();
    expect(within(detail).getByText("appeal within 60 days")).toBeInTheDocument();
  });

  it("shows queue triage summary and escalation flags in case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    const queue = screen.getByRole("region", { name: "Local case queue" });

    expect(within(queue).getByText("Missing: 1")).toBeInTheDocument();
    expect(within(queue).getByText("Deadline: appeal within 60 days")).toBeInTheDocument();
    expect(within(queue).getByText("Flags: denial_or_appeal")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });

    expect(within(detail).getByRole("heading", { name: "Escalation flags" })).toBeInTheDocument();
    expect(within(detail).getByText("denial_or_appeal")).toBeInTheDocument();
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
  });

  it("shows timeline and checklist in opened saved case detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: "Open saved case OR-CA-2026-001" }));

    const detail = screen.getByRole("region", { name: "Case detail" });

    expect(within(detail).getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(within(detail).getByText("Letter analyzed")).toBeInTheDocument();
    expect(within(detail).getByText("Checklist created")).toBeInTheDocument();
    expect(within(detail).getByText("Snapshot saved")).toBeInTheDocument();
    expect(within(detail).getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
    expect(within(detail).getByText("Request human review")).toBeInTheDocument();
    expect(within(detail).getByText("Collect proof of occupancy")).toBeInTheDocument();
  });

  it("exports saved case JSON", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));
    await userEvent.click(screen.getByRole("button", { name: /export saved cases/i }));

    const archiveField = screen.getByLabelText("Saved cases JSON") as HTMLTextAreaElement;
    const archive = JSON.parse(archiveField.value) as { id: string; letterType: string; letterText: string }[];

    expect(archive).toHaveLength(1);
    expect(archive[0]).toMatchObject({
      id: "OR-CA-2026-001",
      letterType: "denial"
    });
    expect(archive[0].letterText).toContain("proof of occupancy");
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
  });

  it("restores a saved local draft and clears stored data", async () => {
    const savedLetter = "FEMA Notice\nYour application is approved for rental assistance.";
    const { unmount } = render(<App />);

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
    expect(screen.getByLabelText("Extracted letter text")).toHaveValue("");
  });
});
