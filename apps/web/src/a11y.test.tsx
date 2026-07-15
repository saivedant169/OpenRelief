import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

const stylesPath = path.join(process.cwd(), "apps", "web", "src", "styles.css");

const styleRule = (styles: string, selector: string) =>
  styles.match(new RegExp(`${selector.replaceAll(".", "\\.")}\\s*\\{[^}]+\\}`))?.[0] ?? "";

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
    const archiveActionRule = styleRule(styles, ".case-archive-actions .secondary-action");

    expect(archiveActionRule).toContain("min-height: 44px");
  });

  it("keeps saved-case queue rows at least 44px tall", () => {
    const styles = readFileSync(stylesPath, "utf8");
    const queueRowRule = styleRule(styles, ".queue-row");

    expect(queueRowRule).toContain("min-height: 44px");
  });

  it("keeps case task checkbox rows at least 44px tall", () => {
    const styles = readFileSync(stylesPath, "utf8");
    const taskStatusRule = styleRule(styles, ".case-task-status");

    expect(taskStatusRule).toContain("min-height: 44px");
  });

  it("keeps primary actions and file upload targets at least 44px tall", () => {
    const styles = readFileSync(stylesPath, "utf8");
    const sharedActionRule = styleRule(styles, ".file-control,\n.primary-action,\n.secondary-action");

    expect(sharedActionRule).toContain("min-height: 44px");
  });

  it("keeps basic intake fields at least 44px tall", () => {
    const styles = readFileSync(stylesPath, "utf8");
    const fieldRule = styleRule(styles, ".field-group input,\n.field-group select");

    expect(fieldRule).toContain("min-height: 44px");
  });
});
