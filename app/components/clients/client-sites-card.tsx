import { Warehouse } from "lucide-react";
import type { Site } from "~/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SitesTable from "./sites-table";

export default function ClientSitesCard({
  sites,
  clientId,
}: {
  sites: Site[];
  clientId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Warehouse /> Sites
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SitesTable
          sites={sites}
          clientId={clientId}
          buildToSite={(id) => "sites/" + id}
        />
      </CardContent>
    </Card>
  );
}
