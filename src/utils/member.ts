import { v4 as uuid } from "uuid";
import type { DeviceMember, SyncMeta } from "../types";

const MEMBER_KEY = "travel_app:member";

export function getMember(): DeviceMember | null {
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    return raw ? (JSON.parse(raw) as DeviceMember) : null;
  } catch {
    return null;
  }
}

export function setMember(displayName: string): DeviceMember {
  const existing = getMember();
  const member: DeviceMember = { id: existing?.id ?? uuid(), displayName };
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  return member;
}

export function ensureMember(displayName?: string): DeviceMember {
  const existing = getMember();
  if (existing) return existing;
  return setMember(displayName?.trim() || "Traveler");
}

export function stampUpdate<T extends object>(row: T): T & SyncMeta {
  const member = getMember();
  return { ...row, updatedAt: new Date().toISOString(), updatedBy: member?.id ?? "unknown" };
}
