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
    <div>
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <dl className="grid grid-cols-2 gap-2">
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
