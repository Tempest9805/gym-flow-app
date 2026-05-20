/**
 * tabata-active.tsx — Tabata Active Session Screen
 * 3-zone layout (as per Stitch design):
 *   Zone 1 (flex:1)     — Current phase + giant timer digit
 *   Zone 2 (20% height) — Next phase preview
 *   Zone 3 (256px)      — Controls: rounds left / SVG ring stop-go / cycles left
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
import { useTabataStore, type TabataConfig } from '@/lib/store/tabataStore';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TabataPhase =
  | 'prepare'
  | 'work'
  | 'rest'
  | 'cycle-rest'
  | 'cooldown'
  | 'done';

type TabataState = {
  phase: TabataPhase;
  timeLeft: number;
  currentRound: number;
  currentCycle: number;
  isPaused: boolean;
};

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<TabataPhase, string> = {
  prepare: '#EAB308',
  work: '#C0FF00',
  rest: '#FF3B30',
  'cycle-rest': '#3B82F6',
  cooldown: '#3B82F6',
  done: '#BC13FE',
};

const PHASE_LABELS: Record<TabataPhase, string> = {
  prepare: 'PREPARE',
  work: 'TRAIN',
  rest: 'REST',
  'cycle-rest': 'COOLING',
  cooldown: 'COOLING',
  done: 'DONE!',
};

// SVG circle circumference for r=45: 2 * π * 45 ≈ 283
const RING_CIRCUMFERENCE = 283;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getPhaseDuration(phase: TabataPhase, config: TabataConfig): number {
  switch (phase) {
    case 'prepare':   return config.prepSeconds;
    case 'work':      return config.workSeconds;
    case 'rest':      return config.restSeconds;
    case 'cycle-rest': return config.cycleRestSeconds;
    case 'cooldown':  return config.cooldownSeconds;
    default:          return 0;
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

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function TabataActiveScreen() {
  const router = useRouter();
  const { config } = useTabataStore();
  const insets = useSafeAreaInsets();

  const totalWorkoutSeconds = useMemo(() => {
    const timePerCycle =
      (config.workSeconds + config.restSeconds) * config.rounds;
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

  // Flash animation for phase transitions
  const flashAnim = useRef(new Animated.Value(1)).current;

  const triggerFlash = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [flashAnim]);

  // ── Main timer ──
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
                pathname: '/tabata-summary' as any,
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

  // ── AppState background time compensation ──
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

  // ── Derived values ──
  const { phase, timeLeft, currentRound, currentCycle, isPaused } = state;
  const phaseColor = PHASE_COLORS[phase];
  const nextPhaseData = getNextPhaseInfo(phase, currentRound, currentCycle, config);
  const nextColor = PHASE_COLORS[nextPhaseData.phase];

  const totalPhaseTime = getPhaseDuration(phase, config);
  const progress = totalPhaseTime > 0 ? 1 - timeLeft / totalPhaseTime : 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);

  // Rounds left: total rounds minus completed rounds in current cycle
  const roundsLeft = config.rounds - currentRound + (phase === 'work' ? 1 : 0);
  // Cycles left: total cycles minus completed cycles
  const cyclesLeft = config.cycles - currentCycle + 1;

  const handleStopGo = () => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

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
    <View className="flex-1" style={{ backgroundColor: '#19101C' }}>
      {/* ─── Zone 1: Current phase (flex:1, ~70%) ─── */}
      <Animated.View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: phaseColor, opacity: flashAnim, position: 'relative' }}
      >
        {/* Tiempo total — anclado al top, nunca se mueve */}
        <View style={{
          position: 'absolute',
          top: insets.top + 16,
          alignItems: 'center',
        }}>
          <Text style={{
            color: '#19101C',
            fontSize: 20,
            fontWeight: '700',
            opacity: 0.55,
            fontVariant: ['tabular-nums'],
            letterSpacing: 1,
          }}>
            {formatTime(totalTimeLeft)}
          </Text>
          <Text style={{
            color: '#19101C',
            fontSize: 10,
            fontWeight: '700',
            opacity: 0.4,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginTop: 2,
          }}>
            TOTAL
          </Text>
        </View>

        <Text
          style={{
            color: '#19101C',
            fontSize: 52,
            fontWeight: '800',
            letterSpacing: -1,
            lineHeight: 52,
            opacity: 1,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {PHASE_LABELS[phase]}
        </Text>

        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{
            color: '#19101C',
            fontSize: 112,
            fontWeight: '900',
            lineHeight: 112,
            letterSpacing: -4,
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatTime(timeLeft)}
        </Text>
      </Animated.View>

      {/* ─── Zone 2: Next phase preview (20% height) ─── */}
      <View
        style={{
          height: '20%' as any,
          backgroundColor: nextColor,
          opacity: 0.85,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 30,
        }}
        className="items-center justify-center z-10"
      >
        <Text
          style={{
            color: '#19101C',
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: -1,
            lineHeight: 32,
            textTransform: 'uppercase',
          }}
        >
          {PHASE_LABELS[nextPhaseData.phase]}
        </Text>
        {nextPhaseData.duration > 0 && (
          <Text
            style={{
              color: '#19101C',
              fontSize: 64,
              fontWeight: '900',
              fontVariant: ['tabular-nums'],
              lineHeight: 68,
              letterSpacing: -2,
            }}
          >
            {formatTime(nextPhaseData.duration)}
          </Text>
        )}
      </View>

      {/* ─── Zone 3: Controls (256px fixed) ─── */}
      <View
        className="flex-row items-center justify-between px-8 z-20"
        style={{
          height: 256,
          backgroundColor: '#19101C',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -20 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
          elevation: 20,
          paddingBottom: 24,
        }}
      >
        {/* Rounds left */}
        <View className="w-24 items-center">
          <Text
            className="font-black leading-none"
            style={{
              fontSize: 64,
              color: '#3B82F6',
              fontVariant: ['tabular-nums'],
            }}
          >
            {Math.max(0, roundsLeft)}
          </Text>
          <Text
            className="text-[10px] font-bold uppercase text-center mt-1"
            style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}
          >
            {'ROUNDS\nLEFT'}
          </Text>
        </View>

        {/* Central SVG ring + stop/go button + reset */}
        <View className="items-center">
          <View style={{ width: 128, height: 128, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            {/* SVG ring */}
            <Svg
              width={128}
              height={128}
              viewBox="0 0 100 100"
              style={{ position: 'absolute' }}
            >
              {/* Track ring */}
              <Circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#3b313e"
                strokeWidth="4"
              />
              {/* Progress ring */}
              <Circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={phaseColor}
                strokeWidth="4"
                strokeDasharray={String(RING_CIRCUMFERENCE)}
                strokeDashoffset={String(strokeOffset)}
                strokeLinecap="round"
                rotation="-90"
                originX="50"
                originY="50"
              />
            </Svg>

            {/* Center button */}
            <TouchableOpacity
              onPress={phase === 'done' ? () => router.back() : handleStopGo}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: phaseColor,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
              }}
              activeOpacity={0.8}
            >
              {phase === 'done' ? (
                <Text style={{ fontSize: 36, color: '#19101C', fontWeight: '900' }}>✓</Text>
              ) : isPaused ? (
                /* Play triangle */
                <Text style={{ fontSize: 32, color: '#19101C', marginLeft: 4 }}>▶</Text>
              ) : (
                /* Stop square */
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#19101C',
                    borderRadius: 4,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>

          <Text
            className="text-[10px] font-bold uppercase"
            style={{ color: phaseColor, letterSpacing: 3 }}
          >
            {phase === 'done' ? 'DONE' : isPaused ? 'START' : 'STOP'}
          </Text>

          {/* Reset Button */}
          <TouchableOpacity
            onPress={handleReset}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginTop: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#504254',
            }}
            activeOpacity={0.6}>
            <MaterialCommunityIcons
              name="replay"
              size={13}
              color="#9d8ba0"
            />
            <Text style={{
              color: '#9d8ba0',
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              RESET
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cycles left */}
        <View className="w-24 items-center">
          <Text
            className="font-black leading-none"
            style={{
              fontSize: 64,
              color: '#EAB308',
              fontVariant: ['tabular-nums'],
            }}
          >
            {Math.max(0, cyclesLeft)}
          </Text>
          <Text
            className="text-[10px] font-bold uppercase text-center mt-1"
            style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}
          >
            {'CYCLES\nLEFT'}
          </Text>
        </View>
      </View>
    </View>
  );
}