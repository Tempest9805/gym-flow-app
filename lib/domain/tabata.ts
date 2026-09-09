/**
 * La maquina de estados del tabata.
 *
 * Vivia dentro de `app/(app)/tabata-active.tsx`, que es una pantalla de 580
 * lineas con un `setInterval`, animaciones y navegacion: comprobar ahi si la
 * ultima ronda termina de verdad significaba correr un tabata entero en un
 * emulador. Aqui son funciones puras y se comprueban en milisegundos.
 *
 * Un tabata es: preparacion, y luego `cycles` ciclos de `rounds` rondas de
 * trabajo y descanso, con un descanso mas largo entre ciclos y un enfriamiento
 * opcional al final. Los tiempos que valen 0 se saltan.
 */
import type { TabataConfig } from './types';

export type TabataPhase = 'prepare' | 'work' | 'rest' | 'cycle-rest' | 'cooldown' | 'done';

export interface TabataProgress {
  phase: TabataPhase;
  /** Segundos que le quedan a la fase actual. */
  timeLeft: number;
  /** Ronda en curso dentro del ciclo, empezando en 1. */
  currentRound: number;
  /** Ciclo en curso, empezando en 1. */
  currentCycle: number;
}

/** Donde arranca un tabata: en preparacion, o directo al trabajo si no la hay. */
export function initialProgress(config: TabataConfig): TabataProgress {
  const conPreparacion = config.prepSeconds > 0;
  return {
    phase: conPreparacion ? 'prepare' : 'work',
    timeLeft: conPreparacion ? config.prepSeconds : config.workSeconds,
    currentRound: 1,
    currentCycle: 1,
  };
}

/** Cuanto dura una fase segun la configuracion. `done` no dura nada. */
export function phaseDuration(phase: TabataPhase, config: TabataConfig): number {
  switch (phase) {
    case 'prepare':    return config.prepSeconds;
    case 'work':       return config.workSeconds;
    case 'rest':       return config.restSeconds;
    case 'cycle-rest': return config.cycleRestSeconds;
    case 'cooldown':   return config.cooldownSeconds;
    default:           return 0;
  }
}

/**
 * La fase siguiente, con su duracion. Es lo que se pinta en la franja de
 * «lo que viene», y tiene que coincidir con lo que hara `advance`.
 */
export function nextPhase(
  progress: TabataProgress,
  config: TabataConfig,
): { phase: TabataPhase; duration: number } {
  const siguiente = advance({ ...progress, timeLeft: 0 }, config);
  return { phase: siguiente.phase, duration: phaseDuration(siguiente.phase, config) };
}

/**
 * Pasa a la fase siguiente cuando la actual se agota.
 *
 * El orden importa: se agotan primero las rondas del ciclo, luego los ciclos, y
 * solo entonces el enfriamiento. `done` es absorbente — una vez terminado, no
 * se sale de ahi.
 */
export function advance(progress: TabataProgress, config: TabataConfig): TabataProgress {
  switch (progress.phase) {
    case 'prepare':
      return { ...progress, phase: 'work', timeLeft: config.workSeconds };

    case 'work':
      if (progress.currentRound < config.rounds) {
        return { ...progress, phase: 'rest', timeLeft: config.restSeconds };
      }
      if (progress.currentCycle < config.cycles) {
        return {
          ...progress,
          phase: 'cycle-rest',
          timeLeft: config.cycleRestSeconds,
          currentRound: 1,
          currentCycle: progress.currentCycle + 1,
        };
      }
      if (config.cooldownSeconds > 0) {
        return { ...progress, phase: 'cooldown', timeLeft: config.cooldownSeconds };
      }
      return { ...progress, phase: 'done', timeLeft: 0 };

    case 'rest':
      return {
        ...progress,
        phase: 'work',
        timeLeft: config.workSeconds,
        currentRound: progress.currentRound + 1,
      };

    case 'cycle-rest':
      return { ...progress, phase: 'work', timeLeft: config.workSeconds };

    case 'cooldown':
      return { ...progress, phase: 'done', timeLeft: 0 };

    default:
      return progress;
  }
}

/** Un segundo de reloj: baja el contador, o cambia de fase si se agoto. */
export function tick(progress: TabataProgress, config: TabataConfig): TabataProgress {
  if (progress.phase === 'done') return progress;
  if (progress.timeLeft > 1) return { ...progress, timeLeft: progress.timeLeft - 1 };
  return advance(progress, config);
}

/**
 * Rondas que quedan por hacer, la actual incluida.
 *
 * Durante la preparacion quedan todas: aun no se ha hecho ninguna. La version
 * anterior calculaba `rounds - currentRound` y ensenaba **0 rondas restantes**
 * antes de empezar un tabata de una ronda.
 */
export function roundsLeft(progress: TabataProgress, config: TabataConfig): number {
  if (progress.phase === 'done') return 0;
  if (progress.phase === 'prepare') return config.rounds;
  const hechas = progress.phase === 'work' ? progress.currentRound - 1 : progress.currentRound;
  return Math.max(0, config.rounds - hechas);
}

/** Ciclos que quedan por hacer, el actual incluido. */
export function cyclesLeft(progress: TabataProgress, config: TabataConfig): number {
  if (progress.phase === 'done') return 0;
  return Math.max(0, config.cycles - progress.currentCycle + 1);
}

/**
 * Lo que dura el tabata entero, para el contador de arriba.
 *
 * **La ultima ronda de cada ciclo no lleva descanso detras**: despues de ella
 * viene el descanso entre ciclos, o el final. Son `rounds - 1` descansos por
 * ciclo, no `rounds`. La version anterior multiplicaba por `rounds` y anunciaba
 * 995 s para un tabata que dura 895 — cien segundos de mas en la configuracion
 * por defecto, con el contador llegando al final marcando 1:40 restantes. Lo
 * destapo el test que corre el reloj entero y cuenta los tics.
 */
export function totalSeconds(config: TabataConfig): number {
  const descansosPorCiclo = Math.max(0, config.rounds - 1);
  const porCiclo = config.workSeconds * config.rounds + config.restSeconds * descansosPorCiclo;
  const entreCiclos = config.cycleRestSeconds * Math.max(0, config.cycles - 1);
  return config.prepSeconds + porCiclo * config.cycles + entreCiclos + config.cooldownSeconds;
}
