import { v4 as uuid } from "uuid";
import type { Activity, CloudMember, Expense, ItineraryDay, Trip } from "../types";
import { generateInviteCode } from "./inviteCode";
import type { JoinResult, SharePayload, SyncBackend, SyncChangeEvent, SyncTable } from "./syncBackend";

interface CloudTrip {
  cloudId: string;
  inviteCode: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverEmoji: string;
  currency: string;
}

const CLOUD_KEYS = {
  trips: "travel_app:cloud:trips",
  members: "travel_app:cloud:members",
  days: "travel_app:cloud:days",
  activities: "travel_app:cloud:activities",
  expenses: "travel_app:cloud:expenses",
} as const;

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("travel_app_sync") : null;

interface BroadcastPayload {
  cloudId: string;
  event: SyncChangeEvent;
}

function tableKey(table: SyncTable): string {
  if (table === "itinerary_days") return CLOUD_KEYS.days;
  if (table === "activities") return CLOUD_KEYS.activities;
  return CLOUD_KEYS.expenses;
}

function withCloudTripId<T extends { tripId: string }>(row: T, cloudId: string): T {
  return { ...row, tripId: cloudId };
}

export const mockBackend: SyncBackend = {
  async shareTrip(payload: SharePayload, memberId: string, displayName: string) {
    const cloudId = uuid();
    let inviteCode = generateInviteCode();
    const existingCodes = new Set(load<CloudTrip>(CLOUD_KEYS.trips).map((t) => t.inviteCode));
    while (existingCodes.has(inviteCode)) inviteCode = generateInviteCode();

    const cloudTrip: CloudTrip = {
      cloudId,
      inviteCode,
      name: payload.trip.name,
      destination: payload.trip.destination,
      startDate: payload.trip.startDate,
      endDate: payload.trip.endDate,
      coverEmoji: payload.trip.coverEmoji,
      currency: payload.trip.currency,
    };
    save(CLOUD_KEYS.trips, [...load<CloudTrip>(CLOUD_KEYS.trips), cloudTrip]);

    const members = load<CloudMember & { cloudId: string }>(CLOUD_KEYS.members);
    save(CLOUD_KEYS.members, [...members, { cloudId, memberId, displayName }]);

    save(CLOUD_KEYS.days, [
      ...load<ItineraryDay>(CLOUD_KEYS.days),
      ...payload.days.map((d) => withCloudTripId(d, cloudId)),
    ]);
    save(CLOUD_KEYS.activities, [
      ...load<Activity>(CLOUD_KEYS.activities),
      ...payload.activities.map((a) => withCloudTripId(a, cloudId)),
    ]);
    save(CLOUD_KEYS.expenses, [
      ...load<Expense>(CLOUD_KEYS.expenses),
      ...payload.expenses.map((e) => withCloudTripId(e, cloudId)),
    ]);

    return { cloudId, inviteCode };
  },

  async joinTrip(inviteCode: string, memberId: string, displayName: string): Promise<JoinResult> {
    const cloudTrip = load<CloudTrip>(CLOUD_KEYS.trips).find(
      (t) => t.inviteCode.toUpperCase() === inviteCode.toUpperCase()
    );
    if (!cloudTrip) {
      throw new Error("Invite code not found.");
    }

    const members = load<CloudMember & { cloudId: string }>(CLOUD_KEYS.members);
    if (!members.some((m) => m.cloudId === cloudTrip.cloudId && m.memberId === memberId)) {
      save(CLOUD_KEYS.members, [...members, { cloudId: cloudTrip.cloudId, memberId, displayName }]);
    }

    const trip: Trip = {
      id: cloudTrip.cloudId,
      name: cloudTrip.name,
      destination: cloudTrip.destination,
      startDate: cloudTrip.startDate,
      endDate: cloudTrip.endDate,
      coverEmoji: cloudTrip.coverEmoji,
      currency: cloudTrip.currency,
      createdAt: new Date().toISOString(),
      isShared: true,
      cloudId: cloudTrip.cloudId,
      inviteCode: cloudTrip.inviteCode,
    };

    const days = load<ItineraryDay>(CLOUD_KEYS.days).filter((d) => d.tripId === cloudTrip.cloudId);
    const activities = load<Activity>(CLOUD_KEYS.activities).filter((a) => a.tripId === cloudTrip.cloudId);
    const expenses = load<Expense>(CLOUD_KEYS.expenses).filter((e) => e.tripId === cloudTrip.cloudId);

    return { trip, days, activities, expenses };
  },

  async loadMembers(cloudId: string): Promise<CloudMember[]> {
    return load<CloudMember & { cloudId: string }>(CLOUD_KEYS.members)
      .filter((m) => m.cloudId === cloudId)
      .map(({ memberId, displayName }) => ({ memberId, displayName }));
  },

  async loadTripData(cloudId: string) {
    return {
      days: load<ItineraryDay>(CLOUD_KEYS.days).filter((d) => d.tripId === cloudId),
      activities: load<Activity>(CLOUD_KEYS.activities).filter((a) => a.tripId === cloudId),
      expenses: load<Expense>(CLOUD_KEYS.expenses).filter((e) => e.tripId === cloudId),
    };
  },

  async writeRow(cloudId, table, row) {
    const key = tableKey(table);
    const all = load<{ id: string; tripId: string }>(key);
    const cloudRow = withCloudTripId(row as unknown as { id: string; tripId: string }, cloudId);
    const next = all.some((r) => r.id === row.id)
      ? all.map((r) => (r.id === row.id ? cloudRow : r))
      : [...all, cloudRow];
    save(key, next);
    channel?.postMessage({ cloudId, event: { table, row } } satisfies BroadcastPayload);
  },

  async deleteRow(cloudId, table, rowId) {
    const key = tableKey(table);
    const all = load<{ id: string; tripId: string }>(key);
    save(key, all.filter((r) => r.id !== rowId));
    channel?.postMessage({
      cloudId,
      event: { table, row: { id: rowId } as unknown as ItineraryDay, deleted: true },
    } satisfies BroadcastPayload);
  },

  subscribeToTrip(cloudId, onChange) {
    if (!channel) return () => {};
    const handler = (e: MessageEvent<BroadcastPayload>) => {
      if (e.data.cloudId === cloudId) onChange(e.data.event);
    };
    channel.addEventListener("message", handler);
    return () => channel.removeEventListener("message", handler);
  },
};
