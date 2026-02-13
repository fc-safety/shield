import {
  ArrowRight,
  BookOpenText,
  Building,
  CircleHelp,
  FileSpreadsheet,
  LayoutDashboard,
  MessageCircleMore,
  PartyPopper,
  Rocket,
  Route as RouteIcon,
  Settings,
  Shield,
  Sidebar,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import Step from "~/components/assistant/components/step";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";
import type { OnboardingPersona } from "~/lib/onboarding-personas";
import {
  getDashboardItems,
  getDashboardSubtitle,
  getFinishButtonText,
  getQuickStartItems,
  getQuickStartSubtitle,
  getSectionDescription,
  getWelcomeSubtitle,
  inferPersona,
} from "~/lib/onboarding-personas";
import { CAPABILITIES } from "~/lib/permissions";
import { can, isGlobalAdmin } from "~/lib/users";
import { cn } from "~/lib/utils";

const STEP_IDS = {
  WELCOME: "welcome",
  DASHBOARD: "dashboard",
  KEY_SECTIONS: "key-sections",
  QUICK_START: "quick-start",
  GETTING_HELP: "getting-help",
} as const;

interface FirstTimeOnboardingProps {
  clientName: string;
  onClose: () => void;
}

export default function FirstTimeOnboarding({ clientName, onClose }: FirstTimeOnboardingProps) {
  const { user } = useAuth();
  const persona = inferPersona(user);

  const assistant = useAssistant({
    onClose,
    firstStepId: STEP_IDS.WELCOME,
  });

  return (
    <AssistantProvider
      context={assistant}
      renderStep={({ stepId, stepTo }) => {
        switch (stepId) {
          case STEP_IDS.WELCOME:
            return (
              <StepWelcome
                clientName={clientName}
                persona={persona}
                onContinue={() => stepTo(STEP_IDS.DASHBOARD, "forward")}
              />
            );
          case STEP_IDS.DASHBOARD:
            return (
              <StepDashboard
                persona={persona}
                onContinue={() => stepTo(STEP_IDS.KEY_SECTIONS, "forward")}
                onStepBackward={() => stepTo(STEP_IDS.WELCOME, "backward")}
              />
            );
          case STEP_IDS.KEY_SECTIONS:
            return (
              <StepKeySections
                persona={persona}
                onContinue={() => stepTo(STEP_IDS.QUICK_START, "forward")}
                onStepBackward={() => stepTo(STEP_IDS.DASHBOARD, "backward")}
              />
            );
          case STEP_IDS.QUICK_START:
            return (
              <StepQuickStart
                persona={persona}
                onContinue={() => stepTo(STEP_IDS.GETTING_HELP, "forward")}
                onStepBackward={() => stepTo(STEP_IDS.KEY_SECTIONS, "backward")}
              />
            );
          case STEP_IDS.GETTING_HELP:
            return (
              <StepGettingHelp
                persona={persona}
                onClose={onClose}
                onStepBackward={() => stepTo(STEP_IDS.QUICK_START, "backward")}
              />
            );
          default:
            return null;
        }
      }}
    />
  );
}

function StepWelcome({
  clientName,
  persona,
  onContinue,
}: {
  clientName: string;
  persona: OnboardingPersona;
  onContinue: () => void;
}) {
  const {
    bannerLogoDark: { h48px: bannerLogoDarkUrl },
    bannerLogoLight: { h48px: bannerLogoLightUrl },
  } = useOptimizedImageUrls();

  return (
    <div className="flex h-full w-full max-w-xl flex-col items-center justify-center gap-6 py-2 text-center">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
        <PartyPopper className="text-primary animate-pop-once size-6" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-lg leading-tight">Welcome to the</p>
        <div className="w-84 max-w-5/6 [&>img]:w-full">
          <img src={bannerLogoLightUrl} alt="FC Safety Shield" className="dark:hidden" />
          <img src={bannerLogoDarkUrl} alt="FC Safety Shield" className="hidden dark:block" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm">
          You now have access to the <span className="font-bold underline">{clientName}</span>{" "}
          organization.
        </p>
        <p className="text-muted-foreground text-sm">{getWelcomeSubtitle(persona)}</p>
      </div>
      <Button size="lg" onClick={onContinue}>
        Get Started <ArrowRight />
      </Button>
      <div className="flex flex-col gap-2 text-xs">
        <p className="italic">Here's what we'll cover:</p>
        <ul className="[&>li]:text-muted-foreground flex flex-col text-left [&_li]:py-0.5 [&_svg]:size-3">
          <li className="group flex items-center gap-2">
            <LayoutDashboard className="group-hover:text-primary shrink-0 transition-colors" /> Your
            Command Center dashboard
          </li>
          <li className="group flex items-center gap-2">
            <Shield className="group-hover:text-primary shrink-0 transition-colors" /> Key sections
            you can access
          </li>
          <li className="group flex items-center gap-2">
            <Rocket className="group-hover:text-primary shrink-0 transition-colors" /> Tips to get
            started
          </li>
          <li className="group flex items-center gap-2">
            <CircleHelp className="group-hover:text-primary shrink-0 transition-colors" /> Where to
            get help
          </li>
        </ul>
      </div>
    </div>
  );
}

const DASHBOARD_ICON_MAP: Record<string, ReactNode> = {
  compliance: <LayoutDashboard className="text-primary size-4" />,
  inspections: <FileSpreadsheet className="text-primary size-4" />,
  alerts: <Shield className="text-primary size-4" />,
};

function StepDashboard({
  persona,
  onContinue,
  onStepBackward,
}: {
  persona: OnboardingPersona;
  onContinue: () => void;
  onStepBackward: () => void;
}) {
  const items = getDashboardItems(persona);

  return (
    <Step
      title={
        <span className="flex items-center justify-center gap-2">
          <LayoutDashboard className="size-5" />
          Your Command Center
        </span>
      }
      subtitle={getDashboardSubtitle(persona)}
      onContinue={onContinue}
      onStepBackward={onStepBackward}
    >
      <div className="flex flex-col gap-3 py-2">
        {items.map((item) => (
          <InfoItem
            key={item.title}
            icon={DASHBOARD_ICON_MAP[item.icon]}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
      <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1 text-center text-xs">
        <Sidebar className="size-4" />
        Use the sidebar on the left to navigate between sections.
      </p>
    </Step>
  );
}

function StepKeySections({
  persona,
  onContinue,
  onStepBackward,
}: {
  persona: OnboardingPersona;
  onContinue: () => void;
  onStepBackward: () => void;
}) {
  const { user } = useAuth();

  const sections: {
    icon: ReactNode;
    title: string;
    description: string;
    show: boolean;
  }[] = [
    {
      icon: <LayoutDashboard className="size-5" />,
      title: "Command Center",
      description: "Dashboard with compliance overview and alerts",
      show: true,
    },
    {
      icon: <Shield className="size-5" />,
      title: "Assets",
      description: "Manage fire safety equipment and tags",
      show: can(user, CAPABILITIES.PERFORM_INSPECTIONS),
    },
    {
      icon: <RouteIcon className="size-5" />,
      title: "Inspection Routes",
      description: "Plan and schedule inspection routes",
      show: can(user, CAPABILITIES.MANAGE_ROUTES),
    },
    {
      icon: <FileSpreadsheet className="size-5" />,
      title: "Reports",
      description: "View compliance reports and statistics",
      show: true,
    },
    {
      icon: <Building className="size-5" />,
      title: "My Organization",
      description: "Manage sites, members, and settings",
      show: true,
    },
    {
      icon: <Settings className="size-5" />,
      title: "Admin",
      description: "Platform administration and system settings",
      show: persona === "system-admin",
    },
    {
      icon: <Sparkles className="size-5" />,
      title: "Products",
      description: "Manage product catalog and categories",
      show: isGlobalAdmin(user) && can(user, CAPABILITIES.CONFIGURE_PRODUCTS),
    },
  ];

  // Apply persona-specific description overrides
  const visibleSections = sections
    .filter((s) => s.show)
    .map((s) => ({
      ...s,
      description: getSectionDescription(persona, s.title) ?? s.description,
    }));

  // Reorder: put most relevant sections first per persona
  const priorityTitles: Partial<Record<OnboardingPersona, string[]>> = {
    inspector: ["Assets", "Inspection Routes", "Command Center"],
    "compliance-manager": ["Command Center", "Reports"],
    "organization-admin": ["My Organization", "Command Center"],
    "system-admin": ["Admin", "Command Center", "My Organization"],
  };

  const priority = priorityTitles[persona];
  if (priority) {
    visibleSections.sort((a, b) => {
      const aIdx = priority.indexOf(a.title);
      const bIdx = priority.indexOf(b.title);
      // Items in priority list come first; preserve original order for the rest
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
  }

  return (
    <Step
      title="Key Sections"
      subtitle="Here are the main areas you can access based on your role."
      onContinue={onContinue}
      onStepBackward={onStepBackward}
      growContent
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visibleSections.map((section) => (
          <div
            key={section.title}
            className={cn(
              "bg-secondary/50 flex items-start gap-3 rounded-lg p-3",
              "border transition-colors"
            )}
          >
            <div className="text-primary mt-0.5 shrink-0">{section.icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{section.title}</p>
              <p className="text-muted-foreground text-xs">{section.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Step>
  );
}

function StepQuickStart({
  persona,
  onContinue,
  onStepBackward,
}: {
  persona: OnboardingPersona;
  onContinue: () => void;
  onStepBackward: () => void;
}) {
  const items = getQuickStartItems(persona);

  return (
    <Step
      title={
        <span className="flex items-center justify-center gap-2">
          <Rocket className="size-5" />
          Quick Start
        </span>
      }
      subtitle={getQuickStartSubtitle(persona)}
      onContinue={onContinue}
      onStepBackward={onStepBackward}
    >
      <div className="flex flex-col gap-3 py-2">
        {items.map((item) => (
          <div key={item.text} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <ArrowRight className="text-primary size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.text}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1 text-center text-xs">
        <Sidebar className="size-4" />
        Navigate to any section using the sidebar on the left.
      </p>
    </Step>
  );
}

function StepGettingHelp({
  persona,
  onClose,
  onStepBackward,
}: {
  persona: OnboardingPersona;
  onClose: () => void;
  onStepBackward: () => void;
}) {
  return (
    <Step
      title="Getting Help"
      subtitle="We're here to help whenever you need it."
      onContinue={onClose}
      continueButtonText={getFinishButtonText(persona)}
      onStepBackward={onStepBackward}
    >
      <div className="flex flex-col gap-3 py-2">
        <InfoItem
          icon={<MessageCircleMore className="text-primary size-4" />}
          title="Contact Us"
          description="Reach out to our support team for personalized assistance."
        />
        <InfoItem
          icon={<CircleHelp className="text-primary size-4" />}
          title="FAQs"
          description="Find answers to commonly asked questions."
        />
        <InfoItem
          icon={<BookOpenText className="text-primary size-4" />}
          title="Docs"
          description="Browse detailed documentation and guides."
        />
      </div>
      <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1 text-center text-xs">
        <Sidebar className="size-4" />
        You can find these in the Support section of the sidebar.
      </p>
    </Step>
  );
}

function InfoItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  );
}
