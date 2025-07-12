import { BANNER_LOGO_LIGHT_URL } from "~/lib/constants";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full w-full items-center justify-center gap-4">
        <img
          src={BANNER_LOGO_LIGHT_URL}
          alt="Shield Logo"
          className="w-96 max-w-[90vw]"
        />
        <div className="text-xl italic animate-pulse">Loading...</div>
      </div>
    </div>
  );
}
