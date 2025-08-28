import { Loader2 } from "lucide-react";
import { BANNER_LOGO_LIGHT_URL } from "~/lib/constants";

export default function SplashScreen() {
  return (
    <div style={styles.container}>
      <img src={BANNER_LOGO_LIGHT_URL} alt="Shield Logo" style={styles.bannerLogo} />
      <div style={styles.loader}>
        <Loader2 />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "var(--background)",
    zIndex: 50,
  },
  bannerLogo: {
    width: "90vw",
    maxWidth: "325px",
  },
  loader: {
    fontSize: "1.25rem",
    fontStyle: "italic",
    animation: "spin 1.2s infinite",
    color: "var(--muted-foreground)",
  },
};
