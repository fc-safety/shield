import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useFetcher, type To } from "react-router";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type {
  Asset,
  InspectionRoute,
  InspectionRoutePoint,
  ResultsPage,
} from "~/lib/models";
import {
  createInspectionRoutePointSchema,
  updateInspectionRoutePointSchema,
} from "~/lib/schema";
import { buildPath } from "~/lib/urls";
import AssetCombobox from "../assets/asset-combobox";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type TForm = z.infer<
  | typeof updateInspectionRoutePointSchema
  | typeof createInspectionRoutePointSchema
> & {
  routeId?: string;
};
export interface RoutePointDetailsFormProps {
  route?: InspectionRoute;
  asset?: Asset;
  routePoint?: InspectionRoutePoint;
  onSubmitted?: () => void;
  filterRoute?: (route: InspectionRoute) => boolean;
  linkToRoutes?: To;
}

const createInspectionRouteSchemaResolver = zodResolver(
  createInspectionRoutePointSchema as z.Schema<TForm>
);
const updateInspectionRouteSchemaResolver = zodResolver(
  updateInspectionRoutePointSchema as z.Schema<TForm>
);

const FORM_DEFAULTS = {
  order: 0,
  assetId: "",
} satisfies TForm;

export default function RoutePointDetailsForm({
  route: routeProp,
  asset: assetProp,
  routePoint,
  onSubmitted,
  filterRoute,
  linkToRoutes = "routes",
}: RoutePointDetailsFormProps) {
  const isNew = !routePoint;
  const fetcher = useFetcher<ResultsPage<InspectionRoute>>();
  const [routesLoading, setRoutesLoading] = useState(true);

  const loadRoutes = useCallback(() => {
    if (fetcher.state === "idle") {
      fetcher.load(
        buildPath("/api/proxy/inspection-routes", {
          limit: 10000,
          siteId: assetProp?.siteId,
        })
      );
    }
  }, [fetcher]);

  const preloadRoutes = useCallback(() => {
    if (!fetcher.data) {
      loadRoutes();
    }
  }, [fetcher, loadRoutes]);

  useEffect(() => {
    if (!routeProp) {
      preloadRoutes();
    }
  }, [preloadRoutes, routeProp]);

  const [routes, setRoutes] = useState<InspectionRoute[]>([]);

  useEffect(() => {
    if (fetcher.data) {
      setRoutes(fetcher.data.results.filter(filterRoute ?? (() => true)));
      setRoutesLoading(false);
    }
  }, [fetcher.data, filterRoute]);

  const form = useForm<TForm>({
    resolver: isNew
      ? createInspectionRouteSchemaResolver
      : updateInspectionRouteSchemaResolver,
    values: isNew
      ? {
          ...FORM_DEFAULTS,
          routeId: routeProp?.id,
          assetId: assetProp?.id ?? "",
        }
      : routePoint,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const routeId = watch("routeId");

  const route = useMemo(() => {
    if (routeProp) return routeProp;
    if (routeId) return routes.find((r) => r.id === routeId);
    return undefined;
  }, [routeProp, routeId, routes]);

  useEffect(() => {
    if (!route?.inspectionRoutePoints) return;
    const proposedOrderNumber =
      (route.inspectionRoutePoints.sort((a, b) => a.order - b.order).at(-1)
        ?.order ?? -1) + 1;
    form.setValue("order", proposedOrderNumber);
  }, [route?.inspectionRoutePoints, form]);

  const includedAssetIds = useMemo(() => {
    if (!route?.inspectionRoutePoints) return new Set<string>();
    return new Set(route.inspectionRoutePoints.map((point) => point.assetId));
  }, [route?.inspectionRoutePoints]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/inspection-routes/${routeId}/points`,
      id: routePoint?.id,
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <Input type="hidden" {...form.register("order")} hidden />

        {!routeProp &&
          (routesLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : routes.length > 0 ? (
            <FormField
              control={form.control}
              name="routeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Select a route"
                          onBlur={field.onBlur}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Button
                    type="button"
                    title="Refresh"
                    variant="outline"
                    size="xs"
                    onClick={loadRoutes}
                  >
                    Refresh Routes
                    <RotateCw />
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="flex flex-col items-center text-sm text-muted-foreground my-4">
              <div>No new routes available for this asset.</div>
              <Button
                type="button"
                title="Refresh"
                variant="outline"
                size="xs"
                onClick={loadRoutes}
              >
                Refresh Routes
                <RotateCw />
              </Button>
              <Button variant="link" asChild>
                <Link to={linkToRoutes} target="_blank" rel="noreferrer">
                  Create a new route <ExternalLink />
                </Link>
              </Button>
            </div>
          ))}

        {!assetProp && (
          <FormField
            control={form.control}
            name="assetId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <FormControl>
                  <AssetCombobox
                    className="w-full"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    optionFilter={(asset) => !includedAssetIds.has(asset.id)}
                    disabled={!route}
                    siteId={route?.siteId}
                    optionQueryFilter={{
                      siteId: route?.siteId,
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          disabled={
            !routeId || isSubmitting || (!isNew && !isDirty) || !isValid
          }
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
