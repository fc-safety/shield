import { useOptimizedImageUrls } from "~/contexts/optimized-image-context";

export default function Footer() {
  const {
    bannerLogoDark: { h24px: bannerLogoDarkUrl },
    bannerLogoLight: { h24px: bannerLogoLightUrl },
  } = useOptimizedImageUrls();

  return (
    <footer className="w-full bg-secondary p-4 flex justify-center">
      <div className="w-full bg-secondary p-4 flex flex-col lg:flex-row gap-6 justify-between items-center text-center text-secondary-foreground text-sm">
        <img
          src={bannerLogoLightUrl}
          alt="FC Safety Shield"
          className="h-4 w-auto dark:hidden"
        />
        <img
          src={bannerLogoDarkUrl}
          alt="FC Safety Shield"
          className="h-4 w-auto hidden dark:block"
        />
        <p className="text-sm">
          &copy; {new Date().getFullYear()} FC Safety Shield. All rights
          reserved.
        </p>
        <p className="text-sm">
          Protected by{" "}
          <a
            href="https://patents.google.com/patent/US12156111B2/en"
            target="_blank"
            className="underline"
          >
            U.S. Patent No. 12,156,111 B2
          </a>
        </p>
      </div>
    </footer>
  );
}
