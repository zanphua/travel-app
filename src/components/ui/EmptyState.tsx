import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky/10 text-sky">{icon}</div>
      <h2 className="text-lg font-semibold text-slate">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 min-h-[44px] rounded-full bg-sky px-6 font-medium text-white active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
