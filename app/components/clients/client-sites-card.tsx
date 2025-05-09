import { Warehouse } from "lucide-react";
import type { ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SitesTable from "./sites-table";

export default function ClientSitesCard({
  title = "Sites",
  buildToSite = (id: string) => "sites/" + id,
  ...props
}: Omit<ComponentProps<typeof SitesTable>, "buildToSite"> & {
  title?: string;
  buildToSite?: (id: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Warehouse />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SitesTable {...props} buildToSite={buildToSite} />
      </CardContent>
    </Card>
  );
}
