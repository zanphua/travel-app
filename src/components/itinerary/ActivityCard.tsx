import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Activity } from "../../types";
import { activityCategories } from "../../utils/categories";
import { SwipeableRow } from "../ui/SwipeableRow";
import { MemberBadge } from "../ui/MemberBadge";

interface ActivityCardProps {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  updatedByName?: string;
}

export function ActivityCard({ activity, onEdit, onDelete, updatedByName }: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = activityCategories[activity.category];

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="flex w-full flex-col gap-1.5 px-4 py-3 text-left active:bg-sand/60"
      >
        <div className="flex items-center gap-2">
          {activity.time && (
            <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-xs text-slate">{activity.time}</span>
          )}
          <span aria-hidden="true">{meta.emoji}</span>
          <span className="flex-1 truncate font-medium text-slate">{activity.title}</span>
          {updatedByName && <MemberBadge displayName={updatedByName} />}
        </div>
        {activity.notes && (
          <p className={`text-sm text-muted ${expanded ? "" : "truncate"}`}>{activity.notes}</p>
        )}
        <a
          href={activity.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-sky active:opacity-70"
        >
          <MapPin size={14} /> Maps
        </a>
      </div>
    </SwipeableRow>
  );
}
