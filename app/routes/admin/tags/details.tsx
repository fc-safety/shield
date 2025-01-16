import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import EditTagButton from "~/components/assets/edit-tag-button";
import { CopyableText } from "~/components/copyable-text";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { updateTagSchema, updateTagSchemaResolver } from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  getValidatedFormDataOrThrow,
  validateParam,
} from "~/lib/utils";
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

export const action = async ({ request, params }: Route.ActionArgs) => {
  const id = validateParam(params, "id");

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateTagSchema>
    >(request, updateTagSchemaResolver);

    return api.tags.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.tags.deleteAndRedirect(request, id, "/admin/tags");
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  return api.tags.get(request, id);
};

export default function ProductDetails({
  loaderData: tag,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>
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
