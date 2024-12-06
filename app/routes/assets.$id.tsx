import {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ShieldCheck } from "lucide-react";
import { PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import AssetDetailsForm from "~/components/assets/asset-details-form";
import AssetHistoryLogs from "~/components/assets/asset-history-logs";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { demoAssetHistoryLogs, demoAssets } from "~/lib/demo-data";

export const handle = {
  breadcrumb: () => ({ label: "Details" }),
};

export const action: ActionFunction = async (data: ActionFunctionArgs) => {
  console.debug(await data.request.formData());
  return null;
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  const asset = demoAssets.find((asset) => asset.id === id);

  if (!asset) {
    throw new Response("Asset not found", { status: 404 });
  }

  return {
    asset,
    historyLogs: demoAssetHistoryLogs,
  };
};

export default function AssetDetails() {
  const { asset, historyLogs } = useLoaderData<typeof loader>();

  const notificationsForm = useForm({
    defaultValues: {
      recipients: "",
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AuxiliaryCard title="Compliance">
        <div className="flex flex-col items-center gap-2 h-full pt-2">
          <ShieldCheck className="text-primary size-16" />
          <p className="text-muted-foreground text-center text-xs">
            Fully Compliant
          </p>
        </div>
      </AuxiliaryCard>{" "}
      <AuxiliaryCard title="Order Requests">
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs">
            No active order requests.
          </p>
          <Button type="submit" variant="secondary">
            Create Order Request
          </Button>
        </div>
      </AuxiliaryCard>
      <AuxiliaryCard title="Notifications">
        <Form {...notificationsForm}>
          <form className="space-y-4" onSubmit={() => {}}>
            <FormField
              control={notificationsForm.control}
              name="recipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="secondary">
              Send
            </Button>
          </form>
        </Form>
      </AuxiliaryCard>
      <AuxiliaryCard title="Inspection Route">
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs">
            No route has been configured yet for this asset.
          </p>
          <Button type="submit" variant="secondary">
            Create New Route
          </Button>
        </div>
      </AuxiliaryCard>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetDetailsForm asset={asset} />
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetHistoryLogs historyLogs={historyLogs} />
        </CardContent>
      </Card>
    </div>
  );
}

function AuxiliaryCard({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <Card className="col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
