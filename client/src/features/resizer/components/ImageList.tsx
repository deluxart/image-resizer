import type { ResizeItem } from "../types";
import { ImageRow } from "./ImageRow";

interface ImageListProps {
  readonly items: readonly ResizeItem[];
}

export const ImageList = ({ items }: ImageListProps) => {
  if (items.length === 0) return null;

  return (
    <ul className="list">
      {items.map((item) => (
        <ImageRow key={item.id} item={item} />
      ))}
    </ul>
  );
};
