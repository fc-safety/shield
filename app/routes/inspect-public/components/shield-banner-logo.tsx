import { BANNER_LOGO_LIGHT_URL } from "~/lib/constants";

import { BANNER_LOGO_DARK_URL } from "~/lib/constants";

export default function ShieldBannerLogo() {
  return (
    <>
      <img
        src={BANNER_LOGO_LIGHT_URL}
        alt="FC Safety Shield"
        className="w-64 dark:hidden"
      />
      <img
        src={BANNER_LOGO_DARK_URL}
        alt="FC Safety Shield"
        className="w-64 hidden dark:block"
      />{" "}
    </>
  );
}
