/**
 * Los controles que comparten las dos pantallas de ajuste de temporizador.
 *
 * Vivian dentro de `tabata.tsx`, y por eso el temporizador de intervalos habia
 * crecido con otro lenguaje: cabecera distinta, etiquetas distintas y los mas
 * y menos apilados en vez de en linea. Aqui son de los dos, y no vuelven a
 * separarse.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '@/lib/hooks/useTheme';

/** El rotulo de una seccion: una pastilla y una linea que llega hasta el borde. */
export function SectionPill({ label }: { label: string }) {
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

interface StepperRowProps {
  label: string;
  display: string;
  onDecrement: () => void;
  onIncrement: () => void;
  isHighlight?: boolean;
}

/** Una fila con etiqueta, valor y los dos botones de ajuste. */
export function StepperRow({
  label,
  display,
  onDecrement,
  onIncrement,
  isHighlight,
}: StepperRowProps) {
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
      <Text className="text-lg" style={{ color: isHighlight ? t.onSurface : t.onSurfaceVariant }}>
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
