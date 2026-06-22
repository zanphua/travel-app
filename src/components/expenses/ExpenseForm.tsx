import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BottomSheet } from "../ui/BottomSheet";
import { CategoryBadge } from "../ui/CategoryBadge";
import { expenseCategories, expenseCategoryOrder } from "../../utils/categories";
import type { Expense, ExpenseCategory } from "../../types";

export interface ExpenseFormValues {
  description: string;
  amount: string;
  date: string;
  category: ExpenseCategory;
  currency: string;
  paidBy: string;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ExpenseFormValues) => void;
  initialExpense?: Expense | null;
  tripCurrency: string;
}

export function ExpenseForm({ isOpen, onClose, onSave, initialExpense, tripCurrency }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>({
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "food",
    currency: tripCurrency,
    paidBy: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setValues({
          description: initialExpense.description,
          amount: String(initialExpense.amount),
          date: initialExpense.date,
          category: initialExpense.category,
          currency: initialExpense.currency,
          paidBy: initialExpense.paidBy,
        });
      } else {
        setValues({
          description: "",
          amount: "",
          date: format(new Date(), "yyyy-MM-dd"),
          category: "food",
          currency: tripCurrency,
          paidBy: "",
        });
      }
    }
  }, [isOpen, initialExpense, tripCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.description.trim() || !values.amount) return;
    onSave(values);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialExpense ? "Edit Expense" : "Add Expense"}>
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Description</label>
            <input
              type="text"
              required
              autoFocus
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="Ramen lunch"
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              value={values.amount}
              onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Date</label>
            <input
              type="date"
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {expenseCategoryOrder.map((cat) => (
                <CategoryBadge
                  key={cat}
                  emoji={expenseCategories[cat].emoji}
                  label={expenseCategories[cat].label}
                  color={expenseCategories[cat].color}
                  selected={values.category === cat}
                  onClick={() => setValues((v) => ({ ...v, category: cat }))}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Currency</label>
            <input
              type="text"
              value={values.currency}
              onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value.toUpperCase() }))}
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Paid by</label>
            <input
              type="text"
              value={values.paidBy}
              onChange={(e) => setValues((v) => ({ ...v, paidBy: e.target.value }))}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate/5 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-full bg-sky font-medium text-white active:scale-95"
          >
            Save
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
