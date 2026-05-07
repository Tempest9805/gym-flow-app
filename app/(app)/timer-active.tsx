import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';

const { width } = Dimensions.get('window');

export default function TimerActiveScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const workTime = Number(params.work) || 60;
  const restTime = Number(params.rest) || 0;
  const totalRounds = Number(params.rounds) || 1;
  const soundEnabled = params.sound === '1';

  const [phase, setPhase] = useState<'WORK' | 'REST' | 'DONE'>('WORK');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && phase !== 'DONE') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) return prev - 1;
          
          // Phase transition
          if (phase === 'WORK') {
            if (currentRound >= totalRounds) {
              setPhase('DONE');
              setIsRunning(false);
              return 0;
            } else if (restTime > 0) {
              setPhase('REST');
              return restTime;
            } else {
              setCurrentRound((r) => r + 1);
              return workTime;
            }
          } else {
            // End of REST
            setPhase('WORK');
            setCurrentRound((r) => r + 1);
            return workTime;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, phase, currentRound, totalRounds, workTime, restTime]);

  const togglePause = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setPhase('WORK');
    setCurrentRound(1);
    setTimeLeft(workTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isRest = phase === 'REST';
  const isDone = phase === 'DONE';

  const bgColor = isDone ? t.surfaceContainer : isRest ? t.secondaryContainer : t.background;
  const accentColor = isDone ? t.outlineVariant : isRest ? t.onSecondaryContainer : t.primaryContainer;
  const textColor = isDone ? t.onSurface : isRest ? t.onSecondaryContainer : t.onBackground;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: textColor }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {totalRounds > 1 ? `ROUND ${currentRound}/${totalRounds}` : 'INTERVAL TIMER'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.main}>
        <View style={styles.phaseBadge}>
          <Text style={[styles.phaseText, { color: accentColor }]}>
            {isDone ? 'COMPLETED' : phase}
          </Text>
        </View>

        <Text
          style={[
            styles.timeDisplay,
            { color: textColor, textShadowColor: isRest ? 'transparent' : t.glowPrimary },
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatTime(timeLeft)}
        </Text>
      </View>

      <View style={styles.controls}>
        {!isDone && (
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: accentColor }]}
            onPress={togglePause}
            activeOpacity={0.8}
          >
            <Text style={[styles.playIcon, { color: isRest ? t.secondaryContainer : t.onPrimaryContainer }]}>
              {isRunning ? '❚❚' : '▶'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: accentColor }]}
          onPress={isDone ? () => router.back() : resetTimer}
        >
          <Text style={[styles.resetText, { color: accentColor }]}>
            {isDone ? 'DONE' : 'RESET'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 64,
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 24, fontWeight: '300' },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  phaseBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  timeDisplay: {
    fontSize: width * 0.35,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  controls: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 24,
  },
  playBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  playIcon: {
    fontSize: 40,
    marginLeft: 4,
  },
  resetBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
