import { format, isValid, parseISO } from "date-fns";
import { responseValueImageSchema } from "~/lib/schema";
import type { ResponseValueImage } from "~/lib/types";
import PreviewInspectionImages from "./preview-inspection-images";

export default function DisplayInspectionValue({
  value,
}: {
  value: string | number | ResponseValueImage;
}) {
  return isImageValue(value) ? (
    <PreviewInspectionImages urls={value.urls} dense />
  ) : isDateValue(value) ? (
    format(parseISO(value), "PPpp")
  ) : isNumberValue(value) ? (
    value
  ) : (
    value
  );
}

const isImageValue = (
  value: string | number | ResponseValueImage
): value is ResponseValueImage => {
  return responseValueImageSchema.safeParse(value).success;
};

const isDateValue = (
  value: string | number | ResponseValueImage
): value is string => {
  return isStringValue(value) && isValid(parseISO(value));
};

const isNumberValue = (
  value: string | number | ResponseValueImage
): value is number => {
  return typeof value === "number";
};

const isStringValue = (
  value: string | number | ResponseValueImage
): value is string => {
  return typeof value === "string";
};
