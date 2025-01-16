import type { z } from "zod";
import { api } from "~/.server/api";
import {
  resolveAlertSchemaResolver,
  type resolveAlertSchema,
} from "~/lib/schema";
import { getValidatedFormDataOrThrow, validateParams } from "~/lib/utils";
import type { Route } from "./+types/resolve";

export async function action({ request, params }: Route.ActionArgs) {
  const { assetId, id } = validateParams(params, ["assetId", "id"]);

  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof resolveAlertSchema>
  >(request, resolveAlertSchemaResolver);

  return api.assets.alerts(assetId).resolve(request, id, data);
}
