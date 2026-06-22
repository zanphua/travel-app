import { useState } from "react";
import type { Activity, ItineraryDay } from "../../types";
import { formatShortDate } from "../../utils/dates";
import { ActivityCard } from "./ActivityCard";

interface DaySectionProps {
  day: ItineraryDay;
  activities: Activity[];
  onLabelChange: (label: string) => void;
  onAddActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
}

export function DaySection({
  day,
  activities,
  onLabelChange,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}: DaySectionProps) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(day.label);

  const commitLabel = () => {
    setEditingLabel(false);
    if (draftLabel.trim() && draftLabel !== day.label) {
      onLabelChange(draftLabel.trim());
    } else {
      setDraftLabel(day.label);
    }
  };

  return (
    <section>
      <div className="sticky top-0 z-10 bg-sand/95 px-4 py-2 backdrop-blur-sm">
        {editingLabel ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => e.key === "Enter" && commitLabel()}
            className="w-full rounded-md border border-slate/10 bg-white px-2 py-1 text-base font-semibold text-slate"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingLabel(true)}
            className="text-left text-base font-semibold text-slate active:opacity-70"
          >
            {day.label} · {formatShortDate(day.date)}
          </button>
        )}
      </div>

      <div className="divide-y divide-slate/5 px-4">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onEdit={() => onEditActivity(activity)}
            onDelete={() => onDeleteActivity(activity.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddActivity}
        className="ml-4 mt-2 mb-4 min-h-[44px] text-sm font-medium text-sky active:opacity-70"
      >
        + Add activity
      </button>
    </section>
  );
}
