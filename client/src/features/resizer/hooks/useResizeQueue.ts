import { useCallback, useState } from "react";
import { config } from "../../../config";
import { resizeImage } from "../api/resizeImage";
import type { ResizeItem } from "../types";

const isAccepted = (file: File): boolean =>
  (config.acceptedTypes as readonly string[]).includes(file.type);

/**
 * Owns all resize-queue logic: holding the selected images, running them
 * sequentially (one at a time), and exposing a "processing" flag the UI uses
 * to block uploads until the current batch is done. Components stay purely
 * presentational and read from this hook.
 */
export const useResizeQueue = () => {
  const [items, setItems] = useState<ResizeItem[]>([]);
  const [percentage, setPercentage] = useState(config.defaultPercentage);
  const [isProcessing, setIsProcessing] = useState(false);

  const patchItem = useCallback((id: string, patch: Partial<ResizeItem>): void => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback((files: readonly File[]): void => {
    setItems((current) => {
      const room = config.maxImages - current.length;
      const additions = files
        .filter(isAccepted)
        .slice(0, Math.max(0, room))
        .map<ResizeItem>((file) => ({ id: crypto.randomUUID(), file, status: "pending" }));
      return [...current, ...additions];
    });
  }, []);

  const resizeAll = useCallback(async (): Promise<void> => {
    setIsProcessing(true);
    // Process one image at a time; the UI keeps uploads disabled meanwhile.
    for (const item of items) {
      if (item.status === "done") continue;
      patchItem(item.id, { status: "processing", error: undefined });
      try {
        const { blob, filename } = await resizeImage(item.file, percentage);
        patchItem(item.id, {
          status: "done",
          resultUrl: URL.createObjectURL(blob),
          resultName: filename,
        });
      } catch (error) {
        patchItem(item.id, {
          status: "error",
          error: error instanceof Error ? error.message : "Failed to resize",
        });
      }
    }
    setIsProcessing(false);
  }, [items, percentage, patchItem]);

  const clear = useCallback((): void => {
    setItems((current) => {
      current.forEach((item) => item.resultUrl && URL.revokeObjectURL(item.resultUrl));
      return [];
    });
  }, []);

  const canAddMore = items.length < config.maxImages && !isProcessing;
  const canResize = !isProcessing && items.some((item) => item.status !== "done");

  return {
    items,
    percentage,
    isProcessing,
    canAddMore,
    canResize,
    setPercentage,
    addFiles,
    resizeAll,
    clear,
  } as const;
};
