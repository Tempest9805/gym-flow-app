# 🏋️ Gym Flow App — Project Context & Audit

**Target Audience:** No-context LLMs assisting the user in future sessions.
**Frameworks & Tech Stack:**
- **Core:** React Native / Expo Router (File-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native) / Vanilla React Native Styles
- **Data & Auth:** Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management:** Zustand (for local/session states like Tabata Timer), TanStack React Query (Server state and data fetching)
- **UI Architecture:** Custom-built components adhering strictly to "Stitch UI" high-end design aesthetics (glassmorphism, vibrant accents `#BC13FE`, neon glows). NO `StyleSheet.create`.

---

## 📌 Recent Major Implementations

### 1. Home Screen & Streak System (`app/(app)/index.tsx`)
- **Visuals:** Features a dynamic Greeting, a "Streak Card" with an animated pulsing flame (changes color from grey -> orange -> red -> purple based on weekly streak), a Weekly Days Tracker (`SU` to `SA`), Today's Routine card, and horizontal Saved Routines scroll.
- **Logic:** 
  - Streak calculated weekly (`lib/api/streak.ts`). Uses Supabase table `user_streaks`.
  - When all exercises in "Today's Routine" are checked off, the system triggers `markDayCompleted` silently to increment the streak.
  - Queries powered by React Query (`getTodaySchedule`, `getWeekSchedule`, `getAllRoutines`).

### 2. Routine Builder & CRUD (`app/(app)/routine-builder.tsx` & `routines.tsx`)
- **Structure:** `routines.tsx` renders a FlatList of `RoutineCard` components with "Edit" (pencil) and "Delete" (trash) buttons.
- **Builder (`routine-builder.tsx`):**
  - Fully dynamic form that handles standard weights/reps, time-based exercises, and cardio.
  - Day selector assigns `day_of_week` to all exercises.
  - Exercises can be reordered (up/down arrows) or removed.
  - Interactive "pills" toggle `exercise_type` between `'reps' | 'time' | 'cardio'`.
  - **Schema Update:** The `routine_exercises` table now includes `duration_seconds` (INTEGER) and `exercise_type` (TEXT check in `reps`, `time`, `cardio`). Weight is purely optional (`null` allowed).
  - **API:** `upsertRoutine` gracefully handles updates by deleting existing `routine_exercises` for a given routine and re-inserting the fresh payload to ensure index ordering and purity.

### 3. Tabata Timer (`app/(app)/tabata-active.tsx` & `tabata-summary.tsx`)
- **Active State:** High-performance, full-screen three-zone layout. Top zone shows the current phase (GET READY, WORK, REST), center shows the countdown, bottom manages controls. Uses Zustand (`tabataStore`) to keep track of phases.
- **Summary State:** A polished results screen with an animated bouncing trophy and stats (total sets, total time).
- **Recent Fixes:** Adjusted `totalTimeLeft` logic, corrected visual overflow bugs with the camera/Dynamic Island (Safe Areas injected manually using `useSafeAreaInsets`), and forced strict `MM:SS` formatting via zero-padding.

### 4. Exercises Database (`app/(app)/exercise/[id].tsx` & `components/ExerciseListItem.tsx`)
- **Images:** Migrated placeholder images to use real Supabase local assets. Bound to a local `mediaMap.ts` which statically requires `.webp` images stored in `assets/normalized/`.
- **Parsing:** Details screen parses JSON strings from the database to present step-by-step instructions with `1️⃣, 2️⃣` emojis.

---

## 🗄️ Database Schema & Rules (Supabase)

**Key Tables Updated Recently:**
1. `routines` (id, user_id, name, created_at)
2. `routine_exercises` 
   - `id`, `routine_id`, `exercise_id`
   - `day_of_week` (0-6)
   - `order_index` (sorting)
   - `sets`, `reps`, `weight`
   - `rest_seconds`
   - **NEW:** `duration_seconds` (INT)
   - **NEW:** `exercise_type` (TEXT 'reps' | 'time' | 'cardio')
3. `user_streaks`
   - `id`, `user_id`
   - `current_streak`, `longest_streak`
   - `last_active_week` (TEXT, e.g., '2026-W20')
   - `completed_days_this_week` (INTEGER ARRAY)

---

## 🚨 Strict Rules for AI Assistants

1. **NO Layout Compromises:** "Stitch" designs are the absolute truth. Aesthetics must remain premium, dark mode default, with highly readable fonts.
2. **Component Purity:** DO NOT use `StyleSheet.create`. Only use NativeWind classes + inline styles for dynamic variables (`boxShadow`, colors based on logic).
3. **No Any:** Use strict TypeScript. `types/index.ts` and `lib/api/schemas.ts` (Zod) map out the database entities.
4. **Tool Use:** Always run checks (e.g. `pnpm typecheck`) before concluding a task.

---
**Timestamp of this Audit:** May 2026.
**Current Focus / Next Steps:** Further refinement of user profile, global icon standardization (`@expo/vector-icons`), or deployment readiness depending on user instruction.
