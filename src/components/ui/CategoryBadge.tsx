interface CategoryBadgeProps {
  emoji: string;
  label: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
}

export function CategoryBadge({ emoji, label, color, selected, onClick }: CategoryBadgeProps) {
  const content = (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );

  if (!onClick) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[36px] items-center rounded-full px-3 text-sm font-medium transition active:scale-95 ${
        selected ? "text-white" : ""
      }`}
      style={
        selected
          ? { backgroundColor: color }
          : { backgroundColor: `${color}1A`, color }
      }
    >
      {content}
    </button>
  );
}
