export const FONT_AWESOME_VERSION = "6.7.2";
export const GENERIC_MANUFACTURER_NAME = "Generic";

export const BANNER_LOGO_LIGHT_URL =
  "https://content.fc-safety.com/fc_safety_shield_logo_full_05x-light.png";
export const BANNER_LOGO_DARK_URL =
  "https://content.fc-safety.com/fc_safety_shield_logo_full_05x-dark.png";

export const ASSET_QUESTION_TONES = {
  NEUTRAL: "NEUTRAL",
  POSITIVE: "POSITIVE",
  NEGATIVE: "NEGATIVE",
} as const;

export const ASSET_QUESTION_TONE_OPTIONS = [
  { label: "Neutral", value: ASSET_QUESTION_TONES.NEUTRAL },
  { label: "Positive", value: ASSET_QUESTION_TONES.POSITIVE },
  { label: "Negative", value: ASSET_QUESTION_TONES.NEGATIVE },
] as const;

export const MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY = "mark-legacy-viewed";
