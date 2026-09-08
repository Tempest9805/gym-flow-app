/**
 * La pantalla que corre el tabata. A pantalla completa, un solo dato a la vez.
 *
 * Tres zonas, de arriba abajo:
 *   1. La fase de ahora y el numero grande - ocupa lo que sobre.
 *   2. Lo que viene despues, en su color, al 20% de la altura.
 *   3. Los mandos: rondas, el boton, ciclos.
 *
 * El color de fase es RELLENO (`TABATA_FILL`) y no cambia con el tema: llena el
 * 70% de la pantalla y hay que leerlo de reojo, sudando, desde un metro. Los
 * mandos si siguen el tema, y ahi la fase se escribe con su token TINTA
 * (`t.tabataWork`), que es otro color a proposito - la misma regla de siempre.
 *
 * La tinta sobre el relleno no baja de 0.8 de opacidad: a 0.4, que es como
 * estaba, la etiqueta TOTAL daba 2,27:1 sobre el rojo. Medido, no estimado.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Vibration,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TABATA_FILL, TABATA_ON_FILL, type TabataFillId } from '@/lib/domain/theme';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTabataStore, type TabataConfig } from '@/lib/store/tabataStore';

type TabataPhase = 'prepare' | 'work' | 'rest' | 'cycle-rest' | 'cooldown' | 'done';

type TabataState = {
  phase: TabataPhase;
  timeLeft: number;
  currentRound: number;
  currentCycle: number;
  isPaused: boolean;
};

/** Que relleno le toca a cada fase. Los dos descansos largos comparten neutro. */
const PHASE_FILL: Record<TabataPhase, TabataFillId> = {
  prepare: 'prepare',
  work: 'work',
  rest: 'rest',
  'cycle-rest': 'cooldown',
  cooldown: 'cooldown',
  done: 'cooldown',
};

const PHASE_LABELS: Record<TabataPhase, string> = {
  prepare: 'PREPARA',
  work: 'VAMOS',
  rest: 'DESCANSA',
  'cycle-rest': 'RESPIRA',
  cooldown: 'RESPIRA',
  done: 'HECHO',
};

/** Lo minimo que aguanta AA sobre el relleno mas oscuro (el rojo): 4,94:1. */
const TINTA_SECUNDARIA = 0.8;

/** Circunferencia del anillo con r=45: 2 * PI * 45. */
const RING_CIRCUMFERENCE = 283;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getPhaseDuration(phase: TabataPhase, config: TabataConfig): number {
  switch (phase) {
    case 'prepare':    return config.prepSeconds;
    case 'work':       return config.workSeconds;
    case 'rest':       return config.restSeconds;
    case 'cycle-rest': return config.cycleRestSeconds;
    case 'cooldown':   return config.cooldownSeconds;
    default:           return 0;
  }
}

function getNextPhaseInfo(
  phase: TabataPhase,
  round: number,
  cycle: number,
  config: TabataConfig,
): { phase: TabataPhase; duration: number } {
  switch (phase) {
    case 'prepare':
      return { phase: 'work', duration: config.workSeconds };
    case 'work':
      if (round < config.rounds) {
        return { phase: 'rest', duration: config.restSeconds };
      }
      if (cycle < config.cycles) {
        return { phase: 'cycle-rest', duration: config.cycleRestSeconds };
      }
      if (config.cooldownSeconds > 0) {
        return { phase: 'cooldown', duration: config.cooldownSeconds };
      }
      return { phase: 'done', duration: 0 };
    case 'rest':
      return { phase: 'work', duration: config.workSeconds };
    case 'cycle-rest':
      return { phase: 'work', duration: config.workSeconds };
    case 'cooldown':
      return { phase: 'done', duration: 0 };
    default:
      return { phase: 'done', duration: 0 };
  }
}

function advanceState(prev: TabataState, config: TabataConfig): TabataState {
  switch (prev.phase) {
    case 'prepare':
      return { ...prev, phase: 'work', timeLeft: config.workSeconds };

    case 'work':
      if (prev.currentRound < config.rounds) {
        return { ...prev, phase: 'rest', timeLeft: config.restSeconds };
      }
      if (prev.currentCycle < config.cycles) {
        return {
          ...prev,
          phase: 'cycle-rest',
          timeLeft: config.cycleRestSeconds,
          currentRound: 1,
          currentCycle: prev.currentCycle + 1,
        };
      }
      if (config.cooldownSeconds > 0) {
        return { ...prev, phase: 'cooldown', timeLeft: config.cooldownSeconds };
      }
      return { ...prev, phase: 'done', timeLeft: 0 };

    case 'rest':
      return {
        ...prev,
        phase: 'work',
        timeLeft: config.workSeconds,
        currentRound: prev.currentRound + 1,
      };

    case 'cycle-rest':
      return { ...prev, phase: 'work', timeLeft: config.workSeconds };

    case 'cooldown':
      return { ...prev, phase: 'done', timeLeft: 0 };

    default:
      return prev;
  }
}

