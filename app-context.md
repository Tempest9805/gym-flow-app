# Gym Flow App (MVP)

## 🚀 Overview
Gym Flow is a mobile-first fitness app built with Expo + Supabase.

The MVP focuses on a **simple, user-only experience**:
- Browse exercises
- Understand how to perform them (video/gif + instructions)
- Build weekly routines
- Share routines with other users

The product follows a **kiosk-style UX**:
- minimal steps
- large touch targets
- fast navigation
- zero unnecessary complexity

---

## 🎯 Core Features (MVP)

1. **Exercise Library**
   - Browse by category
   - Search by name
   - Clean, card-based UI

2. **Exercise Detail**
   - Description (how to perform correctly)
   - Video/GIF demonstration
   - Minimal, visual-first layout

3. **Routine Builder**
   - Create weekly routines
   - Add exercises by search/category
   - Configure:
     - sets
     - reps
     - weight
     - rest
     - day of week

4. **Routine Sharing**
   - Share via QR or code
   - Other users can import/duplicate routines

---

## 🧠 Architecture

### Frontend
- Expo (React Native)
- Expo Router
- NativeWind
- Zustand (auth state)
- React Query (server state)

### Backend
- Supabase (PostgreSQL + Auth)

---

## 🗄️ Core Data Model

- `profiles` → user data (1:1 with auth.users)
- `exercises` → exercise catalog (preloaded CSV)
- `routines` → user-created routines
- `routine_exercises` → exercises inside routines
- `routine_shares` → sharing system (QR/code)

---

## 🔐 Security (Simplified MVP)

- Users can only access their own data
- Shared data only via explicit share codes
- RLS enabled but **must remain simple and non-recursive**
- ❌ No roles (coach/trainer)
- ❌ No gym/multi-tenant logic

---

## ⚠️ Critical Constraints

- No RLS recursion (avoid self-referencing policies)
- No frontend profile creation → must be DB trigger
- No race conditions in auth flow
- No complex navigation or role-based logic

---

## 🧩 UX Rules (Non-Negotiable)

- 1 primary action per screen
- Max 2 taps to core actions
- Large buttons only
- No long forms
- No hidden actions
- No complex flows

User should:
> open app → understand instantly → create routine → use it → share it

---

## 🛠️ Current Goal

Stabilize and deliver a **fully working MVP** with:
- correct auth flow
- stable database (no RLS errors)
- simple navigation
- core features working end-to-end

---

## 📌 Future (Not MVP)

- Progress tracking
- Notifications
- Analytics
- Social features

---

**TL;DR:**  
A simple fitness app where users browse exercises, build routines, and share them — built with stability and UX clarity as top priorities.