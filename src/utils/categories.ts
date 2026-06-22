import type { ActivityCategory, ExpenseCategory } from "../types";

interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
}

export const activityCategories: Record<ActivityCategory, CategoryMeta> = {
  accommodation: { label: "Stay", emoji: "🏨", color: "#3B82F6" },
  food: { label: "Food", emoji: "🍜", color: "#F59E0B" },
  transport: { label: "Transport", emoji: "🚆", color: "#10B981" },
  attraction: { label: "Attraction", emoji: "🎟️", color: "#A855F7" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "#EC4899" },
  other: { label: "Other", emoji: "📌", color: "#94A3B8" },
};

export const expenseCategories: Record<ExpenseCategory, CategoryMeta> = {
  accommodation: { label: "Stay", emoji: "🏨", color: "#3B82F6" },
  food: { label: "Food", emoji: "🍜", color: "#F59E0B" },
  transport: { label: "Transport", emoji: "🚆", color: "#10B981" },
  activities: { label: "Activities", emoji: "🎟️", color: "#A855F7" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "#EC4899" },
  other: { label: "Other", emoji: "📌", color: "#94A3B8" },
};

export const activityCategoryOrder: ActivityCategory[] = [
  "accommodation",
  "food",
  "transport",
  "attraction",
  "shopping",
  "other",
];

export const expenseCategoryOrder: ExpenseCategory[] = [
  "accommodation",
  "food",
  "transport",
  "activities",
  "shopping",
  "other",
];
