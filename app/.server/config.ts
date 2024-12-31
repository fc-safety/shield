const notEmpty = (value: string | undefined, errorMessage?: string) => {
  if (value !== undefined && value !== "") {
    return value;
  }

  throw new Error(errorMessage || "String cannot be empty");
};

const getNotEmptyVar = (name: string) =>
  notEmpty(process.env[name], `Environment variable ${name} is required`);

// Authentication
export const CLIENT_ID = getNotEmptyVar("CLIENT_ID");
export const CLIENT_SECRET = getNotEmptyVar("CLIENT_SECRET");
export const ISSUER_URL = getNotEmptyVar("ISSUER_URL");
export const USERINFO_URL = getNotEmptyVar("USERINFO_URL");
export const LOGOUT_URL = getNotEmptyVar("LOGOUT_URL");
export const SESSION_SECRET = getNotEmptyVar("SESSION_SECRET");

// API
export const API_BASE_URL = getNotEmptyVar("API_BASE_URL").replace(/\/+$/, "");

// Cookies
export const COOKIE_SECRET = getNotEmptyVar("COOKIE_SECRET");
