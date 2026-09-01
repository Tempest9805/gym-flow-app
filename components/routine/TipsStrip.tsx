/**
 * "Indicaciones generales" — the footer strip of the printed sheet.
 *
 * Collapsed by default: it is reference material, not something you read
 * between sets. One tap opens it.
 */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TIPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'fire', title: 'Calentamiento', body: '5-10 minutos antes de entrenar' },
  { icon: 'check-decagram', title: 'Técnica primero', body: 'Prioriza la ejecución antes que el peso' },
  { icon: 'chart-bar', title: 'Progresión', body: 'Sube la carga poco a poco, semana a semana' },
  { icon: 'food-apple', title: 'Alimentación e hidratación', body: 'Tu alimentación es clave para los resultados' },
];

export function TipsStrip() {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: t.outlineVariant, backgroundColor: t.surfaceContainerLow }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Indicaciones generales"
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-center justify-between px-4"
        style={{ minHeight: 48 }}
      >
        <Text className="text-[12px] font-bold uppercase tracking-wider" style={{ color: t.onSurfaceVariant }}>
          Indicaciones generales
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={t.onSurfaceVariant}
        />
      </Pressable>

      {open && (
        <View className="px-4 pb-4 gap-3">
          {TIPS.map((tip) => (
            <View key={tip.title} className="flex-row items-start gap-3">
              <MaterialCommunityIcons name={tip.icon} size={20} color={t.primary} />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold" style={{ color: t.onSurface }}>
                  {tip.title}
                </Text>
                <Text className="text-[13px] leading-5" style={{ color: t.onSurfaceVariant }}>
                  {tip.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
