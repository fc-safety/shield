import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { Shapes, Shield } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "remix-themes";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useThemeValues } from "~/hooks/use-theme-values";
import { getStatusLabel, sortByStatus } from "~/lib/dashboard-utils";
import { getAssetInspectionStatus } from "~/lib/model-utils";
import type { Asset, ProductCategory, ResultsPage } from "~/lib/models";
import { countBy } from "~/lib/utils";
import { ReactECharts, type ReactEChartsProps } from "../charts/echarts";
import BlankDashboardTile from "./blank-dashboard-tile";
import ErrorDashboardTile from "./error-dashboard-tile";

export function ComplianceByCategoryChart({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [theme] = useTheme();
  const themeValues = useThemeValues();

  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const navigate = useNavigate();

  const { data: rawAssets, error } = useQuery({
    queryKey: ["assets-with-latest-inspection", refreshKey],
    queryFn: () => getAssetsWithLatestInspection(fetch).then((r) => r.results),
  });

  const { data: productCategories } = useQuery({
    queryKey: ["product-categories-200"],
    queryFn: () => getProductCategories(fetch).then((r) => r.results),
  });

  const productCategoriesById = React.useMemo(
    () =>
      productCategories &&
      Object.fromEntries(
        productCategories
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((s) => [s.id, s])
      ),
    [productCategories]
  );

  const nonEmptyProductCategories = React.useMemo(
    () =>
      countBy(rawAssets?.map((a) => a.product) ?? [], "productCategoryId")
        .filter(({ count }) => count > 0)
        .map(
          ({ productCategoryId }) => productCategoriesById?.[productCategoryId]
        )
        .filter((c) => c !== undefined),
    [rawAssets, productCategoriesById]
  );

  const [iconMap, setIconMap] = useState<TProductCategoryIconMap>({});
  useEffect(() => {
    const iconMap: TProductCategoryIconMap = {};
    for (const category of nonEmptyProductCategories) {
      if (!category.icon) {
        continue;
      }

      iconMap[category.id] = {
        id: category.icon.replace(/-/g, "_"),
        unicode: getIconUnicode(category.icon),
        color: category.color ?? undefined,
      };
    }
    setIconMap(iconMap);
  }, [nonEmptyProductCategories]);

  const series = React.useMemo((): EChartsOption["series"] => {
    if (!rawAssets || !productCategoriesById || themeValues === null) {
      return;
    }

    const assetStatuses = rawAssets.map((a) => {
      const status = getAssetInspectionStatus(
        a.inspections ?? [],
        a.inspectionCycle ?? a.client?.defaultInspectionCycle
      );
      return {
        asset: a,
        status,
      };
    });

    const totalCountsByCategoryIdArray = countBy(
      rawAssets.map((a) => a.product),
      "productCategoryId"
    );
    const totalCountsByCategoryId = Object.fromEntries(
      totalCountsByCategoryIdArray.map(({ productCategoryId, count }) => [
        productCategoryId,
        count,
      ])
    );

    return countBy(assetStatuses, "status")
      .sort(sortByStatus())
      .map(({ status, items }) => {
        const assets = items.map(({ asset }) => asset);
        const countsByCategoryArray = countBy(
          assets.map((a) => a.product),
          "productCategoryId"
        );
        const countsByCategoryId = Object.fromEntries(
          countsByCategoryArray.map(({ productCategoryId, count }) => [
            productCategoryId,
            count,
          ])
        );

        return {
          id: status,
          name: getStatusLabel(status),
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: (params) => {
              const categoryId = (params.data as { id: string }).id;
              return `${
                Math.round(
                  (+(params.value ?? 0) /
                    (totalCountsByCategoryId[categoryId] || 1)) *
                    10000
                ) / 100
              }%`;
            },
          },
          emphasis: {
            focus: "series",
          },
          itemStyle: {
            color: themeValues[status],
          },
          data: nonEmptyProductCategories.map((productCategory) => ({
            id: productCategory.id,
            name: productCategory.shortName ?? productCategory.name,
            value: countsByCategoryId[productCategory.id] ?? 0,
          })),
        } satisfies NonNullable<EChartsOption["series"]>;
      });
  }, [
    rawAssets,
    themeValues,
    productCategoriesById,
    nonEmptyProductCategories,
  ]);

  const chartOption = useMemo(
    (): ReactEChartsProps["option"] => ({
      // Global chart text style
      textStyle: {
        fontFamily: themeValues?.fontFamily,
      },
      // Tooltip when hovering over a slice of the pie chart
      tooltip: {
        trigger: "axis",
        axisPointer: {
          // Use axis to trigger tooltip
          type: "shadow", // 'shadow' as default; can also be 'line' or 'shadow'
        },
      },
      // Legend at the bottom of the chart
      legend: {
        bottom: "0%",
        left: "center",
        formatter: "{name}",
      },
      // Background color of the chart
      backgroundColor: "transparent",
      // Title of the chart
      // title: {
      // text: "Compliance by Category",
      // subtext: `Breakdown of compliance by product category.`,
      // left: "center",
      // top: "0%",
      // textStyle: {
      //   fontSize: 16,
      //   fontWeight: 600,
      // },
      // subtextStyle: {
      //   width: 320,
      //   overflow: "break",
      //   fontSize: 14,
      //   color: themeValues?.mutedForeground,
      //   lineHeight: 8,
      // },
      //   itemGap: 8,
      // },
      // Specifies how to draw the bar chart within the container
      grid: {
        left: "3%",
        right: "4%",
        bottom: "14%",
        top: "0%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
      },
      yAxis: {
        type: "category",
        data: nonEmptyProductCategories.map((c) => c.shortName ?? c.name),
        axisLabel: {
          formatter: (name, idx) => {
            const icon = iconMap[nonEmptyProductCategories[idx].id];
            if (!icon) {
              return name;
            }
            // Use rich text to display the icon, which is stored here as a unicode string.
            return `${name}  {icon_${icon.id}|${icon.unicode}}`;
          },
          fontSize: 14,
          rich: {
            // Rich text is general, not specific to each axis label. For this reason,
            // we need to create a new rich object for each axis label.
            ...Object.values(iconMap).reduce((acc, { id, color }) => {
              acc[`icon_${id}`] = {
                color,
                fontFamily: "FontAwesome",
                fontSize: 14,
              };
              return acc;
            }, {} as NonNullable<NonNullable<SingularNonNullable<ReactEChartsProps["option"]["yAxis"]>["axisLabel"]>["rich"]>),
          },
        },
      },
      series,
    }),
    [series, themeValues, nonEmptyProductCategories, iconMap]
  );

  return series ? (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>
          <Shield />+<Shapes /> Compliance by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center">
        {Array.isArray(series) && series.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-muted-foreground text-sm">
              No assets to display.
            </div>
          </div>
        ) : (
          <ReactECharts
            theme={theme ?? undefined}
            option={chartOption}
            onClick={(e) => {
              const productCategoryId = (e.data as { id: string }).id;
              navigate(
                `/assets?inspectionStatus=${e.seriesId}&productCategoryId=${productCategoryId}`
              );
            }}
            className="w-full h-full"
            style={{
              // Allow chart to grow vertically to fit the number of product categories.
              // However, this allows Y Axis labels to get progressively smaller
              // with a lower limit of 20px.
              minHeight:
                200 +
                (productCategoriesById
                  ? Object.keys(productCategoriesById).length
                  : 3) *
                  20,
            }}
          />
        )}
      </CardContent>
    </Card>
  ) : error ? (
    <ErrorDashboardTile />
  ) : (
    <BlankDashboardTile className="animate-pulse h-full" />
  );
}

const getAssetsWithLatestInspection = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/assets/latest-inspection?limit=10000", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Asset>>;
};

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
