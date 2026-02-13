import type { User } from "~/.server/authenticator";
import type { TCapability, TScope } from "~/lib/permissions";
import { CAPABILITIES } from "~/lib/permissions";
import {
  getFinishButtonText,
  getQuickStartItems,
  getQuickStartSubtitle,
  getWelcomeSubtitle,
  inferPersona,
} from "./onboarding-personas";

function makeUser(
  scope: TScope = "SITE",
  capabilities: TCapability[] = []
): User {
  return {
    idpId: "test-idp",
    email: "test@example.com",
    username: "testuser",
    scope,
    capabilities,
    hasMultiClientScope: false,
    hasMultiSiteScope: false,
    activeClientId: null,
    activeSiteId: null,
    tokens: { accessToken: "", refreshToken: "" },
  };
}

describe("inferPersona", () => {
  test("returns system-admin for SYSTEM scope", () => {
    expect(inferPersona(makeUser("SYSTEM", []))).toBe("system-admin");
  });

  test("returns system-admin for GLOBAL scope", () => {
    expect(inferPersona(makeUser("GLOBAL", []))).toBe("system-admin");
  });

  test("returns system-admin for SYSTEM scope even with other capabilities", () => {
    expect(
      inferPersona(
        makeUser("SYSTEM", [
          CAPABILITIES.MANAGE_USERS,
          CAPABILITIES.PERFORM_INSPECTIONS,
        ])
      )
    ).toBe("system-admin");
  });

  test("returns organization-admin for user with MANAGE_USERS", () => {
    expect(
      inferPersona(makeUser("CLIENT", [CAPABILITIES.MANAGE_USERS]))
    ).toBe("organization-admin");
  });

  test("returns compliance-manager for user with RESOLVE_ALERTS", () => {
    expect(
      inferPersona(makeUser("SITE", [CAPABILITIES.RESOLVE_ALERTS]))
    ).toBe("compliance-manager");
  });

  test("returns compliance-manager for user with VIEW_REPORTS", () => {
    expect(inferPersona(makeUser("SITE", [CAPABILITIES.VIEW_REPORTS]))).toBe(
      "compliance-manager"
    );
  });

  test("returns compliance-manager for user with both RESOLVE_ALERTS and VIEW_REPORTS", () => {
    expect(
      inferPersona(
        makeUser("SITE", [
          CAPABILITIES.RESOLVE_ALERTS,
          CAPABILITIES.VIEW_REPORTS,
        ])
      )
    ).toBe("compliance-manager");
  });

  test("returns inspector for user with PERFORM_INSPECTIONS", () => {
    expect(
      inferPersona(makeUser("SITE", [CAPABILITIES.PERFORM_INSPECTIONS]))
    ).toBe("inspector");
  });

  test("returns general for user with no matching capabilities", () => {
    expect(inferPersona(makeUser("SITE", []))).toBe("general");
  });

  test("returns general for user with only SUBMIT_REQUESTS", () => {
    expect(
      inferPersona(makeUser("SITE", [CAPABILITIES.SUBMIT_REQUESTS]))
    ).toBe("general");
  });

  // Priority ordering tests
  test("MANAGE_USERS beats PERFORM_INSPECTIONS (organization-admin > inspector)", () => {
    expect(
      inferPersona(
        makeUser("CLIENT", [
          CAPABILITIES.MANAGE_USERS,
          CAPABILITIES.PERFORM_INSPECTIONS,
        ])
      )
    ).toBe("organization-admin");
  });

  test("MANAGE_USERS beats RESOLVE_ALERTS (organization-admin > compliance-manager)", () => {
    expect(
      inferPersona(
        makeUser("CLIENT", [
          CAPABILITIES.MANAGE_USERS,
          CAPABILITIES.RESOLVE_ALERTS,
        ])
      )
    ).toBe("organization-admin");
  });

  test("RESOLVE_ALERTS beats PERFORM_INSPECTIONS (compliance-manager > inspector)", () => {
    expect(
      inferPersona(
        makeUser("SITE", [
          CAPABILITIES.RESOLVE_ALERTS,
          CAPABILITIES.PERFORM_INSPECTIONS,
        ])
      )
    ).toBe("compliance-manager");
  });

  test("GLOBAL scope beats all capabilities (system-admin is highest priority)", () => {
    expect(
      inferPersona(
        makeUser("GLOBAL", [
          CAPABILITIES.MANAGE_USERS,
          CAPABILITIES.RESOLVE_ALERTS,
          CAPABILITIES.PERFORM_INSPECTIONS,
        ])
      )
    ).toBe("system-admin");
  });
});

describe("content helpers", () => {
  test("getWelcomeSubtitle returns distinct text for each persona", () => {
    const subtitles = new Set([
      getWelcomeSubtitle("system-admin"),
      getWelcomeSubtitle("organization-admin"),
      getWelcomeSubtitle("compliance-manager"),
      getWelcomeSubtitle("inspector"),
      getWelcomeSubtitle("general"),
    ]);
    expect(subtitles.size).toBe(5);
  });

  test("getQuickStartItems returns items with text and description for every persona", () => {
    const personas = [
      "system-admin",
      "organization-admin",
      "compliance-manager",
      "inspector",
      "general",
    ] as const;
    for (const persona of personas) {
      const items = getQuickStartItems(persona);
      expect(items.length).toBeGreaterThanOrEqual(2);
      for (const item of items) {
        expect(item.text.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
      }
    }
  });

  test("getQuickStartSubtitle returns distinct text for each persona", () => {
    const subtitles = new Set([
      getQuickStartSubtitle("system-admin"),
      getQuickStartSubtitle("organization-admin"),
      getQuickStartSubtitle("compliance-manager"),
      getQuickStartSubtitle("inspector"),
      getQuickStartSubtitle("general"),
    ]);
    expect(subtitles.size).toBe(5);
  });

  test("getFinishButtonText returns a string for every persona", () => {
    const personas = [
      "system-admin",
      "organization-admin",
      "compliance-manager",
      "inspector",
      "general",
    ] as const;
    for (const persona of personas) {
      expect(typeof getFinishButtonText(persona)).toBe("string");
      expect(getFinishButtonText(persona).length).toBeGreaterThan(0);
    }
  });
});
