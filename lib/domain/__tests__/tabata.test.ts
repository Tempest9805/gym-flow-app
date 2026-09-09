import {
  advance,
  cyclesLeft,
  initialProgress,
  nextPhase,
  phaseDuration,
  roundsLeft,
  tick,
  totalSeconds,
  type TabataProgress,
} from '../tabata';
import { DEFAULT_TABATA_CONFIG, type TabataConfig } from '../types';

/** Un tabata minimo: una ronda, un ciclo, sin descansos. Cabe en un test. */
const CORTO: TabataConfig = {
  ...DEFAULT_TABATA_CONFIG,
  prepSeconds: 5,
  workSeconds: 5,
  restSeconds: 0,
  cooldownSeconds: 0,
  cycleRestSeconds: 15,
  rounds: 1,
  cycles: 1,
};

/** Corre el reloj hasta que termine, o se rinde. Devuelve las fases vistas. */
function correrEntero(config: TabataConfig, maxTicks = 10_000): TabataPhaseLog {
  let progress = initialProgress(config);
  const fases: string[] = [progress.phase];
  let ticks = 0;

  while (progress.phase !== 'done' && ticks < maxTicks) {
    progress = tick(progress, config);
    ticks += 1;
    if (fases[fases.length - 1] !== progress.phase) fases.push(progress.phase);
  }

  return { progress, fases, ticks, termino: progress.phase === 'done' };
}

interface TabataPhaseLog {
  progress: TabataProgress;
  fases: string[];
  ticks: number;
  termino: boolean;
}

describe('initialProgress', () => {
  it('arranca en preparacion cuando la hay', () => {
    expect(initialProgress(CORTO)).toMatchObject({
      phase: 'prepare',
      timeLeft: 5,
      currentRound: 1,
      currentCycle: 1,
    });
  });

  it('se salta la preparacion si dura cero', () => {
    expect(initialProgress({ ...CORTO, prepSeconds: 0 })).toMatchObject({
      phase: 'work',
      timeLeft: 5,
    });
  });
});

describe('advance', () => {
  const base = initialProgress(CORTO);

  it('de preparacion pasa a trabajo', () => {
    expect(advance(base, CORTO).phase).toBe('work');
  });

  // El caso que motiva todo esto: la ultima ronda del ultimo ciclo tiene que
  // TERMINAR. Comprobarlo en la pantalla pedia correr un tabata entero.
  it('la ultima ronda del ultimo ciclo termina', () => {
    const trabajando = advance(base, CORTO);
    expect(advance(trabajando, CORTO)).toMatchObject({ phase: 'done', timeLeft: 0 });
  });

  it('con enfriamiento, termina pasando por el', () => {
    const config = { ...CORTO, cooldownSeconds: 30 };
    const trabajando = advance(initialProgress(config), config);
    const enfriando = advance(trabajando, config);
    expect(enfriando).toMatchObject({ phase: 'cooldown', timeLeft: 30 });
    expect(advance(enfriando, config).phase).toBe('done');
  });

  it('encadena rondas dentro del ciclo', () => {
    const config = { ...CORTO, rounds: 3, restSeconds: 20 };
    let p = advance(initialProgress(config), config); // work, ronda 1
    expect(p).toMatchObject({ phase: 'work', currentRound: 1 });
    p = advance(p, config);
    expect(p).toMatchObject({ phase: 'rest', currentRound: 1 });
    p = advance(p, config);
    expect(p).toMatchObject({ phase: 'work', currentRound: 2 });
  });

  it('al acabar el ciclo reinicia la ronda y suma ciclo', () => {
    const config = { ...CORTO, rounds: 2, cycles: 2, restSeconds: 20 };
    let p: TabataProgress = { phase: 'work', timeLeft: 0, currentRound: 2, currentCycle: 1 };
    p = advance(p, config);
    expect(p).toMatchObject({ phase: 'cycle-rest', currentRound: 1, currentCycle: 2 });
    expect(advance(p, config).phase).toBe('work');
  });

  it('done es absorbente', () => {
    const fin: TabataProgress = { phase: 'done', timeLeft: 0, currentRound: 1, currentCycle: 1 };
    expect(advance(fin, CORTO)).toBe(fin);
  });
});

describe('nextPhase', () => {
  // Lo que dice la franja de «lo que viene» tiene que ser lo que pase de
  // verdad; si se calculan por separado, un dia dejan de coincidir.
  it('coincide siempre con lo que hara advance', () => {
    const config = { ...DEFAULT_TABATA_CONFIG, rounds: 2, cycles: 2 };
    let p = initialProgress(config);

    for (let i = 0; i < 40 && p.phase !== 'done'; i += 1) {
      const anunciada = nextPhase(p, config);
      const real = advance(p, config);
      expect(anunciada.phase).toBe(real.phase);
      expect(anunciada.duration).toBe(phaseDuration(real.phase, config));
      p = real;
    }
  });
});

