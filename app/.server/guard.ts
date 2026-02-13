import { redirect } from "react-router";
import type { User } from "./authenticator";
import { requireUserSession } from "./user-sesssion";

const handleGuard = async (
  request: Request,
  condition: (user: User) => boolean,
  fallback: () => Response
) => {
  const { user } = await requireUserSession(request);
  if (!condition(user)) {
    throw fallback();
  }
  return user;
};

export const guard = async (request: Request, condition: (user: User) => boolean) => {
  return await handleGuard(request, condition, () => new Response("Forbidden", { status: 403 }));
};

export const guardOrSendHome = async (request: Request, condition: (user: User) => boolean) => {
  return await handleGuard(request, condition, () => redirect("/"));
};
