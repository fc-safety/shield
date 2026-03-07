import { Hand } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "~/components/responsive-modal";
import { useActiveAccessGrant } from "~/contexts/active-access-grant-context";
import { useQueryNavigate } from "~/hooks/use-query-navigate";
import FirstTimeOnboarding from "./first-time-onboarding";
import ReturningUserWelcome from "./returning-user-welcome";

interface WelcomeOnboardingProps {
  showWelcome: boolean;
}

export default function WelcomeOnboarding({ showWelcome }: WelcomeOnboardingProps) {
  const { accessibleClients, activeClient, isLoading } = useActiveAccessGrant();
  const { setQuery } = useQueryNavigate();
  const [open, setOpen] = useState(showWelcome);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    // Remove ?welcome=true from URL
    setQuery((prev) => prev.delete("welcome"), { replace: true });
  }, [setQuery]);

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
    <ResponsiveModal open={open} onOpenChange={handleOpenChange}>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-2xl" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            <span className="flex items-center gap-1">
              <Hand className="animate-sway size-5 rotate-45" /> Welcome{isFirstTime ? "!" : " back!"}
            </span>
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ResponsiveModalBody disableScrollArea>
          <div className="flex-1 min-h-0 overflow-hidden">
            {isFirstTime ? (
              <FirstTimeOnboarding clientName={clientName} onClose={handleDismiss} />
            ) : (
              <ReturningUserWelcome clientName={clientName} onClose={handleDismiss} />
            )}
          </div>
        </ResponsiveModalBody>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
