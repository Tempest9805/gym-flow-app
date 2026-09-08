/**
 * Ajustes del tabata: tiempos, estructura y sonido.
 *
 * Pantalla de configuracion normal, asi que sigue al tema como las demas.
 * La que corre (tabata-active) es la inmersiva, y esa si es siempre oscura.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/hooks/useTheme';
import { useTabataStore, type TabataConfig } from '@/lib/store/tabataStore';

function formatSetupTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return `:${seconds.toString().padStart(2, '0')}`;
}

function SectionPill({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View className="flex-row items-center gap-2 mb-4">
      <View
        className="flex-row items-center px-3 py-1 rounded-full"
        style={{ backgroundColor: t.surfaceContainerHigh }}
      >
        <Text
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: t.onSurfaceVariant }}
        >
          {label}
        </Text>
      </View>
      <View className="flex-1 h-px" style={{ backgroundColor: t.outlineVariant }} />
    </View>
  );
}

interface StepperProps {
  label: string;
  display: string;
  onDecrement: () => void;
  onIncrement: () => void;
  isHighlight?: boolean;
}

/** Una fila con etiqueta, valor y los dos botones de ajuste. */
function StepperRow({ label, display, onDecrement, onIncrement, isHighlight }: StepperProps) {
  const t = useTheme();
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl"
      style={{
        backgroundColor: t.surfaceContainer,
        borderWidth: 1,
        borderColor: isHighlight ? t.primary : t.outlineVariant,
      }}
    >
      <Text
        className="text-lg"
        style={{ color: isHighlight ? t.onSurface : t.onSurfaceVariant }}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-6">
        <TouchableOpacity
          onPress={onDecrement}
          accessibilityRole="button"
          accessibilityLabel={`Bajar ${label}`}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: t.surfaceContainerHigh }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl font-bold leading-none" style={{ color: t.onSurface }}>
            −
          </Text>
        </TouchableOpacity>
        <Text
          className="text-3xl font-bold w-16 text-center"
          style={{ color: t.onSurface, fontVariant: ['tabular-nums'] }}
        >
          {display}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          accessibilityRole="button"
          accessibilityLabel={`Subir ${label}`}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: t.surfaceContainerHigh }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl font-bold leading-none" style={{ color: t.onSurface }}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabataSetupScreen() {
  const t = useTheme();
  const router = useRouter();
  const { config: savedConfig, setConfig, loadConfig } = useTabataStore();

  const [config, setLocalConfig] = useState<TabataConfig>(savedConfig);

  useEffect(() => {
    loadConfig().then(() => {
      setLocalConfig(useTabataStore.getState().config);
    });
  }, [loadConfig]);

  const update = <K extends keyof TabataConfig>(key: K, value: TabataConfig[K]) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const clampTime = (val: number, step: number, min: number, max: number) =>
    Math.min(max, Math.max(min, val + step));

  const handleStart = async () => {
    await setConfig(config);
    router.push('/tabata-active');
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
          Tabata
        </Text>
      </View>

      <View className="flex-1 relative">
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <SectionPill label="Tiempos" />
          <View className="gap-3 mb-6">
            <StepperRow
              label="Preparación"
              display={formatSetupTime(config.prepSeconds)}
              onDecrement={() => update('prepSeconds', clampTime(config.prepSeconds, -5, 0, 300))}
              onIncrement={() => update('prepSeconds', clampTime(config.prepSeconds, 5, 0, 300))}
            />
            <StepperRow
              label="Trabajo"
              display={formatSetupTime(config.workSeconds)}
              isHighlight
              onDecrement={() => update('workSeconds', clampTime(config.workSeconds, -5, 5, 300))}
              onIncrement={() => update('workSeconds', clampTime(config.workSeconds, 5, 5, 300))}
            />
            <StepperRow
              label="Descanso"
              display={formatSetupTime(config.restSeconds)}
              onDecrement={() => update('restSeconds', clampTime(config.restSeconds, -5, 0, 300))}
              onIncrement={() => update('restSeconds', clampTime(config.restSeconds, 5, 0, 300))}
            />
            <StepperRow
              label="Enfriamiento"
              display={formatSetupTime(config.cooldownSeconds)}
              onDecrement={() =>
                update('cooldownSeconds', clampTime(config.cooldownSeconds, -5, 0, 300))
              }
              onIncrement={() =>
                update('cooldownSeconds', clampTime(config.cooldownSeconds, 5, 0, 300))
              }
            />
          </View>

          <SectionPill label="Estructura" />
          <View className="gap-3 mb-6">
            <StepperRow
              label="Rondas"
              display={String(config.rounds)}
              onDecrement={() => update('rounds', Math.max(1, config.rounds - 1))}
              onIncrement={() => update('rounds', Math.min(20, config.rounds + 1))}
            />
            <StepperRow
              label="Ciclos"
              display={String(config.cycles)}
              onDecrement={() => update('cycles', Math.max(1, config.cycles - 1))}
              onIncrement={() => update('cycles', Math.min(20, config.cycles + 1))}
            />
            <StepperRow
              label="Descanso entre ciclos"
              display={formatSetupTime(config.cycleRestSeconds)}
              onDecrement={() =>
                update('cycleRestSeconds', clampTime(config.cycleRestSeconds, -5, 0, 300))
              }
              onIncrement={() =>
                update('cycleRestSeconds', clampTime(config.cycleRestSeconds, 5, 0, 300))
              }
            />
          </View>

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
              Sonido
            </Text>
            <Switch
              value={config.soundEnabled}
              onValueChange={(val) => update('soundEnabled', val)}
              accessibilityLabel="Sonido del tabata"
              trackColor={{ false: t.surfaceContainerHighest, true: t.primaryContainer }}
              thumbColor={config.soundEnabled ? t.onPrimaryContainer : t.onSurfaceVariant}
            />
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4"
          style={{ backgroundColor: t.background }}
        >
          <TouchableOpacity
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Empezar el tabata"
            className="w-full py-4 rounded-2xl items-center"
            style={{ backgroundColor: t.primaryContainer, minHeight: 56 }}
            activeOpacity={0.85}
          >
            {/* El texto va en onPrimaryContainer, no en blanco fijo: sobre un
                relleno claro, blanco sobre blanco es 1:1. */}
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
