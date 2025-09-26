import { Link2, ScrollText } from "lucide-react";
import { Link } from "react-router";
import type { AssetQuestion } from "~/lib/models";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

export default function AssetQuestionRegulatoryCodesDisplay({
  regulatoryCodes,
}: {
  regulatoryCodes: AssetQuestion["regulatoryCodes"] | undefined | null;
}) {
  return regulatoryCodes && regulatoryCodes.length > 0 ? (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      <ScrollText className="text-muted-foreground size-4 shrink-0" />
      {regulatoryCodes.map((rc, idx) => (
        <div key={rc.id} title={rc.title}>
          <RegulatoryCodeDisplay regulatoryCode={rc} />
          {idx < regulatoryCodes.length - 1 && (
            <span className="text-muted-foreground text-xs">;</span>
          )}
        </div>
      ))}
    </div>
  ) : null;
}

function RegulatoryCodeDisplay({
  regulatoryCode,
}: {
  regulatoryCode: NonNullable<AssetQuestion["regulatoryCodes"]>[number];
}) {
  const displayText = (
    <div className="text-muted-foreground inline-block text-xs">
      <span className="border-border text-2xs rounded-sm border px-1 py-0.5 font-bold">
        {regulatoryCode.governingBody}
      </span>{" "}
      {regulatoryCode.codeIdentifier}
      {regulatoryCode.section && (
        <span className="text-muted-foreground ml-1">({regulatoryCode.section})</span>
      )}
    </div>
  );

  if (regulatoryCode.title) {
    return (
      <HoverCard>
        <HoverCardTrigger>{displayText}</HoverCardTrigger>
        <HoverCardContent>
          {regulatoryCode.sourceUrl ? (
            <Button variant="link" asChild>
              <Link to={regulatoryCode.sourceUrl} target="_blank" rel="noopener noreferrer">
                {regulatoryCode.title}
                <Link2 />
              </Link>
            </Button>
          ) : (
            <h4 className="text-sm">{regulatoryCode.title}</h4>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return displayText;
}
