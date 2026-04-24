# Verification Checklist

Use this checklist to validate the application flow after setup.

## 1. Authentication
- [ ] Sign up as a new user.
- [ ] Login with existing credentials.
- [ ] Logout clears the session and redirects to Login.
- [ ] Session persists after closing/reopening the app (SecureStore check).

## 2. Authorization & Routing
- [ ] **USER Role**: 
  - [ ] Can see "Home" and "Workout" tabs.
  - [ ] CANNOT see "Routines" or "Dashboard" tabs.
  - [ ] Redirected if trying to access `/routines` manually.
- [ ] **TRAINER Role**:
  - [ ] Can see "Home", "Workout", and "Routines" tabs.
  - [ ] CANNOT see "Dashboard" tab.
- [ ] **COACH Role**:
  - [ ] Can see all tabs including "Dashboard".

## 3. Core Features
- [ ] **Assignments**: 
  - [ ] Users see their active assignments on the Home screen.
  - [ ] Tapping an assignment opens the workout view.
- [ ] **Workouts**:
  - [ ] Can start a workout session.
  - [ ] Exercises are displayed correctly.
  - [ ] Can mark sets as completed.
- [ ] **Routines (Coaches/Trainers)**:
  - [ ] Can create a new routine.
  - [ ] Can add exercises to a routine.
- [ ] **Dashboard (Coaches)**:
  - [ ] Shows list of coached users and their status.

## 4. Quality & UX
- [ ] **Loading States**: Full-screen loader shown during initial profile fetch.
- [ ] **Error Handling**: Error boundary displays if a screen crashes.
- [ ] **Aesthetics**: NativeWind styles apply correctly (colors, spacing).
- [ ] **Accessibility**: All primary buttons have a minimum touch target of 44px.
