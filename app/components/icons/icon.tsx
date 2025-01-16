import { cn } from "~/lib/utils";

export default function Icon({
  iconId,
  color,
  className,
}: {
  iconId: string;
  color?: string;
  className?: string;
}) {
  return (
    <i
      className={cn(`fa-solid fa-${iconId}`, "text-2xl", className)}
      style={color ? { color } : {}}
    />
  );
}
