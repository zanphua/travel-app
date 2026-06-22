import { useEffect } from "react";
import type { Activity, Expense, ItineraryDay, SyncMeta, Trip } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "../utils/storage";
import { backend } from "../utils/backend";
import type { SyncChangeEvent } from "../utils/syncBackend";

function localKeyFor(table: SyncChangeEvent["table"]): keyof typeof STORAGE_KEYS {
  if (table === "itinerary_days") return "days";
  if (table === "activities") return "activities";
  return "expenses";
}

function mergeIncoming(localTripId: string, event: SyncChangeEvent) {
  const key = STORAGE_KEYS[localKeyFor(event.table)];
  const all = loadFromStorage<ItineraryDay | Activity | Expense>(key);

  if (event.deleted) {
    saveToStorage(key, all.filter((r) => r.id !== event.row.id));
    return;
  }

  const incoming = { ...event.row, tripId: localTripId } as (ItineraryDay | Activity | Expense) & Partial<SyncMeta>;
  const existing = all.find((r) => r.id === incoming.id) as (Partial<SyncMeta> & { id: string }) | undefined;

  if (existing && existing.updatedAt && incoming.updatedAt && existing.updatedAt >= incoming.updatedAt) {
    return;
  }

  const next = existing ? all.map((r) => (r.id === incoming.id ? incoming : r)) : [...all, incoming];
  saveToStorage(key, next);
}

export function useRealtimeSync(trip: Trip, onChange: () => void) {
  useEffect(() => {
    if (!trip.isShared || !trip.cloudId) return;
    const cloudId = trip.cloudId;
    let cancelled = false;

    backend.loadTripData(cloudId).then(({ days, activities, expenses }) => {
      if (cancelled) return;
      for (const row of days) mergeIncoming(trip.id, { table: "itinerary_days", row });
      for (const row of activities) mergeIncoming(trip.id, { table: "activities", row });
      for (const row of expenses) mergeIncoming(trip.id, { table: "expenses", row });
      onChange();
    });

    const unsubscribe = backend.subscribeToTrip(cloudId, (event) => {
      mergeIncoming(trip.id, event);
      onChange();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [trip.id, trip.isShared, trip.cloudId, onChange]);
}
