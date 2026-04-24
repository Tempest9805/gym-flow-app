# PLAN: Gym Flow App (Hybrid Fitness SaaS)

## Project Summary
`gym-flow-app` is a hybrid mobile-first Fitness SaaS platform for iOS and Android.

It supports two interoperable operating modes:

1. **Gym Mode (Multi-tenant):**
   Coaches manage Trainers, and Trainers manage Users inside a specific `gym_id` scope.

2. **Independent Mode (Peer-to-Peer):**
   A User can act as a coach or trainer for another User without belonging to a gym, using explicit coaching relationships.

The app must feel like a kiosk-style ordering system:
- extremely simple
- large touch targets
- minimal steps
- visual-first navigation
- zero unnecessary complexity

## Business Goal
Provide a scalable, low-friction coaching tool that works for both traditional gyms and independent personal trainers or online coaches, without forcing the system into a gym-only model.

## Authorization Model (RBAC + ABAC)
Security is enforced through two layers:

### 1. Role-Based Access Control (RBAC)
- **USER:** receives routines and executes workouts.
- **TRAINER:** builds routines and assigns them.
- **COACH:** manages trainers, users, and gym-level oversight.

### 2. Attribute-Based Access Control (ABAC)
Access depends on context:

- **Gym context:** if `gym_id` is present, access is scoped to that gym.
- **Independent context:** if `gym_id` is null, access is based on explicit coaching relationships between profiles.

### Access Rules
- A trainer can assign routines:
  - within their own gym, when `gym_id` matches
  - in independent mode, only to users with an active coaching relationship
- A coach can manage staff and users only inside their own gym scope
- A user can receive assignments either:
  - from gym-based trainers
  - from independent coaches/trainers with an approved relationship

## Database Schema (Supabase / PostgreSQL)
Use the `profiles` pattern linked to `auth.users`.

### Core Tables
- **gyms**
  - `id` (UUID, PK)
  - `name`
  - `owner_profile_id` (FK to `profiles.id`)
  - `metadata`
  - `created_at`

- **profiles**
  - `id` (UUID, PK and FK to `auth.users.id`)
  - `email`
  - `full_name`
  - `role` (enum: `user`, `trainer`, `coach`)
  - `gym_id` (UUID, nullable)
  - `avatar_url`
  - `status`
  - `created_at`

- **exercises**
  - `id`
  - `name`
  - `category`
  - `muscle_group`
  - `difficulty`
  - `demonstration_url`
  - `description`
  - `created_at`

- **routines**
  - `id`
  - `name`
  - `created_by_profile_id` (FK to `profiles.id`)
  - `gym_id` (nullable)
  - `metadata`
  - `status`
  - `created_at`

- **routine_exercises**
  - `id`
  - `routine_id` (FK to `routines.id`)
  - `exercise_id` (FK to `exercises.id`)
  - `sets`
  - `reps`
  - `duration_seconds`
  - `rest_seconds`
  - `order_index`
  - `notes`

- **coaching_relations**
  - `id`
  - `coach_profile_id` (FK to `profiles.id`)
  - `user_profile_id` (FK to `profiles.id`)
  - `status` (pending, active, revoked)
  - `context_type` (gym, independent)
  - `gym_id` (nullable)
  - `created_at`

- **assignments**
  - `id`
  - `user_profile_id` (recipient, FK to `profiles.id`)
  - `routine_id` (FK to `routines.id`)
  - `assigned_by_profile_id` (FK to `profiles.id`)
  - `gym_id` (nullable)
  - `coaching_relation_id` (nullable, FK to `coaching_relations.id`)
  - `context_type` (gym, independent)
  - `status` (active, inactive, completed, archived)
  - `assigned_at`
  - `completed_at` (nullable)

