# PLAN: Gym Flow App (User-Only MVP + Stitch UI System)

## 🟢 Current Status
- **Exercises**: 147 synced to Supabase ✅
- **Security**: Production RLS active on all tables ✅
- **Validation**: Zod schemas cover all lib/api responses ✅
- **TypeScript**: 0 compiler errors ✅
- **Phase 1**: Complete ✅
- **Phase 2**: Complete ✅
- **Phase 3**: Complete (Timer + Tabata) ✅
- **Phase 4**: In progress — styling and type hardening pending
- **Next**: NativeWind migration (StyleSheet.create → utility classes)

## Project Summary
`gym-flow-app` is a mobile-first fitness app for iOS and Android focused on individual users.

The product is intentionally simplified to avoid unnecessary complexity and concentrate on the core experience:
1. Browse exercises by category
2. View exercise detail with instructions and short media guidance
3. Build weekly routines from the exercise catalog
4. Track daily completion and weekly workout progress
5. Share routines with other users through QR or invite code
6. Use lightweight utility tools such as Timer and Tabata from the hamburger menu

The app must feel like a kiosk-style ordering system:
- extremely simple
- large touch targets
- minimal steps
- visual-first navigation
- zero unnecessary complexity

## Product Goal
Provide a fast, low-friction fitness app for individual users that helps them discover exercises, understand correct execution, create weekly routines, track workout completion, and share routines with others.

The app should feel premium, modern, and easy to use, while remaining simple enough for a first-time user to understand immediately.

---

## Source of Truth for UI
The visual design and layout structure must follow the generated Stitch screens stored in:

- `assets/stitch_gym_flow_app`

These Stitch exports are the source of truth for:
- screen structure
- spacing rhythm
- card hierarchy
- CTA placement
- navigation composition
- dark theme styling
- visual language consistency

### UI Rules for Stitch Implementation
- Do not invent new layouts unless strictly necessary
- Do not redesign the screens from scratch
- Preserve the Stitch structure as much as possible
- Keep the app visually consistent across all screens
- Only change colors/themes through tokens, not layout structure
- Keep the UX simple, kiosk-style, and mobile-first

---

## Themes
The app supports two visual themes:

### 1. Neon Purple (Default)
- This is the default theme on first launch
- Used for the main visual identity of the app
- Dark-first with neon purple accents

### 2. Neon Orange
- Available as an alternate theme
- Selectable from Profile / Settings
- Persists across app launches
- Must preserve the same layout structure and only change accent tokens

### Theme Rules
- Theme changes must affect colors, borders, active states, buttons, tabs, and highlights
- Do not create separate layouts for each theme
- Keep both themes visually premium and readable
- Use theme tokens instead of hardcoded colors

---

## Business Goal
Provide a scalable, low-friction fitness tool for individuals that focuses on exercise discovery, routine creation, workout tracking, and routine sharing without forcing gym-based or coach-based complexity.

---

## Authorization Model
For the MVP, the system is user-only.

### Access Rules
- Each authenticated user manages only their own data
- A user can read the shared exercise catalog
- A user can create, edit, and delete only their own routines
- A user can share routines with another user through QR or share code
- A user can accept or duplicate routines shared by other users

No gym logic, no coach/trainer roles, and no multi-tenant permissions are part of the MVP.

---

## Auth Flow
The final auth flow must include:
- Login
- Sign Up
- Forgot Password
- Reset Password

### Auth Rules
- Keep auth flow clean and stable
- Profile creation must be handled by the backend, not manually in the UI
- No loading deadlocks
- No broken redirects
- No race conditions between session and profile loading
- Guest/dev login options should not be part of the final user-facing flow unless explicitly reintroduced later

---

## Language Support
The app supports two languages:
- Spanish (ES)
- English (EN)

### Language Rules
- Users can switch language from Profile / Settings or a clearly visible place
- The selected language must persist
- UI text should adapt cleanly
- Keep labels short and readable
- Avoid cluttering screens with duplicate bilingual text

---

## Database Schema (Supabase / PostgreSQL)
Use a simple user-centered model linked to `auth.users`.

### Core Tables
- **profiles**
  - `id` (UUID, PK and FK to `auth.users.id`)
  - `email`
  - `full_name`
  - `avatar_url`
  - `created_at`

