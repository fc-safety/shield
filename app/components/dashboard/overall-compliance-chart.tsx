import { useQuery } from "@tanstack/react-query";
import type { PieSeriesOption } from "echarts";
import { Shield } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "remix-themes";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useThemeValues } from "~/hooks/use-theme-values";
import { getStatusLabel, sortByStatus } from "~/lib/dashboard-utils";
import {
  AssetInspectionsStatuses,
  type AssetInspectionsStatus,
} from "~/lib/enums";
import { ReactECharts, type ReactEChartsProps } from "../charts/echarts";
import EmptyStateOverlay from "./components/empty-state-overlay";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";
import { getComplianceHistory } from "./services/stats";
import type { AssetRow } from "./types/stats";

export function OverallComplianceChart({ refreshKey }: { refreshKey: number }) {
  const [theme] = useTheme();
  const themeValues = useThemeValues();

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

  const data = React.useMemo(() => {
    if (!complianceHistory || !complianceHistory.length) {
      return null;
    }

    if (themeValues === null) {
      return null;
    }

    return (
      Object.entries(complianceHistory[0].assetsByComplianceStatus) as [
        AssetInspectionsStatus,
        AssetRow[]
      ][]
    )
      .sort(([statusA], [statusB]) => sortByStatus()(statusA, statusB))
      .map(
        ([status, assets]) =>
          ({
            id: status,
            name: getStatusLabel(status),
            value: assets.length,
            itemStyle: {
              color: themeValues[status],
            },
          } satisfies NonNullable<PieSeriesOption["data"]>[number])
      )
      .filter((d) => d.value > 0);
  }, [complianceHistory, themeValues]);

  const totalAssets = React.useMemo(
    () => complianceHistory?.[0]?.totalAssets ?? 0,
    [complianceHistory]
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
      backgroundColor: "transparent",
      series: [
        {
          name: "Compliance Status",
          type: "pie",
          radius: ["35%", "72%"],
          top: 0,
          center: ["50%", "43%"],
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
        },
        {
          name: "Compliance Status General",
          type: "pie",
          radius: ["80%", "83%"],
          top: 0,
          center: ["50%", "43%"],
          avoidLabelOverlap: false,
          startAngle: 270,
          padAngle: 5,
          itemStyle: {
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          tooltip: {
            show: false,
          },
          legendHoverLink: false,
          cursor: "default",
          label: {
            show: false,
          },
          emphasis: {
            disabled: true,
          },
          labelLine: {
            show: true,
          },
          data: Object.values(
            data?.reduce((acc, d) => {
              if (
                d.id === "COMPLIANT_DUE_LATER" ||
                d.id === "COMPLIANT_DUE_SOON"
              ) {
                if (!acc.compliant) {
                  acc.compliant = {
                    id: "compliant",
                    name: "Compliant",
                    value: 0,
                    itemStyle: d.itemStyle,
                  };
                }
                (acc.compliant as any).value += d.value;
              } else {
                if (!acc.nonCompliant) {
                  acc.nonCompliant = {
                    id: "nonCompliant",
                    name: "Non-Compliant",
                    value: 0,
                    itemStyle: d.itemStyle,
                  };
                }
                (acc.nonCompliant as any).value += d.value;
              }
              return acc;
            }, {} as Record<string, NonNullable<PieSeriesOption["data"]>[number]>) ||
              {}
          ),
        },
      ],
    }),
    [data, themeValues, totalAssets]
  );

  return (
    <Card className="flex flex-col relative">
      <CardHeader>
        <CardTitle>
          <Shield /> Overall Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-64px)] flex flex-col items-center">
        <ReactECharts
          theme={theme ?? undefined}
          settings={{
            silent: true,
          }}
          option={chartOption}
          onClick={(e) => {
            const status = (e.data as { id: string }).id;
            if (
              !AssetInspectionsStatuses.includes(
                status as AssetInspectionsStatus
              )
            ) {
              return;
            }
            navigate(`/assets?inspectionStatus=${status}`);
          }}
          className="w-full flex-1 min-h-[250px] max-w-(--breakpoint-sm)"
        />
      </CardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading assets.</ErrorOverlay>
      ) : data && data.length === 0 ? (
        <EmptyStateOverlay>No assets to display.</EmptyStateOverlay>
      ) : null}
    </Card>
  );
}
