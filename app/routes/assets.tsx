import { startTransition, useEffect } from "react";
import { Outlet } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { createAsset, getAssetsStateData } from "~/.server/api";
import { useAssetsState } from "~/hooks/use-assets-state";
import { createAssetSchema, createAssetSchemaResolver } from "~/lib/schema";
import type { Route } from "./+types/assets";

export const handle = {
  breadcrumb: () => ({ label: "Assets" }),
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return getAssetsStateData(request);
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { data, errors } = await getValidatedFormData<
    z.infer<typeof createAssetSchema>
  >(request, createAssetSchemaResolver);

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
    products.then((resolvedProducts) => {
      startTransition(() => {
        setProducts(resolvedProducts);
      });
    });
  }, [products, setProducts]);

  return <Outlet />;
}
