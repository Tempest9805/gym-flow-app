# Gym Flow

Una hoja de entrenamiento en papel, digital.

Abres la app y ves la tabla del día:

| ▶ | Ejercicio | Series | Reps | Rest | ☐ |
|---|-----------|--------|------|------|---|
| ▶ | Dominadas | 3 | 6-8 | 3:00 | ☑ |
| ▶ | Remo en Smith | 3 | 8-10 | 2:00 | ☐ |

Marcas lo que vas haciendo y la fila se tacha. El descanso de esa fila empieza
a contar atrás y te avisa al llegar a cero, aunque tengas el móvil guardado.
El ▶ abre el video del ejercicio.

**Sin cuenta, sin servidor, sin sincronización, sin pagos.** Todo se guarda en
el dispositivo.

## Empezar

```bash
npx expo start
```

## Desarrollo

```bash
npx tsc --noEmit    # typecheck
npx jest            # tests
npx expo lint       # lint
npm run seed        # regenerar las semillas de datos
```

Documentación en [`docs/`](docs/_INDEX.md) — pensada para abrirse como vault de
Obsidian.
