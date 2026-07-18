import { UploadButton } from "./UploadButton";
import { ScaleSlider } from "./ScaleSlider";

interface ToolbarProps {
  readonly percentage: number;
  readonly isProcessing: boolean;
  readonly canAddMore: boolean;
  readonly canResize: boolean;
  readonly hasItems: boolean;
  readonly onFiles: (files: File[]) => void;
  readonly onPercentageChange: (value: number) => void;
  readonly onResize: () => void;
  readonly onClear: () => void;
}

/** Groups the upload control, scale slider and action buttons. */
export const Toolbar = ({
  percentage,
  isProcessing,
  canAddMore,
  canResize,
  hasItems,
  onFiles,
  onPercentageChange,
  onResize,
  onClear,
}: ToolbarProps) => (
  <div className="toolbar">
    <UploadButton disabled={!canAddMore} onFiles={onFiles} />

    <ScaleSlider value={percentage} disabled={isProcessing} onChange={onPercentageChange} />

    <button onClick={onResize} disabled={!canResize}>
      {isProcessing ? "Resizing…" : "Resize"}
    </button>

    <button className="ghost" onClick={onClear} disabled={isProcessing || !hasItems}>
      Clear
    </button>
  </div>
);
