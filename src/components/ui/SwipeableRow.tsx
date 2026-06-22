import { useRef, useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SwipeableRowProps {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

const ACTION_WIDTH = 144;

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const handleStart = (clientX: number) => {
    startX.current = clientX;
    dragging.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!dragging.current || startX.current === null) return;
    const delta = clientX - startX.current;
    const next = Math.min(0, Math.max(-ACTION_WIDTH, offset + delta));
    setOffset(next);
    startX.current = clientX;
  };

  const handleEnd = () => {
    dragging.current = false;
    startX.current = null;
    setOffset((current) => (current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0));
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH }}>
        <button
          type="button"
          onClick={() => {
            setOffset(0);
            onEdit();
          }}
          className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 bg-sky text-white active:opacity-80"
          aria-label="Edit"
        >
          <Pencil size={18} />
          <span className="text-xs">Edit</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOffset(0);
            onDelete();
          }}
          className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 bg-danger text-white active:opacity-80"
          aria-label="Delete"
        >
          <Trash2 size={18} />
          <span className="text-xs">Delete</span>
        </button>
      </div>
      <div
        className="relative bg-white"
        style={{ transform: `translateX(${offset}px)`, transition: dragging.current ? "none" : "transform 0.2s" }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {children}
      </div>
    </div>
  );
}
