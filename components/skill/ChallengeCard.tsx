import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';
import type { Challenge, UserChallengeProgress } from '@/lib/api/schemas';

export function ChallengeCard({
  challenge,
  progress,
  language,
  onAttempt,
  onAchieve,
}: {
  challenge: Challenge;
  progress?: UserChallengeProgress;
  language: 'en' | 'es';
  onAttempt: () => void;
  onAchieve: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const status = progress?.status ?? 'locked';
  const readiness = Math.round(progress?.readiness ?? 0);
  const name = language === 'es' ? challenge.name_es : challenge.name_en;
  const ready = status === 'ready' || readiness >= 100;

  return (
    <View
      className="rounded-2xl border p-4 gap-3"
      style={{
        backgroundColor: t.surfaceContainer,
        borderColor: ready ? t.primaryContainer : t.surfaceContainerHighest,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white flex-shrink">{name}</Text>
        <Text className="text-[10px] font-bold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
          T{challenge.challenge_tier}
        </Text>
      </View>

      {status === 'achieved' ? (
        <View className="flex-row items-center gap-2">
          <Text style={{ color: t.primaryContainer }}>✓</Text>
          <Text className="text-sm font-bold" style={{ color: t.primaryContainer }}>{tr('tree.achieved')}</Text>
        </View>
      ) : (
        <>
          <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ width: `${readiness}%`, height: '100%', backgroundColor: t.primaryContainer }} />
          </View>
          {ready ? (
            status === 'attempted' ? (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: t.primaryContainer }}
                onPress={onAchieve}
              >
                <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
                  {tr('tree.iDidIt')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center border"
                style={{ borderColor: t.primaryContainer }}
                onPress={onAttempt}
              >
                <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
                  {tr('tree.tryChallenge')}
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <Text className="text-xs" style={{ color: t.onSurfaceVariant }}>
              {readiness}% {tr('tree.ready')}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
