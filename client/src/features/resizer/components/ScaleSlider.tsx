import type { ChangeEvent } from "react";

interface ScaleSliderProps {
  readonly value: number;
  readonly disabled: boolean;
  readonly onChange: (value: number) => void;
}

export const ScaleSlider = ({ value, disabled, onChange }: ScaleSliderProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void =>
    onChange(Number(event.target.value));

  return (
    <div className="scale">
      <label>
        Resize: <b>{value}%</b>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  );
};
