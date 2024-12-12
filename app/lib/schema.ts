import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  assetManufacturers,
  assetSites,
  assetStatuses,
  assetTypes,
  reportTypes,
} from "./demo-data";

export const assetSchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  type: z.enum(assetTypes),
  tag: z.string(),
  site: z.enum(assetSites),
  location: z.string(),
  placement: z.string(),
  manufacturer: z.enum(assetManufacturers),
  status: z.enum(assetStatuses),
});

export const assetSchemaResolver = zodResolver(assetSchema);

export const buildReportSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(reportTypes),
  columns: z.array(z.string()),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
});

export const buildReportSchemaResolver = zodResolver(buildReportSchema);