### Referential Integrity Rules
- `profiles.id` references `auth.users.id`
- `profiles.gym_id` references `gyms.id`
- `gyms.owner_profile_id` references `profiles.id`
- `routines.created_by_profile_id` references `profiles.id`
- `routines.gym_id` references `gyms.id`
- `routine_exercises.routine_id` references `routines.id`
- `routine_exercises.exercise_id` references `exercises.id`
- `coaching_relations.coach_profile_id` references `profiles.id`
- `coaching_relations.user_profile_id` references `profiles.id`
- `coaching_relations.gym_id` references `gyms.id`
- `assignments.user_profile_id` references `profiles.id`
- `assignments.routine_id` references `routines.id`
- `assignments.assigned_by_profile_id` references `profiles.id`
- `assignments.gym_id` references `gyms.id`
- `assignments.coaching_relation_id` references `coaching_relations.id`

### Integrity Rules
- A profile can belong to at most one gym at a time.
- A routine must belong to either:
  - a gym context, or
  - an independent context, but not both inconsistently
- An assignment must always have a valid authorization path:
  - gym-based authority, or
  - active coaching relation
- Unique constraints must prevent duplicate active coaching relations for the same pair
- Independent coaching relationships must be explicit and revocable

## MVP Feature Roadmap
### Phase 1: Hybrid Foundation
- [x] Supabase Auth + Profiles setup
    - [x] Create Supabase client with expo-secure-store persistence
    - [x] Setup environment variables
    - [x] Create Auth Context / Store
    - [x] Implement Simple Login Screen
    - [x] Implement Basic Route Protection
- [x] RBAC implementation
    - [x] Role-based tab visibility in app layout
    - [x] Navigation guards for unauthorized route access
    - [x] Write protection on routine creation (role check)
- [x] ABAC authorization layer
    - [x] Context-aware routine filtering (gym_id vs independent)
    - [x] Profile-linked hooks for authorization context
- [x] Gym mode and independent mode support
- [x] Base exercise library
- [x] Basic routine creation and assignment
- [x] Role-based home screens (User, Trainer, Coach variants)

### Phase 2: Kiosk UX & Workouts
- [x] Workout detail screen
- [x] Workout session flow
- [x] Clear completion actions
- [x] Simplified routine builder
- [x] Coach dashboard
- [x] Weekly Workout Agenda (USER role)
    - [x] workout_schedules table + RLS migration
    - [x] Schedule API service (lib/api/schedule.ts)
    - [x] React Query hooks (lib/hooks/useSchedule.ts)
    - [x] WeeklyAgenda feature component
    - [x] Integrated into User Home screen

### Phase 3: Growth Features
- [ ] Progress history
- [ ] Notifications
- [ ] Basic analytics
- [ ] Routine templates
- [ ] Search and filters in exercise library

## UX Enforcement Rules (Critical)
These are mandatory constraints, not guidelines.

### Interaction Rules
- Maximum 1 primary action per screen
- Maximum 2 secondary actions
- Maximum navigation depth of 2 levels
- No hidden core actions behind menus or gestures
- No multi-step flows longer than 3 steps in MVP

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
- start a workout without instructions
- complete the session without confusion

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
- Enforce RBAC and ABAC both client-side and server-side
- Use Supabase RLS policies as the final security boundary

## Wireframe Plan (Stitch MCP)
Generate wireframes using Stitch MCP for the MVP screens only.

### Required Wireframes
1. Login
2. Role-Based Home
   - User Home
   - Trainer Home
   - Coach Home
3. Workout Detail
4. Workout Session
5. Routine Builder
6. Coach Dashboard
7. Exercise Library

### Wireframe Requirements
- Mobile-first
- Ultra simple
- Kiosk-style like a McDonald’s ordering terminal
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
- Nullable `gym_id` enables both gym-based and independent users in the same system
- `coaching_relations` provides a clean and explicit way to authorize peer-to-peer coaching
- `assignments` captures both gym-based and independent assignment flows
- RLS policies must prevent cross-gym leakage and unauthorized independent access
- The schema should support future expansion into messaging, analytics, notifications, and progress tracking without restructuring core entities

**STOP: Awaiting approval for PLAN.md.**