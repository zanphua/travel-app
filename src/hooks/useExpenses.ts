import { useCallback, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Expense } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "../utils/storage";

export type NewExpenseInput = Omit<Expense, "id">;

export function useExpenses(tripId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setExpenses(loadFromStorage<Expense>(STORAGE_KEYS.expenses));
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    saveToStorage(STORAGE_KEYS.expenses, next);
  }, []);

  const addExpense = useCallback(
    (input: NewExpenseInput) => {
      const expense: Expense = { ...input, id: uuid() };
      persist([...expenses, expense]);
      return expense;
    },
    [expenses, persist]
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<NewExpenseInput>) => {
      persist(expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  const deleteExpensesForTrip = useCallback(
    (deletedTripId: string) => {
      const all = loadFromStorage<Expense>(STORAGE_KEYS.expenses);
      persist(all.filter((e) => e.tripId !== deletedTripId));
    },
    [persist]
  );

  const tripExpenses = tripId
    ? expenses.filter((e) => e.tripId === tripId).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return { expenses, tripExpenses, addExpense, updateExpense, deleteExpense, deleteExpensesForTrip };
}
