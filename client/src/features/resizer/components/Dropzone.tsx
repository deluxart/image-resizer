import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { config } from "../../../config";

interface DropzoneProps {
  readonly disabled: boolean;
  readonly onFiles: (files: File[]) => void;
}

/** Drag-and-drop (and click-to-select) upload area. */
export const Dropzone = ({ disabled, onFiles }: DropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emit = (fileList: FileList | null): void => {
    if (fileList) onFiles(Array.from(fileList));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) emit(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    emit(event.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const className = ["dropzone", isDragging && "dragging", disabled && "disabled"]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <div className="dropzone__icon">⤒</div>
      <p className="dropzone__title">Drop images here or click to browse</p>
      <p className="dropzone__hint">JPEG or PNG · up to {config.maxImages} images</p>
      <input
        ref={inputRef}
        type="file"
        accept={config.acceptedTypes.join(",")}
        multiple
        disabled={disabled}
        onChange={handleChange}
        hidden
      />
    </div>
  );
};
