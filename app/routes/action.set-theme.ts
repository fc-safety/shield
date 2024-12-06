import { createThemeAction } from "remix-themes";
import { themeSessionResolver } from "~/.server/sessions";

export const action = createThemeAction(themeSessionResolver);
