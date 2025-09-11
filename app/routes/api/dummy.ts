import { getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/dummy";

const dummy = async ({ request }: Route.LoaderArgs | Route.ActionArgs) => {
  const searchParams = getSearchParams(request);
  const delay = searchParams.get("delay") ?? "1000";
  const dataOrError = searchParams.get("dataOrError") === "true";
  const fakeId = searchParams.get("fakeId") === "true";

  const body = await request.json();

  if (body !== null && typeof body === "object") {
    if (fakeId) {
      body.id = "fake-id";
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        dataOrError
          ? {
              data: body,
            }
          : body
      );
    }, parseInt(delay));
  });
};

export const loader = async (args: Route.LoaderArgs) => {
  return dummy(args);
};

export const action = async (args: Route.ActionArgs) => {
  return dummy(args);
};
