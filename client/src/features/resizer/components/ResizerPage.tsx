import { config } from "../../../config";
import { useResizeQueue } from "../hooks/useResizeQueue";
import { Toolbar } from "./Toolbar";
import { ImageList } from "./ImageList";
import "./resizer.css";

/** Top-level container for the resizer feature: state comes from the hook, UI from children. */
export const ResizerPage = () => {
  const queue = useResizeQueue();
  const atLimit = queue.items.length >= config.maxImages;

  return (
    <main className="resizer">
      <h1>Online Image Resizer</h1>

      <Toolbar
        percentage={queue.percentage}
        isProcessing={queue.isProcessing}
        canAddMore={queue.canAddMore}
        canResize={queue.canResize}
        hasItems={queue.items.length > 0}
        onFiles={queue.addFiles}
        onPercentageChange={queue.setPercentage}
        onResize={queue.resizeAll}
        onClear={queue.clear}
      />

      <p className="hint">
        {queue.items.length}/{config.maxImages} images{atLimit && " (limit reached)"}
      </p>

      <ImageList items={queue.items} />
    </main>
  );
};
