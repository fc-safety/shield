import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Shield, Warehouse } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { Link } from "react-router";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { AssetInspectionsStatus } from "~/lib/enums";
import type { ResultsPage, Site } from "~/lib/models";
import { DataTable } from "../data-table/data-table";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "./components/dashboard-card";
import EmptyStateOverlay from "./components/empty-state-overlay";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";
import MiniStatusProgressBar from "./components/mini-status-progress-bar";
import { getComplianceHistory } from "./services/stats";

export function ComplianceBySiteChart({ refreshKey }: { refreshKey: number }) {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const {
    data: complianceHistory,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["compliance-history", 1] as const,
    queryFn: ({ queryKey: [, months] }) => getComplianceHistory(fetch, months),
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  const { data: mySites } = useQuery({
    queryKey: ["my-sites-200"],
    queryFn: () => getMySites(fetch).then((r) => r.results),
  });

  const siteRows = React.useMemo(() => {
    if (!mySites || !complianceHistory || !complianceHistory.length) {
      return null;
    }

    const newGrouping: Record<
      string,
      Record<AssetInspectionsStatus, number>
    > = {};

    Object.entries(complianceHistory[0].assetsByComplianceStatus).forEach(
      ([rawStatus, assets]) => {
        assets.forEach((asset) => {
          const status = rawStatus as AssetInspectionsStatus;
          if (!newGrouping[asset.site.id]) {
            newGrouping[asset.site.id] = {
              COMPLIANT_DUE_LATER: 0,
              COMPLIANT_DUE_SOON: 0,
              NON_COMPLIANT_INSPECTED: 0,
              NON_COMPLIANT_NEVER_INSPECTED: 0,
            };
          }
          newGrouping[asset.site.id][status] += 1;
        });
      }
    );

    return mySites.map(({ id: siteId, name: siteName }) => {
      const assetsByStatus = newGrouping[siteId];
      if (!assetsByStatus) {
        return {
          id: siteId,
          name: siteName,
          score: 0,
          totalAssets: 0,
        };
      }

      const totalCompliant =
        assetsByStatus.COMPLIANT_DUE_LATER + assetsByStatus.COMPLIANT_DUE_SOON;
      const totalNonCompliant =
        assetsByStatus.NON_COMPLIANT_INSPECTED +
        assetsByStatus.NON_COMPLIANT_NEVER_INSPECTED;
      const total = totalCompliant + totalNonCompliant;
      const score = total ? totalCompliant / total : 0;

      return {
        id: siteId,
        name: siteName,
        score,
        totalAssets: total,
      };
    });
  }, [mySites, complianceHistory]);

  const columns = React.useMemo((): ColumnDef<
    NonNullable<typeof siteRows>[number]
  >[] => {
    return [
      {
        header: "Site",
        accessorKey: "name",
      },
      {
        header: "Assets",
        accessorKey: "totalAssets",
        // size: 50,
        meta: {
          align: "right",
        },
      },
      {
        header: "Score",
        accessorKey: "score",
        // size: 100,
        meta: {
          align: "right",
        },
        cell: ({ row }) => <MiniStatusProgressBar value={row.original.score} />,
      },
      {
        id: "details",
        cell: ({ row }) => (
          <Link to={`/assets?siteId=${row.original.id}`}>
            <ChevronRight className="size-4.5 text-primary" />
          </Link>
        ),
      },
    ];
  }, []);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          <Shield />+<Warehouse /> Compliance by Site
          <div className="flex-1"></div>
          {/* <Button variant="outline" size="iconSm">
            <Printer />
          </Button> */}
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="min-h-0 flex-1 flex flex-col bg-inherit rounded-[inherit]">
        <DataTable
          columns={columns}
          data={siteRows ?? []}
          hidePagination
          initialState={{
            pagination: {
              pageIndex: 0,
              pageSize: siteRows?.length ?? 1000,
            },
            sorting: [{ id: "score", desc: false }],
          }}
          classNames={{
            container: "max-h-full",
          }}
        />
      </DashboardCardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading assets.</ErrorOverlay>
      ) : mySites && mySites.length === 0 ? (
        <EmptyStateOverlay>No sites to display assets for.</EmptyStateOverlay>
      ) : null}
    </DashboardCard>
  );
}

const getMySites = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/sites?limit=200&subsites[none]=", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Site>>;
};
