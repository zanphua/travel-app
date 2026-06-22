import type { Trip } from "../../types";
import { formatDateRange, tripDurationDays } from "../../utils/dates";

interface TripCardProps {
  trip: Trip;
  activityCount: number;
  totalExpenses: number;
  onClick: () => void;
}

export function TripCard({ trip, activityCount, totalExpenses, onClick }: TripCardProps) {
  const days = tripDurationDays(trip.startDate, trip.endDate);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)] active:scale-[0.98]"
    >
      <span className="text-3xl" aria-hidden="true">
        {trip.coverEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate">{trip.name}</p>
        <p className="truncate text-sm text-muted">{trip.destination}</p>
        <p className="mt-1 text-xs text-muted">
          {formatDateRange(trip.startDate, trip.endDate)} · {days} {days === 1 ? "day" : "days"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {activityCount} activities · {trip.currency} {totalExpenses.toFixed(2)}
        </p>
      </div>
    </button>
  );
}
