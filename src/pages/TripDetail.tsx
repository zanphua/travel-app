import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useTrips } from "../hooks/useTrips";
import { TripForm, type TripFormValues } from "../components/trips/TripForm";
import { formatDateRange } from "../utils/dates";
import type { Trip } from "../types";

function tabKey(tripId: string) {
  return `travel_app:lastTab:${tripId}`;
}

export function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { getTrip, updateTrip } = useTrips();
  const [editOpen, setEditOpen] = useState(false);
  const trip = tripId ? getTrip(tripId) : undefined;

  useEffect(() => {
    if (tripId) {
      const segment = window.location.pathname.split("/").pop();
      if (segment === "itinerary" || segment === "expenses") {
        localStorage.setItem(tabKey(tripId), segment);
      }
    }
  }, [tripId]);

  if (!tripId) return <Navigate to="/" replace />;
  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted">
        Trip not found.
      </div>
    );
  }

  const handleSave = (values: TripFormValues) => {
    updateTrip(tripId, values);
    setEditOpen(false);
  };

  const handleShared = (updates: Partial<Trip>) => {
    updateTrip(tripId, updates);
  };

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 min-h-[44px] flex items-center justify-center text-sm font-medium border-b-2 active:opacity-70 ${
      isActive ? "border-sky text-sky" : "border-transparent text-muted"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-white">
        <div className="flex min-h-[56px] items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-slate active:opacity-70"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center">
            <p className="truncate font-semibold text-slate">{trip.name}</p>
            <p className="truncate text-xs text-muted">{formatDateRange(trip.startDate, trip.endDate)}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-slate active:opacity-70"
            aria-label="Edit trip"
          >
            <Pencil size={18} />
          </button>
        </div>
        <nav className="flex border-b border-slate/5">
          <NavLink to="itinerary" className={tabClass}>
            Itinerary
          </NavLink>
          <NavLink to="expenses" className={tabClass}>
            Expenses
          </NavLink>
        </nav>
      </header>

      <Outlet context={{ trip }} />

      <TripForm
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        initialTrip={trip}
        onShared={handleShared}
      />
    </div>
  );
}

export function TripIndexRedirect() {
  const { tripId } = useParams<{ tripId: string }>();
  const lastTab = tripId ? localStorage.getItem(tabKey(tripId)) : null;
  return <Navigate to={lastTab === "expenses" ? "expenses" : "itinerary"} replace />;
}
