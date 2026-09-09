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
- **Cualquier cosa pegada abajo usa `useSafeAreaInsets()`, nunca un relleno
  fijo.** La app dibuja bajo la barra de navegación: con gestos son ~24dp, con
  los tres botones ~48. Un número a ojo deja la tab bar intocable.
- **Nada anclado al pie de una pantalla con teclado.** Con `edgeToEdgeEnabled`
  la ventana **no se encoge** al abrir el teclado, así que un botón abajo queda
  debajo de las teclas e inalcanzable, y `KeyboardAvoidingView` no lo arregla en
  Android. La acción va en la cabecera. Fue un bug real en el importador.
- **Un ejercicio nuevo necesita su entrada en `exercise-text-es.json`.** El CSV
  de origen está en inglés y la traducción se aplica encima al generar. El seed
  no falla por ello, pero `seeds.test.ts` sí: busca palabras funcionales
  inglesas en descripción, consejos y grupo muscular.
- **Subir `LIBRARY_VERSION` al tocar `lib/data/`.** La biblioteca es dato de
  referencia y nadie la edita desde la app, así que se refresca sola cuando la
  versión empaquetada es más nueva. Sin subirla, lo que añadas solo lo ven las
  instalaciones nuevas. Las **rutinas** son del usuario y nunca se pisan.
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
- **Dar por probada una pantalla con estado local sin volver a entrar en ella.**
  Las pantallas de acción viven en el `Tabs` y no se desmontan: la primera
  visita siempre funciona. El caso que rompe es la **segunda**.
- **Usar `as any` en un nombre de ruta.** Oculta errores reales de ruta, que es
  justo lo que se rompe al reorganizar la navegación.
- **`git add .` sin mirar `git status`.** `.env` está gitignored; que siga así.
- **Volver a meter los PNG originales de ejercicios.** Eran 198 MB. Lo que sí
  entra son los **webp de `normalized`** (900×536, ~85 KB): 146 de los 169
  ejercicios, 12,3 MB, en el detalle encima del botón de video. Decidido el
  2026-09-08. El mapa de `require()` lo genera `npm run seed`, no se edita a
  mano, y `scripts/build-exercise-images.mjs` falla si sobra una imagen que no
  corresponde a ningún ejercicio.
- **Quitar `plugins/withExactAlarm.js` ni cambiarlo por `android.permissions` de
  `app.json`.** Ese campo sólo sabe escribir `android:name`, y el
  `maxSdkVersion=32` del segundo permiso es justo lo que impide que
  `SCHEDULE_EXACT_ALARM` llegue a Android 13+, donde exigiría pasar por los
  ajustes del sistema. Sin ese plugin el aviso del descanso vuelve a llegar
  minutos tarde. Ver `docs/decisions.md`.
- **Dar por probado el teclado en un emulador con teclado fisico.** Con uno
  conectado el IME no sube y las pantallas con teclado parecen sanas. Para
  que suba: `adb shell settings put secure show_ime_with_hard_keyboard 1`.
  Asi salio el bug del `CellEditor`, que llevaba meses ahi.
- **Dar por probada una notificación en Expo Go.** Expo Go corre con **su**
  AndroidManifest, no con el nuestro: los permisos que declaramos no existen
  ahí. Todo lo que dependa del manifest se verifica en un dev build.

---

## Hall of Fame — causas raíz ya vistas

Si un síntoma se parece a uno de estos, probar primero esta hipótesis.

| Síntoma | Causa raíz | Sesión |
|---|---|---|
| Una hoja con teclado se ve a medias o no se deja pulsar | `KeyboardAvoidingView` con `behavior` solo en iOS no hace **nada** en Android, y con `edgeToEdgeEnabled` la ventana ya no se encoge. Hay que sumar la altura del teclado a mano, y ademas el `insets.bottom`: lo que reporta `keyboardDidShow` se mide desde la barra de navegacion, no desde el borde de la pantalla | 2026-09-09 |
| Un temporizador abre ya terminado la segunda vez | Las pantallas «ocultas» son `Tabs.Screen` con `href: null`: un `Tabs` monta una vez y no desmonta, así que el `useState` inicial no se repite y queda el estado de la visita anterior. `unmountOnBlur` ya no existe en React Navigation 7 | 2026-09-08 |
| Un botón del pie no responde **en dev build** | El aviso de LogBox («Open debugger to view warnings») se come los toques de su franja, más alta que el propio aviso. Cerrarlo antes de diagnosticar nada | 2026-09-08 |
| Una pantalla entera en inglés en una app española | El valor del estado se pintaba tal cual (`{phase}` con `'WORK'`). Traducir en el borde del render, nunca reutilizar el estado como texto | 2026-09-08 |
| Un cambio en `lib/data/` no se ve en la app | El almacenamiento manda tras la primera siembra; hay que subir `LIBRARY_VERSION` | 2026-09-08 |
| Texto invisible en una pantalla concreta | Fondo hardcodeado + tinta del tema. Solo era seguro mientras todos los temas eran oscuros; con el claro da 1,1:1 | 2026-09-08 |
| Un token de borde usado como color de texto | `outlineVariant` existe para separar, no para leerse: 1,4:1 en los dos temas | 2026-09-08 |
| Las pestañas no se dejan tocar | `edgeToEdgeEnabled` dibuja bajo la barra del sistema; con relleno fijo en vez del inset real, los tres botones tapan la tab bar | 2026-09-08 |
| Un botón del pie no se deja pulsar con el teclado abierto | `edgeToEdgeEnabled` hace que la ventana ya no se redimensione con el teclado; la acción tiene que ir en la cabecera | 2026-09-08 |
| Un texto se ve lavado sobre un color de fase | Tinta negra con opacidad: a 0,4 sobre el rojo da 2,27:1. La opacidad rebaja el contraste y no aparece en ninguna revisión de tokens | 2026-09-08 |
| Un cambio en `lib/data/` se ve a medias | Se subió `LIBRARY_VERSION` una vez y luego se tocó `lib/data/` otra vez sin volver a subirla | 2026-09-08 |
| El aviso del descanso llega minutos tarde o no llega | Sin permiso de alarma exacta, `expo-notifications` cae a `setAndAllowWhileIdle`, que Android estrangula a ~1 disparo cada 9 min | 2026-09-02 |
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
