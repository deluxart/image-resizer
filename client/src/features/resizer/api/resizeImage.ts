import axios from "axios";
import { httpClient } from "../../../shared/api/httpClient";
import type { ResizeResult } from "../types";

const parseFilename = (disposition: string, fallback: string): string =>
  /filename="?([^"]+)"?/i.exec(disposition)?.[1] ?? fallback;

/**
 * Sends one image + percentage to the API and returns the resized image.
 * The API replies with raw image bytes, so we request a Blob. On error the
 * body is a JSON `{ error }` (also delivered as a Blob), which we surface as
 * a readable Error message.
 */
export const resizeImage = async (file: File, percentage: number): Promise<ResizeResult> => {
  const form = new FormData();
  form.append("file", file);
  form.append("percentage", String(percentage));

  try {
    const response = await httpClient.post<Blob>("/api/resize", form, {
      responseType: "blob",
    });

    const disposition = (response.headers["content-disposition"] as string) ?? "";
    return {
      blob: response.data,
      filename: parseFilename(disposition, `resized_${file.name}`),
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      const message = tryReadError(text) ?? `Request failed (${error.response.status})`;
      throw new Error(message);
    }
    throw error;
  }
};

const tryReadError = (text: string): string | null => {
  try {
    return (JSON.parse(text) as { error?: string }).error ?? null;
  } catch {
    return text || null;
  }
};
