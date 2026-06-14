import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';
import type { TranslationKey } from '@/lib/hooks/useTranslation';
import { BRANCH_ORDER, type Branch } from '@/lib/skills/treeView';

const ICONS: Record<Branch, string> = {
  push: '⌃',
  pull: '⌄',
  core: '◆',
  legs: '⏚',
  skill: '✦',
};

export function BranchLevelStrip({ counts }: { counts: Record<Branch, number> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View className="flex-row justify-between mt-4">
      {BRANCH_ORDER.map((b) => (
        <View key={b} className="items-center gap-1 flex-1">
          <Text className="text-lg" style={{ color: t.primaryContainer }}>{ICONS[b]}</Text>
          <Text className="text-[10px] uppercase tracking-wide" style={{ color: t.onSurfaceVariant }}>
            {tr(`branch.${b}` as TranslationKey)}
          </Text>
          <Text className="text-sm font-bold text-white">{counts[b]}</Text>
        </View>
      ))}
    </View>
  );
}
