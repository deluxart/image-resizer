import { ScaleSlider } from "./ScaleSlider";

interface ToolbarProps {
  readonly percentage: number;
  readonly isProcessing: boolean;
  readonly canResize: boolean;
  readonly hasItems: boolean;
  readonly onPercentageChange: (value: number) => void;
  readonly onResize: () => void;
  readonly onClear: () => void;
}

/** Scale slider + primary actions. Upload lives in the Dropzone above. */
export const Toolbar = ({
  percentage,
  isProcessing,
  canResize,
  hasItems,
  onPercentageChange,
  onResize,
  onClear,
}: ToolbarProps) => (
  <div className="toolbar">
    <ScaleSlider value={percentage} disabled={isProcessing} onChange={onPercentageChange} />

    <div className="toolbar__actions">
      <button className="btn btn--primary" onClick={onResize} disabled={!canResize}>
        {isProcessing ? "Resizing…" : "Resize all"}
      </button>
      <button className="btn btn--ghost" onClick={onClear} disabled={isProcessing || !hasItems}>
        Clear
      </button>
    </div>
  </div>
);
