export const STORAGE_KEYS = {
  trips: "travel_app:trips",
  days: "travel_app:days",
  activities: "travel_app:activities",
  expenses: "travel_app:expenses",
} as const;

export function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}
