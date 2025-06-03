export interface AssetRow {
  id: string;
  name: string;
  createdOn: string;
  site: {
    id: string;
    name: string;
  };
  product: {
    productCategory: {
      id: string;
      name: string;
      shortName: string | null;
    };
  };
  inspections: {
    id: string;
    createdOn: string;
  }[];
}

interface ComplianceHistoryRecord {
  endDate: string;
  assetsByComplianceStatus: {
    COMPLIANT_DUE_LATER: AssetRow[];
    COMPLIANT_DUE_SOON: AssetRow[];
    NON_COMPLIANT_INSPECTED: AssetRow[];
    NON_COMPLIANT_NEVER_INSPECTED: AssetRow[];
  };
  totalAssets: number;
  totalCompliant: number;
  totalNonCompliant: number;
}

export type GetComplianceHistoryResponse = ComplianceHistoryRecord[];
