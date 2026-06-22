import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Share2, Copy } from "lucide-react";
import { BottomSheet } from "../ui/BottomSheet";
import { isEndAfterOrEqualStart } from "../../utils/dates";
import type { Activity, CloudMember, Expense, ItineraryDay, Trip } from "../../types";
import { useTripSharing } from "../../hooks/useTripSharing";
import { useItinerary } from "../../hooks/useItinerary";
import { useExpenses } from "../../hooks/useExpenses";
import { getMember } from "../../utils/member";

export interface TripFormValues {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
  coverEmoji: string;
}

export interface JoinedTripResult {
  trip: Trip;
  days: ItineraryDay[];
  activities: Activity[];
  expenses: Expense[];
}

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: TripFormValues) => void;
  initialTrip?: Trip | null;
  allowJoin?: boolean;
  onJoined?: (result: JoinedTripResult) => void;
  onShared?: (updates: Partial<Trip>) => void;
}

const EMOJI_OPTIONS = ["🗾", "🏖️", "🏔️", "🏙️", "🌴", "🗽", "🏰", "🚂", "🛕", "🎡", "🚢", "🏕️"];
const CURRENCY_OPTIONS = ["SGD", "USD", "JPY", "EUR", "GBP", "AUD", "THB", "KRW", "MYR", "IDR"];

const today = format(new Date(), "yyyy-MM-dd");

const emptyValues: TripFormValues = {
  name: "",
  destination: "",
  startDate: today,
  endDate: today,
  currency: "SGD",
  coverEmoji: EMOJI_OPTIONS[0],
};

