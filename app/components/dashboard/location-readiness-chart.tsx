import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../data-table/data-table";

const data = [
  {
    id: 1,
    site: "World Headquarters",
    city: "Redmond",
    assetCount: 8,
    score: 0,
    status: "error",
  },
  {
    id: 2,
    site: "Irvine",
    city: "Irvine",
    assetCount: 4,
    score: 0,
    status: "error",
  },
  {
    id: 3,
    site: "NYC Office",
    city: "New York",
    assetCount: 1,
    score: 0,
    status: "error",
  },
  {
    id: 4,
    site: "Wrigley",
    city: "Chicago",
    assetCount: 1,
    score: 0,
    status: "error",
  },
  {
    id: 5,
    site: "Alamo",
    city: "San Antonio",
    assetCount: 1,
    score: 0,
    status: "error",
  },
];

const columns: ColumnDef<(typeof data)[number]>[] = [
  {
    accessorKey: "site",
    header: "Site",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "assetCount",
    header: "Assets",
  },
  {
    accessorKey: "score",
    header: "Score",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

export function LocationReadinessChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Location Readiness</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <DataTable data={data} columns={columns} />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
    // <div className="flex flex-col gap-2 sm:gap-4">
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Location Readiness</CardTitle>
    //   </CardHeader>
    //   <CardContent className="flex flex-col gap-2 sm:gap-4">
    //     {data.map((site) => (
    //       <SiteReadinessCard key={site.id} site={site} />
    //     ))}
    //   </CardContent>
    // </Card>
    // </div>
  );
}

// function SiteReadinessCard({ site }: { site: (typeof data)[number] }) {
//   return (
//     <Card className="bg-secondary text-secondary-foreground">
//       <div className="flex space-between w-full">
//         <CardHeader>
//           <CardTitle>{site.site}</CardTitle>
//           <CardDescription>{site.city}</CardDescription>
//         </CardHeader>
//         <div className="grid grid-cols-2 gap-2 sm:gap-4 p-6">
//           <div className="flex flex-col gap-2 items-center w-max justify-self-end">
//             <span className="font-semibold">Status</span>
//             <div className="flex grow items-center">
//               <ShieldCheck className="size-8 text-chart-1" />
//             </div>
//           </div>
//           <div className="flex flex-col gap-2 items-center w-max justify-self-start">
//             <span className="font-semibold">Score</span>
//             <div className="flex grow items-center">{site.score}%</div>
//           </div>
//         </div>
//       </div>
//       <CardFooter></CardFooter>
//     </Card>
//   );
// }
