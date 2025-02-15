import { format, formatDistanceToNow } from "date-fns";

export default function DisplayRelativeDate({ date }: { date: string }) {
  return (
    <span title={format(date, "PPpp")}>
      {formatDistanceToNow(date, { addSuffix: true, includeSeconds: true })}
    </span>
  );
}
