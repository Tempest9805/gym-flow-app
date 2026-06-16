import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import type { NodeStatus } from '@/lib/api/schemas';

const ALIGN = ['flex-start', 'center', 'flex-end'] as const;

export function SkillNode({
  label,
  status,
  index,
  onPress,
}: {
  label: string;
  status: NodeStatus;
  index: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const filled = status === 'mastered';
  const active = status === 'available' || status === 'in_progress';
  const locked = status === 'locked';

  const bg = filled ? t.primaryContainer : t.surfaceContainer;
  const border = locked ? t.surfaceContainerHighest : t.primaryContainer;

  return (
    <View style={{ alignSelf: ALIGN[index % 3], maxWidth: '70%' }} className="my-2">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="flex-row items-center gap-3"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View
          className="w-11 h-11 rounded-full border-2 items-center justify-center"
          style={{ backgroundColor: bg, borderColor: border, opacity: locked ? 0.55 : 1 }}
        >
          <Text style={{ color: filled ? t.surfaceContainerLowest : border, fontSize: 16 }}>
            {locked ? '🔒' : active ? '◆' : '✓'}
          </Text>
        </View>
        <Text
          className="text-sm flex-shrink"
          style={{ color: locked ? t.onSurfaceVariant : 'white', opacity: locked ? 0.7 : 1 }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
