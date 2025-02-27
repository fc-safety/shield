import { z } from "zod";

const configSchema = z.object({
  // General
  APP_HOST: z.string(),

  // Authentication
  CLIENT_ID: z.string(),
  CLIENT_SECRET: z.string(),
  ISSUER_URL: z.string(),
  USERINFO_URL: z.string(),
  LOGOUT_URL: z.string(),
  REDIRECT_URL: z.string(),
  SESSION_SECRET: z.string(),

  // API
  API_BASE_URL: z.string().transform((value) => value.replace(/\/+$/, "")),

  // Cookies
  COOKIE_SECRET: z.string(),

  // Address Support
  ZIPCODESTACK_API_KEY: z.string(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string(),

  // AWS
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_ACCESS_KEY_SECRET: z.string(),
  AWS_REGION: z.string(),
  AWS_PUBLIC_BUCKET: z.string(),
  AWS_PUBLIC_CDN_URL: z.string(),
  AWS_PRIVATE_BUCKET: z.string(),
  AWS_PRIVATE_CDN_URL: z.string(),
  AWS_PRIVATE_CDN_KEY_PAIR_ID: z.string(),
  AWS_PRIVATE_CDN_PRIVATE_KEY: z.string(),
  AWS_PRIVATE_OBJECT_EXPIRATION_SECONDS: z.coerce.number().default(60 * 60),
});

export const config = configSchema.parse(process.env);
