import type { GetComplianceHistoryResponse } from "../types/stats";

export const getComplianceHistory = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>,
  months: number
) => {
  const response = await fetch(`/stats/compliance-history?months=${months}`, {
    method: "GET",
  });

  return response.json() as Promise<GetComplianceHistoryResponse>;
};
