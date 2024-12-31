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
import type { assetStatuses } from "~/lib/demo-data";

const StatusLink = ({ status, label }: { status: string; label?: string }) => {
  return (
    <Link
      to={`/assets?status=${status}`}
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
    color: "hsl(var(--chart-status-ok))",
  },
  warning: {
    label: <StatusLink status="warning" />,
    color: "hsl(var(--chart-status-warning))",
  },
  error: {
    label: <StatusLink status="error" />,
    color: "hsl(var(--chart-status-error))",
  },
} satisfies ChartConfig;

export function InspectionSummaryChart({
  data: dataProp,
}: {
  data: {
    status: (typeof assetStatuses)[number];
    totalAssets: number;
  }[];
}) {
  const data = React.useMemo(
    () =>
      dataProp.map((d) => ({
        ...d,
        fill: "var(--color-" + d.status + ")",
      })),
    [dataProp]
  );
  const totalAssets = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.totalAssets, 0);
  }, [data]);

  const navigate = useNavigate();

  return (
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
              onClick={(d) => navigate(`/assets?status=${d.payload.status}`)}
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
  );
}
