import { ScrollText } from "lucide-react";
import { Link } from "react-router";
import type { AssetQuestion } from "~/lib/models";

export default function AssetQuestionRegulatoryCodesDisplay({
  regulatoryCodes,
}: {
  regulatoryCodes: AssetQuestion["regulatoryCodes"] | undefined | null;
}) {
  return regulatoryCodes && regulatoryCodes.length > 0 ? (
    <div className="text-muted-foreground flex items-center gap-1.5 py-1 text-xs">
      <ScrollText className="size-4" />
      {regulatoryCodes.map((rc, idx) => (
        <div key={rc.id} title={rc.title}>
          {rc.sourceUrl ? (
            <Link
              to={rc.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              <RegulatoryCodeDisplay regulatoryCode={rc} />
            </Link>
          ) : (
            <RegulatoryCodeDisplay regulatoryCode={rc} />
          )}
          {idx < regulatoryCodes.length - 1 && <span>,</span>}
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
  return (
    <div>
      <span>
        {regulatoryCode.governingBody}: {regulatoryCode.codeIdentifier}
      </span>
    </div>
  );
}
