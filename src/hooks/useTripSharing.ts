import { useCallback } from "react";
import type { Activity, CloudMember, Expense, ItineraryDay, Trip } from "../types";
import { backend } from "../utils/backend";
import { ensureMember } from "../utils/member";
import type { JoinResult } from "../utils/syncBackend";

export function useTripSharing() {
  const shareTrip = useCallback(
    async (
      trip: Trip,
      days: ItineraryDay[],
      activities: Activity[],
      expenses: Expense[],
      displayName?: string
    ) => {
      const member = ensureMember(displayName);
      const { cloudId, inviteCode } = await backend.shareTrip({ trip, days, activities, expenses }, member.id, member.displayName);
      return { cloudId, inviteCode, member };
    },
    []
  );

  const joinTrip = useCallback(async (inviteCode: string, displayName?: string): Promise<JoinResult> => {
    const member = ensureMember(displayName);
    return backend.joinTrip(inviteCode.trim(), member.id, member.displayName);
  }, []);

  const loadMembers = useCallback(async (cloudId: string): Promise<CloudMember[]> => {
    return backend.loadMembers(cloudId);
  }, []);

  return { shareTrip, joinTrip, loadMembers };
}
