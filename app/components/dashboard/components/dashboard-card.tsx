import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

export function DashboardCard({
  children,
  className,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={cn("relative flex flex-col", className)} {...props}>
      {children}
    </Card>
  );
}

export function DashboardCardHeader({
  children,
  className,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardHeader
      className={cn("pt-2 pb-1 sm:pt-4 sm:pb-2", className)}
      {...props}
    >
      {children}
    </CardHeader>
  );
}

export function DashboardCardTitle({
  children,
  className,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardTitle
      className={cn("h-8 flex items-center gap-2 flex-wrap w-full", className)}
      {...props}
    >
      {children}
    </CardTitle>
  );
}

export const DashboardCardDescription = CardDescription;
export const DashboardCardContent = CardContent;
export const DashboardCardFooter = CardFooter;
