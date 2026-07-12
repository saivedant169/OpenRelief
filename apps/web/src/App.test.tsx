import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("OpenRelief web workflow", () => {
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
});

