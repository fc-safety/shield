import { Hand } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { useActiveAccessGrant } from "~/contexts/active-access-grant-context";
import FirstTimeOnboarding from "./first-time-onboarding";
import ReturningUserWelcome from "./returning-user-welcome";

interface WelcomeOnboardingProps {
  showWelcome: boolean;
}

export default function WelcomeOnboarding({ showWelcome }: WelcomeOnboardingProps) {
  const { accessibleClients, activeClient, isLoading } = useActiveAccessGrant();
  const navigate = useNavigate();
  const [open, setOpen] = useState(showWelcome);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    // Remove ?welcome=true from URL
    navigate(".", { replace: true });
  }, [navigate]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  // Don't render until data is loaded
  if (isLoading || !open) {
    return null;
  }

  const clientName = activeClient?.clientName ?? "your organization";
  const isFirstTime = accessibleClients.length <= 1;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <span className="flex items-center gap-1">
          <Hand className="animate-sway size-5 rotate-45" /> Welcome{isFirstTime ? "!" : " back!"}
        </span>
      }
      dialogClassName="sm:max-w-2xl"
      disableScrollArea
      trigger={<div className="absolute hidden"></div>}
      render={({ drawerContentHeight }) => (
        <div className="overflow-hidden" style={{ height: drawerContentHeight ?? "28rem" }}>
          {isFirstTime ? (
            <FirstTimeOnboarding clientName={clientName} onClose={handleDismiss} />
          ) : (
            <ReturningUserWelcome clientName={clientName} onClose={handleDismiss} />
          )}
        </div>
      )}
    />
  );
}
