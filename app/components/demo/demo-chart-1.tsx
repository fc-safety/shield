import { TrendingUp } from "lucide-react";
import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
const chartData = [
  { status: "ready", totalAssets: 48, fill: "var(--color-ready)" },
  { status: "overdue", totalAssets: 12, fill: "var(--color-overdue)" },
  { status: "expired", totalAssets: 3, fill: "var(--color-expired)" },
  { status: "never", totalAssets: 21, fill: "var(--color-never)" },
];

const chartConfig = {
  totalAssets: {
    label: "Total Assets",
  },
  ready: {
    label: "Ready",
    color: "hsl(var(--chart-status-ready))",
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--chart-status-overdue))",
  },
  expired: {
    label: "Expired",
    color: "hsl(var(--chart-status-expired))",
  },
  never: {
    label: "Never",
    color: "hsl(var(--chart-status-never))",
  },
} satisfies ChartConfig;

export function DemoChart1() {
  const totalAssets = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalAssets, 0);
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Inspection Scorecard</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="totalAssets"
              nameKey="status"
              innerRadius={80}
              strokeWidth={5}
            >
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
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
