import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTabataThemeStore, TABATA_THEMES } from '@/lib/store/tabataThemeStore';

const { width } = Dimensions.get('window');

type Phase = 'PREP' | 'WORK' | 'REST' | 'DONE';

export default function TabataActiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, loadTabataTheme } = useTabataThemeStore();
  
  const workTime = Number(params.work) || 20;
  const restTime = Number(params.rest) || 10;
  const totalRounds = Number(params.rounds) || 8;
  const prepTime = Number(params.prep) || 10;

  const [phase, setPhase] = useState<Phase>(prepTime > 0 ? 'PREP' : 'WORK');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(prepTime > 0 ? prepTime : workTime);
  const [isRunning, setIsRunning] = useState(true);
  const [prevColors, setPrevColors] = useState(TABATA_THEMES.purple);

  useEffect(() => {
    loadTabataTheme();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && phase !== 'DONE') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) return prev - 1;
          
          switch (phase) {
            case 'PREP':
              setPhase('WORK');
              setPrevColors(colors);
              return workTime;
            case 'WORK':
              if (currentRound >= totalRounds) {
                setPhase('DONE');
                setIsRunning(false);
                return 0;
              }
              if (restTime > 0) {
                setPhase('REST');
                setPrevColors(colors);
                return restTime;
              }
              setCurrentRound(r => r + 1);
              return workTime;
            case 'REST':
              setPhase('WORK');
              setCurrentRound(r => r + 1);
              setPrevColors(colors);
              return workTime;
            default:
              return 0;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, phase, currentRound, totalRounds, workTime, restTime, colors]);

  const togglePause = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setPhase(prepTime > 0 ? 'PREP' : 'WORK');
    setCurrentRound(1);
    setTimeLeft(prepTime > 0 ? prepTime : workTime);
  };

  const getPhaseColor = (p: Phase) => {
    switch (p) {
      case 'PREP': return colors.prepare;
      case 'WORK': return colors.work;
      case 'REST': return colors.rest;
      case 'DONE': return '#111111';
    }
  };

  const getNextPhase = (): Phase => {
    if (phase === 'PREP') return 'WORK';
    if (phase === 'WORK') return currentRound >= totalRounds ? 'DONE' : (restTime > 0 ? 'REST' : 'WORK');
    if (phase === 'REST') return 'WORK';
    return 'DONE';
  };

  const currentColor = getPhaseColor(phase);
  const nextPhase = getNextPhase();
  const nextColor = getPhaseColor(nextPhase);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#111111' }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: '#fff' }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>
          ROUND {Math.min(currentRound, totalRounds)} / {totalRounds}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={[styles.mainPanel, { backgroundColor: currentColor }]}>
        <View style={[styles.phaseBadge, { backgroundColor: `${currentColor}33`, borderColor: '#00000044' }]}>
          <Text style={[styles.phaseText, { color: '#000000' }]}>
            {phase === 'PREP' ? 'GET READY' : phase}
          </Text>
        </View>

        <Text
          style={[
            styles.timeDisplay,
            { color: '#000000', textShadowColor: phase === 'WORK' ? currentColor : 'transparent' },
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {timeLeft}
        </Text>

        <View style={[styles.nextPreview, { backgroundColor: `${nextColor}88` }]}>
          <Text style={[styles.nextPreviewText, { color: '#000000' }]}>
            NEXT: {nextPhase === 'DONE' ? 'FINISH' : nextPhase}
          </Text>
        </View>
      </View>

      <View style={[styles.controls, { backgroundColor: '#111111' }]}>
        {phase !== 'DONE' && (
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: currentColor, borderColor: currentColor }]}
            onPress={togglePause}
            activeOpacity={0.8}
          >
            <Text style={[styles.playIcon, { color: '#000000' }]}>
              {isRunning ? '❚❚' : '▶'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: '#444444' }]}
          onPress={phase === 'DONE' ? () => router.back() : resetTimer}
        >
          <Text style={[styles.resetText, { color: '#888888' }]}>
            {phase === 'DONE' ? 'DONE' : 'RESET'}
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  mainPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 24,
  },
  phaseBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 2,
    marginBottom: 24,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
  },
  timeDisplay: {
    fontSize: width * 0.45,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -4,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  nextPreview: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  nextPreviewText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  controls: {
    paddingHorizontal: 40,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 24,
  },
  playBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 4,
  },
  playIcon: {
    fontSize: 48,
    marginLeft: 6,
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