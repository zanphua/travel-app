# Trip Collaboration — Feature Spec

## Overview

Add the ability to **share a trip with friends via a short invite code**, so
multiple people can view and edit the same itinerary and expenses. This is a
deliberate amendment to the original product spec's "no backend / no cloud
sync" non-goal — that constraint held for a single-user journal; it can't
hold for a feature whose entire point is "two phones see the same data."

**Scope of this phase:** make sharing work, simply and reliably, for small
trusted groups (the people you're actually traveling with). Not in scope:
granular permissions, offline editing of shared trips, push notifications,
or undo/audit history. Those are called out as future work below.

---

## Design principles

1. **Local-only trips stay exactly as they are.** Nothing about today's
   localStorage-only flow changes unless a user explicitly shares a trip.
2. **No email/password signup.** Joining a trip should feel as light as
   entering a code, not creating an account. Use Supabase anonymous auth
   under the hood — it issues a real session without ever asking for
   credentials.
3. **One-way upgrade.** A local trip can become a shared trip. A shared trip
   does not convert back (v1). This avoids merge-conflict edge cases on
   downgrade.
4. **Last-write-wins.** No CRDT/OT merge logic. Every row gets `updatedAt`;
   the most recent write for a given row wins. Good enough for a group of
   friends editing a shared itinerary, not good enough for adversarial or
   highly concurrent editing — that's an explicit tradeoff, not an oversight.

---

## Architecture

### Backend: Supabase

Chosen because it gives us, with no servers to run ourselves:
- Postgres (relational, matches our existing typed models closely)
- Realtime (Postgres change feed over websockets) for live multi-device sync
- Anonymous auth (frictionless "join with a code" UX)
- Row Level Security (RLS) to enforce "only trip members can read/write this
  trip's data" at the database layer, not just in client code

### High-level flow

```
Device A                         Supabase                        Device B
--------                         --------                        --------
Create local trip
Tap "Share trip"
  → upload trip + days
    + activities + expenses
  → generate invite code    →    trips row (cloud_id, invite_code)
  → trip.isShared = true          trip_members row (device A)

                                  Device B enters code
                             ←    lookup trip by invite_code
                                  trip_members row (device B)  →  Trip now in
                                                                   B's trip list

Device A adds activity     →    activities row insert      →    Realtime push  →  appears on B
Device B adds expense      →    expenses row insert         →    Realtime push  →  appears on A
```

---

## Data model changes

### Trip (extended)

```typescript
interface Trip {
  // ...existing fields unchanged...
  isShared: boolean;          // false = local-only (today's behavior)
  cloudId?: string;            // Supabase trips.id, only set if isShared
  inviteCode?: string;         // e.g. "7K2P9Q", only set if isShared, owner-visible
}
```

### ItineraryDay / Activity / Expense (extended)

```typescript
interface SyncMeta {
  updatedAt: string;     // ISO timestamp, set on every write
  updatedBy: string;     // memberId of whoever last wrote it
}
```
`ItineraryDay`, `Activity`, and `Expense` all gain these two fields. Used for
last-write-wins conflict resolution and for "added/edited by" attribution in
the UI.

### New: Member (local concept, no login)

```typescript
interface DeviceMember {
  id: string;            // uuid, generated once per device, stored locally
  displayName: string;   // user-chosen, e.g. "Zan" — prompted once on first share/join
}
```
Stored in `localStorage` under `travel_app:member`. This is the "identity"
used for `updatedBy` / `paidBy` defaults and member avatars — not a real
account, just a stable label for "who did this" within a shared trip.

### Supabase schema (cloud-side only, mirrors the above)

```sql
trips (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,      -- short, e.g. 6 chars, collision-checked
  name text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  cover_emoji text not null,
  currency text not null,
  created_at timestamptz default now()
);

trip_members (
  trip_id uuid references trips(id) on delete cascade,
  member_id uuid not null,               -- matches DeviceMember.id, not auth.uid
  display_name text not null,
  auth_user_id uuid references auth.users(id),  -- the anonymous session that owns this membership
  joined_at timestamptz default now(),
  primary key (trip_id, member_id)
);

itinerary_days (
  id uuid primary key, trip_id uuid references trips(id) on delete cascade,
  date date not null, label text not null,
  updated_at timestamptz default now(), updated_by uuid not null
);

activities (
  id uuid primary key, trip_id uuid references trips(id) on delete cascade,
  day_id uuid references itinerary_days(id) on delete cascade,
  time text, title text not null, notes text, place_name text,
  google_maps_url text, category text not null,
  updated_at timestamptz default now(), updated_by uuid not null
);

expenses (
  id uuid primary key, trip_id uuid references trips(id) on delete cascade,
  date date not null, description text not null, amount numeric not null,
  currency text not null, category text not null, paid_by text,
  updated_at timestamptz default now(), updated_by uuid not null
);
```

**RLS policy shape** (applied to every table above): a row is readable/
writable only if the requesting `auth.uid()` has a matching `trip_members`
row for that `trip_id`. The invite-code lookup itself (`SELECT id FROM trips
WHERE invite_code = ?`) is the one query allowed without membership, scoped
to a Postgres function rather than the raw table, so codes can't be used to
enumerate trip contents before joining.

---

## User flows

### 1. Sharing a trip (becoming the owner)

- On Trip Detail, the edit (pencil) sheet gains a **"Share trip"** section
  at the bottom (below the existing fields).
- First time sharing anything: prompt for a display name (one text input,
  "What should friends call you?") — stored as the `DeviceMember`.
- Tap "Share trip" → uploads the trip + all its days/activities/expenses to
  Supabase in one batch, generates a 6-character invite code, flips
  `trip.isShared = true`.
- Sheet now shows the code large and tappable, plus a **native share sheet**
  button (`navigator.share` with graceful fallback to copy-to-clipboard) —
  pre-filled with something like *"Join my trip on Travel Planner: 7K2P9Q"*.

### 2. Joining a trip (a friend)

- The existing "+" bottom sheet (today: just the trip-creation form) gains
  a **"Create" / "Join" tab switcher** at its top, above the title.
- The "Join" tab is only rendered **once the user already has at least one
  trip** in their list. A fresh install with zero trips sees only "Create"
  — there's nothing to switch to until the empty-state CTA path has been
  used at least once. This keeps first-run as simple as the original spec
  intended, while still surfacing joining for returning users.
- "Join" tab content: 6 large character boxes, numeric/alphanumeric
  keyboard, auto-advances per character.
- On submit: look up the trip by code, prompt for display name if this
  device has never set one, write a `trip_members` row, download the
  trip + its days/activities/expenses, and insert them into local state as
  a new shared trip. Lands the user on Trip Detail → Itinerary, same as
  creating a trip normally.
- Invalid/expired code → inline error under the code boxes, no navigation.

### 3. Live collaboration

- Once `trip.isShared`, the Itinerary and Expenses tabs subscribe to a
  Supabase Realtime channel scoped to that `trip_id` for `activities`,
  `itinerary_days`, and `expenses` tables.
- Incoming changes merge into local state by `id`: upsert if `updated_at` on
  the incoming row is newer than what's cached locally, otherwise ignore
  (last-write-wins, prevents a stale realtime echo from clobbering a fresher
  local edit made a moment earlier).
- Every local mutation writes to Supabase directly (no local-first queue in
  v1 — see "Known limitations"). The existing `useItinerary`/`useExpenses`
  hooks gain a branch: if `trip.isShared`, write through to Supabase instead
  of (in addition to, for offline cache purposes) `localStorage`.
- Small **avatar/initial badge** on `ActivityCard` and `ExpenseRow` shows who
  last touched that item, using `updatedBy` → member display name (members
  list fetched once per trip load, cached).

### 4. Leaving / managing members (minimal v1)

- Trip edit sheet, when `isShared`, shows a simple member list (display
  names only) under the invite code section. No remove/kick action in v1 —
  that needs an owner-vs-member permission concept we're deliberately not
  building yet.

---

## Tech stack additions

| Concern | Choice |
|---|---|
| Client SDK | `@supabase/supabase-js` |
| Auth | Supabase anonymous auth (`signInAnonymously`) — one session per device, created lazily on first share/join |
| Realtime | Supabase Realtime Postgres Changes, one channel per shared trip, subscribed only while that trip's tabs are mounted |
| Invite code generation | 6-char base32-ish alphabet (excludes ambiguous chars like 0/O, 1/I), collision-checked against `trips.invite_code` with retry |
| Env config | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — public anon key is safe to ship client-side; RLS is what actually protects data |

### New files

```
src/utils/supabaseClient.ts     # createClient() singleton
src/utils/inviteCode.ts          # generate/validate code format
src/hooks/useTripSharing.ts      # shareTrip(), joinTrip(code), member list
src/hooks/useRealtimeSync.ts     # subscribe/merge for a shared trip's tables
src/components/trips/ShareTripSheet.tsx
src/components/trips/JoinTripSheet.tsx
src/components/ui/MemberBadge.tsx
```

### Hook changes

`useItinerary` and `useExpenses` need a `trip` (not just `tripId`) passed in
so they know whether to route writes to Supabase or `localStorage`. Reads
for shared trips come from local state that's been hydrated from Supabase
on mount + kept current via the realtime subscription — the read API
shape for components doesn't change.

---

## Known limitations (explicit, not hidden)

- **No offline support for shared trips.** Writes to a shared trip require
  connectivity; there's no local queue + replay. If this matters in
  practice, it's the natural next phase (outbox pattern: write to
  localStorage immediately, queue to Supabase, flush on reconnect).
