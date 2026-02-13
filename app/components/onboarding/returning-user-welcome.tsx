import { ArrowLeftRight, Building, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import Step from "~/components/assistant/components/step";

const STEP_ID = "welcome-back";

interface ReturningUserWelcomeProps {
  clientName: string;
  onClose: () => void;
}

export default function ReturningUserWelcome({ clientName, onClose }: ReturningUserWelcomeProps) {
  const assistant = useAssistant({
    onClose,
    firstStepId: STEP_ID,
  });

  return (
    <AssistantProvider
      context={assistant}
      renderStep={() => (
        <Step
          title={`Welcome to ${clientName}!`}
          subtitle="You now have access to a new organization. Here are a few things to know."
          onContinue={onClose}
          continueButtonText="Got It"
        >
          <div className="flex flex-col gap-3 py-2">
            <InfoItem
              icon={<ArrowLeftRight className="text-primary size-4" />}
              title="Switch Organizations"
              description="Use the dropdown in the header to switch between your organizations."
            />
            <InfoItem
              icon={<LayoutDashboard className="text-primary size-4" />}
              title="Organization-Scoped Data"
              description="Your dashboard and reports reflect the currently active organization."
            />
            <InfoItem
              icon={<Building className="text-primary size-4" />}
              title="Organization Settings"
              description="Visit My Organization to see sites, members, and settings."
            />
          </div>
        </Step>
      )}
    />
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
