import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRouter } from 'expo-router';

interface ControlRowProps {
  label: string;
  min: number;
  sec: number;
  setMin: (v: number) => void;
  setSec: (v: number) => void;
}

interface StepperProps {
  value: number;
  /** `m` o `s`. Va como hermana del numero, no anidada dentro. */
  unit: string;
  /** Para el lector de pantalla, que si no solo oye un numero suelto. */
  label: string;
  onDecrement: () => void;
  onIncrement: () => void;
}

/**
 * Menos / valor / mas, en columna.
 *
 * El numero lleva `lineHeight` explicito: sin el, Android recorta las
 * ascendentes y descendentes de una fuente de 40px en negrita, y la unidad
 * va como Text hermano porque anidar tamanos distintos dentro de un mismo
 * Text descuadra la caja de linea.
 */
function Stepper({ value, unit, label, onDecrement, onIncrement }: StepperProps) {
  const t = useTheme();
  return (
    <View className="items-center gap-2">
      <TouchableOpacity
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel={`Bajar ${label}`}
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: t.surfaceContainerHigh }}
      >
        <Text className="text-2xl" style={{ color: t.onSurface }}>
          −
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-baseline">
        <Text
          className="text-[40px] font-extrabold"
          style={{ color: t.onSurface, lineHeight: 48, fontVariant: ['tabular-nums'] }}
          accessibilityLabel={`${label}: ${value}`}
        >
          {String(value).padStart(2, '0')}
        </Text>
        <Text
          className="text-base font-semibold"
          style={{ color: t.onSurfaceVariant, lineHeight: 48 }}
        >
          {unit}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel={`Subir ${label}`}
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: t.surfaceContainerHigh }}
      >
        <Text className="text-2xl" style={{ color: t.onSurface }}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TimerSetupScreen() {
  const t = useTheme();
  const router = useRouter();

  const [workMinutes, setWorkMinutes] = useState(1);
  const [workSeconds, setWorkSeconds] = useState(0);
  const [rounds, setRounds] = useState(1);
  const [restMinutes, setRestMinutes] = useState(0);
  const [restSeconds, setRestSeconds] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const startTimer = () => {
    const workTime = workMinutes * 60 + workSeconds;
    const restTime = restMinutes * 60 + restSeconds;
    if (workTime === 0) return;

    router.push({
      pathname: '/timer-active',
      params: { 
        work: workTime, 
        rest: restTime, 
        rounds, 
        sound: soundEnabled ? '1' : '0' 
      }
    });
  };

  const ControlRow = ({ label, min, sec, setMin, setSec }: ControlRowProps) => (
    <View
      className="p-5 rounded-2xl border gap-4"
      style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
    >
      <Text
        className="text-[12px] font-bold tracking-[2px] uppercase"
        style={{ color: t.onSurfaceVariant }}
      >
        {label}
      </Text>
      <View className="flex-row items-center justify-center gap-4">
        <Stepper
          value={min}
          unit="m"
          label={`${label}, minutos`}
          onDecrement={() => setMin(Math.max(0, min - 1))}
          onIncrement={() => setMin(min + 1)}
        />
        <Text
          className="text-[32px] font-extrabold pb-4"
          style={{ color: t.onSurfaceVariant, lineHeight: 40 }}
        >
          :
        </Text>
        <Stepper
          value={sec}
          unit="s"
          label={`${label}, segundos`}
          onDecrement={() => setSec(sec - 5 < 0 ? 55 : sec - 5)}
          onIncrement={() => setSec(sec + 5 > 59 ? 0 : sec + 5)}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="flex-1 relative">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View className="gap-2 mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-base font-semibold" style={{ color: t.onSurfaceVariant }}>← Volver</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-extrabold tracking-tighter" style={{ color: t.onSurface }}>Temporizador de intervalos</Text>
          </View>

          <ControlRow label="Duración" min={workMinutes} sec={workSeconds} setMin={setWorkMinutes} setSec={setWorkSeconds} />
          
          <View 
            className="p-5 rounded-2xl border gap-4" 
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>Rondas</Text>
            <View className="flex-row items-center justify-center gap-4">
              <TouchableOpacity 
                onPress={() => setRounds(Math.max(1, rounds - 1))} 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: t.surfaceContainerHigh }}
              >
                <Text className="text-2xl" style={{ color: t.primary }}>−</Text>
              </TouchableOpacity>
              <Text className="text-[40px] font-extrabold min-w-[60px] text-center" style={{ color: t.onSurface }}>{rounds}</Text>
              <TouchableOpacity 
                onPress={() => setRounds(rounds + 1)} 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: t.surfaceContainerHigh }}
              >
                <Text className="text-2xl" style={{ color: t.primary }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {rounds > 1 && (
            <ControlRow label="Descanso entre rondas" min={restMinutes} sec={restSeconds} setMin={setRestMinutes} setSec={setRestSeconds} />
          )}

          <View 
            className="flex-row items-center justify-between p-5 rounded-2xl border" 
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>Sonido y vibración</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              accessibilityLabel="Sonido y vibración del temporizador"
              trackColor={{ false: t.surfaceContainerHighest, true: t.primaryContainer }}
              thumbColor={soundEnabled ? t.onPrimaryContainer : t.onSurfaceVariant}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View 
          className="absolute bottom-0 left-0 right-0 p-5 border-t" 
          style={{ backgroundColor: t.background, borderTopColor: t.surfaceContainerHighest }}
        >
          <TouchableOpacity
            className="h-16 rounded-xl items-center justify-center shadow-2xl"
            style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
            activeOpacity={0.8}
            onPress={startTimer}
          >
            <Text className="text-lg font-extrabold tracking-[2px]" style={{ color: t.onPrimaryContainer }}>Empezar  ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
