import {
  ArrowRight,
  BookOpenText,
  Building,
  CircleHelp,
  FileSpreadsheet,
  LayoutDashboard,
  MessageCircleMore,
  PartyPopper,
  Route as RouteIcon,
  Shield,
  Sidebar,
} from "lucide-react";
import type { ReactNode } from "react";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import Step from "~/components/assistant/components/step";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";
import { CAPABILITIES } from "~/lib/permissions";
import { can } from "~/lib/users";
import { cn } from "~/lib/utils";

const STEP_IDS = {
  WELCOME: "welcome",
  DASHBOARD: "dashboard",
  KEY_SECTIONS: "key-sections",
  GETTING_HELP: "getting-help",
} as const;

interface FirstTimeOnboardingProps {
  clientName: string;
  onClose: () => void;
}

export default function FirstTimeOnboarding({ clientName, onClose }: FirstTimeOnboardingProps) {
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
                onContinue={() => stepTo(STEP_IDS.DASHBOARD, "forward")}
              />
            );
          case STEP_IDS.DASHBOARD:
            return (
              <StepDashboard
                onContinue={() => stepTo(STEP_IDS.KEY_SECTIONS, "forward")}
                onStepBackward={() => stepTo(STEP_IDS.WELCOME, "backward")}
              />
            );
          case STEP_IDS.KEY_SECTIONS:
            return (
              <StepKeySections
                onContinue={() => stepTo(STEP_IDS.GETTING_HELP, "forward")}
                onStepBackward={() => stepTo(STEP_IDS.DASHBOARD, "backward")}
              />
            );
          case STEP_IDS.GETTING_HELP:
            return (
              <StepGettingHelp
                onClose={onClose}
                onStepBackward={() => stepTo(STEP_IDS.KEY_SECTIONS, "backward")}
              />
            );
          default:
            return null;
        }
      }}
    />
  );
}

function StepWelcome({ clientName, onContinue }: { clientName: string; onContinue: () => void }) {
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
      <p className="text-sm">
        You now have access to the <span className="font-bold underline">{clientName}</span>{" "}
        organization.
      </p>
      <Button size="lg" onClick={onContinue}>
        Get Started <ArrowRight />
      </Button>
      <div className="text-muted-foreground flex flex-col gap-2 text-sm">
        <p className="italic">Here's what we'll cover:</p>
        <ul className="flex flex-col text-left [&_li]:py-0.5">
          <li className="group flex items-center gap-2">
            <LayoutDashboard className="group-hover:text-primary size-4 shrink-0 transition-colors" />{" "}
            Your Command Center dashboard
          </li>
          <li className="group flex items-center gap-2">
            <Shield className="group-hover:text-primary size-4 shrink-0 transition-colors" /> Key
            sections you can access
          </li>
          <li className="group flex items-center gap-2">
            <CircleHelp className="group-hover:text-primary size-4 shrink-0 transition-colors" />{" "}
            Where to get help
          </li>
        </ul>
      </div>
    </div>
  );
}

function StepDashboard({
  onContinue,
  onStepBackward,
}: {
  onContinue: () => void;
  onStepBackward: () => void;
}) {
  return (
    <Step
      title={
        <span className="flex items-center justify-center gap-2">
          <LayoutDashboard className="size-5" />
          Your Command Center
        </span>
      }
      subtitle="Your at-a-glance overview of everything happening in your organization."
      onContinue={onContinue}
      onStepBackward={onStepBackward}
    >
      <div className="flex flex-col gap-3 py-2">
        <InfoItem
          icon={<LayoutDashboard className="text-primary size-4" />}
          title="Compliance Dashboard"
          description="See your organization's overall compliance status and key metrics at a glance."
        />
        <InfoItem
          icon={<FileSpreadsheet className="text-primary size-4" />}
          title="Recent Inspections"
          description="Quickly review the latest inspection activity across your sites."
        />
        <InfoItem
          icon={<Shield className="text-primary size-4" />}
          title="Alerts & Action Items"
          description="Stay informed about failed inspections and items that need attention."
        />
      </div>
      <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1 text-center text-xs">
        <Sidebar className="size-4" />
        Use the sidebar on the left to navigate between sections.
      </p>
    </Step>
  );
}

function StepKeySections({
  onContinue,
  onStepBackward,
}: {
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
  ];

  const visibleSections = sections.filter((s) => s.show);

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

function StepGettingHelp({
  onClose,
  onStepBackward,
}: {
  onClose: () => void;
  onStepBackward: () => void;
}) {
  return (
    <Step
      title="Getting Help"
      subtitle="We're here to help whenever you need it."
      onContinue={onClose}
      continueButtonText="Start Exploring"
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
