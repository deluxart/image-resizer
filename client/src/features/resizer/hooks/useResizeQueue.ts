import { useCallback, useState } from "react";
import { config } from "../../../config";
import { resizeImage } from "../api/resizeImage";
import { getDimensions } from "../lib/imageInfo";
import type { ResizeItem } from "../types";

const isAccepted = (file: File): boolean =>
  (config.acceptedTypes as readonly string[]).includes(file.type);

const revokeUrls = (item: ResizeItem): void => {
  URL.revokeObjectURL(item.originalUrl);
  if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
};

/**
 * Owns all resize-queue logic: holding selected images (with before/after
 * metadata), running them sequentially, and exposing a "processing" flag the
 * UI uses to block uploads. Components stay purely presentational.
 */
export const useResizeQueue = () => {
  const [items, setItems] = useState<ResizeItem[]>([]);
  // Explicit number type: config.defaultPercentage is a literal (`as const`),
  // which would otherwise narrow the setter to that single value.
  const [percentage, setPercentage] = useState<number>(config.defaultPercentage);
  const [isProcessing, setIsProcessing] = useState(false);

  const patchItem = useCallback((id: string, patch: Partial<ResizeItem>): void => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback(
    (files: readonly File[]): void => {
      const room = Math.max(0, config.maxImages - items.length);
      const additions = files
        .filter(isAccepted)
        .slice(0, room)
        .map<ResizeItem>((file) => ({
          id: crypto.randomUUID(),
          file,
          status: "pending",
          originalUrl: URL.createObjectURL(file),
          originalSize: file.size,
        }));

      if (additions.length === 0) return;
      setItems((current) => [...current, ...additions]);

      // Decode source dimensions in the background and fill them in.
      additions.forEach((item) => {
        void getDimensions(item.file)
          .then((dimensions) => patchItem(item.id, { originalDimensions: dimensions }))
          .catch(() => undefined);
      });
    },
    [items.length, patchItem],
  );

  const resizeAll = useCallback(async (): Promise<void> => {
    setIsProcessing(true);
    // Process one image at a time; uploads stay disabled meanwhile.
    for (const item of items) {
      if (item.status === "done") continue;
      patchItem(item.id, { status: "processing", error: undefined });
      try {
        const { blob, filename } = await resizeImage(item.file, percentage);
        const resultDimensions = await getDimensions(blob).catch(() => undefined);
        patchItem(item.id, {
          status: "done",
          resultUrl: URL.createObjectURL(blob),
          resultName: filename,
          resultSize: blob.size,
          resultDimensions,
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
      current.forEach(revokeUrls);
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
