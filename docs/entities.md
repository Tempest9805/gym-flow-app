---
tags: [entities, data-model, gym-flow-app]
---

# Entities

Fuente de verdad: `lib/api/schemas.ts` (Zod schemas + tipos inferidos)

Ver también: [[services]], [[data-flow]]

## Profile

```ts
Profile {
  id: uuid
  email: string
  full_name: string | null
  avatar_url: string | null
  goal: string | null     // null → redirige a onboarding
  created_at: string
}
```

## Exercise

```ts
Exercise {
  id: uuid
  slug: string | null
  name_en: string           // nombre en inglés
  name_es: string | null    // nombre en español
  category: string          // arms|back|chest|legs|core|shoulders|cardio|functional
  muscle_group: string
  equipment: string | null
  difficulty: string | null // beginner|intermediate|advanced
  type: string | null
  is_compound: boolean | null
  movement_pattern: string | null
  description: string | null
  instructions: string | null
  demonstration_url: string | null
  thumbnail_url: string | null
  hires_url: string | null
  media_storage_path: string | null
  media_status: string | null
  notes: string | null
  created_at: string
}
```

## Routine

```ts
Routine {
  id: uuid
  name: string
  user_id: uuid
  description: string | null
  status: 'active'|'inactive'|'pending'|'completed'|'archived'|'revoked'
  metadata: Record<string, any> | null
  created_at: string
}
```

## RoutineExercise (junction)

```ts
RoutineExercise {
  id: uuid
  routine_id: uuid
  exercise_id: uuid
  day_of_week: 0-6 | null
  order_index: number
  sets: number          // default 3
  reps: number | null   // default 10
  weight: number | null
  rest_seconds: number | null  // default 60
  duration_seconds: number | null
  exercise_type: 'reps'|'time'|'cardio'
  notes: string | null
  exercise?: Exercise   // populated en queries con join
  created_at?: string
}
```

## WorkoutSchedule

```ts
WorkoutSchedule {
  id: uuid
  user_id: uuid
  day_of_week: 0-6
  routine_id: uuid
  is_active: boolean
  created_at: string
}
```

`WorkoutScheduleWithRoutine` — extiende con `routine: Routine`.

## RoutineShare

```ts
RoutineShare {
  id: uuid
  routine_id: uuid
  sender_user_id: uuid
  receiver_user_id: uuid | null
  share_code: string
  share_type: 'code'|'qr'
  status: 'pending'|'accepted'|'revoked'|'expired'
  accepted_at: string | null
  created_at: string
}
```

## UserStreak

```ts
UserStreak {
  id: uuid
  user_id: uuid
  current_streak: number
  longest_streak: number
  last_active_week: string | null
  completed_days_this_week: number[]  // días 0-6
  updated_at?: string
}
```

## Relaciones

```
Profile ──< Routine ──< RoutineExercise >── Exercise
Profile ──< WorkoutSchedule >── Routine
Routine ──< RoutineShare
Profile ──  UserStreak
```
