import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createId } from "@paralleldrive/cuid2";
import { api } from "~/.server/api";
import { config } from "~/.server/config";
import { requireUserSession } from "~/.server/sessions";
import { buildUrl } from "~/lib/urls";
import { getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/image-upload-url";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
  const searchParams = getSearchParams(request);

  const keyStart = searchParams.get("key") ?? "";
  const isPublic = searchParams.get("public") !== null;

  const internalPrefix = "uploads/";

  const key = `${internalPrefix}${uniquifyKey(keyStart)}`;

  if (!isPublic) {
    // If is private, store ownership information in the database.
    await api.vaultOwnerships.create(request, {
      key,
    });
  }

  const putUrl = await getSignedUrl(
    new S3Client({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_ACCESS_KEY_SECRET,
      },
    }),
    new PutObjectCommand({
      Bucket: isPublic ? config.AWS_PUBLIC_BUCKET : config.AWS_PRIVATE_BUCKET,
      Key: key,
    })
  );

  // Public files can be accessed directly from the CDN, but private files
  // need to be accessed via the vault ownership endpoint.
  const getUrl = isPublic
    ? `${config.AWS_PUBLIC_CDN_URL}/${key}`
    : buildUrl(
        `/action/access-vault/${encodeURIComponent(key)}`,
        config.APP_HOST
      );

  return Response.json({ putUrl, getUrl });
}

const uniquifyKey = (keyStart: string) => {
  let ext: string | undefined;
  let rest: string[] = [];
  if (keyStart.includes(".")) {
    [ext, ...rest] = keyStart.split(".").reverse();
  }
  return `${rest.join("_")}_${createId()}${ext ? `.${ext}` : ""}`.replace(
    /^\/+/,
    ""
  );
};
