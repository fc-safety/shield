import { createContext, useContext, type PropsWithChildren } from "react";
import type { User } from "~/.server/authenticator";

const AuthContext = createContext<{
  user: User;
  apiUrl: string;
  appHost: string;
} | null>(null);

export const AuthProvider = ({
  children,
  user,
  apiUrl,
  appHost,
}: PropsWithChildren<{
  user: User;
  apiUrl: string;
  appHost: string;
}>) => {
  return (
    <AuthContext.Provider value={{ user, apiUrl, appHost }}>
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
