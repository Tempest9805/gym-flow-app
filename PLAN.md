# PLAN: Gym Flow App (User-Only MVP)

## Project Summary
`gym-flow-app` is a mobile-first Fitness app for iOS and Android focused on individual users.

The MVP is intentionally simplified to avoid unnecessary complexity and concentrate on the core user experience:
1. Browse exercises by category
2. View exercise detail with instructions and short media guidance
3. Build weekly routines from the exercise catalog
4. Share routines with other users through QR or invite code

The app must feel like a kiosk-style ordering system:
- extremely simple
- large touch targets
- minimal steps
- visual-first navigation
- zero unnecessary complexity

## Business Goal
Provide a fast, low-friction fitness app for individual users that helps them discover exercises, understand correct execution, create weekly routines, and share routines with others.

## Authorization Model
For the MVP, the system is user-only.

### Access Rules
- Each authenticated user manages only their own data.
- A user can read the shared exercise catalog.
- A user can create, edit, and delete only their own routines.
- A user can share routines with another user through QR or share code.
- A user can accept or duplicate routines shared by other users.

No gym logic, no coach/trainer roles, and no multi-tenant permissions are part of the MVP.

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

- **workout_schedules** (optional but useful for weekly planning)
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
- A profile belongs to exactly one authenticated user.
- A routine must belong to exactly one user.
- A routine exercise must belong to exactly one routine.
- A share code must be unique while active.
- A shared routine must always have a valid authorization path.
- No recursive RLS policies are allowed.
- No gym-based or role-based dependencies are allowed in the MVP.

## MVP Feature Roadmap
### Phase 1: Core User Foundation
- [x] Supabase Auth + Profiles setup
  - [x] Create Supabase client with expo-secure-store persistence
  - [x] Setup environment variables
  - [x] Create Auth Context / Store
  - [x] Implement simple login screen
  - [x] Implement basic route protection
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

### Phase 2: Kiosk UX & Workflows
- [x] Weekly workout agenda
  - [x] User schedule visualization
  - [x] Day-by-day routine overview
- [ ] Workout session improvements
- [ ] Better exercise search and filters
- [ ] Better progress display

### Phase 3: Growth Features
- [ ] Progress history
- [ ] Notifications
- [ ] Basic analytics
- [ ] Routine templates
- [ ] Saved favorites

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

## UI & UX Architecture
- **Framework:** Expo (React Native) + Expo Router
- **Styling:** NativeWind only
- **Design principle:** kiosk-style simplicity
- **UX Principles:**
  - One primary action per screen
  - Large touch targets
  - Minimal text input
  - Card-based browsing
  - Clear visual hierarchy
  - No cluttered navigation
  - Fast comprehension at a glance

## API & Data Access
- All data access must go through `lib/api`
- No direct `supabase-js` calls inside UI components
- Use React Query for server state
- Enforce authorization only by user ownership
- Use Supabase RLS policies as the final security boundary
- Keep all policies non-recursive and minimal

## Wireframe Plan (Stitch MCP)
Generate wireframes using Stitch MCP for the MVP screens only.

### Required Wireframes
1. Login
2. Home
3. Exercise List
4. Exercise Detail
5. Routine Builder
6. Weekly Agenda
7. Share Routine
8. Accept Shared Routine

### Wireframe Requirements
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
- No high-fidelity polish in MVP wireframes

### Wireframe Output Goal
Define structure, spacing, hierarchy, and interaction flow suitable for direct implementation in Expo React Native.

## Scalability Notes
- The MVP is intentionally user-only to reduce complexity and improve stability.
- The schema should support future expansion into social features, notifications, analytics, and richer routine sharing.
- RLS policies must remain simple and non-recursive.
- The exercise catalog should support future filtering, favorites, and recommendations without restructuring core entities.

**STOP: Awaiting approval for PLAN.md.**