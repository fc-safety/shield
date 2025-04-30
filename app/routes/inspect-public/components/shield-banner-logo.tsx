import { BANNER_LOGO_LIGHT_URL } from "~/lib/constants";

import { BANNER_LOGO_DARK_URL } from "~/lib/constants";
import { cn } from "~/lib/utils";

export default function ShieldBannerLogo({
  className,
}: {
  className?: string;
}) {
  return (
    <>
      <img
        src={BANNER_LOGO_LIGHT_URL}
        alt="FC Safety Shield"
        className={cn("w-64 dark:hidden", className)}
      />
      <img
        src={BANNER_LOGO_DARK_URL}
        alt="FC Safety Shield"
        className={cn("w-64 hidden dark:block", className)}
      />{" "}
    </>
  );
}
