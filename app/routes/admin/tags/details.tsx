import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import TagDetailsForm from "~/components/assets/tag-details-form";
import { updateTagSchema, updateTagSchemaResolver } from "~/lib/schema";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs) => ({
    label: data.serialNumber || "Details",
  }),
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Tag ID", { status: 400 });
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateTagSchema>
    >(request, updateTagSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return api.tags.update(request, id, data);
  } else if (request.method === "DELETE") {
    const { init } = await api.tags.delete(request, id);
    return redirect("/admin/tags/", init ?? undefined);
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Tag ID", { status: 400 });
  }

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
