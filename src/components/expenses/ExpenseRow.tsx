import type { Expense } from "../../types";
import { expenseCategories } from "../../utils/categories";
import { formatShortDate } from "../../utils/dates";
import { SwipeableRow } from "../ui/SwipeableRow";
import { MemberBadge } from "../ui/MemberBadge";

interface ExpenseRowProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  updatedByName?: string;
}

export function ExpenseRow({ expense, onEdit, onDelete, updatedByName }: ExpenseRowProps) {
  const meta = expenseCategories[expense.category];

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-lg" aria-hidden="true">
          {meta.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate">{expense.description}</p>
          <p className="truncate text-xs text-muted">
            {formatShortDate(expense.date)}
            {expense.paidBy && ` · ${expense.paidBy}`}
          </p>
        </div>
        {updatedByName && <MemberBadge displayName={updatedByName} />}
        <p className="shrink-0 font-mono text-sm font-semibold text-slate">
          {expense.currency} {expense.amount.toFixed(2)}
        </p>
      </div>
    </SwipeableRow>
  );
}
