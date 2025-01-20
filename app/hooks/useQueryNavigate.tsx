import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";

export const useQueryNavigate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const setQuery = useCallback(
    (
      params: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)
    ) => {
      const newSearchParams =
        typeof params === "function" ? params(searchParams) : params;
      navigate(`?${newSearchParams.toString()}`);
    },
    [searchParams, navigate]
  );

  return { setQuery, query: searchParams };
};
