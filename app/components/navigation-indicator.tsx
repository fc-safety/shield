import { AnimatePresence, motion } from "framer-motion";
import { useNavigation } from "react-router";

/**
 * Navigation indicator component that displays a thin loading bar at the top
 * of the page during navigation. Uses Framer Motion for smooth animations.
 *
 * Features:
 * - Thin 2px height bar at the top of the viewport
 * - Smooth shimmer animation that moves across the bar
 * - Automatically appears during navigation and disappears when complete
 * - Uses theme colors for consistent styling
 */
export function NavigationIndicator() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading" || navigation.state === "submitting";

  return (
    <AnimatePresence mode="wait">
      {isNavigating && (
        <motion.div
          className="fixed top-0 right-0 left-0 z-[9999] h-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Background bar - more visible base */}
          <div className="bg-primary/30 h-full w-full" />

          {/* Animated shimmer effect - wider gradient that travels fully across */}
          <motion.div
            className="absolute top-0 left-0 h-full w-1/2"
            initial={{ x: "-50%" }}
            animate={{ x: "150%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
