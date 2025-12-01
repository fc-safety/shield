import { RouteOff } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

export default function InspectionRoutesIndex() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouteOff />
        </EmptyMedia>
        <EmptyTitle>No inspection route selected.</EmptyTitle>
        <EmptyDescription>Please select an inspection route to view its details.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
