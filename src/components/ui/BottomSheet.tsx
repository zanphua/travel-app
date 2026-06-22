import { useEffect, useRef, useState, type ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  heightClass?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, heightClass = "h-[90vh]" }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDragY(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragStart = (clientY: number) => {
    dragStartY.current = clientY;
  };

  const handleDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleDragEnd = () => {
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
    dragStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative ${heightClass} w-full rounded-t-2xl bg-white shadow-2xl flex flex-col`}
        style={{ transform: `translateY(${dragY}px)`, transition: dragStartY.current ? "none" : "transform 0.2s" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="flex shrink-0 cursor-grab flex-col items-center pt-2 pb-1 touch-none"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => {
            if (dragStartY.current !== null) handleDragMove(e.clientY);
          }}
          onMouseUp={handleDragEnd}
        >
          <div className="h-1.5 w-10 rounded-full bg-muted/40" />
        </div>
        <div className="flex shrink-0 items-center justify-between px-4 pb-3 border-b border-slate/5">
          <h2 className="text-lg font-semibold text-slate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted active:opacity-70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
