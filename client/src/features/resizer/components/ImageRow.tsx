import type { ResizeItem } from "../types";

interface ImageRowProps {
  readonly item: ResizeItem;
}

const StatusLabel = ({ item }: ImageRowProps) => {
  switch (item.status) {
    case "pending":
      return <>waiting</>;
    case "processing":
      return <>resizing…</>;
    case "error":
      return <>error: {item.error}</>;
    case "done":
      return (
        <a href={item.resultUrl} download={item.resultName}>
          ⬇ download
        </a>
      );
  }
};

/** One image in the list with its current status / download link. */
export const ImageRow = ({ item }: ImageRowProps) => (
  <li className={`row ${item.status}`}>
    <span className="name">{item.file.name}</span>
    <span className="status">
      <StatusLabel item={item} />
    </span>
  </li>
);
