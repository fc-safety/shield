import { useCallback } from "react";
import { useNavigate, useSearchParams, type NavigateOptions } from "react-router";

export const useQueryNavigate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const setQuery = useCallback(
    (
      params: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams | void),
      options?: NavigateOptions
    ) => {
      let newParams = searchParams;
      if (typeof params === "function") {
        const fnResult = params(searchParams);
        if (fnResult instanceof URLSearchParams) {
          newParams = fnResult;
        }
      } else {
        newParams = params;
      }
      navigate(`?${newParams.toString()}`, options);
    },
    [searchParams, navigate]
  );

  return { setQuery, query: searchParams };
};
