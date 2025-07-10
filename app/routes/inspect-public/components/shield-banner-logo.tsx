import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";

import { cn } from "~/lib/utils";

export default function ShieldBannerLogo({
  className,
}: {
  className?: string;
}) {
  const {
    bannerLogoDark: { h24px: bannerLogoDarkUrl },
    bannerLogoLight: { h24px: bannerLogoLightUrl },
  } = useOptimizedImageUrls();

  return (
    <>
      <img
        src={bannerLogoLightUrl}
        alt="FC Safety Shield"
        className={cn("w-64 dark:hidden", className)}
      />
      <img
        src={bannerLogoDarkUrl}
        alt="FC Safety Shield"
        className={cn("w-64 hidden dark:block", className)}
      />{" "}
    </>
  );
}
