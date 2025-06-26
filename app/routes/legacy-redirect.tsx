import {
  ArrowRight,
  BarChart,
  CheckCircle,
  Lock,
  MessageCircle,
  Palette,
  RefreshCw,
  Shield,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { redirect } from "react-router";
import { appStateSessionStorage } from "~/.server/sessions";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY } from "~/lib/constants";
import { cn, getSearchParam, getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/legacy-redirect";

export const action = async ({ request }: Route.ActionArgs) => {
  const returnTo = getSearchParam(request, "returnTo") ?? "/";

  let init: ResponseInit = {};
  const searchParams = getSearchParams(request);
  if (searchParams.has(MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY)) {
    const appStateSession = await appStateSessionStorage.getSession(
      request.headers.get("cookie")
    );

    // Mark the legacy redirect as viewed, unless set explicitly to false. This is used
    // by other pages to prevent this page from being shown repeatedly.
    appStateSession.set(
      "show_legacy_redirect",
      searchParams.get(MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY) === "false"
    );

    init.headers = {
      "Set-Cookie": await appStateSessionStorage.commitSession(appStateSession),
    };
  }

  return redirect(returnTo, init);
};

export default function LegacyRedirect() {
  return (
    <div className="bg-background w-full h-full min-h-svh flex flex-col">
      <Header showBreadcrumb={false} className="pb-2" />
      <main className="flex flex-col items-stretch grow">
        <PageSection>
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 inline w-max text-primary text-xs">
            <CheckCircle className="size-4 inline mr-1 animate-pop-once" />
            <span className="align-middle font-semibold">Account migrated</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center">
            Welcome to the Newly Upgraded{" "}
            <span className="text-primary">FC Safety Shield</span>
          </h1>
          <p className="text-center text-muted-foreground">
            Your account has been successfully migrated to the new FC Safety
            Shield, a more advanced and secure way to manage your safety assets.
          </p>
          <div className="flex flex-col gap-6 items-center rounded-xl border border-border p-4 self-stretch">
            <div className="text-center flex flex-col gap-1">
              <h3 className="text-xl font-semibold leading-tight">
                Ready to get started?
              </h3>
              <p className="text-center text-muted-foreground text-sm">
                Access your migrated account using your existing credentials.
              </p>
            </div>
            <form method="post">
              <Button type="submit">
                Continue to FC Safety Shield <ArrowRight />
              </Button>
            </form>
            <p className="text-center text-muted-foreground text-sm">
              Use the same username and password as your previous account.
            </p>
          </div>
        </PageSection>
        <PageSection className="bg-secondary">
          <h2 className="text-3xl font-semibold">Migration Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MIGRATION_PROCESS_STEPS.map(
              ({ title, description, icon: Icon }) => (
                <Card key={title}>
                  <CardHeader>
                    <CardTitle className="flex-col gap-4 [&_svg]:size-6">
                      <div className="bg-primary/10 rounded-full size-12 p-2 flex items-center justify-center text-primary">
                        <Icon />
                      </div>{" "}
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center font-light">{description}</p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </PageSection>
        <PageSection>
          <h2 className="text-3xl font-semibold">
            What's New in FC Safety Shield
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NEW_FEATURES.map(
              ({ title, description, icon: Icon, iconColors }) => (
                <Card key={title}>
                  <CardHeader>
                    <CardTitle className="flex-col items-start gap-4 [&_svg]:size-6">
                      <div
                        className={cn(
                          "rounded-md size-12 p-2 flex items-center justify-center",
                          iconColors
                        )}
                      >
                        <Icon />
                      </div>{" "}
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-light">{description}</p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </PageSection>
      </main>
      <Footer />
    </div>
  );
}

const MIGRATION_PROCESS_STEPS: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Data Transferred",
    description:
      "All your safety records, reports, and user data have been securely migrated to the new platform.",
    icon: CheckCircle,
  },
  {
    title: "Teams Preserved",
    description:
      "Your team structure, roles, and permissions have been maintained exactly as before.",
    icon: Users,
  },
  {
    title: "Security Enhanced",
    description:
      "Your account now benefits from advanced security features and encryption protocols.",
    icon: Lock,
  },
];

const NEW_FEATURES: {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColors: string;
}[] = [
  {
    title: "Faster Performance",
    description:
      "Experience 3x faster loading times and improved responsiveness across all features.",
    icon: Zap,
    iconColors: "bg-critical text-critical-foreground",
  },
  {
    title: "Advanced Security",
    description:
      "Your data is now protected with advanced encryption and security protocols.",
    icon: Shield,
    iconColors: "bg-primary text-primary-foreground",
  },
  {
    title: "Quicker Update Cycles",
    description:
      "Stay up-to-date with new features and improvements with our quicker update cycles.",
    icon: RefreshCw,
    iconColors: "bg-info-foreground text-white",
  },
  {
    title: "Enhanced Reporting",
    description:
      "Real-time reporting and analytics to help you make data-driven decisions.",
    icon: BarChart,
    iconColors: "bg-warning text-warning-foreground",
  },
  {
    title: "Modern Design",
    description:
      "Enjoy a sleek, modern design with improved user experience and navigation.",
    icon: Palette,
    iconColors: "bg-audit text-audit-foreground",
  },
  {
    title: "Better Communication",
    description:
      "Stay on track with more informative and better designed emails.",
    icon: MessageCircle,
    iconColors: "bg-info text-info-foreground",
  },
];

const PageSection: React.FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <section
      className={cn(
        "py-18 sm:py-24 px-6 sm:px-8 flex justify-center",
        className
      )}
    >
      <div className="max-w-3xl flex flex-col items-center gap-8">
        {children}
      </div>
    </section>
  );
};
