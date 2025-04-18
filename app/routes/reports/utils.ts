export const downloadReportCsv = async (
  fetcher: typeof fetch,
  reportId: string
) => {
  const response = await fetcher(`/reports/${reportId}/csv`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Create an anchor element to trigger download
  const a = document.createElement("a");
  a.href = url;

  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch =
    contentDisposition && contentDisposition.match(/filename="?([^"]*)"?/);
  const filename = filenameMatch ? filenameMatch[1] : `report-${reportId}.csv`;

  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};
