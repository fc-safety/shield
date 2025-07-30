import { format, isValid, parseISO } from "date-fns";
import { responseValueImageSchema } from "~/lib/schema";
import type { ResponseValueImage } from "~/lib/types";
import { isNil } from "~/lib/utils";
import PreviewInspectionImages from "./preview-inspection-images";

export default function DisplayInspectionValue({
  value,
}: {
  value: null | boolean | string | number | ResponseValueImage;
}) {
  return isNil(value) ? (
    "N/A"
  ) : isBooleanValue(value) ? (
    value ? (
      "Yes"
    ) : (
      "No"
    )
  ) : isImageValue(value) ? (
    <PreviewInspectionImages urls={value.urls} dense />
  ) : isStringValue(value) ? (
    isDateValue(value) ? (
      format(parseISO(value), "PP")
    ) : (
      (value ?? <>&mdash;</>)
    )
  ) : isNumberValue(value) ? (
    value
  ) : (
    (value ?? <>&mdash;</>)
  );
}

const isBooleanValue = (
  value: boolean | string | number | ResponseValueImage
): value is boolean => {
  return typeof value === "boolean";
};

const isImageValue = (value: string | number | ResponseValueImage): value is ResponseValueImage => {
  return responseValueImageSchema.safeParse(value).success;
};

const isDateValue = (value: string | number | ResponseValueImage) => {
  return isStringValue(value) && isValid(parseISO(value));
};

const isNumberValue = (value: string | number | ResponseValueImage): value is number => {
  return typeof value === "number";
};

const isStringValue = (value: string | number | ResponseValueImage): value is string => {
  return typeof value === "string";
};
