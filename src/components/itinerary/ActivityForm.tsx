import { useEffect, useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { CategoryBadge } from "../ui/CategoryBadge";
import { activityCategories, activityCategoryOrder } from "../../utils/categories";
import { buildMapsUrl } from "../../utils/mapsUrl";
import type { Activity, ActivityCategory } from "../../types";

export interface ActivityFormValues {
  time: string;
  title: string;
  placeName: string;
  googleMapsUrl: string;
  category: ActivityCategory;
  notes: string;
}

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ActivityFormValues) => void;
  initialActivity?: Activity | null;
}

const emptyValues: ActivityFormValues = {
  time: "",
  title: "",
  placeName: "",
  googleMapsUrl: "",
  category: "attraction",
  notes: "",
};

export function ActivityForm({ isOpen, onClose, onSave, initialActivity }: ActivityFormProps) {
  const [values, setValues] = useState<ActivityFormValues>(emptyValues);
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialActivity) {
        setValues({
          time: initialActivity.time,
          title: initialActivity.title,
          placeName: initialActivity.placeName,
          googleMapsUrl: initialActivity.googleMapsUrl,
          category: initialActivity.category,
          notes: initialActivity.notes,
        });
        setUseCustomUrl(initialActivity.googleMapsUrl !== buildMapsUrl(initialActivity.placeName));
      } else {
        setValues(emptyValues);
        setUseCustomUrl(false);
      }
    }
  }, [isOpen, initialActivity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return;
    onSave({
      ...values,
      googleMapsUrl: useCustomUrl ? values.googleMapsUrl : "",
    });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialActivity ? "Edit Activity" : "Add Activity"}>
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Time</label>
            <input
              type="time"
              inputMode="none"
              value={values.time}
              onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))}
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Title</label>
            <input
              type="text"
              required
              autoFocus
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="Senso-ji Temple"
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Place name</label>
            <input
              type="text"
              value={values.placeName}
              onChange={(e) => setValues((v) => ({ ...v, placeName: e.target.value }))}
              placeholder="Senso-ji Temple, Asakusa"
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
            {values.placeName && !useCustomUrl && (
              <p className="mt-1 truncate text-xs text-muted">{buildMapsUrl(values.placeName)}</p>
            )}
          </div>

          <details
            className="rounded-lg border border-slate/10 px-3 py-2"
            open={useCustomUrl}
            onToggle={(e) => setUseCustomUrl((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer text-sm font-medium text-slate">Use custom URL</summary>
            <input
              type="url"
              value={values.googleMapsUrl}
              onChange={(e) => setValues((v) => ({ ...v, googleMapsUrl: e.target.value }))}
              placeholder="https://maps.google.com/..."
              className="mt-2 w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </details>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activityCategoryOrder.map((cat) => (
                <CategoryBadge
                  key={cat}
                  emoji={activityCategories[cat].emoji}
                  label={activityCategories[cat].label}
                  color={activityCategories[cat].color}
                  selected={values.category === cat}
                  onClick={() => setValues((v) => ({ ...v, category: cat }))}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate">Notes</label>
            <textarea
              rows={3}
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              className="w-full rounded-lg border border-slate/10 px-3 py-2.5 text-base"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate/5 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-full bg-sky font-medium text-white active:scale-95"
          >
            Save
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
