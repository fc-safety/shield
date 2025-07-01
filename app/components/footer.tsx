import { BANNER_LOGO_DARK_URL, BANNER_LOGO_LIGHT_URL } from "~/lib/constants";

export default function Footer() {
  return (
    <footer className="w-full bg-secondary p-4 flex justify-center">
      <div className="w-full bg-secondary p-4 flex flex-col lg:flex-row gap-6 justify-between items-center text-center text-secondary-foreground text-sm">
        <img
          src={BANNER_LOGO_LIGHT_URL}
          alt="FC Safety Shield"
          className="h-4 w-auto dark:hidden"
        />
        <img
          src={BANNER_LOGO_DARK_URL}
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
