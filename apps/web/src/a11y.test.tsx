import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

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
});
