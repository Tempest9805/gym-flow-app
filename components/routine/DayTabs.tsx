/**
 * Day selector — one tap to switch training day.
 *
 * The sheet's days are cyclic ("Día 1..N", 3 to 7 of them), not weekdays, so
 * this is a horizontal strip rather than a calendar. Up to four fit without
 * scrolling on a phone; beyond that the strip scrolls, which is still one
 * gesture and far less than scrolling past a whole day of exercises.
 */
import React, { useEffect, useRef } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { dayProgress, isDayComplete } from '@/lib/domain/day';
import type { RoutineDay } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface DayTabsProps {
  days: RoutineDay[];
  activeDayId: string | null;
  onSelect: (dayId: string) => void;
}

export function DayTabs({ days, activeDayId, onSelect }: DayTabsProps) {
  const t = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const activeIndex = days.findIndex((day) => day.id === activeDayId);

  // Keep the selected day in view when it changes from outside a tap.
  useEffect(() => {
    if (activeIndex > 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex - 1) * 116, animated: true });
    }
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="grow-0"
    >
      {days.map((day) => {
        const isActive = day.id === activeDayId;
        const { done, total } = dayProgress(day);
        const complete = isDayComplete(day);

        return (
          <Pressable
            key={day.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${day.label}, ${day.focus}, ${done} de ${total} hechos`}
            onPress={() => onSelect(day.id)}
            className="rounded-2xl border px-4 py-3 min-w-[104px]"
            style={{
              backgroundColor: isActive ? `${t.primaryContainer}22` : t.surfaceContainerLow,
              borderColor: isActive ? t.primary : t.outlineVariant,
            }}
          >
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name={day.icon as IconName}
                size={18}
                color={isActive ? t.primary : t.onSurfaceVariant}
              />
              <Text
                className="text-[13px] font-bold"
                style={{ color: isActive ? t.onSurface : t.onSurfaceVariant }}
              >
                {day.label}
              </Text>
              {complete && (
                <MaterialCommunityIcons name="check-circle" size={14} color={t.primary} />
              )}
            </View>

            <Text
              className="text-[12px] mt-0.5"
              style={{ color: isActive ? t.onSurfaceVariant : t.outline }}
              numberOfLines={1}
            >
              {day.focus}
            </Text>

            <Text className="text-[11px] font-semibold mt-1" style={{ color: t.outline }}>
              {done}/{total}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
