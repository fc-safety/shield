import type { User } from "~/.server/authenticator";
import { CAPABILITIES } from "~/lib/permissions";
import { can, isGlobalAdmin } from "~/lib/users";

export type OnboardingPersona =
  | "system-admin"
  | "organization-admin"
  | "compliance-manager"
  | "inspector"
  | "general";

/**
 * Infer a single onboarding persona from the user's scope and capabilities.
 * Priority-ordered: most elevated role wins (a system admin has all capabilities).
 */
export function inferPersona(user: User): OnboardingPersona {
  if (isGlobalAdmin(user)) return "system-admin";
  if (can(user, CAPABILITIES.MANAGE_USERS)) return "organization-admin";
  if (can(user, CAPABILITIES.RESOLVE_ALERTS) || can(user, CAPABILITIES.VIEW_REPORTS))
    return "compliance-manager";
  if (can(user, CAPABILITIES.PERFORM_INSPECTIONS)) return "inspector";
  return "general";
}

// ---------------------------------------------------------------------------
// Content helpers — all persona-specific copy lives here for easy review
// ---------------------------------------------------------------------------

export function getWelcomeSubtitle(persona: OnboardingPersona): string {
  switch (persona) {
    case "system-admin":
      return "You have full platform access. Let's get you oriented.";
    case "organization-admin":
      return "You're set up to manage your team and organization.";
    case "compliance-manager":
      return "You're set up to monitor compliance and resolve issues.";
    case "inspector":
      return "You're set up as an inspector. Here's a quick tour.";
    case "general":
      return "Here's a quick tour of what you can do.";
  }
}

export function getDashboardSubtitle(persona: OnboardingPersona): string {
  switch (persona) {
    case "system-admin":
      return "A high-level view of compliance across all organizations.";
    case "organization-admin":
      return "Track your team's compliance status and key activity.";
    case "compliance-manager":
      return "Monitor compliance metrics and items that need your attention.";
    case "inspector":
      return "See your recent inspections and any items flagged for follow-up.";
    case "general":
      return "Your at-a-glance overview of everything happening in your organization.";
  }
}

export interface DashboardItem {
  title: string;
  description: string;
  /** Icon key so the component can map to the right lucide icon */
  icon: "compliance" | "inspections" | "alerts";
}

const DASHBOARD_ITEMS: Record<string, DashboardItem> = {
  compliance: {
    title: "Compliance Dashboard",
    description: "See your organization's overall compliance status and key metrics at a glance.",
    icon: "compliance",
  },
  inspections: {
    title: "Recent Inspections",
    description: "Quickly review the latest inspection activity across your sites.",
    icon: "inspections",
  },
  alerts: {
    title: "Alerts & Action Items",
    description: "Stay informed about failed inspections and items that need attention.",
    icon: "alerts",
  },
};

function dashboardItem(key: string, overrides?: Partial<DashboardItem>): DashboardItem {
  return { ...DASHBOARD_ITEMS[key], ...overrides };
}

export function getDashboardItems(persona: OnboardingPersona): DashboardItem[] {
  switch (persona) {
    case "inspector":
      return [
        dashboardItem("inspections", {
          description: "View your latest inspections and any that need follow-up.",
        }),
        dashboardItem("alerts", {
          description: "See items flagged during your inspections.",
        }),
        dashboardItem("compliance"),
      ];
    case "compliance-manager":
      return [
        dashboardItem("alerts", {
          description: "Review failed inspections and items requiring your resolution.",
        }),
        dashboardItem("compliance", {
          description: "Track compliance trends and metrics for your organization.",
        }),
        dashboardItem("inspections"),
      ];
    case "system-admin":
      return [
        dashboardItem("compliance", {
          description: "Monitor compliance across all client organizations at a glance.",
        }),
        dashboardItem("alerts", {
          description: "Platform-wide alerts and items needing attention.",
        }),
        dashboardItem("inspections"),
      ];
    case "organization-admin":
      return [
        dashboardItem("compliance", {
          description: "Track your organization's compliance status and trends.",
        }),
        dashboardItem("inspections", {
          description: "Review recent inspection activity from your team.",
        }),
        dashboardItem("alerts"),
      ];
    case "general":
      return [dashboardItem("compliance"), dashboardItem("inspections"), dashboardItem("alerts")];
  }
}