- **exercises**
  - `id`
  - `slug`
  - `name_en`
  - `name_es`
  - `category`
  - `muscle_group`
  - `equipment`
  - `difficulty`
  - `type`
  - `is_compound`
  - `movement_pattern`
  - `demonstration_url`
  - `description`
  - `notes`
  - `created_at`

- **routines**
  - `id`
  - `user_id` (FK to `profiles.id`)
  - `name`
  - `description`
  - `created_at`
  - `updated_at`

- **routine_exercises**
  - `id`
  - `routine_id` (FK to `routines.id`)
  - `exercise_id` (FK to `exercises.id`)
  - `day_of_week`
  - `order_index`
  - `sets`
  - `reps`
  - `weight`
  - `rest_seconds`
  - `notes`
  - `created_at`

- **routine_shares**
  - `id`
  - `routine_id` (FK to `routines.id`)
  - `sender_user_id` (FK to `profiles.id`)
  - `receiver_user_id` (FK to `profiles.id`, nullable until accepted)
  - `share_code`
  - `share_type` (code, qr)
  - `status` (pending, accepted, revoked, expired)
  - `created_at`
  - `accepted_at` (nullable)

- **workout_schedules** (used for weekly agenda / weekly tracking)
  - `id`
  - `user_id` (FK to `profiles.id`)
  - `routine_id` (FK to `routines.id`)
  - `day_of_week`
  - `is_active`
  - `created_at`

### Referential Integrity Rules
- `profiles.id` references `auth.users.id`
- `routines.user_id` references `profiles.id`
- `routine_exercises.routine_id` references `routines.id`
- `routine_exercises.exercise_id` references `exercises.id`
- `routine_shares.routine_id` references `routines.id`
- `routine_shares.sender_user_id` references `profiles.id`
- `routine_shares.receiver_user_id` references `profiles.id`
- `workout_schedules.user_id` references `profiles.id`
- `workout_schedules.routine_id` references `routines.id`

### Integrity Rules
- A profile belongs to exactly one authenticated user
- A routine must belong to exactly one user
- A routine exercise must belong to exactly one routine
- A share code must be unique while active
- A shared routine must always have a valid authorization path
- No recursive RLS policies are allowed
- No gym-based or role-based dependencies are allowed in the MVP

---

## MVP Feature Roadmap

### Phase 1: Core User Foundation
- [x] Supabase Auth + Profiles setup
  - [x] Create Supabase client with expo-secure-store persistence
  - [x] Setup environment variables
  - [x] Create Auth Context / Store
  - [x] Implement login screen
  - [x] Implement route protection
  - [x] Implement sign up / forgot password / reset password flow

- [x] Exercise catalog integration
  - [x] Connect real exercises table
  - [x] Group/filter by category
  - [x] Search by name

- [x] Exercise detail experience
  - [x] Description
  - [x] Gif/video guide
  - [x] Clear back navigation

- [x] Routine creation
  - [x] Weekly routine builder
  - [x] Sets, reps, weight, day-of-week
  - [x] Save and edit routines

- [x] Routine sharing
  - [x] Share code
  - [x] QR generation
  - [x] Accept or duplicate shared routines

- [x] UI system from Stitch
  - [x] Stitch-based layout implementation
  - [x] Neon Purple theme default
  - [x] Neon Orange alternate theme
  - [x] Theme selector in Profile / Settings
  - [x] Theme persistence across app launches
  - [x] ES / EN language switching

### Phase 2: Kiosk UX & Workflows
- [x] Weekly workout agenda
  - [x] User schedule visualization
  - [x] Day-by-day routine overview
  - [x] Weekly progress tracking

- [x] Home routine improvements
  - [x] Routine display on Home
  - [x] Beginner-friendly explanations for sets and reps
  - [x] Exercise completion state
  - [x] Tappable exercise names that open detail
  - [x] Weekly day completion checks

- [ ] Workout session improvements
- [ ] Better exercise search and filters
- [ ] Better progress display

### Phase 3: Utility Tools
- [x] Timer (hamburger menu)
- [x] Tabata (hamburger menu)
- [x] Timer and Tabata should each have:
  - [x] setup view
  - [x] active session view

