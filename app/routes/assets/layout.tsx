import { startTransition, useEffect } from "react";
import { Outlet } from "react-router";
import { getAssetsStateData } from "~/.server/api";
import { useAssetsState } from "~/hooks/use-assets-state";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({ label: "Assets" }),
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return getAssetsStateData(request);
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
