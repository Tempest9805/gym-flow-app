# Gym Flow App (Current MVP Context)

## 🚀 Overview
Gym Flow is a mobile-first fitness app built with Expo + Supabase.

The app focuses on a simple, user-only experience with a premium dark UI:
- Browse exercises
- Understand how to perform them correctly
- Build weekly routines
- Track workout completion
- Share routines with other users
- Use lightweight utility tools such as Timer and Tabata from the hamburger menu

The product follows a kiosk-style UX:
- minimal steps
- large touch targets
- fast navigation
- zero unnecessary complexity
- visually polished but simple screens

---

## 🎯 Core Features

### 1. Exercise Library
- Browse by category
- Search by name
- Clean, card-based UI
- Exercise media loaded from Supabase CDN when available
- Lazy loading in list/detail screens
- Fallback placeholder when media is missing

### 2. Exercise Detail
- Description of how to perform the exercise correctly
- Muscles worked
- Demonstration image/video
- Minimal, visual-first layout
- Tappable from the Home routine and exercise list

### 3. Routine Builder
- Create weekly routines
- Add exercises by search/category
- Configure:
  - sets
  - reps
  - weight
  - rest
  - day of week
- Edit existing routines

### 4. Weekly Agenda / Weekly Tracking
- Show what routine is assigned each day
- Display week-day completion status
- Reset weekly tracking automatically
- Keep the current week visually clear

### 5. Home Routine Experience
- Show today’s routine
- Show beginner-friendly explanations for sets and reps
- Allow marking each exercise as completed
- Show weekly progress checks
- Each exercise name must be tappable and open exercise detail

### 6. Routine Sharing
- Share via QR or code
- Other users can import or duplicate routines

### 7. Utility Tools
- Timer
- Tabata
- Both are secondary tools accessible from the hamburger menu
- They are not part of the main footer navigation

---

## 🧠 UI / Design System

### Source of Truth
The app UI is based on Stitch-generated screens stored in:
- `assets/stitch_gym_flow_app`

The Stitch screens are the visual base for implementation.

### Theme System
The app supports two themes:
- **Neon Purple** → default theme
- **Neon Orange** → alternate theme

Theme switch is available from:
- Profile / Settings

Theme behavior:
- theme choice must persist across app launches
- theme changes must affect buttons, cards, active states, borders, and highlights
- the screen structure must remain the same across both themes

### Visual Direction
- Dark mode first
- Premium dark surfaces
- Neon accent colors
- High contrast text
- Large readable typography
- Kiosk-style simplicity
- No cluttered dashboards
- No heavy visual noise

### Navigation
- Footer must have no more than 5 items
- Overflow actions belong in the hamburger menu
- Navigation must stay simple and mobile-first

---

## 🌐 Localization
The app supports:
- Spanish (ES)
- English (EN)

Language switch:
- available from Profile / Settings or another clear place
- must persist
- should not clutter the UI
- should update screen labels cleanly

---

## 🧠 Architecture

### Frontend
- Expo (React Native)
- Expo Router
- NativeWind
- Zustand (auth and UI state)
- React Query (server state)
- expo-image for optimized image loading

### Backend
- Supabase (PostgreSQL + Auth + Storage)

### AI Development Stack (Skills)
The project utilizes `autoskills` to maintain a set of specialized agent capabilities:
- **Core Web Quality**: SEO, Accessibility (addyosmani)
- **Frontend & UX**: Design Mobile Apps (sleekdotdesign), Composition Patterns (vercel-labs), Frontend Design (anthropics), React Best Practices (vercel-labs)
- **Expo & Native**: Native Data Fetching, Building Native UI, Expo Tailwind Setup, API Routes, Dev Client, CICD (expo)
- **Backend & Logic**: Node.js Best Practices (sickn33), Supabase Postgres Best Practices (supabase), Zod Validation (pproenca), Advanced TypeScript Types (wshobson)

### Environment & Tooling
- **Node.js**: v22.6.0 (LTS)
- **Version Manager**: `fnm` (Fast Node Manager)
- **Diagnostics**: `expo-doctor` for dependency health checks

---

## 🗄️ Core Data Model

- `profiles` → user data (1:1 with auth.users)
- `exercises` → exercise catalog (preloaded CSV + media fields)
- `routines` → user-created routines
- `routine_exercises` → exercises inside routines
- `routine_shares` → sharing system (QR/code)
- `workout_schedules` → weekly agenda / day tracking

### Exercise Media Fields
The `exercises` table includes media-related fields such as:
- `media_url`
- `media_type`
- `media_source`
- `media_storage_path`
- `media_status`

Media is served from Supabase Storage / CDN when available.

---

## 🔐 Security (Simplified MVP)

- Users can only access their own data
- Shared routines only via explicit share codes
- RLS must remain simple and non-recursive
- No roles (coach/trainer)
- No gym/multi-tenant logic

### Important Security Rules
- No recursive RLS
- No frontend profile creation
- No complex role-based branching
- No multi-tenant permissions in the MVP

---

---

## 🧩 UX Rules (Non-Negotiable)

- 1 primary action per screen
- Max 2 taps to core actions
- Large buttons only
- No long forms
- No hidden actions
- No complex flows
- No cluttered screens
- No unnecessary redesigns

The user should:
> open app → understand instantly → train → mark progress → move to next exercise

---

### 🛠️ Current Status & Milestones
- **Stability Finalized**: Core auth and DB flows are production-ready.
- **Node.js Upgrade**: Environment updated to Node 22.6.0 using `fnm`.
- **Skills Integrated**: `autoskills` deployed with 23 active capabilities.
- **Manual Media Assets**: Switched to a manual approach for exercise images located in `assets/Excercices`.
- **UI Audit**: Accessibility labels and React best practices enforced across core screens.

---

## 📌 Future (Not MVP)
- Progress history
- Notifications
- Analytics
- Social features
- More advanced workout timers
- More training statistics

---

## TL;DR
A simple, premium fitness app where users browse exercises, build routines, track completion, and share routines — built with stability, clear UX, Stitch-based design, dual themes, and fast media loading as top priorities.