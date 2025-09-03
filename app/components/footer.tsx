import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";

export default function Footer() {
  const {
    bannerLogoDark: { h24px: bannerLogoDarkUrl },
    bannerLogoLight: { h24px: bannerLogoLightUrl },
  } = useOptimizedImageUrls();

  return (
    <footer className="bg-secondary flex w-full justify-center p-4">
      <div className="bg-secondary text-secondary-foreground flex w-full flex-col items-center justify-between gap-6 p-4 text-center text-sm lg:flex-row">
        <img src={bannerLogoLightUrl} alt="FC Safety Shield" className="h-4 w-auto dark:hidden" />
        <img
          src={bannerLogoDarkUrl}
          alt="FC Safety Shield"
          className="hidden h-4 w-auto dark:block"
        />
        <p className="text-sm">
          &copy; {new Date().getFullYear()} FC Safety Shield. All rights reserved.
        </p>
        <p className="text-sm">
          Protected by{" "}
          <a
            href="https://patents.google.com/patent/US12156111B2/en"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            U.S. Patent No. 12,156,111 B2
          </a>
        </p>
      </div>
    </footer>
  );
}
