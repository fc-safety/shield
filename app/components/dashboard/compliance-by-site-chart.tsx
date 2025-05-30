import { useQuery } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { Shield, Warehouse } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "remix-themes";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useThemeValues } from "~/hooks/use-theme-values";
import { getStatusLabel, sortByStatus } from "~/lib/dashboard-utils";
import { getAssetInspectionStatus } from "~/lib/model-utils";
import type { Asset, ResultsPage, Site } from "~/lib/models";
import { countBy } from "~/lib/utils";
import { ReactECharts, type ReactEChartsProps } from "../charts/echarts";
import EmptyStateOverlay from "./components/empty-state-overlay";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";

export function ComplianceBySiteChart({ refreshKey }: { refreshKey: number }) {
  const [theme] = useTheme();
  const themeValues = useThemeValues();

  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const navigate = useNavigate();

  const {
    data: rawAssets,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["assets-with-latest-inspection"],
    queryFn: () => getAssetsWithLatestInspection(fetch).then((r) => r.results),
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  const { data: mySites } = useQuery({
    queryKey: ["my-sites-200"],
    queryFn: () => getMySites(fetch).then((r) => r.results),
  });
  const mySitesById = React.useMemo(
    () =>
      mySites &&
      Object.fromEntries(
        mySites
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((s) => [s.id, s])
      ),
    [mySites]
  );

  const series = React.useMemo((): EChartsOption["series"] => {
    if (!rawAssets || !mySitesById || themeValues === null) {
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

    const totalCountsBySiteIdArray = countBy(rawAssets, "siteId");
    const totalCountsBySiteId = Object.fromEntries(
      totalCountsBySiteIdArray.map(({ siteId, count }) => [siteId, count])
    );

    return countBy(assetStatuses, "status")
      .sort(sortByStatus())
      .map(({ status, items }) => {
        const assets = items.map(({ asset }) => asset);
        const countsBySiteArray = countBy(assets, "siteId");
        const countsBySiteId = Object.fromEntries(
          countsBySiteArray.map(({ siteId, count }) => [siteId, count])
        );

        return {
          id: status,
          name: getStatusLabel(status),
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: (params) => {
              const siteId = (params.data as { id: string }).id;
              return `${
                Math.round(
                  (+(params.value ?? 0) / (totalCountsBySiteId[siteId] || 1)) *
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
          data: Object.entries(mySitesById).map(([siteId, site]) => ({
            id: siteId,
            name: site.name,
            value: countsBySiteId[siteId] ?? 0,
          })),
        } satisfies NonNullable<EChartsOption["series"]>;
      });
  }, [rawAssets, themeValues, mySitesById]);

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
      title: {
        // text: "Compliance by Site",
        // subtext: `Breakdown of compliance by site.`,
        left: "center",
        top: "0%",
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
        itemGap: 8,
      },
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
        data: mySitesById ? Object.values(mySitesById).map((s) => s.name) : [],
      },
      series,
    }),
    [series, themeValues, mySitesById]
  );

  return (
    <Card className="flex flex-col relative">
      <CardHeader>
        <CardTitle>
          <Shield />+<Warehouse /> Compliance by Site
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center">
        <ReactECharts
          theme={theme ?? undefined}
          option={chartOption}
          onClick={(e) => {
            const siteId = (e.data as { id: string }).id;
            navigate(`/assets?inspectionStatus=${e.seriesId}&siteId=${siteId}`);
          }}
          className="w-full h-full"
          style={{
            minHeight:
              150 + (mySitesById ? Object.keys(mySitesById).length : 3) * 20,
          }}
        />
      </CardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading assets.</ErrorOverlay>
      ) : series && Array.isArray(series) && series.length === 0 ? (
        <EmptyStateOverlay>No assets to display.</EmptyStateOverlay>
      ) : null}
    </Card>
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

const getMySites = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/sites?limit=200&subsites[none]=", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Site>>;
};
