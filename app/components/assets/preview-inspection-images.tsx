import { Trash } from "lucide-react";
import { useOpenData } from "~/hooks/use-open-data";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export default function PreviewInspectionImages({
  urls,
  onRemove,
  dense,
}: {
  urls: string[];
  onRemove?: (idx: number) => void;
  dense?: boolean;
}) {
  const previewImage = useOpenData<string>();

  return (
    <>
      <div className="grid gap-2">
        {urls.map((url, idx) => (
          <div key={url} className="flex items-center gap-2 text-sm">
            {!dense && (
              <>
                <div className="font-semibold">Upload {idx + 1}</div>
                <div className="flex-1"></div>
                <div className="italic">{url.split(/(\/|(%2F))/g).pop()}</div>
              </>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => previewImage.openData(url)}
            >
              Preview {dense && `#${idx + 1}`}
            </Button>
            {onRemove && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={() => onRemove(idx)}
              >
                <Trash />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Dialog open={previewImage.open} onOpenChange={previewImage.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <img
            src={previewImage.data ?? ""}
            alt="Preview"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
