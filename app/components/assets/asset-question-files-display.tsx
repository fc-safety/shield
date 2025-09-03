import { ExternalLink, File } from "lucide-react";
import { Link } from "react-router";
import { Fragment } from "react/jsx-runtime";
import type { AssetQuestion } from "~/lib/models";

export default function AssetQuestionFilesDisplay({
  files,
}: {
  files: AssetQuestion["files"] | undefined | null;
}) {
  return files && files.length > 0 ? (
    <div className="text-muted-foreground grid grid-cols-[auto_1fr] items-center gap-1.5 py-1">
      {files.map((f) => (
        <Fragment key={f.id}>
          <File className="size-4" />
          <Link
            to={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex cursor-pointer items-center gap-1 text-sm font-light hover:underline"
          >
            {f.name}
            <ExternalLink className="size-3" />
          </Link>
        </Fragment>
      ))}
    </div>
  ) : null;
}
