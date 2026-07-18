import { formatBytes, savingsPercent } from "../lib/imageInfo";
import type { Dimensions, ResizeItem } from "../types";

const formatDimensions = (dimensions?: Dimensions): string =>
  dimensions ? `${dimensions.width}×${dimensions.height}` : "…";

const StatusBadge = ({ item }: { item: ResizeItem }) => {
  switch (item.status) {
    case "pending":
      return <span className="badge badge--muted">waiting</span>;
    case "processing":
      return (
        <span className="badge badge--busy">
          <span className="spinner" /> resizing
        </span>
      );
    case "error":
      return <span className="badge badge--error">{item.error}</span>;
    case "done":
      return (
        <a className="badge badge--download" href={item.resultUrl} download={item.resultName}>
          ⬇ Download
        </a>
      );
  }
};

/** One image card: source thumbnail, before → after metrics, status/download. */
export const ImageRow = ({ item }: { item: ResizeItem }) => {
  const savings =
    item.status === "done" && item.resultSize !== undefined
      ? savingsPercent(item.originalSize, item.resultSize)
      : null;

  return (
    <li className={`card card--${item.status}`}>
      <img className="card__thumb" src={item.originalUrl} alt="" />

      <div className="card__body">
        <p className="card__name">{item.file.name}</p>

        <div className="card__metrics">
          <span>
            {formatDimensions(item.originalDimensions)}
            {item.status === "done" && (
              <>
                {" → "}
                <b>{formatDimensions(item.resultDimensions)}</b>
              </>
            )}
          </span>
          <span className="card__dot">·</span>
          <span>
            {formatBytes(item.originalSize)}
            {item.status === "done" && item.resultSize !== undefined && (
              <>
                {" → "}
                <b>{formatBytes(item.resultSize)}</b>
              </>
            )}
          </span>
          {savings !== null && savings > 0 && <span className="card__savings">−{savings}%</span>}
        </div>
      </div>

      <div className="card__action">
        <StatusBadge item={item} />
      </div>
    </li>
  );
};
