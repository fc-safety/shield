import { queryOptions } from "@tanstack/react-query";
import type { Invitation, InvitationValidation } from "../types";
import { buildPath } from "../urls";

interface ListInvitationsOptions {
  status?: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  limit?: number;
  offset?: number;
}

interface ListInvitationsResult {
  results: Invitation[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Query options for listing invitations.
 */
export const getInvitationsQueryOptions = (
  fetcher: typeof fetch,
  options?: ListInvitationsOptions
) =>
  queryOptions({
    queryKey: [
      "invitations",
      {
        status: options?.status,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/invitations", queryKey[1])).then(
        (r) => r.json() as Promise<ListInvitationsResult>
      ),
  });

/**
 * Query options for validating an invitation code (public endpoint).
 */
export const getInvitationValidationQueryOptions = (
  fetcher: typeof fetch,
  code: string
) =>
  queryOptions({
    queryKey: ["invitations", "validate", code] as const,
    queryFn: () =>
      fetcher(buildPath("/invitations/validate/:code", { code })).then(
        (r) => r.json() as Promise<InvitationValidation>
      ),
    retry: false, // Don't retry on 404/410
  });

/**
 * Create a new invitation.
 */
export interface CreateInvitationInput {
  clientId?: string;
  email?: string;
  roleId?: string;
  siteId?: string;
  expiresInDays?: number;
}

export const createInvitation = async (
  fetcher: typeof fetch,
  input: CreateInvitationInput
): Promise<Invitation> => {
  const response = await fetcher(buildPath("/invitations"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw response;
  }

  return response.json();
};

/**
 * Accept an invitation.
 */
export interface AcceptInvitationResult {
  success: boolean;
  clientAccess: {
    id: string;
    clientId: string;
    client: { id: string; name: string; externalId: string };
    role?: { id: string; name: string };
    site?: { id: string; name: string };
  };
}

export const acceptInvitation = async (
  fetcher: typeof fetch,
  code: string
): Promise<AcceptInvitationResult> => {
  const response = await fetcher(
    buildPath("/invitations/:code/accept", { code }),
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw response;
  }

  return response.json();
};

/**
 * Revoke an invitation.
 */
export const revokeInvitation = async (
  fetcher: typeof fetch,
  id: string
): Promise<void> => {
  const response = await fetcher(buildPath("/invitations/:id", { id }), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw response;
  }
};
