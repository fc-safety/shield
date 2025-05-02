import Papa from "papaparse";

export const coerceNumeric = (value: string) => {
  return value.replace(/\D/g, "");
};

export const incrementSerialNumber = (
  serialNumber: string,
  increment: number
) => {
  const trailingNumberMatch = serialNumber.match(/\d+$/);
  if (!trailingNumberMatch) {
    return serialNumber;
  }

  // Serial numbers will typically be all numbers, but may be padded with leading zeroes.
  // Try to preserve the padding when incrementing.
  let padSize: number | null = null;
  if (
    trailingNumberMatch[0].length === serialNumber.length &&
    serialNumber.startsWith("0")
  ) {
    padSize = serialNumber.length;
  }

  const incrementedTrailingNumber =
    parseInt(trailingNumberMatch[0]) + increment;

  if (padSize) {
    return String(incrementedTrailingNumber).padStart(padSize, "0");
  } else {
    return serialNumber.replace(/\d+$/, incrementedTrailingNumber.toString());
  }
};

export const getAssetOptionQueryFilter = (
  siteId: string | undefined,
  assetId: string | undefined
) => {
  if (!siteId) {
    return {};
  }

  const baseFilter = {
    site: {
      id: siteId,
    },
    tagId: "_NULL",
  };

  if (!assetId) {
    return baseFilter;
  }

  return {
    OR: [
      baseFilter,
      {
        id: assetId,
      },
    ],
  };
};

export const extractCsvHeaders = (file: File) =>
  new Promise<string[]>((resolve, reject) =>
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      preview: 1,
      complete: (results) => {
        const rawHeaders = Object.keys(results.data[0]);
        resolve(rawHeaders);
      },
      error: (error) => reject(error),
    })
  );
