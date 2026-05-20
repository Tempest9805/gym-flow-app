# Gym Flow App

Hybrid mobile-first Fitness SaaS platform.

## Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Expo Go app on your physical device (optional, for testing)
- A Supabase project

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Update `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 4. Running the App
- **Android**: `pnpm android`
- **iOS**: `pnpm ios`
- **Web**: `pnpm web`
- **General**: `pnpm start`

### 5. Testing on Physical Device
1. Ensure your phone and computer are on the same Wi-Fi.
2. Run `pnpm start`.
3. Scan the QR code with the Expo Go app (Android) or Camera app (iOS).

## Scripts
- `pnpm typecheck`: Runs TypeScript compiler check.
- `pnpm lint`: Runs ESLint (Note: Ensure devDependencies are installed).
