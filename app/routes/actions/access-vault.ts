import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { addSeconds } from "date-fns";
import { redirect } from "react-router";
import { api } from "~/.server/api";
import { config } from "~/.server/config";
import { buildUrl } from "~/lib/urls";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/access-vault";

export async function loader({ request, params }: Route.LoaderArgs) {
  const key = validateParam(params, "*");
  const vaultOwnershipRecord = await api.vaultOwnerships.getByKey(request, key);

  if (!vaultOwnershipRecord) {
    throw new Response("Not found", { status: 404 });
  }

  const rawUrl = buildUrl(key, config.AWS_PRIVATE_CDN_URL).toString();
  const signedUrl = getSignedUrl({
    url: rawUrl,
    keyPairId: config.AWS_PRIVATE_CDN_KEY_PAIR_ID,
    privateKey: config.AWS_PRIVATE_CDN_PRIVATE_KEY,
    dateLessThan: getExpirationDate(
      config.AWS_PRIVATE_OBJECT_EXPIRATION_SECONDS
    ).toISOString(),
  });

  return redirect(signedUrl);
}

const getExpirationDate = (seconds: number) => {
  return addSeconds(new Date(), seconds);
};
