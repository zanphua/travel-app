interface MemberBadgeProps {
  displayName: string;
}

export function MemberBadge({ displayName }: MemberBadgeProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      title={displayName}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky/15 text-[10px] font-semibold text-sky"
    >
      {initial}
    </span>
  );
}
