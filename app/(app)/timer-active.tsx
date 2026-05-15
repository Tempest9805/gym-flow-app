import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
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
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: bgColor }} 
      edges={['top', 'bottom']}
    >
      <View className="flex-row items-center justify-between px-5 h-16">
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-start justify-center">
          <Text className="text-2xl font-light" style={{ color: textColor }}>✕</Text>
        </TouchableOpacity>
        <Text className="text-sm font-bold tracking-[2px]" style={{ color: textColor }}>
          {totalRounds > 1 ? `ROUND ${currentRound}/${totalRounds}` : 'INTERVAL TIMER'}
        </Text>
        <View className="w-12" />
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <View 
          className="px-4 py-2 rounded-full border-2 mb-6"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <Text className="text-lg font-extrabold tracking-[4px]" style={{ color: accentColor }}>
            {isDone ? 'COMPLETED' : phase}
          </Text>
        </View>

        <Text
          className="font-extrabold tracking-tighter text-center"
          style={{ 
            color: textColor, 
            fontSize: width * 0.35,
            textShadowColor: isRest ? 'transparent' : t.glowPrimary,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
          }}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatTime(timeLeft)}
        </Text>
      </View>

      <View className="px-10 pb-10 items-center gap-6">
        {!isDone && (
          <TouchableOpacity
            className="w-24 h-24 rounded-full items-center justify-center shadow-2xl elevation-md"
            style={{ 
              backgroundColor: accentColor,
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            }}
            onPress={togglePause}
            activeOpacity={0.8}
          >
            <Text 
              className="text-4xl ml-1" 
              style={{ color: isRest ? t.secondaryContainer : t.onPrimaryContainer }}
            >
              {isRunning ? '❚❚' : '▶'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="px-8 py-3 rounded-full border-2"
          style={{ borderColor: accentColor }}
          onPress={isDone ? () => router.back() : resetTimer}
        >
          <Text className="text-sm font-bold tracking-[2px]" style={{ color: accentColor }}>
            {isDone ? 'DONE' : 'RESET'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
