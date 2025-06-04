import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Shapes, Shield } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { AssetInspectionsStatus } from "~/lib/enums";
import type { ProductCategory, ResultsPage } from "~/lib/models";
import { DataTable } from "../data-table/data-table";
import ProductCategoryIcon from "../products/product-category-icon";
import EmptyStateOverlay from "./components/empty-state-overlay";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";
import MiniStatusProgressBar from "./components/mini-status-progress-bar";
import { getComplianceHistory } from "./services/stats";

export function ComplianceByCategoryChart({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const navigate = useNavigate();

  const {
    data: complianceHistory,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["compliance-history", 1] as const,
    queryFn: ({ queryKey: [, months] }) => getComplianceHistory(fetch, months),
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  const { data: productCategories } = useQuery({
    queryKey: ["product-categories-200"],
    queryFn: () => getProductCategories(fetch).then((r) => r.results),
  });

  const categoryRows = React.useMemo(() => {
    if (!productCategories || !complianceHistory || !complianceHistory.length) {
      return null;
    }

    const newGrouping: Record<
      string,
      Record<AssetInspectionsStatus, number>
    > = {};

    Object.entries(complianceHistory[0].assetsByComplianceStatus).forEach(
      ([rawStatus, assets]) => {
        assets.forEach((asset) => {
          const status = rawStatus as AssetInspectionsStatus;
          if (!newGrouping[asset.product.productCategory.id]) {
            newGrouping[asset.product.productCategory.id] = {
              COMPLIANT_DUE_LATER: 0,
              COMPLIANT_DUE_SOON: 0,
              NON_COMPLIANT_INSPECTED: 0,
              NON_COMPLIANT_NEVER_INSPECTED: 0,
            };
          }
          newGrouping[asset.product.productCategory.id][status] += 1;
        });
      }
    );

    return productCategories
      .map((category) => {
        const assetsByStatus = newGrouping[category.id];
        if (!assetsByStatus) {
          return null;
        }

        const totalCompliant =
          assetsByStatus.COMPLIANT_DUE_LATER +
          assetsByStatus.COMPLIANT_DUE_SOON;
        const totalNonCompliant =
          assetsByStatus.NON_COMPLIANT_INSPECTED +
          assetsByStatus.NON_COMPLIANT_NEVER_INSPECTED;
        const total = totalCompliant + totalNonCompliant;
        const score = total ? totalCompliant / total : 0;

        return {
          id: category.id,
          name: category.name,
          shortName: category.shortName,
          icon: category.icon,
          color: category.color,
          score,
          totalAssets: total,
        };
      })
      .filter((c) => c !== null);
  }, [productCategories, complianceHistory]);

  const columns = React.useMemo((): ColumnDef<
    NonNullable<typeof categoryRows>[number]
  >[] => {
    return [
      {
        header: "Category",
        accessorKey: "name",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <ProductCategoryIcon category={row.original} />
              {row.original.name}
            </div>
          );
        },
      },
      {
        header: "Assets",
        accessorKey: "totalAssets",
        meta: {
          align: "right",
        },
      },
      {
        header: "Score",
        accessorKey: "score",
        meta: {
          align: "right",
        },
        cell: ({ row }) => <MiniStatusProgressBar value={row.original.score} />,
      },
      {
        id: "details",
        cell: ({ row }) => (
          <Link to={`/assets?productCategoryId=${row.original.id}`}>
            <ChevronRight className="size-4.5 text-primary" />
          </Link>
        ),
      },
    ];
  }, []);

  return (
    <Card className="relative flex flex-col">
      <CardHeader>
        <CardTitle>
          <Shield />+<Shapes /> Compliance by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 flex flex-col items-stretch bg-inherit rounded-[inherit]">
        <DataTable
          columns={columns}
          data={categoryRows ?? []}
          hidePagination
          initialState={{
            pagination: {
              pageIndex: 0,
              pageSize: categoryRows?.length ?? 1000,
            },
            sorting: [{ id: "score", desc: false }],
          }}
          classNames={{
            container: "max-h-full",
          }}
        />
      </CardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading assets.</ErrorOverlay>
      ) : categoryRows && categoryRows.length === 0 ? (
        <EmptyStateOverlay>
          No categories to display assets for.
        </EmptyStateOverlay>
      ) : null}
    </Card>
  );
}

const getProductCategories = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/product-categories?limit=200", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<ProductCategory>>;
};

type SingularNonNullable<T> = T extends Array<infer U> ? U : NonNullable<T>;
type TProductCategoryIconMap = Record<
  string,
  {
    id: string;
    unicode: string;
    color?: string;
  }
>;

/**
 * Get the unicode string for a Font Awesome icon, or empty string if the icon
 * is not found.
 *
 * @param iconId The Font Awesome icon ID. Does not include the `fa-` prefix.
 * @returns The unicode string for the icon.
 */
const getIconUnicode = (iconId: string) => {
  // Create icon element and render by adding to the DOM.
  const icon = document.createElement("i");
  icon.classList.add("fa-solid");
  icon.classList.add(`fa-${iconId}`);
  icon.style.display = "none";
  document.body.appendChild(icon);

  // Get the unicode string for the icon.
  const unicode = getComputedStyle(icon).getPropertyValue("--fa");

  // Clean up by removing the icon from the DOM.
  document.body.removeChild(icon);

  // Evaluate the unicode string to get the actual unicode value.
  try {
    return eval(unicode.replace("\\", "\\u")) as string;
  } catch (e) {
    console.error(e);
    return "";
  }
};
