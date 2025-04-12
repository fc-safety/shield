import { useEffect, useState } from "react";
import { useTheme } from "remix-themes";
import { getThemeValues } from "~/lib/theme";

/**
 * Returns the theme values for the current theme.
 *
 * Designed to be used client side to get theme values in circumstances
 * where normal CSS variables are not valid.
 *
 * @returns The theme values for the current theme.
 */
export function useThemeValues() {
  const [theme] = useTheme();

  const [themeValues, setThemeValues] = useState<ReturnType<
    typeof getThemeValues
  > | null>(null);

  useEffect(() => {
    setThemeValues(getThemeValues());
  }, [theme]);

  return themeValues;
}
