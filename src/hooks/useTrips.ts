import { useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Trip } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "../utils/storage";
import { eachDateInRange } from "../utils/dates";
import { useItinerary } from "./useItinerary";
import { useExpenses } from "./useExpenses";

export type NewTripInput = Omit<Trip, "id" | "createdAt">;

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const { createDaysForTrip, deleteDaysForTrip } = useItinerary();
  const { deleteExpensesForTrip } = useExpenses();

  useEffect(() => {
    setTrips(loadFromStorage<Trip>(STORAGE_KEYS.trips));
  }, []);

  const persist = useCallback((next: Trip[]) => {
    setTrips(next);
    saveToStorage(STORAGE_KEYS.trips, next);
  }, []);

  const addTrip = useCallback(
    (input: NewTripInput): Trip => {
      const trip: Trip = {
        ...input,
        id: uuid(),
        createdAt: new Date().toISOString(),
      };
      persist([...trips, trip]);
      const dates = eachDateInRange(trip.startDate, trip.endDate);
      createDaysForTrip(trip.id, dates);
      return trip;
    },
    [trips, persist, createDaysForTrip]
  );

  const updateTrip = useCallback(
    (id: string, updates: Partial<NewTripInput>) => {
      persist(trips.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    [trips, persist]
  );

  const deleteTrip = useCallback(
    (id: string) => {
      persist(trips.filter((t) => t.id !== id));
      deleteDaysForTrip(id);
      deleteExpensesForTrip(id);
    },
    [trips, persist, deleteDaysForTrip, deleteExpensesForTrip]
  );

  const getTrip = useCallback((id: string) => trips.find((t) => t.id === id), [trips]);

  return { trips, addTrip, updateTrip, deleteTrip, getTrip };
}
