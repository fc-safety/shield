import { Users } from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import ClientUsersTable from "./client-users-table";

export default function ClientUsersCard({
  usersTotalCount,
  ...props
}: ComponentProps<typeof ClientUsersTable> & { usersTotalCount?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Users /> Users <Badge>{usersTotalCount ?? props.users.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClientUsersTable {...props} />
      </CardContent>
    </Card>
  );
}
