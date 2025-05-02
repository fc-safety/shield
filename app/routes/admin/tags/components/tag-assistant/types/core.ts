export const Modes = [
  "preprogram-single",
  "preprogram-batch",
  "batch-register",
] as const;
export type Mode = (typeof Modes)[number];
