import type { AssetQuestion } from "~/lib/models";
import { FormDescription, FormLabel } from "../ui/form";
import AssetQuestionFilesDisplay from "./asset-question-files-display";
import AssetQuestionRegulatoryCodesDisplay from "./asset-question-regulatory-codes-display";

export default function AssetQuestionFormInputLabel({ question }: { question: AssetQuestion }) {
  return (
    <div>
      <FormLabel>
        {question?.prompt}
        {question?.required && " *"}
      </FormLabel>
      {question?.helpText && <FormDescription>{question?.helpText}</FormDescription>}
      <AssetQuestionRegulatoryCodesDisplay regulatoryCodes={question?.regulatoryCodes} />
      <AssetQuestionFilesDisplay files={question?.files} />
    </div>
  );
}
