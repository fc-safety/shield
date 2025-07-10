import { createContext, useContext } from "react";

export interface OptimizedImageUrls {
  bannerLogoLight: {
    h24px: string;
  };
  bannerLogoDark: {
    h24px: string;
  };
}

const OptimizedImageContext = createContext<{
  optimizedImageUrls: OptimizedImageUrls;
} | null>(null);

export const OptimizedImageProvider = ({
  optimizedImageUrls,
  children,
}: {
  optimizedImageUrls: OptimizedImageUrls;
  children: React.ReactNode;
}) => {
  return (
    <OptimizedImageContext.Provider value={{ optimizedImageUrls }}>
      {children}
    </OptimizedImageContext.Provider>
  );
};

export const useOptimizedImageUrls = () => {
  const context = useContext(OptimizedImageContext);
  if (!context) {
    throw new Error(
      "useOptimizedImageUrls must be used within a OptimizedImageProvider"
    );
  }
  return context.optimizedImageUrls;
};

export const useOptimizedImageUrl = (key: keyof OptimizedImageUrls) => {
  const optimizedImageUrls = useOptimizedImageUrls();
  return optimizedImageUrls[key];
};
