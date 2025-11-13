import { format, formatDistanceToNow, formatISO, type DateArg, type Locale } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useHydrationSafeDate } from "~/hooks/use-hydration-safe-date";
import { useHydrationSafeLocale } from "~/hooks/use-hydration-safe-locale";
import TextSkeleton from "./common/text-skeleton";

export default function DisplayRelativeDate({
  date,
  className,
}: {
  date: DateArg<Date>;
  className?: string;
}) {
  const hydrationSafeDate = useHydrationSafeDate(date);
  const locale = useHydrationSafeLocale();

  const hydrationSafeDateFormatted = useMemo(
    () => (hydrationSafeDate ? fromNow(hydrationSafeDate, locale) : null),
    [hydrationSafeDate, date, locale]
  );
  const unsafeDateFormatted = useMemo(() => fromNow(date, locale), [date, locale]);

  const dateStr = useMemo(() => formatISO(date), [date]);
  const estimatedDistanceFormattedDateLength = useMemo(
    () =>
      hydrationSafeDateFormatted ? hydrationSafeDateFormatted.length : unsafeDateFormatted.length,
    [hydrationSafeDateFormatted, unsafeDateFormatted]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <time
      dateTime={dateStr}
      title={mounted ? format(date, "PPpp") : undefined}
      className={className}
    >
      {mounted ? (
        unsafeDateFormatted
      ) : hydrationSafeDateFormatted ? (
        hydrationSafeDateFormatted
      ) : (
        <TextSkeleton size={estimatedDistanceFormattedDateLength} className={className} />
      )}
    </time>
  );
}

const fromNow = (date: DateArg<Date>, locale?: Locale) => {
  return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true, locale });
};
