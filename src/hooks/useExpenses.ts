import { useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Expense, Trip } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "../utils/storage";
import { stampUpdate } from "../utils/member";
import { backend } from "../utils/backend";

export type NewExpenseInput = Omit<Expense, "id">;

function writeThrough(trip: Trip | undefined, row: Expense) {
  if (trip?.isShared && trip.cloudId) {
    backend.writeRow(trip.cloudId, "expenses", row).catch(() => {});
  }
}

function deleteThrough(trip: Trip | undefined, rowId: string) {
  if (trip?.isShared && trip.cloudId) {
    backend.deleteRow(trip.cloudId, "expenses", rowId).catch(() => {});
  }
}

export function useExpenses(trip?: Trip) {
  const tripId = trip?.id;
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const refresh = useCallback(() => {
    setExpenses(loadFromStorage<Expense>(STORAGE_KEYS.expenses));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    saveToStorage(STORAGE_KEYS.expenses, next);
  }, []);

  const addExpense = useCallback(
    (input: NewExpenseInput) => {
      const expense: Expense = stampUpdate({ ...input, id: uuid() });
      persist([...expenses, expense]);
      writeThrough(trip, expense);
      return expense;
    },
    [expenses, persist, trip]
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<NewExpenseInput>) => {
      let updatedRow: Expense | null = null;
      persist(
        expenses.map((e) => {
          if (e.id !== id) return e;
          const stamped = stampUpdate({ ...e, ...updates });
          updatedRow = stamped;
          return stamped;
        })
      );
      if (updatedRow) writeThrough(trip, updatedRow);
    },
    [expenses, persist, trip]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
      deleteThrough(trip, id);
    },
    [expenses, persist, trip]
  );

  const deleteExpensesForTrip = useCallback(
    (deletedTripId: string) => {
      const all = loadFromStorage<Expense>(STORAGE_KEYS.expenses);
      persist(all.filter((e) => e.tripId !== deletedTripId));
    },
    [persist]
  );

  const importExpenses = useCallback(
    (imported: Expense[]) => {
      const all = loadFromStorage<Expense>(STORAGE_KEYS.expenses);
      const importedIds = new Set(imported.map((e) => e.id));
      persist([...all.filter((e) => !importedIds.has(e.id)), ...imported]);
    },
    [persist]
  );

  const tripExpenses = tripId
    ? expenses.filter((e) => e.tripId === tripId).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return {
    expenses,
    tripExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpensesForTrip,
    importExpenses,
    refresh,
  };
}
