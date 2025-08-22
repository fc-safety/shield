import { index, layout, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  // Health routes
  route("health", "./routes/health.tsx"),

  // Legacy user routes
  route("legacy-redirect", "./routes/legacy-redirect.tsx"),

  // Auth Routes
  route("login", "./routes/auth/login.tsx"),
  route("logout", "./routes/auth/logout.tsx"),
  route("callback", "./routes/auth/callback.tsx"),

  // Read tag routes
  ...prefix("tag", [index("./routes/read-tag/index.tsx")]),

  // Inspect routes
  route("inspect", "./routes/inspect/layout.tsx", [
    index("./routes/inspect/index.tsx"),
    route("setup", "./routes/inspect/setup.tsx"),
    route("next", "./routes/inspect/next.tsx"),
    route("routes", "./routes/inspect/routes.tsx"),
    route("register", "./routes/inspect/register.tsx"),
    route("clear-demo-inspections", "./routes/inspect/clear-demo-inspections.tsx"),

    // User routes
    route("account", "./routes/inspect/account.tsx"),

    // Support routes
    // TODO

    route("*", "./routes/inspect/404.tsx"),
  ]),

  route("public-inspect", "./routes/inspect-public/layout.tsx", [
    index("./routes/inspect-public/index.tsx"),
    route("login", "./routes/inspect-public/login.tsx"),
    route("history", "./routes/inspect-public/history.tsx"),
  ]),

  // Action Routes
  ...prefix("action", [
    route("set-theme", "./routes/actions/set-theme.ts"),
    route("refresh-auth", "./routes/actions/refresh-auth.ts"),
    route("access-vault/*", "./routes/actions/access-vault.ts"),
    route("set-app-state", "./routes/actions/set-app-state.ts"),
  ]),

  // API Routes
  ...prefix("api", [
    route("query-zip/:zip", "./routes/api/query-zip.ts"),
    route("link-preview-metadata", "./routes/api/link-preview-metadata.ts"),
    route("product-categories", "./routes/api/product-categories.ts"),
    route("manufacturers", "./routes/api/manufacturers.ts"),
    route("inspections/:id", "./routes/api/inspections.ts"),
    route("proxy/*", "./routes/api/proxy.ts"),
    route("image-upload-url", "./routes/api/image-upload-url.ts"),
    route("image-proxy-url", "./routes/api/image-proxy-url.ts"),
  ]),

  // App Routes
  layout("./routes/layout.tsx", [
    index("./routes/index.tsx"),
    route("command-center", "./routes/command-center.tsx"),
    route("dashboard", "./routes/dashboard.tsx"),
    route("assets", "./routes/assets/layout.tsx", [
      index("./routes/assets/index.tsx"),
      route(":id", "./routes/assets/details.tsx"),
    ]),
    route("inspection-routes", "./routes/inspection-routes.tsx"),
    route("reports", "./routes/reports/layout.tsx", [
      index("./routes/reports/index.tsx"),
      // route("build/:id?", "./routes/reports/build.tsx"),
      route(":id", "./routes/reports/details.tsx"),
    ]),
    route("my-organization", "./routes/my-organization/layout.tsx", [
      index("./routes/my-organization/index.tsx"),
      route("sites/:id", "./routes/my-organization/site-details.tsx"),
    ]),

    // Product Routes
    route("products", "./routes/products/layout.tsx", [
      index("./routes/products/index.tsx"),
      route("all", "./routes/products/all-products/layout.tsx", [
        index("./routes/products/all-products/index.tsx"),
        route(":id", "./routes/products/all-products/details.tsx"),
      ]),
      route("categories", "./routes/products/categories/layout.tsx", [
        index("./routes/products/categories/index.tsx"),
        route(":id", "./routes/products/categories/details.tsx"),
      ]),
      route("manufacturers", "./routes/products/manufacturers/layout.tsx", [
        index("./routes/products/manufacturers/index.tsx"),
        route(":id", "./routes/products/manufacturers/details.tsx"),
      ]),
      route("questions", "./routes/products/questions/layout.tsx", [
        index("./routes/products/questions/index.tsx"),
      ]),
    ]),

    // Admin Routes
    route("admin", "./routes/admin/layout.tsx", [
      index("./routes/admin/index.tsx"),
      route("clients", "./routes/admin/clients/layout.tsx", [
        index("./routes/admin/clients/index.tsx"),
        route(":id", "./routes/admin/clients/details/layout.tsx", [
          index("./routes/admin/clients/details/index.tsx"),
          route("sites/:siteId", "./routes/admin/clients/details/site-details.tsx"),
        ]),
      ]),
      route("product-requests", "./routes/admin/product-requests/layout.tsx", [
        index("./routes/admin/product-requests/index.tsx"),
        route(":id", "./routes/admin/product-requests/details.tsx"),
      ]),
      route("tags", "./routes/admin/tags/layout.tsx", [
        index("./routes/admin/tags/index.tsx"),
        route(":id", "./routes/admin/tags/details.tsx"),
      ]),
      route("roles", "./routes/admin/roles/layout.tsx", [
        index("./routes/admin/roles/index.tsx"),
        route(":id", "./routes/admin/roles/details.tsx"),
      ]),
      route("settings", "./routes/admin/settings.tsx"),
      route("advanced", "./routes/admin/advanced/layout.tsx", [
        index("./routes/admin/advanced/index.tsx"),
        route("jobs", "./routes/admin/advanced/jobs.tsx"),
      ]),
    ]),

    // Help routes
    route("contact-us", "./routes/contact-us.tsx"),
    route("faqs", "./routes/faqs.tsx"),
    route("docs", "./routes/docs/layout.tsx", [
      index("./routes/docs/index.tsx"),
      route("writing-nfc-tags", "./routes/docs/writing-nfc-tags.tsx"),
    ]),

    // User routes
    route("account", "./routes/account.tsx"),

    route("*", "./routes/404.tsx"),
  ]),
] satisfies RouteConfig;
