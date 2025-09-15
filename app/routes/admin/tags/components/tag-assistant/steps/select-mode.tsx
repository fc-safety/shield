import { ExternalLink, Factory, SquarePlus } from "lucide-react";
import { Link } from "react-router";
import OptionButton from "../../../../../../components/assistant/components/option-button";
import Step from "../../../../../../components/assistant/components/step";
import type { Mode } from "../types/core";

export default function StepSelectMode({ onSelectMode }: { onSelectMode: (mode: Mode) => void }) {
  return (
    <Step
      title="How do you want to start?"
      subtitle="Choose an option to begin."
      className="max-w-sm"
    >
      <OptionButton onClick={() => onSelectMode("preprogram-single")}>
        <SquarePlus /> Pre-program one tag at a time
      </OptionButton>
      <OptionButton onClick={() => onSelectMode("preprogram-batch")}>
        <Factory />
        Pre-program tags in batches
      </OptionButton>
      {/* TODO: Finish adding batch register mode */}
      {/* <OptionButton onClick={() => onSelectMode("batch-register")}>
        <FileSpreadsheet />
        Register tags from a batch file
      </OptionButton> */}
      <p className="text-muted-foreground text-center text-xs italic">
        Tip: Make sure you have your NFC writer setup and ready to go before you start.{" "}
        <Link
          to="/docs/writing-nfc-tags"
          className="text-primary underline"
          target="_blank"
          rel="noreferrer"
        >
          Learn more here.
          <ExternalLink className="inline size-3" />
        </Link>
      </p>
    </Step>
  );
}

StepSelectMode.StepId = "select-mode";
