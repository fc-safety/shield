import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export default function LinkPreview({ url, className }: LinkPreviewProps) {
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<{
    title: string;
    description: string;
    image: string;
    favicon: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    fetch(`/api/link-preview-metadata?url=${encodeURIComponent(url)}`)
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{
              title: string;
              description: string;
              image: string;
              favicon: string;
            }>)
          : null
      )
      .then(setMetadata);
  }, [url, open]);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={300}>
      <HoverCardTrigger className={className}>{url}</HoverCardTrigger>
      <HoverCardContent>
        {metadata ? (
          <div className="space-y-2">
            <Link
              to={url}
              className="hover:underline flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {metadata.favicon && (
                <img
                  src={metadata.favicon}
                  alt={""}
                  className="size-5 rounded p-0.5"
                />
              )}
              <h4>{metadata.title || url}</h4>
            </Link>
            <div className="text-xs text-muted-foreground pb-4">
              {metadata.description || <>&mdash;</>}
            </div>
            {metadata.image && (
              <img
                src={metadata.image}
                alt="Link preview"
                className="rounded"
              />
            )}
            <div className="text-xs text-muted-foreground">{url}</div>
          </div>
        ) : (
          <Loader2 className="animate-spin" />
        )}
        {/* <Button variant="link" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            Visit {url}
          </a>
        </Button> */}
      </HoverCardContent>
    </HoverCard>
  );
}