export function TripForm({ isOpen, onClose, onSave, initialTrip, allowJoin, onJoined, onShared }: TripFormProps) {
  const [values, setValues] = useState<TripFormValues>(emptyValues);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const [shareName, setShareName] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<CloudMember[]>([]);

  const { joinTrip, shareTrip, loadMembers } = useTripSharing();
  const { days, activities } = useItinerary();
  const { expenses } = useExpenses();

  const existingMember = getMember();

  useEffect(() => {
    if (isOpen) {
      setError("");
      setMode("create");
      setJoinCode("");
      setJoinName("");
      setJoinError("");
      setShareName("");
      setShareError("");
      setCopied(false);
      setValues(
        initialTrip
          ? {
              name: initialTrip.name,
              destination: initialTrip.destination,
              startDate: initialTrip.startDate,
              endDate: initialTrip.endDate,
              currency: initialTrip.currency,
              coverEmoji: initialTrip.coverEmoji,
            }
          : emptyValues
      );
    }
  }, [isOpen, initialTrip]);

  useEffect(() => {
    if (initialTrip?.isShared && initialTrip.cloudId) {
      loadMembers(initialTrip.cloudId).then(setMembers);
    }
  }, [initialTrip?.isShared, initialTrip?.cloudId, loadMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.destination.trim()) return;
    if (!isEndAfterOrEqualStart(values.startDate, values.endDate)) {
      setError("End date must be on or after the start date.");
      return;
    }
    onSave(values);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    if (joinCode.trim().length < 4) {
      setJoinError("Enter the full invite code.");
      return;
    }
    if (!existingMember && !joinName.trim()) {
      setJoinError("Enter your name so friends know it's you.");
      return;
    }
    setJoining(true);
    try {
      const result = await joinTrip(joinCode, joinName);
      onJoined?.(result);
    } catch {
      setJoinError("That code didn't match any trip. Check and try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    if (!initialTrip) return;
    setShareError("");
    if (!existingMember && !shareName.trim()) {
      setShareError("Enter your name so friends know it's you.");
      return;
    }
    setSharing(true);
    try {
      const tripDays = days.filter((d) => d.tripId === initialTrip.id);
      const tripActivities = activities.filter((a) => a.tripId === initialTrip.id);
      const tripExpenses = expenses.filter((e) => e.tripId === initialTrip.id);
      const { cloudId, inviteCode } = await shareTrip(initialTrip, tripDays, tripActivities, tripExpenses, shareName);
      onShared?.({ isShared: true, cloudId, inviteCode });
    } catch {
      setShareError("Couldn't share this trip. Try again.");
    } finally {
      setSharing(false);
    }
  };

  const handleCopyCode = async () => {
    if (!initialTrip?.inviteCode) return;
    const text = `Join my trip on Travel Planner: ${initialTrip.inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const showJoinTab = allowJoin && !initialTrip;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialTrip ? "Edit Trip" : "New Trip"}>
      {showJoinTab && (
        <div className="flex gap-1 border-b border-slate/5 px-4 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`min-h-[40px] flex-1 rounded-full text-sm font-medium active:scale-95 ${
              mode === "create" ? "bg-sky text-white" : "bg-sand text-slate"
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`min-h-[40px] flex-1 rounded-full text-sm font-medium active:scale-95 ${
              mode === "join" ? "bg-sky text-white" : "bg-sand text-slate"
            }`}
          >
            Join
          </button>
        </div>
      )}

      {mode === "join" && showJoinTab ? (
        <form onSubmit={handleJoinSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate">Invite code</label>
              <input
                type="text"
                autoFocus
                autoCapitalize="characters"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="7K2P9Q"
                className="w-full rounded-lg border border-slate/10 px-3 py-3 text-center font-mono text-2xl tracking-[0.3em]"
              />
            </div>
            {!existingMember && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate">What should friends call you?</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Zan"
                  className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
                />
              </div>
            )}
            {joinError && <p className="text-sm text-danger">{joinError}</p>}
          </div>
          <div className="shrink-0 border-t border-slate/5 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <button
              type="submit"
              disabled={joining}
              className="min-h-[44px] w-full rounded-full bg-sky font-medium text-white active:scale-95 disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join trip"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate">Trip name</label>
              <input
                type="text"
                required
                autoFocus
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                placeholder="Japan 2025"
                className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate">Destination</label>
              <input
                type="text"
                required
                value={values.destination}
                onChange={(e) => setValues((v) => ({ ...v, destination: e.target.value }))}
                placeholder="Tokyo, Japan"
                className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate">Start date</label>
                <input
                  type="date"
                  required
                  value={values.startDate}
                  onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate">End date</label>
                <input
                  type="date"
                  required
                  value={values.endDate}
                  onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
                />
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate">Currency</label>
              <select
                value={values.currency}
                onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))}
                className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate">Cover emoji</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, coverEmoji: emoji }))}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-xl active:scale-95 ${
                      values.coverEmoji === emoji ? "bg-sky/15 ring-2 ring-sky" : "bg-sand"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {initialTrip && (
              <div className="border-t border-slate/5 pt-4">
                <h3 className="mb-2 text-sm font-semibold text-slate">Share trip</h3>
                {initialTrip.isShared && initialTrip.inviteCode ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex w-full items-center justify-between rounded-lg bg-sand px-3 py-3 active:scale-[0.98]"
                    >
                      <span className="font-mono text-2xl tracking-[0.3em] text-slate">{initialTrip.inviteCode}</span>
                      <span className="flex items-center gap-1 text-sm font-medium text-sky">
                        {copied ? "Copied" : <Share2 size={16} />}
                      </span>
                    </button>
                    {members.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted">Members</p>
                        <ul className="space-y-1 text-sm text-slate">
                          {members.map((m) => (
                            <li key={m.memberId}>{m.displayName}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      Generate an invite code so friends can view and add to this trip.
                    </p>
                    {!existingMember && (
                      <input
                        type="text"
                        value={shareName}
                        onChange={(e) => setShareName(e.target.value)}
                        placeholder="What should friends call you?"
                        className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
                      />
                    )}
                    {shareError && <p className="text-sm text-danger">{shareError}</p>}
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={sharing}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-sand font-medium text-slate active:scale-95 disabled:opacity-60"
                    >
                      <Copy size={16} />
                      {sharing ? "Sharing…" : "Share trip"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate/5 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-full bg-sky font-medium text-white active:scale-95"
            >
              {initialTrip ? "Save Changes" : "Create Trip"}
            </button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