- **No fine-grained permissions.** Any member can edit or delete any
  activity/expense, including ones added by someone else. Fine for a trip
  with friends, not fine for anything adversarial.
- **No real merge for simultaneous edits to the same field.** Last-write-
  wins means if two people edit the same activity's notes within the same
  second, one silently overwrites the other. Acceptable risk for this
  product's actual usage pattern (different people adding different
  activities), worth flagging if usage patterns turn out otherwise.
- **Invite codes don't expire and aren't revocable in v1.** Anyone who has
  ever had the code can rejoin later. A "regenerate code" action would close
  this gap and is a small addition if needed.
- **Deleting a shared trip** needs a decision: does it delete for everyone,
  or just leave it for the deleter? v1 assumes only the original sharer can
  delete, and deleting cascades for all members (mirrors the existing local
  cascade-delete behavior in the spec).

---

## Decisions

1. **"Join" entry point.** The "+" bottom sheet on Home gains a "Create" /
   "Join" tab switcher at the top. The **"Join" tab only appears once the
   user already has at least one trip** — a brand-new install with zero
   trips sees only the "Create" flow (matches the existing empty-state CTA,
   "Plan your first trip"). Once a first trip exists, every subsequent "+"
   tap shows both tabs.
2. **Supabase project is stubbed for now.** Build the full UI flow (share
   sheet, join sheet, code entry, member badges) against a mock/in-memory
   version of the sync layer so the interaction can be reviewed and tested
   without a live backend. `src/utils/supabaseClient.ts` is written against
   the real `@supabase/supabase-js` API shape but reads its URL/anon key
   from env vars that, when unset, fall back to a local mock implementation
   (see "Stub strategy" below). Swapping in a real project later is just
   setting two env vars — no code changes.

