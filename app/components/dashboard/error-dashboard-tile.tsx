import BlankDashboardTile from "./blank-dashboard-tile";

export default function ErrorDashboardTile() {
  return (
    <BlankDashboardTile>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground">Error</div>
        </div>
      </div>
    </BlankDashboardTile>
  );
}