### Phase 4: Growth & Remediation
- [x] Hardened RLS for routines, routine_exercises, workout_schedules, profiles
- [x] Revoked temporary bypass policies (temp_anon_write, allow_anon_insert)
- [x] Implement Zod validation in lib/api (schemas.ts, all 6 entities)
- [x] Global type alignment — types/index.ts re-exports Zod-inferred types
- [x] TSC passes with 0 errors (npx tsc --noEmit)
- [x] Fix sharing RLS — recipient can read pending shared routines
- [ ] Refactor styles to NativeWind (02-styling.md compliance)
- [ ] TypeScript hardening — eliminate remaining any in UI components
- [ ] Progress history
- [ ] Notifications
- [ ] Basic analytics
- [ ] Routine templates
- [ ] Saved favorites

---

## UX Enforcement Rules (Critical)
These are mandatory constraints, not guidelines.

### Interaction Rules
- Maximum 1 primary action per screen
- Maximum 2 secondary actions
- Maximum navigation depth of 2 levels
- No hidden core actions behind menus or gestures
- No multi-step wizards longer than 3 steps in MVP

### Layout Rules
- All primary buttons must be large and visually dominant
- Minimum touch target size: 44x44 points
- Prefer full-width buttons when possible
- Use cards for exercises and selectable options
- Avoid dense layouts and compact controls

### Content Rules
- Avoid long text blocks
- Prefer icons plus short labels
- Replace text inputs with selections whenever possible
- Use short titles and clear action labels
- Keep instructions brief and direct

### Flow Rules
- The user must understand the screen purpose in under 2 seconds
- Core actions must be reachable in 2 taps or fewer
- Workout flow must be linear and guided
- No branching complexity in the MVP

### Strictly Forbidden
- Dropdown-heavy forms
- Multi-step wizards longer than 3 steps
- Hidden navigation for core actions
- Overloaded dashboards with too much data
- Small buttons or text-heavy interfaces
- Sidebars or complex menus for the MVP

### Definition of Success
A first-time user of any age must be able to:
- open the app
- understand what to do immediately
- browse exercises easily
- create a routine without confusion
- share or receive a routine with minimal friction
- switch themes without confusion
- switch language without confusion

---

## UI & UX Architecture
- **Framework:** Expo (React Native) + Expo Router
- **Styling:** NativeWind only
- **Design principle:** kiosk-style simplicity
- **Design source of truth:** Stitch exports in `assets/stitch_gym_flow_app`
- **UX Principles:**
  - One primary action per screen
  - Large touch targets
  - Minimal text input
  - Card-based browsing
  - Clear visual hierarchy
  - No cluttered navigation
  - Fast comprehension at a glance
  - Keep layouts faithful to Stitch
  - Do not invent new layout structures unless technically unavoidable

---

## API & Data Access
- All data access must go through `lib/api`
- No direct `supabase-js` calls inside UI components
- Use React Query for server state
- Enforce authorization only by user ownership
- Use Supabase RLS policies as the final security boundary
- Keep all policies non-recursive and minimal

---

## Wireframe / UI Plan
The project now uses Stitch-generated designs as the visual implementation base.

### Required UI Areas
1. Login
2. Sign Up
3. Forgot Password
4. Reset Password
5. Home
6. Exercise List
7. Exercise Detail
8. Routine Builder
9. Weekly Agenda
10. Share Routine
11. Import Routine
12. Profile / Settings
13. Theme selector
14. Language selector
15. Timer setup / Timer active screens
16. Tabata setup / Tabata active screens

### UI Requirements
- Mobile-first
- Ultra simple
- Kiosk-style like a modern ordering terminal
- Large buttons
- Visual hierarchy
- Minimal text
- No clutter
- Card-based exercise browsing
- One primary action per screen
- No decorative complexity
- Dark mode first
- Neon Purple default theme
- Neon Orange alternate theme

---

## Scalability Notes
- The MVP is intentionally user-only to reduce complexity and improve stability
- The schema should support future expansion into social features, notifications, analytics, richer routine sharing, and workout utilities
- RLS policies must remain simple and non-recursive
- The exercise catalog should support future filtering, favorites, and recommendations without restructuring core entities
- Stitch-based UI should remain the visual baseline for future screens and refinements
