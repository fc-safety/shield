import { Copy } from "lucide-react";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export default function DisplayTagWriteData({ data }: { data: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w-full h-9 relative">
      <pre className="h-9 w-full text-xs overflow-x-auto flex items-center">
        {data}
      </pre>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-0 top-0"
        onClick={() => {
          setCopied(true);
          navigator.clipboard.writeText(data);
          setTimeout(() => {
            setCopied(false);
          }, 10000);
        }}
      >
        {copied ? <Check className="text-primary" /> : <Copy />}
      </Button>
    </div>
  );
}
