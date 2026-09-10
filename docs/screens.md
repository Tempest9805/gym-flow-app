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
    ├── import.tsx           Pegar una rutina escrita
    ├── exercise/[id].tsx    Ejecución, recomendaciones, errores comunes
    ├── stopwatch.tsx        Cronómetro con vueltas
    ├── timer.tsx            Temporizador de intervalos (setup)
    ├── timer-active.tsx     Temporizador corriendo
    ├── tabata.tsx           Tabata (setup)
    ├── tabata-active.tsx    Tabata corriendo
    └── tabata-summary.tsx   Resumen post-tabata
```

## Bienvenida — solo la primera vez

Un `Modal` dentro de Hoy, no una ruta. Dos botones: **Pegar mi rutina**, que
lleva al importador, y **Empezar con una de ejemplo**, que se queda con la
rutina sembrada. No pregunta nombre, ni objetivo, ni nivel.

Se guarda en `gymflow_welcome_seen` y no vuelve a salir. Ver [[decisions]].

## Pegar rutina

La rutina ya existe escrita en algún sitio —WhatsApp, notas, un PDF del
coach— y volver a teclearla es la fricción que hace que nadie llegue a usar la
app. Aquí se pega y ya está: sin IA y sin red, es el parser de
`lib/domain/importRoutine.ts`.

La pantalla enseña **lo que ha entendido mientras escribes**: los días con su
icono, cuántos ejercicios lleva cada uno, cuántos han encontrado su ficha en la
biblioteca y cuántas líneas quedaron sin series. Así se ve de un vistazo si la
lectura salió bien sin tener que crear la rutina para descubrirlo.

Las dos acciones —*Pegar* del portapapeles y *Crear*— viven en la cabecera
porque el teclado tapa cualquier cosa anclada al pie. Ver [[decisions]].

Se llega desde la bienvenida, desde el botón **Pegar** de Rutinas y desde el
estado vacío de Hoy.

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

## Detalle del ejercicio

Orden de arriba abajo: nombre · **ilustración** (146 de 169 la tienen) ·
**Ver video** · Ejecución · Recomendaciones · Errores comunes · **Cuando deje
de costarte**, que lleva al siguiente de la escalera.

La ilustración va sobre lámina blanca a propósito: el dibujo tiene fondo
blanco y sin ella se le ve el recorte en tema oscuro.

Los tres textos están en español, igual que el grupo muscular de la cabecera:
el CSV de origen viene en inglés y `npm run seed` le aplica la traducción
encima. Ver [[domain]].

## Tabata

Tres pantallas: ajustes, la que corre y el resumen.

La que corre es inmersiva y va a pantalla completa, en tres zonas: la fase de
ahora, lo que viene y los mandos. El color de fase llena el 70 % de la pantalla
y **no cambia con el tema** —es relleno y hay que leerlo de reojo—; la barra de
mandos sí lo sigue. Ver [[decisions]].
