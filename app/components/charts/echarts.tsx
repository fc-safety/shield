// React-ECharts.tsx

import type {
  ECElementEvent,
  ECharts,
  EChartsOption,
  SetOptionOpts,
} from "echarts";
import { init } from "echarts";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

export interface ReactEChartsProps {
  option: EChartsOption;
  className?: string;
  style?: React.CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: "light" | "dark";
  onClick?: (event: ECElementEvent) => void;
  getChart?: (chart: ECharts) => void;
}

export function ReactECharts({
  option,
  className,
  style,
  settings,
  loading,
  theme,
  onClick,
  getChart,
}: ReactEChartsProps): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<ECharts | undefined>(undefined);

  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { renderer: "canvas" });
      setChart(chart);
    }

    // Observe changes in chart container size and resize chart
    // as needed.
    function resizeChart() {
      chart?.resize();
    }
    const resizeObserver = new ResizeObserver(resizeChart);
    let unobserve: () => void;
    if (chartRef.current) {
      const element = chartRef.current;
      resizeObserver.observe(element);
      unobserve = () => resizeObserver.unobserve(element);
    }

    // Return cleanup function
    return () => {
      chart?.dispose();
      unobserve?.();
    };
  }, [theme]);

  useEffect(() => {
    // Update chart
    chart?.setOption(option, settings);
  }, [chart, option, settings]);

  useEffect(() => {
    // Update chart
    loading === true ? chart?.showLoading() : chart?.hideLoading();
  }, [chart, loading]);

  useEffect(() => {
    if (chart && onClick) {
      chart.on("click", onClick);

      return () => {
        chart.off("click", onClick);
      };
    }
  }, [chart, onClick]);

  useEffect(() => {
    if (chart && getChart) {
      getChart(chart);
    }
  }, [getChart, chart]);

  return (
    <div
      ref={chartRef}
      className={cn("w-full h-full", className)}
      style={style}
    />
  );
}
