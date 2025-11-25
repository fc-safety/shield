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
import { openChat } from "~/lib/contact/utils";
import { cn, getSearchParam, getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/legacy-redirect";

export const action = async ({ request }: Route.ActionArgs) => {
  const returnTo = getSearchParam(request, "returnTo") ?? "/";

  let init: ResponseInit = {};
  const searchParams = getSearchParams(request);
  if (searchParams.has(MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY)) {
    const appStateSession = await appStateSessionStorage.getSession(request.headers.get("cookie"));

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
    <div className="bg-background flex h-full min-h-svh w-full flex-col">
      <Header showBreadcrumb={false} className="pb-2" />
      <main className="flex grow flex-col items-stretch">
        <PageSection>
          <div className="bg-primary/10 border-primary/20 text-primary inline w-max rounded-lg border px-2 py-1 text-xs">
            <CheckCircle className="animate-pop-once mr-1 inline size-4" />
            <span className="align-middle font-semibold">Account migrated</span>
          </div>
          <h1 className="text-center text-4xl font-bold sm:text-5xl md:text-6xl">
            Welcome to the Newly Upgraded <span className="text-primary">FC Safety Shield</span>
          </h1>
          <p className="text-muted-foreground text-center">
            Your account has been successfully migrated to the new FC Safety Shield, a more advanced
            and secure way to manage your safety assets.
          </p>
          <div className="border-border flex flex-col items-center gap-6 self-stretch rounded-xl border p-4">
            <div className="flex flex-col gap-1 text-center">
              <h3 className="text-xl leading-tight font-semibold">Ready to get started?</h3>
              <p className="text-muted-foreground text-center text-sm">
                Access your migrated account by logging in with your new credentials.
              </p>
            </div>
            <form method="post">
              <Button type="submit">
                Continue to FC Safety Shield <ArrowRight />
              </Button>
            </form>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Havne't received your credentials yet?</span>{" "}
              <button
                className="text-primary inline-block hover:underline"
                onClick={() => openChat()}
              >
                Click here to get help.
              </button>
            </div>
          </div>
        </PageSection>
        <PageSection className="bg-secondary">
          <h2 className="text-3xl font-semibold">What's New in FC Safety Shield</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {NEW_FEATURES.map(({ title, description, icon: Icon, iconColors }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className="flex-col items-start gap-4 [&_svg]:size-6">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-md p-2",
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
            ))}
          </div>
        </PageSection>
        <PageSection>
          <h2 className="text-3xl font-semibold">Migration Process</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {MIGRATION_PROCESS_STEPS.map(({ title, description, icon: Icon }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className="flex-col gap-4 [&_svg]:size-6">
                    <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full p-2">
                      <Icon />
                    </div>{" "}
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center font-light">{description}</p>
                </CardContent>
              </Card>
            ))}
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
      "Your organization, assets, and tags have been securely migrated to the new platform.",
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
    description: "Your data is now protected with advanced encryption and security protocols.",
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
    description: "Real-time reporting and analytics to help you make data-driven decisions.",
    icon: BarChart,
    iconColors: "bg-warning text-warning-foreground",
  },
  {
    title: "Modern Design",
    description: "Enjoy a sleek, modern design with improved user experience and navigation.",
    icon: Palette,
    iconColors: "bg-audit text-audit-foreground",
  },
  {
    title: "Better Communication",
    description: "Stay on track with more informative and better designed emails.",
    icon: MessageCircle,
    iconColors: "bg-info text-info-foreground",
  },
];

const PageSection: React.FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <section className={cn("flex justify-center px-6 py-18 sm:px-8 sm:py-24", className)}>
      <div className="flex max-w-3xl flex-col items-center gap-8">{children}</div>
    </section>
  );
};
