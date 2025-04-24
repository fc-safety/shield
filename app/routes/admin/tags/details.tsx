import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Nfc, Pencil } from "lucide-react";
import { type UIMatch } from "react-router";
import { api } from "~/.server/api";
import EditTagButton from "~/components/assets/edit-tag-button";
import { CopyableText } from "~/components/copyable-text";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.serialNumber || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  return api.tags.get(request, id);
};

export default function ProductDetails({
  loaderData: tag,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>
            <Nfc />
            <div className="inline-flex items-center gap-4">
              Tag Details
              <div className="flex gap-2">
                <EditTagButton
                  tag={tag}
                  trigger={
                    <Button variant="secondary" size="icon" type="button">
                      <Pencil />
                    </Button>
                  }
                  viewContext="admin"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
          <div className="grid gap-4">
            <Label>Properties</Label>
            <DataList
              details={[
                {
                  label: "Serial No.",
                  value: <CopyableText text={tag.serialNumber} />,
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
          <div className="grid gap-4">
            <Label>Assignment</Label>
            <DataList
              details={[
                {
                  label: "Assigned Asset",
                  value: tag.asset?.name,
                },
                {
                  label: "Setup On",
                  value:
                    tag.asset?.setupOn && format(tag.asset.setupOn, "PPpp"),
                },
                {
                  label: "Assigned Client",
                  value: tag.client?.name,
                },
                {
                  label: "Assigned Site",
                  value: tag.site?.name,
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
          <div className="grid gap-4">
            <Label>Other</Label>
            <DataList
              details={[
                {
                  label: "Created",
                  value: format(tag.createdOn, "PPpp"),
                },
                {
                  label: "Last Updated",
                  value: format(tag.modifiedOn, "PPpp"),
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="h-max">
        <CardHeader>
          <CardTitle>...</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
