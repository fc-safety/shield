import crypto from "crypto";
import { config } from "~/.server/config";

export const buildImageProxyUrl = (
  sourceUrl: string,
  processingOptions: string[]
) => {
  const KEY = config.IMAGE_PROCESSING_KEY;
  const SALT = config.IMAGE_PROCESSING_SALT;

  const encodedSourceUrl = encodeSourceUrl(sourceUrl);
  const path = `/${processingOptions.join("/")}/${encodedSourceUrl}`;
  const signature = sign(SALT, path, KEY);

  const url = new URL(`/${signature}${path}`, config.IMAGE_PROCESSING_CDN_HOST);

  return url.toString();
};

const hexDecode = (hex: string) => Buffer.from(hex, "hex");

const sign = (SALT: string, target: string, KEY: string) => {
  return crypto
    .createHmac("sha256", hexDecode(KEY))
    .update(hexDecode(SALT))
    .update(target)
    .digest("base64url");
};

const encodeSourceUrl = (sourceUrl: string) => {
  const ext = sourceUrl.split(".").pop();
  const encodedUrl = Buffer.from(sourceUrl)
    .toString("base64url")
    .match(/.{1,16}/g)
    ?.join("/");
  return `${encodedUrl}.${ext}`;
};
