import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

const stylesPath = path.join(process.cwd(), "apps", "web", "src", "styles.css");

const styleRule = (styles: string, selector: string) =>
  styles.match(new RegExp(`${selector.replaceAll(".", "\\.")}\\s*\\{[^}]+\\}`))?.[0] ?? "";

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");

  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
};

const linearChannel = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const luminance = (hex: string) => {
  const [red, green, blue] = hexToRgb(hex).map(linearChannel);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground: string, background: string) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
};

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
  it("provides a skip link to primary content", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

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

  it("keeps key text and focus indicators at accessible contrast", () => {
    const styles = readFileSync(stylesPath, "utf8");
    const focusRule = styleRule(
      styles,
      "textarea:focus,\nbutton:focus-visible,\na:focus-visible,\n.file-control:focus-within,\n.need-options:focus-within"
    );
    const textPairs = [
      ["#15202b", "#f6f7f8"],
      ["#4b5b6b", "#ffffff"],
      ["#344253", "#ffffff"],
      ["#5f6f80", "#ffffff"],
      ["#073f91", "#ffffff"],
      ["#ffffff", "#073f91"],
      ["#0f6b3f", "#e8f7ee"],
      ["#7a4d00", "#fff3cf"],
      ["#8b1a1a", "#ffe7e7"],
      ["#7a2d00", "#fff1df"]
    ];
    const focusColor = "#0a66c2";

    expect(focusRule).toContain(`outline: 3px solid ${focusColor}`);

    for (const [foreground, background] of textPairs) {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }

    expect(contrastRatio(focusColor, "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(focusColor, "#f6f7f8")).toBeGreaterThanOrEqual(3);
  });
});
