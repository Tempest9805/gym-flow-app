/**
 * Ajustes del temporizador de intervalos: duracion, rondas y sonido.
 *
 * Habla el mismo idioma que el ajuste del tabata —cabecera con chevron,
 * pastillas de seccion, filas de `StepperRow`, boton EMPEZAR abajo— porque son
 * la misma clase de pantalla y antes no lo parecian: esta llevaba «← Volver»
 * en texto, el titulo en su propia linea y los mas y menos apilados.
 *
 * Lo que NO se unifica es el control de la duracion: minutos y segundos por
 * separado. Un `StepperRow` mueve un solo valor, y aqui hacen falta los dos —
 * poner cinco minutos a saltos de cinco segundos son sesenta toques.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { SectionPill, StepperRow } from '@/components/timers/SetupControls';
import { useTheme } from '@/lib/hooks/useTheme';

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
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text className="text-2xl font-bold leading-none" style={{ color: t.onSurface }}>
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
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text className="text-2xl font-bold leading-none" style={{ color: t.onSurface }}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

interface TimeCardProps {
  label: string;
  min: number;
  sec: number;
  setMin: (v: number) => void;
  setSec: (v: number) => void;
}

/**
 * Minutos y segundos, en la misma caja que usan las filas de ajuste.
 *
 * Vive aqui fuera y no dentro de la pantalla: definida dentro, React ve un
 * componente nuevo en cada render y desmonta y vuelve a montar todo el subarbol.
 */
function TimeCard({ label, min, sec, setMin, setSec }: TimeCardProps) {
  const t = useTheme();
  return (
    <View
      className="p-4 rounded-2xl gap-3"
      style={{
        backgroundColor: t.surfaceContainer,
        borderWidth: 1,
        borderColor: t.outlineVariant,
      }}
    >
      <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>
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
}

export default function TimerSetupScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        sound: soundEnabled ? '1' : '0',
      },
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="flex-row items-center gap-1 px-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="items-center justify-center"
          style={{ width: 44, minHeight: 44 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={t.onSurface} />
        </Pressable>
        <Text className="text-[18px] font-extrabold" style={{ color: t.onSurface }}>
          Temporizador de intervalos
        </Text>
      </View>

      <View className="flex-1 relative">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          <SectionPill label="Tiempos" />
          <TimeCard
            label="Duración"
            min={workMinutes}
            sec={workSeconds}
            setMin={setWorkMinutes}
            setSec={setWorkSeconds}
          />

          <View className="h-6" />
          <SectionPill label="Estructura" />
          <StepperRow
            label="Rondas"
            display={String(rounds)}
            onDecrement={() => setRounds(Math.max(1, rounds - 1))}
            onIncrement={() => setRounds(rounds + 1)}
          />

          {rounds > 1 && (
            <>
              <View className="h-4" />
              <TimeCard
                label="Descanso entre rondas"
                min={restMinutes}
                sec={restSeconds}
                setMin={setRestMinutes}
                setSec={setRestSeconds}
              />
            </>
          )}

          <View className="h-6" />
          <SectionPill label="Opciones" />
          <View
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{
              backgroundColor: t.surfaceContainer,
              borderWidth: 1,
              borderColor: t.outlineVariant,
            }}
          >
            <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>
              Sonido y vibración
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              accessibilityLabel="Sonido y vibración del temporizador"
              trackColor={{ false: t.surfaceContainerHighest, true: t.primaryContainer }}
              thumbColor={soundEnabled ? t.onPrimaryContainer : t.onSurfaceVariant}
            />
          </View>
        </ScrollView>

        {/* El relleno de abajo sale del inset real: con gestos son ~24dp y con
            los tres botones ~48, y un numero a ojo deja el boton intocable. */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pt-4"
          style={{ backgroundColor: t.background, paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <TouchableOpacity
            onPress={startTimer}
            accessibilityRole="button"
            accessibilityLabel="Empezar el temporizador"
            className="w-full py-4 rounded-2xl items-center"
            style={{ backgroundColor: t.primaryContainer, minHeight: 56 }}
            activeOpacity={0.85}
          >
            <Text
              className="font-bold text-lg uppercase tracking-wider"
              style={{ color: t.onPrimaryContainer }}
            >
              Empezar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
