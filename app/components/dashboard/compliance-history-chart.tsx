import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth } from "date-fns";
import type { EChartsOption } from "echarts";
import { History } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import { useTheme } from "remix-themes";
import { useAppStateValue } from "~/contexts/app-state-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useThemeValues } from "~/hooks/use-theme-values";
import { getComplianceHistoryQueryOptions } from "~/lib/services/dashboard.service";
import type { ReactEChartsProps } from "../charts/echarts";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "./components/dashboard-card";
import EmptyStateOverlay from "./components/empty-state-overlay";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";
const { ReactECharts } = await import("../charts/echarts");

export function ComplianceHistoryChart() {
  const [theme] = useTheme();
  const themeValues = useThemeValues();
  const [months, setMonths] = useAppStateValue("dash_comp_hist_months", 6);

  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const {
    data: complianceHistory,
    error,
    isLoading,
  } = useQuery(getComplianceHistoryQueryOptions(fetch, { months }));

  const compliancePercentages = React.useMemo(() => {
    if (!complianceHistory || !complianceHistory.length) {
      return null;
    }

    const percentages: Record<string, number> = {};

    complianceHistory?.forEach(({ endDate, assetsByComplianceStatus }) => {
      const month = getMonthLabel(endDate);
      let compliantCount = 0;
      let totalCount = 0;

      Object.entries(assetsByComplianceStatus).forEach(([rawStatus, assets]) => {
        totalCount += assets.length;
        // Count both COMPLIANT_DUE_LATER and COMPLIANT_DUE_SOON as compliant
        if (rawStatus === "COMPLIANT_DUE_LATER" || rawStatus === "COMPLIANT_DUE_SOON") {
          compliantCount += assets.length;
        }
      });

      percentages[month] = totalCount > 0 ? (compliantCount / totalCount) * 100 : 0;
    });

    return percentages;
  }, [complianceHistory]);

  const series = React.useMemo(() => {
    if (compliancePercentages === null || themeValues === null) {
      return;
    }

    return [
      {
        id: "compliant",
        name: "Compliance Score",
        type: "bar",
        emphasis: {
          focus: "series",
        },
        itemStyle: {
          color: themeValues["COMPLIANT_DUE_LATER"],
        },
        data: Object.entries(compliancePercentages)
          .map(([month, percentage]) => ({
            id: month,
            name: month,
            value: percentage,
          }))
          .reverse(),
      } satisfies NonNullable<EChartsOption["series"]>,
    ];
  }, [complianceHistory, compliancePercentages, themeValues]);

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
        trigger: "axis",
        axisPointer: {
          // Use axis to trigger tooltip
          type: "shadow", // 'shadow' as default; can also be 'line' or 'shadow'
        },
        valueFormatter: (value) => `${Number(value).toFixed(1)}%`,
      },
      // Legend at the bottom of the chart
      legend: {
        bottom: "0%",
        left: "center",
        formatter: "{name}",
      },
      // Background color of the chart
      backgroundColor: "transparent",
      // Specifies how to draw the bar chart within the container
      grid: {
        left: "3%",
        right: "4%",
        bottom: "14%",
        top: "2%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: complianceHistory
          ? complianceHistory
              .map((row) => {
                const { endDate } = row;
                return getMonthLabel(endDate);
              })
              .reverse()
          : [],
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%",
        },
      },
      series,
    }),
    [series, themeValues, totalAssets]
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          <History /> Compliance History
          <div className="flex-1"></div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={String(months)}
            onValueChange={(value) => {
              const months = Number(value);
              if (Number.isNaN(months) || months < 1 || months > 13) {
                setMonths(6);
                return;
              }
              setMonths(months);
            }}
          >
            <ToggleGroupItem value="3">3m</ToggleGroupItem>
            <ToggleGroupItem value="6">6m</ToggleGroupItem>
            <ToggleGroupItem value="12">12m</ToggleGroupItem>
          </ToggleGroup>
          {/* <Button variant="outline" size="icon-sm">
            <Printer />
          </Button> */}
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="flex h-[calc(100%-64px)] flex-col items-center">
        <ReactECharts
          theme={theme ?? undefined}
          settings={{
            silent: true,
          }}
          option={chartOption}
          className="min-h-[250px] w-full max-w-(--breakpoint-sm) flex-1"
        />
      </DashboardCardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading assets.</ErrorOverlay>
      ) : series && Array.isArray(series) && series.length === 0 ? (
        <EmptyStateOverlay>No assets to display.</EmptyStateOverlay>
      ) : null}
    </DashboardCard>
  );
}

const getMonthLabel = (endDate: Date | string) => {
  if (isSameMonth(endDate, new Date())) {
    return `Today`;
  }
  return format(endDate, "MMM");
};
