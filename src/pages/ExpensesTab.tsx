import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import type { Trip, Expense } from "../types";
import { useExpenses, type NewExpenseInput } from "../hooks/useExpenses";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { useTripSharing } from "../hooks/useTripSharing";
import { ExpenseSummary } from "../components/expenses/ExpenseSummary";
import { ExpenseRow } from "../components/expenses/ExpenseRow";
import { ExpenseForm, type ExpenseFormValues } from "../components/expenses/ExpenseForm";
import { EmptyState } from "../components/ui/EmptyState";
import { formatShortDate } from "../utils/dates";

export function ExpensesTab() {
  const { trip } = useOutletContext<{ trip: Trip }>();
  const { tripExpenses, addExpense, updateExpense, deleteExpense, refresh } = useExpenses(trip);
  useRealtimeSync(trip, refresh);
  const { loadMembers } = useTripSharing();
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!trip.isShared || !trip.cloudId) return;
    loadMembers(trip.cloudId).then((members) => {
      setMemberNames(Object.fromEntries(members.map((m) => [m.memberId, m.displayName])));
    });
  }, [trip.isShared, trip.cloudId, loadMembers]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const grouped = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const e of tripExpenses) {
      const list = groups.get(e.date) ?? [];
      list.push(e);
      groups.set(e.date, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [tripExpenses]);

  const handleSave = (values: ExpenseFormValues) => {
    const input: NewExpenseInput = {
      ...values,
      amount: parseFloat(values.amount),
      tripId: trip.id,
    };
    if (editingExpense) {
      updateExpense(editingExpense.id, input);
    } else {
      addExpense(input);
    }
    setFormOpen(false);
    setEditingExpense(null);
  };

  return (
    <main className="scroll-touch relative flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)]">
      <ExpenseSummary expenses={tripExpenses} tripCurrency={trip.currency} />

      {tripExpenses.length === 0 ? (
        <EmptyState icon={<Plus size={28} />} title="No expenses yet" description="Tap + to log your first expense." />
      ) : (
        <div className="space-y-4 px-4 py-4">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-medium text-muted">{formatShortDate(date)}</p>
              <div className="divide-y divide-slate/5 overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                {items.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onEdit={() => {
                      setEditingExpense(expense);
                      setFormOpen(true);
                    }}
                    onDelete={() => deleteExpense(expense.id)}
                    updatedByName={expense.updatedBy ? memberNames[expense.updatedBy] : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setEditingExpense(null);
          setFormOpen(true);
        }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-white shadow-lg active:scale-90"
        aria-label="Add expense"
      >
        <Plus size={26} />
      </button>

      <ExpenseForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSave}
        initialExpense={editingExpense}
        tripCurrency={trip.currency}
      />
    </main>
  );
}
