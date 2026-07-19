import { config } from "../../../config";
import { useResizeQueue } from "../hooks/useResizeQueue";
import { Dropzone } from "./Dropzone";
import { Toolbar } from "./Toolbar";
import { ImageList } from "./ImageList";
import "./resizer.css";

/** Top-level container: state from the hook, UI from presentational children. */
export const ResizerPage = () => {
  const queue = useResizeQueue();
  const hasItems = queue.items.length > 0;

  return (
    <div className="page">
      <main className="resizer">
        <header className="resizer__header">
          <h1>Image Resizer</h1>
          <p className="resizer__subtitle">
            Resize JPEG &amp; PNG images right in your browser — fast, private, batched.
          </p>
        </header>

        <Dropzone disabled={!queue.canAddMore} onFiles={queue.addFiles} />

        {hasItems && (
          <>
            <Toolbar
              percentage={queue.percentage}
              isProcessing={queue.isProcessing}
              canResize={queue.canResize}
              hasItems={hasItems}
              count={queue.items.length}
              maxImages={config.maxImages}
              onPercentageChange={queue.setPercentage}
              onResize={queue.resizeAll}
              onClear={queue.clear}
            />

            <ImageList items={queue.items} />
          </>
        )}
      </main>
    </div>
  );
};
