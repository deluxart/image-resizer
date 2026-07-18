import type { Dimensions } from "../types";

/** Decodes an image just enough to read its pixel dimensions. */
export const getDimensions = async (source: Blob): Promise<Dimensions> => {
  const bitmap = await createImageBitmap(source);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close(); // free the decoded bitmap immediately
  return dimensions;
};

/** Human-readable file size (B / KB / MB). */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

/** How much smaller the result is, as a positive percentage (0 if it grew). */
export const savingsPercent = (before: number, after: number): number =>
  before <= 0 ? 0 : Math.max(0, Math.round((1 - after / before) * 100));
