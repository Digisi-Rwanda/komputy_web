// Shared by server (data mapping) and client (editors): no "use client" so the server gets the real array.
export interface ThresholdRow { id: string; key: string; label: string; description: string; unit: "months" | "count" | "percent"; group: string }

/** Engine thresholds → editor rows (PD criteria bounds). */
export const THRESHOLD_ROWS: ThresholdRow[] = [
  { id: "PD-04", key: "max_month_gap", label: "Maximum month gap", description: "Largest allowed gap between consecutive reporting months.", unit: "months", group: "PD data" },
  { id: "PD-05", key: "min_transitions", label: "Minimum transitions per segment", description: "Fewer transitions make the matrix unstable.", unit: "count", group: "PD data" },
  { id: "PD-07", key: "stage3_share_min", label: "Minimum Stage 3 share", description: "Lower bound for the share of exposure in Stage 3.", unit: "percent", group: "Portfolio plausibility" },
  { id: "PD-08", key: "stage3_share_max", label: "Maximum Stage 3 share", description: "Upper bound for the share of exposure in Stage 3.", unit: "percent", group: "Portfolio plausibility" },
  { id: "PD-09", key: "cure_rate_min", label: "Minimum cure rate", description: "Cure rates below this are flagged for review.", unit: "percent", group: "Portfolio plausibility" },
  { id: "PD-10", key: "cure_rate_max", label: "Maximum cure rate", description: "Cure rates above this are flagged for review.", unit: "percent", group: "Portfolio plausibility" },
  { id: "PD-06", key: "offbooks_abs_band", label: "Offbooks tolerance band", description: "Allowed absolute swing in the share of loans leaving the book between months.", unit: "percent", group: "PD data" },
];
