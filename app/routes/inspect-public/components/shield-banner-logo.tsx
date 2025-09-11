import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";

import { cn } from "~/lib/utils";

export default function ShieldBannerLogo({ className }: { className?: string }) {
  const {
    bannerLogoDark: { h48px: bannerLogoDarkUrl },
    bannerLogoLight: { h48px: bannerLogoLightUrl },
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
        className={cn("hidden w-64 dark:block", className)}
      />{" "}
    </>
  );
}
