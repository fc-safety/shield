import { createContext, useContext, type PropsWithChildren } from "react";
import type { User } from "~/.server/authenticator";

const AuthContext = createContext<{
  user: User;
  apiUrl: string;
} | null>(null);

export const AuthProvider = ({
  children,
  user,
  apiUrl,
}: PropsWithChildren<{
  user: User;
  apiUrl: string;
}>) => {
  return (
    <AuthContext.Provider value={{ user, apiUrl }}>
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
