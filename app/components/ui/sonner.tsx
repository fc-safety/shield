import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { useTheme } from "remix-themes";
import { Toaster as Sonner } from "sonner";
import { cn } from "~/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ className, ...props }: ToasterProps) => {
  const [theme] = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group", className)}
      icons={{
        success: <CheckCircleIcon className="text-primary animate-pop-once size-4" />,
        error: <XCircleIcon className="text-destructive size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        info: <InfoIcon className="size-4" />,
        warning: <AlertTriangleIcon className="text-important size-4" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
