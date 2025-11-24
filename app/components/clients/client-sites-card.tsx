import { Warehouse } from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SitesTable from "./sites-table";

export default function ClientSitesCard({
  sitesTotalCount,
  title = "Sites",
  buildToSite = (id: string) => "sites/" + id,
  ...props
}: Omit<ComponentProps<typeof SitesTable>, "buildToSite"> & {
  sitesTotalCount?: number;
  title?: string;
  buildToSite?: (id: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Warehouse />
          {title}
          <Badge>{sitesTotalCount ?? props.sites.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SitesTable {...props} buildToSite={buildToSite} />
      </CardContent>
    </Card>
  );
}
