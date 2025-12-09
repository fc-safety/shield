import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter, type SentryReactRouterBuildOptions } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "example-org",
  project: "example-project",
  // An auth token is required for uploading source maps;
  // store it in an environment variable to keep it secure.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // ...
};

export default defineConfig((config) => ({
  plugins: [
    // reactRouterDevTools(),
    reactRouter(),
    sentryReactRouter(sentryConfig, config),
    tsconfigPaths(),
    tailwindcss(),
  ],
  build: {
    assetsDir: "_assets",
  },
}));
