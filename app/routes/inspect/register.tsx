import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link } from "react-router";
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
import type { Route } from "./+types/register";
import SuccessCircle from "./components/success-circle";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { inspectionToken, serialNumber, expiresOn, isValid } =
    await validateInspectionSession(request);

  console.debug("expiresOn", {
    expiresOn,
    isValid,
  });

  const {
    data: { data: tag },
  } = await catchResponse(
    api.tags.checkRegistration(request, inspectionToken),
    {
      codes: [404],
    }
  );

  return { tag };
};

type TForm = {
  asset: {
    connect: {
      id: string;
    };
  };
};

export default function InspectRegister({
  loaderData: { tag },
}: Route.ComponentProps) {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const form = useForm<TForm>({
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

  const handleSubmit = (data: TForm) => {
    console.debug("submitting", data);
  };

  return (
    <div className="flex flex-col justify-center items-center h-full">
      {tag?.asset ? (
        <div className="flex flex-col items-center gap-2">
          <SuccessCircle />
          <h2 className="text-lg font-semibold">
            This tag is already registered to an asset.
          </h2>
          <Button asChild>
            <Link to="/inspect">Begin Inspection</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <XCircle className="size-16 text-destructive" />
          <h2 className="text-lg font-semibold">
            This tag is not registered to an asset.
          </h2>
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="w-full max-w-md grid gap-4"
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
              {showRegistrationForm ? (
                <Button key="submit-button" type="submit" disabled={!isValid}>
                  Register
                </Button>
              ) : (
                <Button
                  key="open-form-button"
                  type="button"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  Register Tag
                </Button>
              )}
            </form>
          </FormProvider>
        </div>
      )}
    </div>
  );
}
