import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
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
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: '#111111' }} 
      edges={['top', 'bottom']}
    >
      <View className="flex-row items-center justify-between px-5 h-16">
        <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-start justify-center">
          <Text className="text-2xl font-light text-white">✕</Text>
        </TouchableOpacity>
        <Text className="text-base font-black tracking-[2px] text-white">
          ROUND {Math.min(currentRound, totalRounds)} / {totalRounds}
        </Text>
        <View className="w-12" />
      </View>

      <View className="flex-1 items-center justify-center px-5 mx-5 rounded-[24px]" style={{ backgroundColor: currentColor }}>
        <View 
          className="px-6 py-3 rounded-full border-2 mb-6"
          style={{ backgroundColor: `${currentColor}33`, borderColor: '#00000044' }}
        >
          <Text className="text-2xl font-black tracking-[4px] text-black">
            {phase === 'PREP' ? 'GET READY' : phase}
          </Text>
        </View>

        <Text
          className="font-black tracking-[-4px] text-center"
          style={{ 
            color: '#000000', 
            fontSize: width * 0.45,
            textShadowColor: phase === 'WORK' ? currentColor : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 24,
          }}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {timeLeft}
        </Text>

        <View className="mt-6 px-5 py-[10px] rounded-[20px]" style={{ backgroundColor: `${nextColor}88` }}>
          <Text className="text-sm font-bold tracking-[2px] text-black">
            NEXT: {nextPhase === 'DONE' ? 'FINISH' : nextPhase}
          </Text>
        </View>
      </View>

      <View className="px-10 py-10 items-center gap-6" style={{ backgroundColor: '#111111' }}>
        {phase !== 'DONE' && (
          <TouchableOpacity
            className="w-[100px] h-[100px] rounded-full items-center justify-center shadow-2xl border-4"
            style={{ 
              backgroundColor: currentColor, 
              borderColor: currentColor,
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
            }}
            onPress={togglePause}
            activeOpacity={0.8}
          >
            <Text className="text-[48px] ml-[6px] text-black">
              {isRunning ? '❚❚' : '▶'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="px-8 py-3 rounded-full border-2"
          style={{ borderColor: '#444444' }}
          onPress={phase === 'DONE' ? () => router.back() : resetTimer}
        >
          <Text className="text-sm font-bold tracking-[2px]" style={{ color: '#888888' }}>
            {phase === 'DONE' ? 'DONE' : 'RESET'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}