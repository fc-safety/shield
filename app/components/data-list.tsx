import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";

interface DataListProps {
  title?: string;
  details: { label: ReactNode; value: ReactNode | undefined | null }[];
  defaultValue?: React.ReactNode;
}

export default function DataList({
  title,
  details,
  defaultValue = "",
}: DataListProps) {
  return (
    <div className="grid gap-4">
      {title && <Label>{title}</Label>}
      <dl className="grid grid-cols-2 gap-y-1 gap-x-2">
        {details.map(({ label, value }) => (
          <Fragment key={String(label)}>
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-sm">{value || defaultValue}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
