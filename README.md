# Gym Flow App

Hybrid mobile-first Fitness SaaS platform.

## Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Expo Go app on your physical device (optional, for testing)
- A Supabase project

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Update `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 4. Running the App
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`
- **General**: `npm start`

### 5. Testing on Physical Device
1. Ensure your phone and computer are on the same Wi-Fi.
2. Run `npm start`.
3. Scan the QR code with the Expo Go app (Android) or Camera app (iOS).

## Scripts
- `npm run typecheck`: Runs TypeScript compiler check.
- `npm run lint`: Runs ESLint (Note: Ensure devDependencies are installed).
