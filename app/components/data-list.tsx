import type { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";

interface DataListProps {
  details: { label: string; value: ReactNode | undefined | null }[];
}

export default function DataList({ details }: DataListProps) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {details.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className="text-muted-foreground text-sm">{label}</dt>
          <dd className="text-sm">{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
