import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { useOpenData } from "~/hooks/use-open-data";
import type { AnsiCategory, ResultsPage } from "~/lib/models";
import { cn } from "~/lib/utils";
import { ResponsiveCombobox } from "../responsive-combobox";
import EditAnsiCategoryButton from "./edit-ansi-category-button";

interface AnsiCategoryComboboxProps {
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
}

const fuse = new Fuse([] as AnsiCategory[], { keys: ["name", "description"] });

export default function AnsiCategoryCombobox({
  value,
  onValueChange,
  onBlur,
  className,
}: AnsiCategoryComboboxProps) {
  const createNew = useOpenData();

  const fetcher = useFetcher<ResultsPage<AnsiCategory>>();

  const preloadAnsiCategories = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/proxy/ansi-categories`);
    }
  }, [fetcher]);

  useEffect(() => {
    if (value) preloadAnsiCategories();
  }, [value, preloadAnsiCategories]);

  const [ansiCategories, setAnsiCategories] = useState<AnsiCategory[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (fetcher.data) {
      setAnsiCategories(fetcher.data.results);
    }
  }, [fetcher.data]);

  const options = useMemo(() => {
    let filteredAnsiCategories = ansiCategories;
    if (search) {
      fuse.setCollection(ansiCategories);
      filteredAnsiCategories = fuse.search(search).map((result) => result.item);
    }
    return filteredAnsiCategories.map((ansiCategory) => ({
      label: <AnsiCategoryDisplay ansiCategory={ansiCategory} />,
      value: ansiCategory.id,
    }));
  }, [ansiCategories, search]);

  return (
    <>
      <ResponsiveCombobox
        value={value}
        onValueChange={onValueChange}
        onBlur={onBlur}
        displayValue={(value) => {
          const ansiCategory = ansiCategories.find(
            (ansiCategory) => ansiCategory.id === value
          );

          return ansiCategory ? (
            <AnsiCategoryDisplay ansiCategory={ansiCategory} />
          ) : (
            <>&mdash;</>
          );
        }}
        options={options}
        loading={fetcher.state === "loading"}
        onMouseOver={() => preloadAnsiCategories()}
        onTouchStart={() => preloadAnsiCategories()}
        searchValue={search}
        onSearchValueChange={setSearch}
        className={className}
        shouldFilter={false}
        showClear
        onCreate={() => createNew.openNew()}
      />
      <EditAnsiCategoryButton
        trigger={null}
        open={createNew.open}
        onOpenChange={createNew.setOpen}
      />
    </>
  );
}

export function AnsiCategoryDisplay({
  ansiCategory,
  iconOnly,
  className,
}: {
  ansiCategory: AnsiCategory;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <div className="flex items-center gap-2" title={ansiCategory.name}>
        {ansiCategory.icon ? (
          <div
            style={
              {
                "--ansi-bg": ansiCategory.color ?? "hsl(var(--secondary))",
                "--ansi-icon-color": ansiCategory.color
                  ? "hsl(var(--background))"
                  : "hsl(var(--secondary-foreground))",
              } as React.CSSProperties
            }
            className={cn(
              "text-sm text-[var(--ansi-icon-color)] bg-[var(--ansi-bg)] rounded-sm size-6 flex items-center justify-center"
            )}
          >
            <i className={`fa-solid fa-${ansiCategory.icon}`} />
          </div>
        ) : (
          <div
            className="size-4 rounded-sm"
            style={{ backgroundColor: ansiCategory.color ?? "gray" }}
          />
        )}
        {!iconOnly && ansiCategory.name}
      </div>
    </div>
  );
}
