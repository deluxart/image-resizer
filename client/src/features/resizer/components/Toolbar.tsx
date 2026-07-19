import { ScaleSlider } from "./ScaleSlider";

interface ToolbarProps {
  readonly percentage: number;
  readonly isProcessing: boolean;
  readonly canResize: boolean;
  readonly hasItems: boolean;
  readonly count: number;
  readonly maxImages: number;
  readonly onPercentageChange: (value: number) => void;
  readonly onResize: () => void;
  readonly onClear: () => void;
}

/** Scale slider (full width) + a bottom row of actions. Upload lives in the Dropzone. */
export const Toolbar = ({
  percentage,
  isProcessing,
  canResize,
  hasItems,
  count,
  maxImages,
  onPercentageChange,
  onResize,
  onClear,
}: ToolbarProps) => (
  <div className="toolbar">
    <ScaleSlider value={percentage} disabled={isProcessing} onChange={onPercentageChange} />

    <div className="toolbar__row">
      <span className="toolbar__count">
        {count}/{maxImages} images
      </span>
      <div className="toolbar__actions">
        <button className="btn btn--ghost" onClick={onClear} disabled={isProcessing || !hasItems}>
          Clear
        </button>
        <button className="btn btn--primary" onClick={onResize} disabled={!canResize}>
          {isProcessing ? "Resizing…" : "Resize all"}
        </button>
      </div>
    </div>
  </div>
);
