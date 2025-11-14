import { Boxes } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "../ui/card";

import type { Site } from "~/lib/models";
import { Card } from "../ui/card";
import ClientSiteGroupsTable from "./client-site-groups-table";

export default function ClientSiteGroupCard({
  siteGroups,
  clientId,
  buildToSiteGroup = (id: string) => "sites/" + id,
}: {
  siteGroups: Site[];
  clientId: string;
  buildToSiteGroup?: (id: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Boxes /> Site groups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClientSiteGroupsTable
          siteGroups={siteGroups}
          clientId={clientId}
          buildToSiteGroup={buildToSiteGroup}
        />
      </CardContent>
    </Card>
  );
}
