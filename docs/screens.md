---
tags: [screens, navigation, gym-flow-app]
---

# Pantallas

Ver también: [[_INDEX]], [[architecture]], [[domain]]

```
app/
├── _layout.tsx              providers + carga local (sin AuthGuard)
└── (app)/
    ├── _layout.tsx          tab bar propia, 4 pestañas
    │
    │   ── PESTAÑAS ──
    ├── index.tsx            Hoy ⭐ la tabla del día
    ├── routines.tsx         Rutinas — cuál está activa, días, cabecera
    ├── exercises.tsx        Ejercicios — biblioteca de 169
    ├── settings.tsx         Ajustes — tema, timers, restaurar datos
    │
    │   ── OCULTAS ──
    ├── exercise/[id].tsx    Ejecución, recomendaciones, errores comunes
    ├── stopwatch.tsx        Cronómetro con vueltas
    ├── timer.tsx            Temporizador de intervalos (setup)
    ├── timer-active.tsx     Temporizador corriendo
    ├── tabata.tsx           Tabata (setup)
    ├── tabata-active.tsx    Tabata corriendo
    └── tabata-summary.tsx   Resumen post-tabata
```

## Hoy — la pantalla que importa

Réplica del parte impreso: cabecera (rutina · enfoque · objetivo · coach),
pestañas de día, tabla, y las «Indicaciones generales» plegadas al final.

**Tiene dos modos.** Entrenando, la tabla está limpia: `▶` abre el video,
el checkbox marca la serie. «Editar» convierte la última columna en subir /
bajar / quitar y saca el botón de añadir. Así el camino de entrenar no tiene
ruido y nada se borra por un toque perdido a mitad de serie.

**Al marcar una fila** arranca su descanso: esa celda `Rest` se agranda, se
resalta y cuenta atrás. Al llegar a 0 vibra y avisa —también con la app en
segundo plano, porque el móvil se guarda durante los 2-3 minutos. Tocar la
celda mientras corre lo detiene.

**Edición inline**: tocar `Ejercicio`, `Series`, `Reps` o `Rest` abre un modal
de un solo campo con atajos (`3`, `6-8`, `2:00`) y validación. Sin formularios.

**Quitar una fila** ofrece DESHACER, que la devuelve a su posición exacta.

## Tabla

Columnas: `▶ | Ejercicio | Series | Reps | Rest | ☐`

Las numéricas tienen ancho fijo y el nombre se queda con el resto, envolviendo
a dos líneas. **Nunca hay scroll horizontal**: en tablet (≥768 pt) las columnas
y la tipografía crecen, no aparece una barra.

No usa librería de tablas. `react-native-table-component` publicó su última
versión en febrero de 2022 y su README dice que está abandonado; ninguna de las
alternativas hace edición inline. Una fila propia es menos código y más
control.

## Copiar / compartir

El botón de copiar en la cabecera de Hoy exporta el día o la rutina entera
como markdown **autoexplicativo**: tabla más una leyenda que define cada
columna. Está pensado para pegarlo en un chat con un LLM y que se entienda sin
contexto: el descanso sale como `3:00`, no como `180`.
