import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import type { Trip, Activity } from "../types";
import { useItinerary, type NewActivityInput } from "../hooks/useItinerary";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { useTripSharing } from "../hooks/useTripSharing";
import { DaySection } from "../components/itinerary/DaySection";
import { ActivityForm, type ActivityFormValues } from "../components/itinerary/ActivityForm";
import { EmptyState } from "../components/ui/EmptyState";

export function ItineraryTab() {
  const { trip } = useOutletContext<{ trip: Trip }>();
  const { tripDays, activitiesForDay, updateDayLabel, addActivity, updateActivity, deleteActivity, refresh } =
    useItinerary(trip);
  useRealtimeSync(trip, refresh);
  const { loadMembers } = useTripSharing();
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<{ dayId: string; activity: Activity | null } | null>(null);

  useEffect(() => {
    if (!trip.isShared || !trip.cloudId) return;
    loadMembers(trip.cloudId).then((members) => {
      setMemberNames(Object.fromEntries(members.map((m) => [m.memberId, m.displayName])));
    });
  }, [trip.isShared, trip.cloudId, loadMembers]);

  const handleSave = (values: ActivityFormValues) => {
    if (!formState) return;
    if (formState.activity) {
      updateActivity(formState.activity.id, values);
    } else {
      const input: NewActivityInput = {
        ...values,
        dayId: formState.dayId,
        tripId: trip.id,
      };
      addActivity(input);
    }
    setFormState(null);
  };

  if (tripDays.length === 0) {
    return <EmptyState icon={<CalendarDays size={28} />} title="No days planned" description="This trip has no dates." />;
  }

  return (
    <main className="scroll-touch flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      {tripDays.map((day) => (
        <DaySection
          key={day.id}
          day={day}
          activities={activitiesForDay(day.id)}
          onLabelChange={(label) => updateDayLabel(day.id, label)}
          onAddActivity={() => setFormState({ dayId: day.id, activity: null })}
          onEditActivity={(activity) => setFormState({ dayId: day.id, activity })}
          onDeleteActivity={(activityId) => deleteActivity(activityId)}
          memberNames={memberNames}
        />
      ))}

      <ActivityForm
        isOpen={formState !== null}
        onClose={() => setFormState(null)}
        onSave={handleSave}
        initialActivity={formState?.activity ?? null}
      />
    </main>
  );
}
