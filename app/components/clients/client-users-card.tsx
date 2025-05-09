import { Users } from "lucide-react";
import type { ComponentProps } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import ClientUsersTable from "./client-users-table";

export default function ClientUsersCard({
  ...props
}: ComponentProps<typeof ClientUsersTable>) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>
          <Users /> Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClientUsersTable {...props} />
      </CardContent>
    </Card>
  );
}
