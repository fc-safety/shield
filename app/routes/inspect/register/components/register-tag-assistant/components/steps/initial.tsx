import { ArrowRight, CircleSlash, Loader2 } from "lucide-react";
import { Link } from "react-router";
import Step from "~/components/assistant/components/step";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import SuccessCircle from "~/routes/inspect/components/success-circle";

export default function StepInitial({
  isRegistered,
  isRegisteredRecently,
  canRegister,
  onRegister,
  isRegistering,
  setupRequired,
  onSetup,
  hideInspectionPrompt = false,
  onClose,
}: {
  isRegistered: boolean;
  isRegisteredRecently: boolean;
  canRegister: boolean;
  onRegister: () => void;
  isRegistering: boolean;
  setupRequired?: boolean;
  onSetup: () => void;
  hideInspectionPrompt: boolean;
  onClose?: () => void;
}) {
  return (
    <Step>
      <div className="flex flex-col items-center justify-center gap-4">
        {isRegistering ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <Loader2 className="text-muted-foreground size-16 animate-spin" />
            <h2 className="text-lg font-semibold">Registering tag to asset...</h2>
          </div>
        ) : isRegistered ? (
          <>
            <div className="flex flex-col items-center justify-center gap-1">
              <SuccessCircle />
              <h2 className="text-center text-lg font-semibold">
                This tag is {isRegisteredRecently ? "now" : "already"} registered to an asset.
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              {setupRequired && (
                <Alert variant="default">
                  <AlertTitle>Additonal Setup Required</AlertTitle>
                  <AlertDescription>
                    Before you can begin inspecting, this asset requires additional setup.
                  </AlertDescription>
                </Alert>
              )}
              {setupRequired ? (
                <Button onClick={onSetup} type="button">
                  Continue with setup <ArrowRight />
                </Button>
              ) : hideInspectionPrompt ? null : (
                <Button asChild>
                  <Link to="/inspect">
                    Begin inspection <ArrowRight />
                  </Link>
                </Button>
              )}
              {onClose && (
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center gap-1">
              <CircleSlash className="text-destructive size-16" />
              <h2 className="text-lg font-semibold">This tag is not registered to an asset.</h2>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              {!canRegister && (
                <p className="text-destructive text-center text-sm">
                  You do not have permission to register tags.
                </p>
              )}
              <Button
                key="open-form-button"
                type="button"
                onClick={onRegister}
                disabled={!canRegister}
                className="w-full"
              >
                Register Tag
              </Button>
            </div>
          </>
        )}
      </div>
    </Step>
  );
}

StepInitial.StepId = "initial";
