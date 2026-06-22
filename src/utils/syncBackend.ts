import type { Activity, CloudMember, Expense, ItineraryDay, Trip } from "../types";

export interface SharePayload {
  trip: Trip;
  days: ItineraryDay[];
  activities: Activity[];
  expenses: Expense[];
}

export interface JoinResult {
  trip: Trip;
  days: ItineraryDay[];
  activities: Activity[];
  expenses: Expense[];
}

export type SyncTable = "itinerary_days" | "activities" | "expenses";

export interface SyncChangeEvent {
  table: SyncTable;
  row: ItineraryDay | Activity | Expense;
  deleted?: boolean;
}

export interface TripData {
  days: ItineraryDay[];
  activities: Activity[];
  expenses: Expense[];
}

export interface SyncBackend {
  shareTrip(payload: SharePayload, memberId: string, displayName: string): Promise<{ cloudId: string; inviteCode: string }>;
  joinTrip(inviteCode: string, memberId: string, displayName: string): Promise<JoinResult>;
  loadMembers(cloudId: string): Promise<CloudMember[]>;
  loadTripData(cloudId: string): Promise<TripData>;
  writeRow(cloudId: string, table: SyncTable, row: ItineraryDay | Activity | Expense): Promise<void>;
  deleteRow(cloudId: string, table: SyncTable, rowId: string): Promise<void>;
  subscribeToTrip(cloudId: string, onChange: (event: SyncChangeEvent) => void): () => void;
}
