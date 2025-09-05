export const Modes = [
  "preprogram-single",
  "preprogram-batch",
  "batch-register",
  "register-to-asset",
] as const;
export type Mode = (typeof Modes)[number];
