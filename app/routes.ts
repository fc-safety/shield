import {
  index,
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
  route("settings", "./routes/settings.tsx"),

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
    route("products", "./routes/admin/products.tsx"),
    route("tags", "./routes/admin/tags.tsx"),
  ]),

  // Help routes
  route("faqs", "./routes/faqs.tsx"),
  route("contact", "./routes/contact.tsx"),

  // Action Routes
  ...prefix("action", [route("set-theme", "./routes/actions/set-theme.tsx")]),

  // API Routes
  ...prefix("api", [route("query-zip/:zip", "./routes/api/query-zip.tsx")]),
] satisfies RouteConfig;
