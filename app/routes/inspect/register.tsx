import { motion } from "framer-motion";
import { CircleSlash } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { catchResponse } from "~/.server/api-utils";
import { validateInspectionSession } from "~/.server/inspections";
import AssetCombobox from "~/components/assets/asset-combobox";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import {
  registerTagSchemaResolver,
  type registerTagSchema,
} from "~/lib/schema";
import { can } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/register";
import SuccessCircle from "./components/success-circle";

export const handle = {
  breadcrumb: () => ({ label: "Register Tag" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { inspectionToken } = await validateInspectionSession(request);

  const {
    data: { data: tag },
  } = await catchResponse(
    api.tags.checkRegistration(request, inspectionToken),
    {
      codes: [404],
    }
  );

  return { tag, inspectionToken };
};

type TForm = z.infer<typeof registerTagSchema>;

export default function InspectRegister({
  loaderData: { tag, inspectionToken },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canRegister = can(user, "register", "tags");

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [recentlyRegistered, setRecentlyRegistered] = useState(false);

  const form = useForm<TForm>({
    resolver: registerTagSchemaResolver,
    defaultValues: {
      asset: {
        connect: {
          id: tag?.asset?.id ?? "",
        },
      },
    },
  });

  const {
    formState: { isValid },
  } = form;

  const { submitJson: submitRegisterTag, isSubmitting } = useModalFetcher();

  const handleSubmit = (data: TForm) => {
    setRecentlyRegistered(true);
    submitRegisterTag(data, {
      method: "POST",
      path: "/api/proxy/tags/register-tag",
      query: {
        _inspectionToken: inspectionToken,
      },
    });
  };

  return (
    <div className="flex flex-col justify-center items-center gap-2 h-full w-full max-w-sm self-center">
      {tag?.asset ? (
        <>
          <SuccessCircle />
          <h2 className="text-lg font-semibold">
            This tag is {recentlyRegistered ? "now" : "already"} registered to
            an asset.
          </h2>
          <Button asChild>
            <Link to="/inspect">Begin Inspection</Link>
          </Button>
        </>
      ) : (
        <>
          <CircleSlash className="size-16 text-destructive" />
          <h2 className="text-lg font-semibold">
            This tag is not registered to an asset.
          </h2>
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="w-full grid gap-4"
            >
              {showRegistrationForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.1 }}
                  className="overflow-hidden w-full grid gap-4"
                >
                  <FormField
                    control={form.control}
                    name="asset.connect.id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Which asset is this tag for?</FormLabel>
                        <FormControl>
                          <AssetCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            className="w-full"
                            onBlur={field.onBlur}
                            optionQueryFilter={{
                              tagId: "_NULL",
                            }}
                            showClear={false}
                            viewContext="user"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
              {!canRegister && (
                <p className="text-center text-sm text-destructive">
                  You do not have permission to register tags.
                </p>
              )}
              {showRegistrationForm ? (
                <Button
                  key="submit-button"
                  type="submit"
                  disabled={!isValid || isSubmitting || !canRegister}
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>
              ) : (
                <Button
                  key="open-form-button"
                  type="button"
                  onClick={() => setShowRegistrationForm(true)}
                  disabled={!canRegister}
                >
                  Register Tag
                </Button>
              )}
            </form>
          </FormProvider>
        </>
      )}
    </div>
  );
}