describe('tick', () => {
  it('baja el reloj sin cambiar de fase', () => {
    expect(tick(initialProgress(CORTO), CORTO)).toMatchObject({ phase: 'prepare', timeLeft: 4 });
  });

  it('al llegar al ultimo segundo cambia de fase', () => {
    const p: TabataProgress = { phase: 'prepare', timeLeft: 1, currentRound: 1, currentCycle: 1 };
    expect(tick(p, CORTO)).toMatchObject({ phase: 'work', timeLeft: 5 });
  });
});

describe('un tabata entero', () => {
  it('el corto termina, y en los segundos que dice', () => {
    const r = correrEntero(CORTO);
    expect(r.termino).toBe(true);
    expect(r.fases).toEqual(['prepare', 'work', 'done']);
    expect(r.ticks).toBe(totalSeconds(CORTO));
  });

  it('el de por defecto tambien termina', () => {
    const r = correrEntero(DEFAULT_TABATA_CONFIG);
    expect(r.termino).toBe(true);
    expect(r.ticks).toBe(totalSeconds(DEFAULT_TABATA_CONFIG));
  });

  // La cuerda del parte: 40/20 por 12 rondas.
  it('la cuerda de 12 rondas termina', () => {
    const cuerda: TabataConfig = {
      ...DEFAULT_TABATA_CONFIG,
      workSeconds: 40,
      restSeconds: 20,
      rounds: 12,
      cycles: 1,
      cooldownSeconds: 0,
    };
    const r = correrEntero(cuerda);
    expect(r.termino).toBe(true);
    expect(r.progress.currentRound).toBe(12);
  });

  it('sin preparacion ni enfriamiento tambien termina', () => {
    const r = correrEntero({ ...CORTO, prepSeconds: 0 });
    expect(r.termino).toBe(true);
    expect(r.fases[0]).toBe('work');
  });
});

describe('lo que se pinta a los lados', () => {
  // Estaba mal: con una ronda configurada, antes de empezar ensenaba 0.
  it('durante la preparacion quedan todas las rondas', () => {
    expect(roundsLeft(initialProgress(CORTO), CORTO)).toBe(1);
    const tres = { ...CORTO, rounds: 3 };
    expect(roundsLeft(initialProgress(tres), tres)).toBe(3);
  });

  it('durante la ronda, esa cuenta como pendiente', () => {
    const config = { ...CORTO, rounds: 3, restSeconds: 20 };
    const p: TabataProgress = { phase: 'work', timeLeft: 5, currentRound: 1, currentCycle: 1 };
    expect(roundsLeft(p, config)).toBe(3);
    expect(roundsLeft({ ...p, currentRound: 3 }, config)).toBe(1);
  });

  it('en el descanso, la ronda hecha ya no cuenta', () => {
    const config = { ...CORTO, rounds: 3, restSeconds: 20 };
    const p: TabataProgress = { phase: 'rest', timeLeft: 20, currentRound: 1, currentCycle: 1 };
    expect(roundsLeft(p, config)).toBe(2);
  });

  it('al terminar no queda nada', () => {
    const fin: TabataProgress = { phase: 'done', timeLeft: 0, currentRound: 1, currentCycle: 1 };
    expect(roundsLeft(fin, CORTO)).toBe(0);
    expect(cyclesLeft(fin, CORTO)).toBe(0);
  });

  it('cuenta los ciclos incluyendo el actual', () => {
    const config = { ...CORTO, cycles: 5 };
    expect(cyclesLeft(initialProgress(config), config)).toBe(5);
    const p: TabataProgress = { phase: 'work', timeLeft: 5, currentRound: 1, currentCycle: 5 };
    expect(cyclesLeft(p, config)).toBe(1);
  });
});

describe('totalSeconds', () => {
  it('suma preparacion, ciclos, descansos entre ciclos y enfriamiento', () => {
    // 5 prep + 5 trabajo + 0 descanso, 1 ronda, 1 ciclo, sin enfriamiento.
    expect(totalSeconds(CORTO)).toBe(10);
  });

  it('cuenta un descanso entre ciclos menos que ciclos', () => {
    const config = { ...CORTO, cycles: 3, cycleRestSeconds: 15 };
    // 5 + (5+0)*1*3 + 15*2 = 50
    expect(totalSeconds(config)).toBe(50);
  });
});
