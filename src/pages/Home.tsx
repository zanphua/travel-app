import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPinned } from "lucide-react";
import { useTrips } from "../hooks/useTrips";
import { useItinerary } from "../hooks/useItinerary";
import { useExpenses } from "../hooks/useExpenses";
import { TripCard } from "../components/trips/TripCard";
import { TripForm, type TripFormValues } from "../components/trips/TripForm";
import { EmptyState } from "../components/ui/EmptyState";

export function Home() {
  const navigate = useNavigate();
  const { trips, addTrip } = useTrips();
  const { activities } = useItinerary();
  const { expenses } = useExpenses();
  const [formOpen, setFormOpen] = useState(false);

  const handleSave = (values: TripFormValues) => {
    const trip = addTrip(values);
    setFormOpen(false);
    navigate(`/trip/${trip.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between border-b border-slate/5 bg-white px-4">
        <h1 className="text-lg font-semibold text-slate">My Trips</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-sky active:scale-90"
          aria-label="New trip"
        >
          <Plus size={24} />
        </button>
      </header>

      {trips.length === 0 ? (
        <EmptyState
          icon={<MapPinned size={28} />}
          title="No trips yet"
          description="Start planning your next adventure."
          actionLabel="Plan your first trip"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <main className="scroll-touch flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              activityCount={activities.filter((a) => a.tripId === trip.id).length}
              totalExpenses={expenses
                .filter((e) => e.tripId === trip.id && e.currency === trip.currency)
                .reduce((sum, e) => sum + e.amount, 0)}
              onClick={() => navigate(`/trip/${trip.id}`)}
            />
          ))}
        </main>
      )}

      <TripForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  );
}
