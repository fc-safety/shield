import { DemoChart1 } from "~/components/demo/demo-chart-1";
import { DemoChart2 } from "~/components/demo/demo-chart-2";

export const handle = {
  breadcrumb: () => ({
    label: "Dashboard",
  }),
};

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 grow">
      <div className="grid auto-rows-min gap-2 sm:gap-4 lg:grid-cols-2 3xl:grid-cols-3">
        <DemoChart1 />
        <DemoChart2 />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
    </div>
  );
}
