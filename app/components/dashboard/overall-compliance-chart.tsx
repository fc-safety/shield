import { useQuery } from "@tanstack/react-query";
import type { PieSeriesOption } from "echarts";
import * as React from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "remix-themes";
import { Card, CardContent } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useThemeValues } from "~/hooks/use-theme-values";
import { getStatusLabel, sortByStatus } from "~/lib/dashboard-utils";
import { getAssetInspectionStatus } from "~/lib/model-utils";
import type { Asset, ResultsPage } from "~/lib/models";
import { countBy } from "~/lib/utils";
import { ReactECharts, type ReactEChartsProps } from "../charts/echarts";
import BlankDashboardTile from "./blank-dashboard-tile";
import ErrorDashboardTile from "./error-dashboard-tile";

export function OverallComplianceChart() {
  const [theme] = useTheme();
  const themeValues = useThemeValues();

  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const navigate = useNavigate();

  const { data: rawAssets, error } = useQuery({
    queryKey: ["assets-with-latest-inspection"],
    queryFn: () =>
      getAssetsWithLatestInspection(fetch).then((r) => [] as Asset[]),
  });

  const data = React.useMemo(
    () =>
      rawAssets &&
      themeValues !== null &&
      countBy(
        rawAssets.map((a) => {
          const status = getAssetInspectionStatus(
            a.inspections ?? [],
            a.inspectionCycle ?? a.client?.defaultInspectionCycle
          );
          return {
            status,
          };
        }),
        "status"
      )
        .sort(sortByStatus())
        .map(
          ({ status, count }) =>
            ({
              id: status,
              name: getStatusLabel(status),
              value: count,
              itemStyle: {
                color: themeValues[status],
              },
            } satisfies NonNullable<PieSeriesOption["data"]>[number])
        ),
    [rawAssets, themeValues]
  );

  const totalAssets = React.useMemo(
    () => (data ? data.reduce((acc, curr) => acc + curr.value, 0) : 0),
    [data]
  );

  const chartOption = useMemo(
    (): ReactEChartsProps["option"] => ({
      // Global chart text style
      textStyle: {
        fontFamily: themeValues?.fontFamily,
      },
      // Tooltip when hovering over a slice of the pie chart
      tooltip: {
        trigger: "item",
        // See https://echarts.apache.org/en/option.html#tooltip.formatter
        formatter: "{b}: {c} ({d}%)",
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
        text: "Overall Compliance",
        subtext: `You are viewing the compliance status of a total of ${totalAssets} assets.`,
        left: "center",
        top: "0%",
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
        },
        subtextStyle: {
          width: 320,
          overflow: "break",
          fontSize: 14,
          color: themeValues?.mutedForeground,
        },
        itemGap: 8,
      },

      series: [
        {
          name: "Inspection Status",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          startAngle: 270,
          padAngle: 5,
          itemStyle: {
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          label: {
            show: true,
            position: "inner",
            formatter: (params) => {
              return `${params.percent}%`;
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.2)",
            },
          },
          labelLine: {
            show: true,
          },
          data: data || [],
          top: 16,
          center: ["50%", "50%"],
        },
      ],
    }),
    [data, themeValues, totalAssets]
  );

  return data ? (
    <Card className="flex flex-col">
      <CardContent className="flex-1 pt-4 sm:pt-6 flex flex-col items-center">
        {data.length === 0 ? (
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
              const status = (e.data as { id: string }).id;
              navigate(`/assets?inspectionStatus=${status}`);
            }}
            className="w-full aspect-square max-w-(--breakpoint-sm)"
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
