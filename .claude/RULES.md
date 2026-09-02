# gym-flow-app — Rules

Reglas duras del proyecto. `CLAUDE.md` explica **cómo está montado**; esto es
**qué no se negocia**. Cada línea viene de un error real o de una decisión
tomada, no de buenas intenciones.

---

## Must Always

- **La lógica va en `lib/domain/`, con test primero.** Si se puede decidir sin
  React ni almacenamiento, ahí vive. Es la única capa con tests de verdad.
- **`lib/domain/` no importa nada de fuera.** Ni `lib/storage/`, ni `lib/store/`,
  ni `app/`, ni React. La regla de dependencia apunta hacia dentro.
- **Las funciones puras devuelven el objeto original cuando no hay cambio**, para
  que quien llama pueda saltarse la escritura.
- **Verificar que un nombre de icono existe en el glyphmap antes de usarlo:**
  ```bash
  node -e "const g=require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'); console.log('mi-icono' in g)"
  ```
  Un nombre inválido **no falla en typecheck**: se ve en pantalla como un cuadro.
- **`npx tsc --noEmit` + `npx jest` + `npx expo lint` antes de cada commit.**
- **`npx expo install`** para paquetes nuevos (detecta pnpm solo y elige versión
  compatible con el SDK). Nunca `npm install` a pelo.
- **Toda superficie tocable, mínimo 44 pt de alto.**
- **Regenerar semillas con `npm run seed`**, nunca editar `lib/data/*.seed.json`
  a mano: los generadores fallan si un alias apunta a un slug inexistente, y ese
  guard es lo que mantiene las 47 filas enlazadas.
- **Leer la implementación, no la declaración.** Un `.d.ts`, una firma o un
  comentario prueban que algo **existe**, jamás que **hace** lo que uno cree.
  Antes de afirmar el comportamiento de algo de `node_modules`, abrir el `.js`.
  *(Regla heredada de DailyBudget, donde costó tres incidentes.)*
- **Un comentario no es evidencia.** Si un comentario dice que algo se comprueba,
  verificar que el código lo comprueba. En este proyecto un comentario que decía
  *"the rest may have been cancelled"* acompañaba a un código que no lo miraba.

## Must Never

- **Volver a meter red, cuenta, servidor o sincronización** sin una decisión de
  producto explícita. AsyncStorage es la única persistencia. Ese es el MVP.
- **Poner lógica de negocio en un componente o en el store.** El store solo
  guarda estado y persiste; delega en `lib/domain/`.
- **Escribir a AsyncStorage fuera de `lib/storage/repository.ts`.**
- **Hacer que la UI espere al disco.** Las escrituras van a memoria primero y se
  persisten en segundo plano; un fallo de almacenamiento no interrumpe a quien
  está entrenando.
- **Poner `isLoaded` en `false` fuera del arranque.** El layout raíz cambia el
  navegador entero por la pantalla de carga mientras eso sea falso: desmonta las
  tabs y te devuelve a Hoy. Fue un bug real en `resetEverything`.
- **Guardar un temporizador como un contador que va bajando.** Se guarda el
  **instante en que termina**; si no, se congela con la pantalla apagada.
- **Programar un aviso tras un `await` sin comprobar que sigue vigente.** Pedir
  permiso de notificaciones es asíncrono; entre medias el usuario pudo cancelar.
  Usar el contador de generación de `useRestTimer`.
- **Usar el día en pantalla para una acción que pertenece a otro día.** Guardar
  el `dayId` con la acción. Fue el bug de DESHACER.
- **Usar `as any` en un nombre de ruta.** Oculta errores reales de ruta, que es
  justo lo que se rompe al reorganizar la navegación.
- **`git add .` sin mirar `git status`.** `.env` está gitignored; que siga así.
- **Añadir imágenes de ejercicios.** El ▶ abre YouTube. Fueron 200 MB.

---

## Hall of Fame — causas raíz ya vistas

Si un síntoma se parece a uno de estos, probar primero esta hipótesis.

| Síntoma | Causa raíz | Sesión |
|---|---|---|
| DESHACER restaura la fila en el día equivocado | El handler usaba el día en pantalla, no el día de origen de la acción | 2026-09-02 |
| Suena un aviso de descanso que ya se canceló | El `await` del permiso de notificaciones deja una ventana en la que el estado cambia; sin token de generación el programado stale sobrevive | 2026-09-02 |
| Una acción de Ajustes te devuelve a Hoy | `isLoaded: false` desmonta el navegador entero vía el layout raíz | 2026-09-02 |
| Un día compuesto muestra el icono del músculo equivocado | Se elegía por orden de la tabla de palabras clave, no por cuál aparece antes en el texto ("Espalda y bíceps" es día de espalda) | 2026-09-02 |
| El modelo no puede representar la rutina del coach | `reps` era `number`; un parte escribe `6-8`, `fallo`, `1 min` | 2026-09-01 |
| Un icono sale como cuadro vacío | Nombre de glifo inexistente; typecheck no lo ve | — |

---

## Contexto que no se re-discute

- **Sin cuenta, sin servidor, sin pagos.** El proyecto Supabase asociado ya no
  existe y no vuelve sin decisión explícita.
- **La app es española.** El bilingüe EN/ES se retiró; recuperable desde git.
- **Tabata se conserva** (petición explícita del dueño) y tiene cronómetro.
- **El futuro gym/coach/branding no se implementa por adelantado.** Construir
  "por si acaso" es lo que llevó el proyecto a 31 pantallas. Ver
  `docs/decisions.md`.