export function getSectionDescription(
  persona: OnboardingPersona,
  sectionTitle: string
): string | undefined {
  const overrides: Partial<Record<OnboardingPersona, Record<string, string>>> = {
    "system-admin": {
      "Command Center": "Platform-wide compliance overview and alerts",
      "My Organization": "Manage client organizations and platform settings",
    },
    "organization-admin": {
      "My Organization": "Manage your team, roles, and site configuration",
      Reports: "Review compliance reports for your organization",
    },
    "compliance-manager": {
      "Command Center": "Compliance metrics and alerts requiring your action",
      Reports: "Access detailed compliance reports and statistics",
    },
    inspector: {
      Assets: "Browse and inspect fire safety equipment at your sites",
      "My Organization": "View your sites and team members",
      "Inspection Routes": "View your assigned inspection routes",
    },
  };

  return overrides[persona]?.[sectionTitle];
}

export interface QuickStartItem {
  text: string;
  description: string;
}

export function getQuickStartSubtitle(persona: OnboardingPersona): string {
  switch (persona) {
    case "inspector":
      return "Use this app to review your routes and assets. To perform an inspection, go to the asset on-site and tap its NFC tag.";
    case "compliance-manager":
      return "Here are the most impactful things you can do right away.";
    case "organization-admin":
      return "Get your organization set up with these first steps.";
    case "system-admin":
      return "Get familiar with the platform through these key actions.";
    case "general":
      return "Here are some easy ways to start exploring.";
  }
}

export function getQuickStartItems(persona: OnboardingPersona): QuickStartItem[] {
  switch (persona) {
    case "inspector":
      return [
        {
          text: "Tap an NFC tag to inspect",
          description: "Physically tap an asset's NFC tag to open the inspection part of the app.",
        },
        {
          text: "View your inspection routes",
          description: "Routes help you organize your inspections and ensure you cover everything.",
        },
        {
          text: "Browse your site's assets",
          description: "Familiarize yourself with the equipment you'll be inspecting on-site.",
        },
        {
          text: "Check the Command Center",
          description: "Review any items flagged from previous inspections.",
        },
      ];
    case "compliance-manager":
      return [
        {
          text: "Review open alerts",
          description: "See which failed inspections or overdue items need your attention.",
        },
        {
          text: "Check compliance reports",
          description: "Get a snapshot of compliance trends across your sites.",
        },
        {
          text: "Explore the Command Center",
          description: "Your central hub for monitoring compliance status at a glance.",
        },
      ];
    case "organization-admin":
      return [
        {
          text: "Explore the Command Center",
          description: "Your central hub for monitoring compliance status at a glance.",
        },
        {
          text: "Review your sites",
          description: "Make sure your site information and locations are up to date.",
        },
        {
          text: "Invite your team members",
          description: "Add inspectors and managers so they can start using Shield.",
        },
        {
          text: "Check roles and permissions",
          description: "Verify that team members have the right level of access.",
        },
      ];
    case "system-admin":
      return [
        {
          text: "Browse client organizations",
          description: "See which organizations are active and review their setup.",
        },
        {
          text: "Review platform settings",
          description: "Check system configuration, integrations, and global defaults.",
        },
        {
          text: "Monitor compliance overview",
          description: "Get a platform-wide view of compliance across all clients.",
        },
      ];
    case "general":
      return [
        {
          text: "Explore the Command Center",
          description: "Your dashboard with an overview of compliance and recent activity.",
        },
        {
          text: "Browse your organization",
          description: "See your sites, team members, and organization details.",
        },
      ];
  }
}

export function getFinishButtonText(persona: OnboardingPersona): string {
  switch (persona) {
    case "inspector":
      return "Start Exploring";
    case "compliance-manager":
      return "Start Monitoring";
    case "organization-admin":
      return "Start Managing";
    case "system-admin":
      return "Start Exploring";
    case "general":
      return "Start Exploring";
  }
}
