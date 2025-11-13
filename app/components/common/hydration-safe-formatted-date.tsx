import { format, formatISO, type DateArg } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useHydrationSafeDate } from "~/hooks/use-hydration-safe-date";
import { useHydrationSafeLocale } from "~/hooks/use-hydration-safe-locale";
import TextSkeleton from "./text-skeleton";

export default function HydrationSafeFormattedDate({
  date,
  formatStr,
}: {
  date: DateArg<Date>;
  formatStr: string;
}) {
  const hydrationSafeDate = useHydrationSafeDate(date);
  const locale = useHydrationSafeLocale();

  const hydrationSafeDateFormatted = useMemo(
    () => (hydrationSafeDate ? format(hydrationSafeDate, formatStr, { locale }) : null),
    [hydrationSafeDate, formatStr, locale]
  );
  const unsafeDateFormatted = useMemo(
    () => format(date, formatStr, { locale }),
    [date, formatStr, locale]
  );

  const [mounted, setMounted] = useState(false);
  const dateStr = useMemo(() => formatISO(date), [date]);

  const estimatedFormattedDateLength = useMemo(
    () =>
      hydrationSafeDateFormatted ? hydrationSafeDateFormatted.length : unsafeDateFormatted.length,
    [hydrationSafeDateFormatted, unsafeDateFormatted]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <time dateTime={dateStr}>
      {mounted ? (
        unsafeDateFormatted
      ) : hydrationSafeDateFormatted ? (
        hydrationSafeDateFormatted
      ) : (
        <TextSkeleton size={estimatedFormattedDateLength} />
      )}
    </time>
  );
}
