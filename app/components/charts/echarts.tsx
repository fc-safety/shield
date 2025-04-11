// React-ECharts.tsx

import type {
  ECElementEvent,
  ECharts,
  EChartsOption,
  SetOptionOpts,
} from "echarts";
import { getInstanceByDom, init } from "echarts";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { renderer: "canvas" });
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
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      chart?.setOption(option, settings);
    }
  }, [option, settings, theme]); // Whenever theme changes we need to add option and setting due to it being deleted in cleanup function

  useEffect(() => {
    // Update chart
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      loading === true ? chart?.showLoading() : chart?.hideLoading();
    }
  }, [loading, theme]);

  useEffect(() => {
    if (chartRef.current !== null && onClick) {
      const chart = getInstanceByDom(chartRef.current);
      chart?.on("click", onClick);

      return () => {
        chart?.off("click", onClick);
      };
    }
  }, [onClick]);

  useEffect(() => {
    if (chartRef.current !== null && getChart) {
      const chart = getInstanceByDom(chartRef.current);
      if (chart) {
        getChart(chart);
      }
    }
  }, [getChart]);

  return (
    <div
      ref={chartRef}
      className={cn("w-full h-full", className)}
      style={style}
    />
  );
}
