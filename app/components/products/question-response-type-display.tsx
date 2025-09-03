import { Calendar, Check, ChevronDown, Hash, Image, Text, TextCursorInput, X } from "lucide-react";
import { RESPONSE_TYPE_LABELS } from "~/lib/asset-questions/constants";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import type { AssetQuestionResponseType } from "~/lib/models";
import { cn } from "~/lib/utils";

export default function QuestionResponseTypeDisplay({
  valueType,
  tone,
}: {
  valueType: AssetQuestionResponseType;
  tone?: string | null;
}) {
  const isNegativeTone = tone === ASSET_QUESTION_TONES.NEGATIVE;
  const isPositiveTone = tone === ASSET_QUESTION_TONES.POSITIVE;

  return valueType === "BINARY" || valueType === "INDETERMINATE_BINARY" ? (
    <span className="flex items-center gap-1 text-xs">
      <span
        className={cn("inline-flex items-end gap-0.5", {
          "text-primary": isPositiveTone,
          "text-destructive": isNegativeTone,
        })}
      >
        {isPositiveTone && <Check className="inline-block size-3.5" />}
        {isNegativeTone && <X className="inline-block size-3.5" />}
        Yes
      </span>
      <span className="text-muted-foreground">/</span>
      <span
        className={cn("inline-flex items-end gap-0.5", {
          "text-primary": isNegativeTone,
          "text-destructive": isPositiveTone,
        })}
      >
        {isNegativeTone && <Check className="inline-block size-3.5" />}
        {isPositiveTone && <X className="inline-block size-3.5" />}
        No
      </span>
      {valueType === "INDETERMINATE_BINARY" && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground shrink-0">N/A</span>
        </>
      )}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs">
      {valueType === "DATE" ? (
        <Calendar className="inline-block size-3.5" />
      ) : valueType === "TEXT" ? (
        <TextCursorInput className="inline-block size-3.5" />
      ) : valueType === "TEXTAREA" ? (
        <Text className="inline-block size-3.5" />
      ) : valueType === "NUMBER" ? (
        <Hash className="inline-block size-3.5" />
      ) : valueType === "IMAGE" ? (
        <Image className="inline-block size-3.5" />
      ) : valueType === "SELECT" ? (
        <ChevronDown className="inline-block size-3.5" />
      ) : null}
      <span className="capitalize">{RESPONSE_TYPE_LABELS[valueType]}</span>
    </span>
  );
}
