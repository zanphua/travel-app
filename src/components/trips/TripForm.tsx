import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BottomSheet } from "../ui/BottomSheet";
import { isEndAfterOrEqualStart } from "../../utils/dates";
import type { Trip } from "../../types";

export interface TripFormValues {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
  coverEmoji: string;
}

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: TripFormValues) => void;
  initialTrip?: Trip | null;
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

export function TripForm({ isOpen, onClose, onSave, initialTrip }: TripFormProps) {
  const [values, setValues] = useState<TripFormValues>(emptyValues);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.destination.trim()) return;
    if (!isEndAfterOrEqualStart(values.startDate, values.endDate)) {
      setError("End date must be on or after the start date.");
      return;
    }
    onSave(values);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialTrip ? "Edit Trip" : "New Trip"}>
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
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
    </BottomSheet>
  );
}
