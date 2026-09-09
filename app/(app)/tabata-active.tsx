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
import React, { useState, useEffect, useRef, useMemo } from 'react';
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

import {
  cyclesLeft,
  initialProgress,
  nextPhase,
  phaseDuration,
  roundsLeft,
  tick,
  totalSeconds,
  type TabataPhase,
} from '@/lib/domain/tabata';
import { TABATA_FILL, TABATA_ON_FILL, type TabataFillId } from '@/lib/domain/theme';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTabataStore } from '@/lib/store/tabataStore';

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

export default function TabataActiveScreen() {
  const t = useTheme();
  const router = useRouter();
  const { config } = useTabataStore();
  const insets = useSafeAreaInsets();

  const totalWorkoutSeconds = useMemo(() => totalSeconds(config), [config]);

  // El progreso es del dominio; la pausa es solo de esta pantalla, asi que no
  // se mezclan. `lib/domain/tabata.ts` tiene los tests de las transiciones.
  const [progress, setProgress] = useState(() => initialProgress(config));
  const [isPaused, setIsPaused] = useState(true);
  const [totalTimeLeft, setTotalTimeLeft] = useState(totalWorkoutSeconds);

  const flashAnim = useRef(new Animated.Value(1)).current;

  // El reloj: un tic por segundo, y nada mas. Vibrar, parpadear y navegar son
  // efectos de que la fase HAYA cambiado, y por eso viven en su propio efecto y
  // no dentro del actualizador de estado, que debe ser puro.
  useEffect(() => {
    if (isPaused || progress.phase === 'done') return;

    const interval = setInterval(() => {
      setProgress((prev) => tick(prev, config));
      setTotalTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, progress.phase, config]);

  // Un parpadeo y una vibracion al cambiar de fase: se notan aunque el movil
  // este en el suelo. La primera fase no cuenta, que aun no ha cambiado nada.
  const fasePrevia = useRef(progress.phase);

  useEffect(() => {
    if (fasePrevia.current === progress.phase) return;
    fasePrevia.current = progress.phase;

    Vibration.vibrate([0, 100, 50, 100]);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.15, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [progress.phase, flashAnim]);

  // Al terminar, el resumen. Los 800 ms son para que de tiempo a ver el HECHO.
  useEffect(() => {
    if (progress.phase !== 'done') return;

    const id = setTimeout(() => {
      router.replace({
        pathname: '/tabata-summary',
        params: {
          totalSeconds: String(totalWorkoutSeconds),
          roundsCompleted: String(progress.currentRound),
          totalRounds: String(config.rounds),
          cyclesCompleted: String(progress.currentCycle),
          totalCycles: String(config.cycles),
        },
      });
    }, 800);

    return () => clearTimeout(id);
  }, [progress, config, router, totalWorkoutSeconds]);

  // Al volver de segundo plano se adelanta el reloj lo que estuvo fuera, en vez
  // de reanudar donde se quedo: si no, el tabata se alarga solo.
  const bgTimestampRef = useRef(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        bgTimestampRef.current = Date.now();
        return;
      }
      if (nextAppState !== 'active' || !bgTimestampRef.current) return;

      const elapsed = Math.floor((Date.now() - bgTimestampRef.current) / 1000);
      bgTimestampRef.current = 0;
      if (elapsed <= 0) return;

      setProgress((prev) => {
        let cur = prev;
        for (let i = 0; i < elapsed && cur.phase !== 'done'; i += 1) {
          cur = tick(cur, config);
        }
        return cur;
      });
      setTotalTimeLeft((prev) => Math.max(0, prev - elapsed));
    });

    return () => sub.remove();
  }, [config]);

  const { phase, timeLeft } = progress;

  const fill = TABATA_FILL[PHASE_FILL[phase]];
  const nextPhaseData = nextPhase(progress, config);
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

  // Cuanto lleva recorrido el anillo de la fase actual, de 0 a 1.
  const totalPhaseTime = phaseDuration(phase, config);
  const recorrido = totalPhaseTime > 0 ? 1 - timeLeft / totalPhaseTime : 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - recorrido);

  const rondas = roundsLeft(progress, config);
  const ciclos = cyclesLeft(progress, config);

  const handleStopGo = () => setIsPaused((prev) => !prev);

  const handleReset = () => {
    setProgress(initialProgress(config));
    setIsPaused(true);
    setTotalTimeLeft(totalWorkoutSeconds);
    fasePrevia.current = initialProgress(config).phase;
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
            {rondas}
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
            {ciclos}
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
