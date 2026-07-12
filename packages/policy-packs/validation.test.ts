import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import { validatePolicyPack } from "../core/src/openrelief";
import { californiaWildfirePolicyPack } from "./california-wildfire";

describe("policy pack validation", () => {
  it("validates the California wildfire policy pack", () => {
    expect(validatePolicyPack(californiaWildfirePolicyPack)).toEqual({
      valid: true,
      errors: []
    });
  });

  it("runs policy validation from check gate", () => {
    expect(packageJson.scripts["policy:validate"]).toBe("vitest run packages/policy-packs");
    expect(packageJson.scripts.check.split(" && ")).toContain("npm run policy:validate");
  });

  it("runs lint from check gate", () => {
    expect(packageJson.scripts.check.split(" && ")).toContain("npm run lint");
  });

  it("runs accessibility smoke from check gate", () => {
    expect(packageJson.scripts["test:a11y"]).toBe("vitest run apps/web/src/a11y.test.tsx");
    expect(packageJson.scripts.check.split(" && ")).toContain("npm run test:a11y");
  });
});
