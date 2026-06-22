import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Expense } from "../../types";
import { expenseCategories, expenseCategoryOrder } from "../../utils/categories";

interface ExpenseSummaryProps {
  expenses: Expense[];
  tripCurrency: string;
}

export function ExpenseSummary({ expenses, tripCurrency }: ExpenseSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const total = useMemo(
    () => expenses.filter((e) => e.currency === tripCurrency).reduce((sum, e) => sum + e.amount, 0),
    [expenses, tripCurrency]
  );

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0) || 1;
    return expenseCategoryOrder
      .map((cat) => ({
        cat,
        amount: totals.get(cat) ?? 0,
        pct: ((totals.get(cat) ?? 0) / grandTotal) * 100,
      }))
      .filter((row) => row.amount > 0);
  }, [expenses]);

  return (
    <div className="sticky top-0 z-20 border-b border-slate/5 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex min-h-[80px] w-full flex-col justify-center gap-1.5 px-4 py-3 text-left active:bg-sand/40"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Total spend</span>
          <ChevronDown size={18} className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-2xl font-semibold text-slate">
            {tripCurrency} {total.toFixed(2)}
          </span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-sand">
          {byCategory.map((row) => (
            <div
              key={row.cat}
              style={{ width: `${row.pct}%`, backgroundColor: expenseCategories[row.cat].color }}
            />
          ))}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 px-4 pb-4">
          {byCategory.length === 0 && <p className="text-sm text-muted">No expenses yet.</p>}
          {byCategory.map((row) => (
            <div key={row.cat} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-slate">
                {expenseCategories[row.cat].emoji} {expenseCategories[row.cat].label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${row.pct}%`, backgroundColor: expenseCategories[row.cat].color }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs text-muted">{row.pct.toFixed(0)}%</span>
              <span className="w-20 shrink-0 text-right font-mono text-sm text-slate">{row.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
