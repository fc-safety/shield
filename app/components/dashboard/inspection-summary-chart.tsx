import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Link, useNavigate } from "react-router";
import { Cell, Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { getAssetInspectionStatus } from "~/lib/model-utils";
import type { Asset } from "~/lib/models";
import { countBy } from "~/lib/utils";
import BlankDashboardTile from "./blank-dashboard-tile";
import ErrorDashboardTile from "./error-dashboard-tile";

const StatusLink = ({ status, label }: { status: string; label?: string }) => {
  return (
    <Link
      to={`/assets?inspectionsStatus=${status.toUpperCase()}`}
      className="transition-colors hover:text-muted-foreground capitalize"
    >
      {label || status}
    </Link>
  );
};

const chartConfig = {
  totalAssets: {
    label: "Total Assets",
  },
  ok: {
    label: <StatusLink status="ok" label="Compliant" />,
    color: "hsl(var(--status-ok))",
  },
  overdue: {
    label: <StatusLink status="overdue" />,
    color: "hsl(var(--status-overdue))",
  },
  expired: {
    label: <StatusLink status="expired" />,
    color: "hsl(var(--status-expired))",
  },
  never: {
    label: <StatusLink status="never" />,
    color: "hsl(var(--status-never))",
  },
} satisfies ChartConfig;

export function InspectionSummaryChart() {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data: rawAssets, error } = useQuery({
    queryKey: ["assets-with-latest-inspection"],
    queryFn: () => getAssetsWithLatestInspection(fetch),
  });

  const data = React.useMemo(
    () =>
      rawAssets &&
      countBy(
        rawAssets.map((a) => {
          const status = getAssetInspectionStatus(
            a.inspections ?? []
          ).toLowerCase();
          return {
            status,
          };
        }),
        "status"
      ).map(({ status, count }) => ({
        status,
        totalAssets: count,
        fill: `hsl(var(--status-${status}))`,
      })),
    [rawAssets]
  );

  const totalAssets = React.useMemo(() => {
    return rawAssets?.length ?? 0;
  }, [rawAssets]);

  const navigate = useNavigate();

  return data ? (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Inspection Scorecard</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="totalAssets"
              nameKey="status"
              innerRadius={80}
              strokeWidth={5}
              onClick={(d) =>
                navigate(
                  `/assets?inspectionsStatus=${d.payload.status.toUpperCase()}`
                )
              }
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={entry.fill}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalAssets.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Assets
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="status" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {/* <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div> */}
      </CardFooter>
    </Card>
  ) : error ? (
    <ErrorDashboardTile />
  ) : (
    <BlankDashboardTile className="animate-pulse" />
  );
}

const getAssetsWithLatestInspection = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/assets/latest-inspection", {
    method: "GET",
  });

  return response.json() as Promise<Asset[]>;
};
