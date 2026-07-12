import { render, screen, waitFor } from "@testing-library/react";
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
  });

  it("shows export text and requires confirmation before clearing local work", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /create packet text/i }));

    const exportField = screen.getByLabelText("Export packet text") as HTMLTextAreaElement;
    expect(exportField.value).toContain("OpenRelief packet");

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

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /clear local data/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm clear local data/i }));

    expect(window.localStorage.getItem("openrelief:v1:case")).toBeNull();
  });
});
