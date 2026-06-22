import { mockBackend } from "./mockBackend";
import type { SyncBackend } from "./syncBackend";

// Real Supabase backend will be selected here once VITE_SUPABASE_URL is set.
export const backend: SyncBackend = mockBackend;
