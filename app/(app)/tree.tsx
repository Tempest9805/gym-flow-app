import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';

export default function TreeScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-2 mb-8">
          <View
            className="flex-row items-center gap-2 border rounded-full px-3 py-1 self-start"
            style={{ backgroundColor: `${t.primaryContainer}22`, borderColor: `${t.primaryContainer}44` }}
          >
            <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.primaryContainer }}>
              {tr('tree.comingSoon')}
            </Text>
          </View>
          <Text className="text-[48px] font-extrabold tracking-tighter leading-[52px]" style={{ color: t.onSurface }}>
            {tr('tree.title')}
          </Text>
          <Text className="text-base leading-6" style={{ color: t.onSurfaceVariant }}>
            {tr('tree.subtitle')}
          </Text>
        </View>

        {/* Placeholder panel */}
        <View
          className="rounded-2xl border items-center justify-center"
          style={{
            backgroundColor: t.surfaceContainer,
            borderColor: t.surfaceContainerHighest,
            minHeight: 280,
          }}
        >
          <Text style={{ fontSize: 72, color: t.surfaceContainerHighest }}>◬</Text>
          <Text className="text-sm mt-3" style={{ color: t.onSurfaceVariant }}>
            {tr('tree.comingSoon')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
