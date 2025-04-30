export const generateSignedTagUrl = async (
  fetcher: typeof fetch,
  serialNumber: string,
  externalId?: string
) => {
  const response = await fetcher("/tags/generate-signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ serialNumber, externalId }),
  });
  return response.json() as Promise<{
    serialNumber: string;
    tagUrl: string;
    keyId: string;
    timestamp: string;
  }>;
};

export const exportTagDataAsJson = async (
  fetcher: typeof fetch,
  options: {
    serialNumbers?: string[];
    serialNumberRangeStart?: string;
    serialNumberRangeEnd?: string;
    method: "sequential" | "manual";
  }
) => {
  const response = await getBulkTagDataResponse(fetcher, "json", options);
  await handleNdJsonToJsonFileDownload(response);
};

export const exportTagDataAsCsv = async (
  fetcher: typeof fetch,
  options: {
    serialNumbers?: string[];
    serialNumberRangeStart?: string;
    serialNumberRangeEnd?: string;
    method: "sequential" | "manual";
  }
) => {
  const response = await getBulkTagDataResponse(fetcher, "csv", options);
  await handleTextFileDownload(response, "text/csv", "csv");
};

const getBulkTagDataResponse = async (
  fetcher: typeof fetch,
  format: "csv" | "json",
  {
    serialNumbers,
    serialNumberRangeStart,
    serialNumberRangeEnd,
    method,
  }: {
    serialNumbers?: string[];
    serialNumberRangeStart?: string;
    serialNumberRangeEnd?: string;
    method: "sequential" | "manual";
  }
) => {
  const response = await fetcher("/tags/bulk-generate-signed-url/" + format, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serialNumbers,
      serialNumberRangeStart,
      serialNumberRangeEnd,
      method,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to export tag data", {
      cause: response,
    });
  }

  return response;
};

async function handleTextFileDownload(
  response: Response,
  type: NonNullable<BlobPropertyBag["type"]>,
  extension: string
) {
  if (!response.body) {
    throw new Error("No body in response");
  }

  try {
    const reader = response.body.getReader();

    let received = 0;
    const chunks = [];

    // Read the stream incrementally
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      received += value.length;
    }

    // Combine chunks into a single Blob
    const blob = new Blob(chunks, { type });

    // Create a temporary URL for the Blob
    const urlBlob = window.URL.createObjectURL(blob);

    const fileName = getFileNameFromContentDisposition(
      response.headers.get("Content-Disposition")
    );

    handleDownloadFileFromURL(urlBlob, fileName, extension);

    console.log("Download completed successfully");
  } catch (error) {
    console.error("Error downloading file:", error);
  }
}

async function handleNdJsonToJsonFileDownload(response: Response) {
  if (!response.body) {
    throw new Error("No body in response");
  }

  const reader = response.body.getReader();
  const data = [];

  while (true) {
    const { done, value } = await reader?.read();
    if (done) break;

    let buffer = "";

    const rawData = new TextDecoder().decode(value).trim();
    const splitData = (buffer + rawData).split("\n");
    if (rawData) {
      data.push(
        ...splitData
          .filter(Boolean)
          .map((d) => {
            try {
              return JSON.parse(d);
            } catch (e) {
              buffer = d;
              return null;
            }
          })
          .filter(Boolean)
      );
    }
  }

  const urlBlob = window.URL.createObjectURL(
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
  const fileName = getFileNameFromContentDisposition(
    response.headers.get("Content-Disposition")
  );
  handleDownloadFileFromURL(urlBlob, fileName, "json");
}

const getFileNameFromContentDisposition = (
  contentDisposition: string | null
) => {
  if (!contentDisposition) {
    return undefined;
  }

  return contentDisposition.split("filename=")[1];
};

const handleDownloadFileFromURL = (
  url: string,
  fileName: string | undefined,
  extension: string
) => {
  // Create a temporary anchor element to trigger the download
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || `download.${extension}`;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
