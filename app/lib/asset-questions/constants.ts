import type { AssetQuestionResponseType } from "../models";

export const RESPONSE_TYPE_LABELS: Record<AssetQuestionResponseType, string> = {
  BINARY: "Yes / No",
  INDETERMINATE_BINARY: "Yes / No / N/A",
  TEXT: "Text",
  TEXTAREA: "Multiline Text",
  SELECT: "Dropdown",
  DATE: "Date",
  NUMBER: "Number",
  IMAGE: "Image",
};
