import { createContext, useContext, type PropsWithChildren } from "react";
import type { User } from "~/.server/authenticator";

export const ANONYMOUS_USER: User = {
  idpId: "anonymous",
  email: "anonymous@shield.com",
  username: "anonymous",
  name: "Anonymous",
  givenName: "Anonymous",
  familyName: "Anonymous",
  picture: "https://shield.com/anonymous.png",
  clientId: "",
  siteId: "",
  tokens: {
    accessToken: "anonymous",
    refreshToken: "anonymous",
  },
};

const AuthContext = createContext<{
  user: User;
  apiUrl: string;
  appHost: string;
  googleMapsApiKey: string;
  clientId: string;
} | null>(null);

export const AuthProvider = ({
  children,
  user,
  apiUrl,
  appHost,
  googleMapsApiKey,
  clientId,
}: PropsWithChildren<{
  user: User;
  apiUrl: string;
  appHost: string;
  googleMapsApiKey: string;
  clientId: string;
}>) => {
  return (
    <AuthContext.Provider
      value={{ user, apiUrl, appHost, googleMapsApiKey, clientId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return auth;
};
