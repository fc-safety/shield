import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useLoaderData } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { z } from "zod";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { DateRangePicker } from "~/components/date-range-picker";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { buildReportSchema, buildReportSchemaResolver } from "~/lib/schema";
import type { Route } from "./+types/build";

export const handle = {
  breadcrumb: () => ({ label: "Build" }),
};

const reportTypes = ["asset", "inspection", "user", "location"] as const;
const demoReports = [
  { id: "asset", title: "Asset Report", description: "Asset Report" },
  {
    id: "inspection",
    title: "Inspection Report",
    description: "Inspection Report",
  },
  { id: "user", title: "User Report", description: "User Report" },
  { id: "location", title: "Location Report", description: "Location Report" },
];

export const loader = ({ params }: Route.LoaderArgs) => {
  const { id } = params;
  const report = (id && demoReports.find((report) => report.id === id)) || null;
  return {
    report,
  };
};

type TForm = z.infer<typeof buildReportSchema>;

const REPORT_TYPE_COLUMNS: Record<(typeof reportTypes)[number], string[]> = {
  asset: [
    "name",
    "tag",
    "type",
    "site",
    "location",
    "placement",
    "manufacturer",
    "status",
  ],
  inspection: [
    "name",
    "tag",
    "type",
    "site",
    "location",
    "placement",
    "manufacturer",
    "status",
  ],
  user: ["name", "username", "email"],
  location: ["name", "address", "city", "state", "country"],
};

const DEFAULT_REPORT_OPTIONS: TForm = {
  title: "",
  description: "",
  type: "asset",
  columns: REPORT_TYPE_COLUMNS.asset,
};

export default function BuildReport() {
  const { report } = useLoaderData<typeof loader>();

  const form = useRemixForm<TForm>({
    resolver: buildReportSchemaResolver,
    defaultValues: report ?? DEFAULT_REPORT_OPTIONS,
    mode: "onChange",
  });

  const { watch } = form;

  const columns = watch("columns");

  return (
    <div className="grid grid-cols-1 gap-2 sm:gap-4">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Report Options</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportOptionsForm form={form} />
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportPreview
            columns={columns}
            data={[] as Record<string, string>[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportOptionsForm({
  form,
}: {
  form: ReturnType<typeof useRemixForm<TForm>>;
}) {
  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const reportType = watch("type");
  const allColumns = useMemo(
    () => REPORT_TYPE_COLUMNS[reportType],
    [reportType]
  );

  return (
    <Form {...form}>
      <form className="space-y-8" method="post" onSubmit={form.handleSubmit}>
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="type"
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          render={({ field: { onChange, onBlur, ref, ...rest } }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select
                  {...rest}
                  onValueChange={(v) => {
                    onChange(v);
                    form.setValue(
                      "columns",
                      REPORT_TYPE_COLUMNS[v as (typeof reportTypes)[number]]
                    );
                  }}
                >
                  <SelectTrigger className="h-8 capitalize" onBlur={onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {reportTypes.map((option) => (
                      <SelectItem
                        key={option}
                        value={option}
                        className="capitalize"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Columns</FormLabel>
          <div className="flex flex-wrap gap-4 sm:gap-8 w-full">
            {allColumns.map((col) => (
              <FormField
                key={col}
                control={form.control}
                name="columns"
                render={({ field }) => (
                  <FormItem
                    key={col}
                    className="align-middle space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        className="inline align-middle"
                        checked={field.value?.includes(col)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...field.value, col])
                            : field.onChange(
                                field.value?.filter((value) => value !== col)
                              );
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal capitalize">
                      {col}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="(Optional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Range</FormLabel>
              <FormControl>
                <DateRangePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={!isDirty || !isValid}>
          Save
        </Button>
      </form>
    </Form>
  );
}

function ReportPreview<TData extends object>({
  columns: columnsProp,
  data,
}: {
  columns: (keyof TData)[];
  data: TData[];
}) {
  const columns: ColumnDef<TData>[] = columnsProp.map((col) => ({
    accessorKey: col,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={String(col)
          .replace(/(^(\w))|(\s(\w))/g, (c) => c.toUpperCase())
          .trim()}
      />
    ),
  }));

  return <DataTable columns={columns} data={data} />;
}
