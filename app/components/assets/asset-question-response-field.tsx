import type { ComponentProps } from "react";
import type { AssetQuestion } from "~/lib/models";
import AssetQuestionResponseTypeInput from "./asset-question-response-input";

export default function AssetQuestionResponseField({
  question,
  value,
  onValueChange,
  onBlur,
  disabled,
}: { question: AssetQuestion } & Pick<
  ComponentProps<typeof AssetQuestionResponseTypeInput>,
  "value" | "onValueChange" | "onBlur" | "disabled"
>) {
  return (
    <AssetQuestionResponseTypeInput
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      valueType={question.valueType}
      tone={question.tone ?? undefined}
      options={question.selectOptions ?? undefined}
      placeholder={question.placeholder}
      disabled={disabled}
    />
  );
}
