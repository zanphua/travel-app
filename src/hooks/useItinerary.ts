import { useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Activity, ItineraryDay } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "../utils/storage";
import { buildMapsUrl } from "../utils/mapsUrl";

export type NewActivityInput = Omit<Activity, "id" | "googleMapsUrl"> & {
  googleMapsUrl?: string;
};

function dayLabel(index: number): string {
  return `Day ${index + 1}`;
}

export function useItinerary(tripId?: string) {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setDays(loadFromStorage<ItineraryDay>(STORAGE_KEYS.days));
    setActivities(loadFromStorage<Activity>(STORAGE_KEYS.activities));
  }, []);

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

  const updateDayLabel = useCallback(
    (dayId: string, label: string) => {
      persistDays(days.map((d) => (d.id === dayId ? { ...d, label } : d)));
    },
    [days, persistDays]
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
      const activity: Activity = {
        ...input,
        id: uuid(),
        googleMapsUrl: input.googleMapsUrl?.trim() || buildMapsUrl(input.placeName),
      };
      persistActivities([...activities, activity]);
      return activity;
    },
    [activities, persistActivities]
  );

  const updateActivity = useCallback(
    (id: string, updates: Partial<NewActivityInput>) => {
      persistActivities(
        activities.map((a) => {
          if (a.id !== id) return a;
          const merged = { ...a, ...updates };
          const googleMapsUrl =
            updates.googleMapsUrl?.trim() ||
            (updates.placeName && updates.placeName !== a.placeName
              ? buildMapsUrl(updates.placeName)
              : merged.googleMapsUrl);
          return { ...merged, googleMapsUrl };
        })
      );
    },
    [activities, persistActivities]
  );

  const deleteActivity = useCallback(
    (id: string) => {
      persistActivities(activities.filter((a) => a.id !== id));
    },
    [activities, persistActivities]
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
    updateDayLabel,
    deleteDaysForTrip,
    addActivity,
    updateActivity,
    deleteActivity,
  };
}
