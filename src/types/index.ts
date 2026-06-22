export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverEmoji: string;
  currency: string;
  createdAt: string;
  isShared?: boolean;
  cloudId?: string;
  inviteCode?: string;
}

export interface SyncMeta {
  updatedAt: string;
  updatedBy: string;
}

export interface DeviceMember {
  id: string;
  displayName: string;
}

export interface CloudMember {
  memberId: string;
  displayName: string;
}

export interface ItineraryDay extends Partial<SyncMeta> {
  id: string;
  tripId: string;
  date: string;
  label: string;
}

export type ActivityCategory =
  | "accommodation"
  | "food"
  | "transport"
  | "attraction"
  | "shopping"
  | "other";

export interface Activity extends Partial<SyncMeta> {
  id: string;
  dayId: string;
  tripId: string;
  time: string;
  title: string;
  notes: string;
  placeName: string;
  googleMapsUrl: string;
  category: ActivityCategory;
}

export type ExpenseCategory =
  | "accommodation"
  | "food"
  | "transport"
  | "activities"
  | "shopping"
  | "other";

export interface Expense extends Partial<SyncMeta> {
  id: string;
  tripId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string;
}
