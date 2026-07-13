import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

const stylesPath = path.join(process.cwd(), "apps", "web", "src", "styles.css");

const expectNamedControls = () => {
  for (const button of screen.getAllByRole("button")) {
    expect(button).toHaveAccessibleName();
  }

  for (const link of screen.getAllByRole("link")) {
    expect(link).toHaveAccessibleName();
  }

  for (const textbox of screen.getAllByRole("textbox")) {
    expect(textbox).toHaveAccessibleName();
  }
};

describe("OpenRelief accessibility smoke", () => {
  it("keeps interactive controls named", async () => {
    render(<App />);

    expectNamedControls();

    await userEvent.click(screen.getByRole("button", { name: /analyze letter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save case snapshot/i }));

    expectNamedControls();
  });

  it("keeps saved-case archive actions at least 44px tall", () => {
    const styles = readFileSync(stylesPath, "utf8");
    const archiveActionRule = styles.match(/\.case-archive-actions \.secondary-action\s*\{[^}]+\}/)?.[0] ?? "";

    expect(archiveActionRule).toContain("min-height: 44px");
  });
});
