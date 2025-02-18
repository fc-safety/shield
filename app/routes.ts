import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  // Auth Routes
  route("login", "./routes/auth/login.tsx"),
  route("logout", "./routes/auth/logout.tsx"),
  route("callback", "./routes/auth/callback.tsx"),

  // App Routes
  layout("./routes/layout.tsx", [
    index("./routes/index.tsx"),
    route("dashboard", "./routes/dashboard.tsx"),
    route("assets", "./routes/assets/layout.tsx", [
      index("./routes/assets/index.tsx"),
      route(":id", "./routes/assets/details.tsx"),
    ]),
    route("reports", "./routes/reports/layout.tsx", [
      index("./routes/reports/index.tsx"),
      route(":id", "./routes/reports/details.tsx"),
      route("build/(:id)", "./routes/reports/build.tsx"),
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
    ]),

    // Admin Routes
    route("admin", "./routes/admin/layout.tsx", [
      index("./routes/admin/index.tsx"),
      route("clients", "./routes/admin/clients/layout.tsx", [
        index("./routes/admin/clients/index.tsx"),
        route(":id", "./routes/admin/clients/details/layout.tsx", [
          index("./routes/admin/clients/details/index.tsx"),
          route(
            "sites/:siteId",
            "./routes/admin/clients/details/site-details.tsx"
          ),
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
    ]),

    // Help routes
    route("faqs", "./routes/faqs.tsx"),
    route("contact", "./routes/contact.tsx"),

    // User routes
    route("account", "./routes/account.tsx"),

    route("*", "./routes/404.tsx"),
  ]),

  // Inspect routes
  route("inspect", "./routes/inspect/layout.tsx", [
    index("./routes/inspect/index.tsx"),
    route("setup", "./routes/inspect/setup.tsx"),
    route("next", "./routes/inspect/next.tsx"),
  ]),

  // Action Routes
  ...prefix("action", [route("set-theme", "./routes/actions/set-theme.ts")]),
  ...prefix("action", [
    route("refresh-auth", "./routes/actions/refresh-auth.ts"),
  ]),

  // API Routes
  ...prefix("api", [
    route("query-zip/:zip", "./routes/api/query-zip.ts"),
    route("link-preview-metadata", "./routes/api/link-preview-metadata.ts"),
    route("product-categories", "./routes/api/product-categories.ts"),
    route("manufacturers", "./routes/api/manufacturers.ts"),
    route("tags", "./routes/api/tags.ts"),
    route("inspections/:id", "./routes/api/inspections.ts"),
    route("proxy/*", "./routes/api/proxy.ts"),
    route("image-upload-url", "./routes/api/image-upload-url.ts"),
  ]),
] satisfies RouteConfig;
