export interface WsChatBlock {
  id: number;
  status: "active" | "inactive";
  type: string;
  promptType?: string;
  promptOptions?: { label: string; value: string }[];
  promptValue?: any;
  direction: "incoming" | "outgoing";
  message?: string;
  alertType?: string;
}
