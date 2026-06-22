import { useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Activity, ItineraryDay, Trip } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "../utils/storage";
import { buildMapsUrl } from "../utils/mapsUrl";
import { stampUpdate } from "../utils/member";
import { backend } from "../utils/backend";

export type NewActivityInput = Omit<Activity, "id" | "googleMapsUrl"> & {
  googleMapsUrl?: string;
};

function dayLabel(index: number): string {
  return `Day ${index + 1}`;
}

function writeThrough(trip: Trip | undefined, table: "itinerary_days" | "activities", row: ItineraryDay | Activity) {
  if (trip?.isShared && trip.cloudId) {
    backend.writeRow(trip.cloudId, table, row).catch(() => {});
  }
}

function deleteThrough(trip: Trip | undefined, table: "itinerary_days" | "activities", rowId: string) {
  if (trip?.isShared && trip.cloudId) {
    backend.deleteRow(trip.cloudId, table, rowId).catch(() => {});
  }
}

export function useItinerary(trip?: Trip) {
  const tripId = trip?.id;
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const refresh = useCallback(() => {
    setDays(loadFromStorage<ItineraryDay>(STORAGE_KEYS.days));
    setActivities(loadFromStorage<Activity>(STORAGE_KEYS.activities));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistDays = useCallback((next: ItineraryDay[]) => {
    setDays(next);
    saveToStorage(STORAGE_KEYS.days, next);
  }, []);

  const persistActivities = useCallback((next: Activity[]) => {
    setActivities(next);
    saveToStorage(STORAGE_KEYS.activities, next);
  }, []);

  const createDaysForTrip = useCallback(
    (newTripId: string, dates: string[]) => {
      const allDays = loadFromStorage<ItineraryDay>(STORAGE_KEYS.days);
      const newDays: ItineraryDay[] = dates.map((date, index) => ({
        id: uuid(),
        tripId: newTripId,
        date,
        label: dayLabel(index),
      }));
      persistDays([...allDays, ...newDays]);
    },
    [persistDays]
  );

  const importDays = useCallback(
    (importedDays: ItineraryDay[], importedActivities: Activity[]) => {
      const allDays = loadFromStorage<ItineraryDay>(STORAGE_KEYS.days);
      const allActivities = loadFromStorage<Activity>(STORAGE_KEYS.activities);
      const dayIds = new Set(importedDays.map((d) => d.id));
      const activityIds = new Set(importedActivities.map((a) => a.id));
      persistDays([...allDays.filter((d) => !dayIds.has(d.id)), ...importedDays]);
      persistActivities([...allActivities.filter((a) => !activityIds.has(a.id)), ...importedActivities]);
    },
    [persistDays, persistActivities]
  );

  const updateDayLabel = useCallback(
    (dayId: string, label: string) => {
      const stamped = stampUpdate({ label });
      persistDays(days.map((d) => (d.id === dayId ? { ...d, ...stamped } : d)));
      const updated = days.find((d) => d.id === dayId);
      if (updated) writeThrough(trip, "itinerary_days", { ...updated, ...stamped });
    },
    [days, persistDays, trip]
  );

  const deleteDaysForTrip = useCallback(
    (deletedTripId: string) => {
      const allDays = loadFromStorage<ItineraryDay>(STORAGE_KEYS.days);
      const allActivities = loadFromStorage<Activity>(STORAGE_KEYS.activities);
      persistDays(allDays.filter((d) => d.tripId !== deletedTripId));
      persistActivities(allActivities.filter((a) => a.tripId !== deletedTripId));
    },
    [persistDays, persistActivities]
  );

  const addActivity = useCallback(
    (input: NewActivityInput) => {
      const activity: Activity = stampUpdate({
        ...input,
        id: uuid(),
        googleMapsUrl: input.googleMapsUrl?.trim() || buildMapsUrl(input.placeName),
      });
      persistActivities([...activities, activity]);
      writeThrough(trip, "activities", activity);
      return activity;
    },
    [activities, persistActivities, trip]
  );

  const updateActivity = useCallback(
    (id: string, updates: Partial<NewActivityInput>) => {
      let updatedRow: Activity | null = null;
      persistActivities(
        activities.map((a) => {
          if (a.id !== id) return a;
          const merged = { ...a, ...updates };
          const googleMapsUrl =
            updates.googleMapsUrl?.trim() ||
            (updates.placeName && updates.placeName !== a.placeName
              ? buildMapsUrl(updates.placeName)
              : merged.googleMapsUrl);
          const stamped = stampUpdate({ ...merged, googleMapsUrl });
          updatedRow = stamped;
          return stamped;
        })
      );
      if (updatedRow) writeThrough(trip, "activities", updatedRow);
    },
    [activities, persistActivities, trip]
  );

  const deleteActivity = useCallback(
    (id: string) => {
      persistActivities(activities.filter((a) => a.id !== id));
      deleteThrough(trip, "activities", id);
    },
    [activities, persistActivities, trip]
  );

  const tripDays = tripId ? days.filter((d) => d.tripId === tripId).sort((a, b) => a.date.localeCompare(b.date)) : [];

  const activitiesForDay = useCallback(
    (dayId: string) => {
      const list = activities.filter((a) => a.dayId === dayId);
      const timed = list.filter((a) => a.time).sort((a, b) => a.time.localeCompare(b.time));
      const untimed = list.filter((a) => !a.time);
      return [...timed, ...untimed];
    },
    [activities]
  );

  return {
    days,
    activities,
    tripDays,
    activitiesForDay,
    createDaysForTrip,
    importDays,
    updateDayLabel,
    deleteDaysForTrip,
    addActivity,
    updateActivity,
    deleteActivity,
    refresh,
  };
}
