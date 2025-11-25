import { Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type z from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { updateAssetQuestionSchema } from "~/lib/schema";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "selectOptions">;

export default function SelectOptionsInput() {
  const { control } = useFormContext<TForm>();
  const { fields, append, remove, update } = useFieldArray({
    name: "selectOptions",
    control,
  });

  const initialFieldAdded = useRef(false);
  useEffect(() => {
    if (!initialFieldAdded.current && fields.length === 0) {
      append({ value: "", label: "" });
      initialFieldAdded.current = true;
    }
  }, [fields.length]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {fields.map((field, idx) => (
        <div key={idx} className="relative">
          <Input
            value={field.value ?? ""}
            onChange={(e) => update(idx, { ...field, value: e.target.value })}
            className="pr-8"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-0.5 -translate-y-1/2"
            onClick={() => remove(idx)}
            type="button"
            disabled={fields.length === 1}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => append({ value: "", label: "" })}
        type="button"
      >
        <Plus />
      </Button>
    </div>
  );
}
