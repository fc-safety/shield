import { deflate, inflate } from "pako";
import { createCookieSessionStorage, type SessionData, type SessionStorage } from "react-router";
import { createThemeSessionResolver } from "remix-themes";
import type { TCapability, TScope } from "~/lib/permissions";
import type { AppState } from "~/lib/types";
import { type Tokens } from "./authenticator";
import { config } from "./config";

const isProduction = process.env.NODE_ENV === "production";
const domain = process.env.APP_DOMAIN;

export const compress = (data: string) => Buffer.from(deflate(data)).toString("base64");

export const decompress = (data: string) => inflate(Buffer.from(data, "base64"), { to: "string" });

export const getSession = async <T = SessionData>(
  request: Request,
  sessionStorage: SessionStorage<T>
) => {
  return sessionStorage.getSession(request.headers.get("cookie"));
};

export const getSessionValue = async <T = SessionData>(
  request: Request,
  sessionStorage: SessionStorage<T>,
  key: keyof T & string
) => {
  const session = await getSession(request, sessionStorage);
  return session.get(key);
};

// THEME MANAGEMENT

const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__remix-themes",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [config.COOKIE_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const themeSessionResolver = createThemeSessionResolver(themeSessionStorage);

// APP STATE STORAGE
export const appStateSessionStorage = createCookieSessionStorage<AppState>({
  cookie: {
    name: "__appState",
    path: "/",
    sameSite: "lax",
    secrets: [config.COOKIE_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const getAppState = async (request: Request) => {
  const session = await appStateSessionStorage.getSession(request.headers.get("cookie"));
  return session.data;
};

// INSPECTION STORAGE

export interface InspectionCookieValue {
  activeTag?: string;
  tagActivatedOn?: string;
  activeSession?: string;
  activeRoute?: string;
  inspectionToken?: string;
}

export const inspectionSessionStorage = createCookieSessionStorage<InspectionCookieValue>({
  cookie: {
    name: "__inspection",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [config.COOKIE_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

// USER SESSION MANAGEMENT

export const userSessionStorage = createCookieSessionStorage<{
  id?: string;
  tokens?: Tokens | null;
  returnTo?: string;
  scope?: TScope | null;
  capabilities?: TCapability[] | null;
  hasMultiClientScope?: boolean;
  hasMultiSiteScope?: boolean;
  activeClientId?: string | null;
  activeSiteId?: string | null;
}>({
  cookie: {
    name: "session",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [config.SESSION_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
    decode: (value) => {
      // If decompression fails, return the original value.
      try {
        return decompress(value);
      } catch (e) {
        return value;
      }
    },
    encode: (value) => {
      // Compress to allow for more efficient storage. Tokens
      // can be quite large, and the session is stored in the
      // cookie jar.
      return compress(value);
    },
  },
});
