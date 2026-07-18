import { useRef, type ChangeEvent } from "react";
import { config } from "../../../config";

interface UploadButtonProps {
  readonly disabled: boolean;
  readonly onFiles: (files: File[]) => void;
}

export const UploadButton = ({ disabled, onFiles }: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFiles(Array.from(event.target.files ?? []));
    if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
  };

  return (
    <label className={`upload-btn${disabled ? " disabled" : ""}`}>
      + Add images (JPEG/PNG)
      <input
        ref={inputRef}
        type="file"
        accept={config.acceptedTypes.join(",")}
        multiple
        disabled={disabled}
        onChange={handleChange}
        hidden
      />
    </label>
  );
};
