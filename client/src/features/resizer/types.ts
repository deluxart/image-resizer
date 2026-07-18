export type ResizeStatus = "pending" | "processing" | "done" | "error";

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/** One image tracked through the resize queue, with before/after metadata. */
export interface ResizeItem {
  readonly id: string;
  readonly file: File;
  readonly status: ResizeStatus;
  readonly originalUrl: string; // object URL for the source preview
  readonly originalSize: number; // bytes
  readonly originalDimensions?: Dimensions;
  readonly resultUrl?: string;
  readonly resultName?: string;
  readonly resultSize?: number; // bytes
  readonly resultDimensions?: Dimensions;
  readonly error?: string;
}

/** Successful resize response from the API. */
export interface ResizeResult {
  readonly blob: Blob;
  readonly filename: string;
}
