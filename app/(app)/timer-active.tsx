import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';

const { width } = Dimensions.get('window');

/**
 * La fase es estado interno y se queda en ingles; lo que se lee en pantalla
 * no. Traducir aqui, en el borde, evita que el valor del estado y el texto
 * visible sean la misma cosa —que es como esta pantalla acabo siendo la unica
 * en ingles de una app espanola.
 *
 * Las palabras son las del ajuste del tabata («Trabajo», «Descanso»), no las
 * de su cuenta atras («VAMOS», «DESCANSA»): esto es una herramienta, no una
 * sesion.
 */
const ETIQUETA_FASE = {
  WORK: 'TRABAJO',
  REST: 'DESCANSO',
  DONE: 'COMPLETADO',
} as const;

export default function TimerActiveScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const workTime = Number(params.work) || 60;
  const restTime = Number(params.rest) || 0;
  const totalRounds = Number(params.rounds) || 1;

  const [phase, setPhase] = useState<'WORK' | 'REST' | 'DONE'>('WORK');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isRunning, setIsRunning] = useState(true);

  // Esta pantalla es una pestana (`href: null` en `_layout.tsx`) y un `Tabs` no
  // desmonta: `router.push` solo cambia el foco. Sin esto, la segunda vez que
  // se entra en la misma apertura abre en COMPLETADO 0:00 —con la cabecera
  // diciendo «RONDA 1/2», porque los params si llegan y la ronda no— y no
  // cuenta ni un segundo.
  useFocusEffect(
    useCallback(() => {
      setPhase('WORK');
      setCurrentRound(1);
      setTimeLeft(workTime);
      setIsRunning(true);
    }, [workTime]),
  );

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
  // `outlineVariant` es el token de separar, no el de leer: sobre
  // `surfaceContainer` da 1,34:1 en oscuro y 1,45:1 en claro, y dejaba «LISTO»
  // —la unica accion de la pantalla— practicamente invisible.
  const accentColor = isDone ? t.onSurface : isRest ? t.onSecondaryContainer : t.primary;
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
          {totalRounds > 1 ? `RONDA ${currentRound}/${totalRounds}` : 'INTERVALOS'}
        </Text>
        <View className="w-12" />
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <View 
          className="px-4 py-2 rounded-full border-2 mb-6"
          style={{ borderColor: t.outlineVariant }}
        >
          <Text className="text-lg font-extrabold tracking-[4px]" style={{ color: accentColor }}>
            {ETIQUETA_FASE[phase]}
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
            {isDone ? 'LISTO' : 'REINICIAR'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
