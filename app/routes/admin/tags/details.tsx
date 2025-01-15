import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import TagDetailsForm from "~/components/assets/tag-details-form";
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
          <CardTitle>Tag Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TagDetailsForm tag={tag} />
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