export default function TabataActiveScreen() {
  const t = useTheme();
  const router = useRouter();
  const { config } = useTabataStore();
  const insets = useSafeAreaInsets();

  const totalWorkoutSeconds = useMemo(() => {
    const timePerCycle = (config.workSeconds + config.restSeconds) * config.rounds;
    const cyclePadding = config.cycleRestSeconds * (config.cycles - 1);
    return (
      config.prepSeconds +
      timePerCycle * config.cycles +
      cyclePadding +
      config.cooldownSeconds
    );
  }, [config]);

  const initialPhase: TabataPhase = config.prepSeconds > 0 ? 'prepare' : 'work';
  const initialTime = config.prepSeconds > 0 ? config.prepSeconds : config.workSeconds;

  const [state, setState] = useState<TabataState>({
    phase: initialPhase,
    timeLeft: initialTime,
    currentRound: 1,
    currentCycle: 1,
    isPaused: true,
  });

  const [totalTimeLeft, setTotalTimeLeft] = useState(totalWorkoutSeconds);

  // Un parpadeo al cambiar de fase: se ve aunque el movil este en el suelo.
  const flashAnim = useRef(new Animated.Value(1)).current;

  const triggerFlash = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.15, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [flashAnim]);

  useEffect(() => {
    if (state.isPaused || state.phase === 'done') return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          Vibration.vibrate([0, 100, 50, 100]);
          triggerFlash();
          const next = advanceState(prev, config);
          if (next.phase === 'done') {
            setTimeout(() => {
              router.replace({
                pathname: '/tabata-summary',
                params: {
                  totalSeconds: String(totalWorkoutSeconds),
                  roundsCompleted: String(prev.currentRound),
                  totalRounds: String(config.rounds),
                  cyclesCompleted: String(prev.currentCycle),
                  totalCycles: String(config.cycles),
                },
              });
            }, 800);
          }
          return next;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
      setTotalTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isPaused, state.phase, config, router, triggerFlash, totalWorkoutSeconds]);

  // Al volver de segundo plano se adelanta el reloj lo que estuvo fuera, en vez
  // de reanudar donde se quedo: si no, el tabata se alarga solo.
  const bgTimestampRef = useRef(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        bgTimestampRef.current = Date.now();
      } else if (nextAppState === 'active' && bgTimestampRef.current) {
        const elapsed = Math.floor((Date.now() - bgTimestampRef.current) / 1000);
        bgTimestampRef.current = 0;
        if (elapsed > 0) {
          setState((prev) => {
            if (prev.isPaused || prev.phase === 'done') return prev;
            let remaining = elapsed;
            let cur = { ...prev };
            while (remaining > 0 && cur.phase !== 'done') {
              if (cur.timeLeft > remaining) {
                cur = { ...cur, timeLeft: cur.timeLeft - remaining };
                remaining = 0;
              } else {
                remaining -= cur.timeLeft;
                cur = advanceState(cur, config);
              }
            }
            return cur;
          });
          setTotalTimeLeft((totalPrev) => Math.max(0, totalPrev - elapsed));
        }
      }
    });

    return () => sub.remove();
  }, [config]);

  const { phase, timeLeft, currentRound, currentCycle, isPaused } = state;

  const fill = TABATA_FILL[PHASE_FILL[phase]];
  const nextPhaseData = getNextPhaseInfo(phase, currentRound, currentCycle, config);
  const nextFill = TABATA_FILL[PHASE_FILL[nextPhaseData.phase]];

  // La misma fase, escrita sobre los mandos, que si siguen el tema: ahi el
  // color es tinta y no relleno, y por eso es otro.
  const phaseInk =
    phase === 'work'
      ? t.tabataWork
      : phase === 'rest'
        ? t.tabataRest
        : phase === 'prepare'
          ? t.tabataPrepare
          : t.onSurfaceVariant;

  const totalPhaseTime = getPhaseDuration(phase, config);
  const progress = totalPhaseTime > 0 ? 1 - timeLeft / totalPhaseTime : 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);

  const roundsLeft = config.rounds - currentRound + (phase === 'work' ? 1 : 0);
  const cyclesLeft = config.cycles - currentCycle + 1;

  const handleStopGo = () => setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));

  const handleReset = () => {
    setState({
      phase: initialPhase,
      timeLeft: initialTime,
      currentRound: 1,
      currentCycle: 1,
      isPaused: true,
    });
    setTotalTimeLeft(totalWorkoutSeconds);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: t.background }}>
      {/* Zona 1 - la fase de ahora */}
      <Animated.View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: fill, opacity: flashAnim, position: 'relative' }}
      >
        {/* El total, anclado arriba: no se mueve al cambiar de fase. */}
        <View style={{ position: 'absolute', top: insets.top + 16, alignItems: 'center' }}>
          <Text
            style={{
              color: TABATA_ON_FILL,
              opacity: TINTA_SECUNDARIA,
              fontSize: 20,
              fontWeight: '700',
              fontVariant: ['tabular-nums'],
              letterSpacing: 1,
            }}
          >
            {formatTime(totalTimeLeft)}
          </Text>
          <Text
            style={{
              color: TABATA_ON_FILL,
              opacity: TINTA_SECUNDARIA,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            TOTAL
          </Text>
        </View>

        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{
            color: TABATA_ON_FILL,
            fontSize: 52,
            fontWeight: '800',
            letterSpacing: -1,
            lineHeight: 58,
            paddingHorizontal: 16,
            marginBottom: 8,
          }}
        >
          {PHASE_LABELS[phase]}
        </Text>

        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{
            color: TABATA_ON_FILL,
            fontSize: 112,
            fontWeight: '900',
            lineHeight: 124,
            letterSpacing: -4,
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatTime(timeLeft)}
        </Text>
      </Animated.View>

      {/* Zona 2 - lo que viene */}
      <View
        style={{
          height: '20%',
          backgroundColor: nextFill,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 30,
        }}
        className="items-center justify-center z-10"
      >
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{
            color: TABATA_ON_FILL,
            opacity: TINTA_SECUNDARIA,
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: -1,
            lineHeight: 38,
            paddingHorizontal: 16,
          }}
        >
          {PHASE_LABELS[nextPhaseData.phase]}
        </Text>
        {nextPhaseData.duration > 0 && (
          <Text
            style={{
              color: TABATA_ON_FILL,
              fontSize: 64,
              fontWeight: '900',
              fontVariant: ['tabular-nums'],
              lineHeight: 72,
              letterSpacing: -2,
            }}
          >
            {formatTime(nextPhaseData.duration)}
          </Text>
        )}
      </View>

      {/* Zona 3 - los mandos. Siguen el tema y respetan la barra del sistema. */}
      <View
        className="flex-row items-center justify-between px-8 z-20"
        style={{
          minHeight: 248,
          backgroundColor: t.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -20 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
          elevation: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        {/* Rondas que quedan */}
        <View className="w-24 items-center">
          <Text
            className="font-black leading-none"
            style={{ fontSize: 64, color: t.onSurface, fontVariant: ['tabular-nums'] }}
          >
            {Math.max(0, roundsLeft)}
          </Text>
          <Text
            className="text-[10px] font-bold uppercase text-center mt-1"
            style={{ color: t.onSurfaceVariant, letterSpacing: 2 }}
          >
            {'RONDAS\nRESTANTES'}
          </Text>
        </View>

        {/* Anillo, boton y reinicio */}
        <View className="items-center">
          <View
            style={{
              width: 128,
              height: 128,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Svg width={128} height={128} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
              <Circle cx="50" cy="50" r="45" fill="none" stroke={t.outlineVariant} strokeWidth="4" />
              <Circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={fill}
                strokeWidth="4"
                strokeDasharray={String(RING_CIRCUMFERENCE)}
                strokeDashoffset={String(strokeOffset)}
                strokeLinecap="round"
                rotation="-90"
                originX="50"
                originY="50"
              />
            </Svg>

            <TouchableOpacity
              onPress={phase === 'done' ? () => router.back() : handleStopGo}
              accessibilityRole="button"
              accessibilityLabel={
                phase === 'done'
                  ? 'Terminar'
                  : isPaused
                    ? 'Empezar el tabata'
                    : 'Parar el tabata'
              }
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: fill,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
              }}
              activeOpacity={0.8}
            >
              {phase === 'done' ? (
                <MaterialCommunityIcons name="check-bold" size={40} color={TABATA_ON_FILL} />
              ) : isPaused ? (
                <MaterialCommunityIcons name="play" size={44} color={TABATA_ON_FILL} />
              ) : (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: TABATA_ON_FILL,
                    borderRadius: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>

          <Text
            className="text-[10px] font-bold uppercase"
            style={{ color: phaseInk, letterSpacing: 3 }}
          >
            {phase === 'done' ? 'LISTO' : isPaused ? 'EMPEZAR' : 'PARAR'}
          </Text>

          <TouchableOpacity
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar el tabata"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 16,
              marginTop: 8,
              minHeight: 44,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: t.outlineVariant,
            }}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="replay" size={13} color={t.onSurfaceVariant} />
            <Text
              style={{
                color: t.onSurfaceVariant,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Reiniciar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ciclos que quedan */}
        <View className="w-24 items-center">
          <Text
            className="font-black leading-none"
            style={{ fontSize: 64, color: t.onSurface, fontVariant: ['tabular-nums'] }}
          >
            {Math.max(0, cyclesLeft)}
          </Text>
          <Text
            className="text-[10px] font-bold uppercase text-center mt-1"
            style={{ color: t.onSurfaceVariant, letterSpacing: 2 }}
          >
            {'CICLOS\nRESTANTES'}
          </Text>
        </View>
      </View>
    </View>
  );
}
