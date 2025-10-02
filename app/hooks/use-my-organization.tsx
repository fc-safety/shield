import { useQuery } from "@tanstack/react-query";
import { useAuth } from "~/contexts/auth-context";
import { getMyOrganizationQueryOptions } from "~/lib/services/clients.service";
import { useAuthenticatedFetch } from "./use-authenticated-fetch";

export default function useMyOrganization() {
  const { user } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data, isLoading, error } = useQuery(getMyOrganizationQueryOptions(fetchOrThrow));

  return {
    client: data?.client,
    site: data?.site,
    isLoading,
    error,
    user,
  };
}
