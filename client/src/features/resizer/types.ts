export type ResizeStatus = "pending" | "processing" | "done" | "error";

/** One image tracked through the resize queue. */
export interface ResizeItem {
  readonly id: string;
  readonly file: File;
  readonly status: ResizeStatus;
  readonly resultUrl?: string;
  readonly resultName?: string;
  readonly error?: string;
}

/** Successful resize response from the API. */
export interface ResizeResult {
  readonly blob: Blob;
  readonly filename: string;
}
