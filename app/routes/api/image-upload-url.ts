import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createId } from "@paralleldrive/cuid2";
import {
  AWS_PUBLIC_BUCKET,
  AWS_PUBLIC_CDN_URL,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  AWS_UPLOAD_PUBLIC_S3_ACCESS_KEY_ID,
} from "~/.server/config";
import { requireUserSession } from "~/.server/sessions";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/image-upload-url";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);

  const keyStart = getSearchParam(request, "key") ?? "";
  let ext: string | undefined;
  let rest: string[] = [];
  if (keyStart.includes(".")) {
    [ext, ...rest] = keyStart.split(".").reverse();
  }
  const key = `${rest.join("_")}_${createId()}${ext ? `.${ext}` : ""}`.replace(
    /^\/+/,
    ""
  );

  const keyWithPrefix = `uploads/${key}`;
  const putUrl = await getSignedUrl(
    new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_UPLOAD_PUBLIC_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    }),
    new PutObjectCommand({
      Bucket: AWS_PUBLIC_BUCKET,
      Key: keyWithPrefix,
    })
  );

  const getUrl = `${AWS_PUBLIC_CDN_URL}/${keyWithPrefix}`;

  return Response.json({ putUrl, getUrl });
}