### Stub strategy (no live backend yet)

To keep the UI buildable and testable before a real Supabase project
exists:
- `src/utils/syncBackend.ts` defines the interface every real call goes
  through: `shareTrip()`, `joinTrip(code)`, `subscribeToTrip(tripId, cb)`,
  `writeActivity()`, etc.
- Two implementations: `supabaseBackend.ts` (real, used when
  `VITE_SUPABASE_URL` is set) and `mockBackend.ts` (in-memory store +
  `BroadcastChannel` so multiple browser tabs on the same machine can
  simulate "two devices" during development/testing).
- `useTripSharing` and `useRealtimeSync` depend only on the interface, not
  on which implementation is active — this is the same "swap one file"
  pattern the original spec already uses for `storage.ts`.

## Open questions before implementation

1. **Do local-only trips and shared trips need a visual marker** in the
   Trips List (e.g. a small people icon on the `TripCard`) so it's obvious
   which trips are collaborative? Recommend yes — cheap and avoids
   confusion about why a trip suddenly shows other people's edits.
2. **Real Supabase project timing** — the mock backend lets us build and
   demo the full flow now. When you're ready to test real cross-device
   sync, we'll need an actual Supabase project (URL + anon key) and to
   apply the schema above via the SQL editor or a migrations folder in
   this repo.
