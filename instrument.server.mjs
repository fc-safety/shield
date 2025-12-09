import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "https://3777873f1c2a579e81d65dba1b8c6efe@o4510505981116416.ingest.us.sentry.io/4510505984589824",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  environment: process.env.SENTRY_ENVIRONMENT ?? "local",
});
