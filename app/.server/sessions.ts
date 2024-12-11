import { createThemeSessionResolver } from "remix-themes";
import { createCookieSessionStorage } from "react-router";

const isProduction = process.env.NODE_ENV === "production";
const domain = process.env.APP_DOMAIN;

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__remix-themes",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: ["s3cr3t"],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);
