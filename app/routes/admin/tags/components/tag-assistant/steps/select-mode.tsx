import { ExternalLink, Factory, SquarePlus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function StepSelectMode({
  onSelectMode,
}: {
  onSelectMode: (mode: "single" | "bulk") => void;
}) {
  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center gap-4">
      <div>
        <h3 className="text-lg font-bold">
          How do you want to program the tags?
        </h3>
        <h4 className="text-center text-base text-muted-foreground">
          Choose an option to begin.
        </h4>
      </div>
      <Button onClick={() => onSelectMode("single")}>
        <SquarePlus /> One at a time
      </Button>
      <Button onClick={() => onSelectMode("bulk")}>
        <Factory />
        In batches
      </Button>
      <p className="text-xs text-muted-foreground italic text-center">
        Tip: Make sure you have your NFC writer setup and ready to go before you
        start.{" "}
        <Link
          to="/docs/writing-nfc-tags"
          className="text-primary underline"
          target="_blank"
          rel="noreferrer"
        >
          Learn more here.
          <ExternalLink className="size-3 inline" />
        </Link>
      </p>
    </div>
  );
}

StepSelectMode.StepId = "select-mode";
