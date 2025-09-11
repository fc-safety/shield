import ClientCombobox from "~/components/clients/client-combobox";
import Step from "../../../../../../components/assistant/components/step";

export default function StepSelectClient({
  onContinue,
  onStepBackward,
  selectedClientId,
  onSelectClient,
}: {
  onContinue: () => void;
  onStepBackward: () => void;
  selectedClientId: string | undefined;
  onSelectClient: (clientId: string | undefined) => void;
}) {
  return (
    <Step
      title="First, which client are these tags for?"
      subtitle="Select a client to continue."
      onStepBackward={onStepBackward}
      onContinue={onContinue}
      continueDisabled={!selectedClientId}
      className="max-w-sm"
    >
      <ClientCombobox
        value={selectedClientId}
        onValueChange={onSelectClient}
        className="w-full"
        viewContext="admin"
      />
    </Step>
  );
}

StepSelectClient.StepId = "select-client";
