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
}

export function ReactECharts({
  option,
  className,
  style,
  settings,
  loading,
  theme,
  onClick,
}: ReactEChartsProps): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme, { renderer: "canvas" });
    }

    // Add chart resize listener
    // ResizeObserver is leading to a bit janky UX
    function resizeChart() {
      chart?.resize();
    }
    window.addEventListener("resize", resizeChart);

    // Return cleanup function
    return () => {
      chart?.dispose();
      window.removeEventListener("resize", resizeChart);
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

  return (
    <div
      ref={chartRef}
      className={cn("w-full h-full", className)}
      style={style}
    />
  );
}
