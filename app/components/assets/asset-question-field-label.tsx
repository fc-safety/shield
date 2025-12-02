import type { AssetQuestion } from "~/lib/models";
import { RequiredFieldIndicator } from "../required-fields";
import { FieldDescription, FieldLabel } from "../ui/field";
import AssetQuestionFilesDisplay from "./asset-question-files-display";
import AssetQuestionRegulatoryCodesDisplay from "./asset-question-regulatory-codes-display";

export default function AssetQuestionFieldLabel({
  index,
  question,
}: {
  index?: number;
  question: AssetQuestion;
}) {
  return (
    <div>
      <FieldLabel>
        {index !== undefined && `${index + 1}. `}
        {question?.prompt}
        {question?.required && <RequiredFieldIndicator />}
      </FieldLabel>
      {question?.helpText && <FieldDescription>{question?.helpText}</FieldDescription>}
      <AssetQuestionRegulatoryCodesDisplay regulatoryCodes={question?.regulatoryCodes} />
      <AssetQuestionFilesDisplay files={question?.files} />
    </div>
  );
}
