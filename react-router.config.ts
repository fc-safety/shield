import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  future: {
    v8_middleware: true, // 👈 Enable middleware
  },
  ssr: true,
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    // ...
    // Call this at the end of the hook
    +(await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest }));
  },
} satisfies Config;
