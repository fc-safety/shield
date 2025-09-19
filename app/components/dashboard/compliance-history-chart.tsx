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
import { getStatusLabel, sortByStatus } from "~/lib/dashboard-utils";
import type { AssetInspectionsStatus } from "~/lib/enums";
import { getComplianceHistoryQueryOptions } from "~/lib/services/dashboard.service";
import { ReactECharts, type ReactEChartsProps } from "../charts/echarts";
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
import useRefreshByNumericKey from "./hooks/use-refresh-by-numeric-key";

export function ComplianceHistoryChart({ refreshKey }: { refreshKey: number }) {
  const [theme] = useTheme();
  const themeValues = useThemeValues();
  const [months, setMonths] = useAppStateValue("dash_comp_hist_months", 6);

  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const {
    data: complianceHistory,
    error,
    isLoading,
    refetch,
  } = useQuery(getComplianceHistoryQueryOptions(fetch, { months }));

  useRefreshByNumericKey(refreshKey, refetch);

  const rowsGroupedByStatus = React.useMemo(() => {
    if (!complianceHistory || !complianceHistory.length) {
      return null;
    }

    const newGrouping: Record<
      Exclude<AssetInspectionsStatus, "COMPLIANT_DUE_SOON">,
      Record<string, number>
    > = {
      COMPLIANT_DUE_LATER: {},
      NON_COMPLIANT_INSPECTED: {},
      NON_COMPLIANT_NEVER_INSPECTED: {},
    };

    complianceHistory?.forEach(({ endDate, assetsByComplianceStatus }, idx) => {
      Object.entries(assetsByComplianceStatus).forEach(([rawStatus, assets]) => {
        const month = getMonthLabel(endDate);
        // Treat Due Soon as simply Compliant since "Due Soon" doesn't make
        // sense for historical data.
        const status = (
          rawStatus === "COMPLIANT_DUE_SOON" ? "COMPLIANT_DUE_LATER" : rawStatus
        ) as Exclude<AssetInspectionsStatus, "COMPLIANT_DUE_SOON">;
        if (!newGrouping[status][month]) {
          newGrouping[status][month] = 0;
        }
        newGrouping[status][month] += assets.length;
      });
    });

    return newGrouping;
  }, [complianceHistory]);

  const series = React.useMemo(() => {
    if (rowsGroupedByStatus === null || themeValues === null) {
      return;
    }

    return (
      Object.entries(rowsGroupedByStatus) as [AssetInspectionsStatus, Record<string, number>][]
    )
      .sort(([statusA], [statusB]) => sortByStatus()(statusA, statusB))
      .map(([status, statusMonthlyCounts]) => {
        return {
          id: status,
          name: getStatusLabel(status),
          type: "bar",
          stack: "total",
          // areaStyle: {},
          emphasis: {
            focus: "series",
          },
          itemStyle: {
            color: themeValues[status],
          },
          data: Object.entries(statusMonthlyCounts)
            .map(([month, count]) => ({
              id: month,
              name: month,
              value: count,
            }))
            .reverse(),
        } satisfies NonNullable<EChartsOption["series"]>;
      });
  }, [complianceHistory, rowsGroupedByStatus, themeValues]);

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
              setMonths(Number(value));
            }}
          >
            <ToggleGroupItem value="3">3m</ToggleGroupItem>
            <ToggleGroupItem value="6">6m</ToggleGroupItem>
            <ToggleGroupItem value="12">12m</ToggleGroupItem>
          </ToggleGroup>
          {/* <Button variant="outline" size="iconSm">
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
