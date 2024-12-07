import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  assetManufacturers,
  assetSites,
  assetStatuses,
  assetTypes,
} from "./demo-data";

export const assetSchema = z.object({
  id: z.string().optional(),
  active: z.boolean(),
  type: z.enum(assetTypes),
  tag: z.string(),
  site: z.enum(assetSites),
  location: z.string(),
  placement: z.string(),
  manufactuer: z.enum(assetManufacturers),
  status: z.enum(assetStatuses),
});

export const assetSchemaResolver = zodResolver(assetSchema);
