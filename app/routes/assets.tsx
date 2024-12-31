import { useEffect } from "react";
import { Outlet } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import { createAsset, getAssetsStateData } from "~/.server/api";
import { useAssetsState } from "~/hooks/use-assets-state";
import { createAssetSchemaResolver } from "~/lib/schema";
import type { Route } from "./+types/assets";

export const handle = {
  breadcrumb: () => ({ label: "Assets" }),
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return getAssetsStateData(request);
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { data, errors } = await getValidatedFormData(
    request,
    createAssetSchemaResolver
  );

  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }

  return createAsset(request, data);
};

export default function Assets({
  loaderData: { products },
}: Route.ComponentProps) {
  const { setProducts } = useAssetsState();
  useEffect(() => {
    setProducts(products);
  }, [products, setProducts]);

  return <Outlet />;
}
