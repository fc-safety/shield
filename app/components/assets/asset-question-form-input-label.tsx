import type { AssetQuestion } from "~/lib/models";
import { RequiredFieldIndicator } from "../required-fields";
import { FormDescription, FormLabel } from "../ui/form";
import AssetQuestionFilesDisplay from "./asset-question-files-display";
import AssetQuestionRegulatoryCodesDisplay from "./asset-question-regulatory-codes-display";

export default function AssetQuestionFormInputLabel({
  index,
  question,
}: {
  index?: number;
  question: AssetQuestion;
}) {
  return (
    <div>
      <FormLabel>
        {index !== undefined && `${index + 1}. `}
        {question?.prompt}
        {question?.required && <RequiredFieldIndicator />}
      </FormLabel>
      {question?.helpText && <FormDescription>{question?.helpText}</FormDescription>}
      <AssetQuestionRegulatoryCodesDisplay regulatoryCodes={question?.regulatoryCodes} />
      <AssetQuestionFilesDisplay files={question?.files} />
    </div>
  );
}
