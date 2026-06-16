import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import {
  useTranslation,
  useCurrentProfile,
  useExercises,
  useProgressions,
  useSkillProgress,
  useChallenges,
  useChallengeProgress,
  useStreak,
} from '@/lib/hooks';
import { useMarkChallengeStatus } from '@/lib/hooks/useChallenges';
import { useSettingsStore } from '@/lib/store/settingsStore';
import {
  buildBranchSections,
  branchMasteredCounts,
  globalMasteredCount,
} from '@/lib/skills/treeView';
import { avatarStageFromLevel } from '@/lib/skills/avatar';
import { AvatarHud } from '@/components/skill/AvatarHud';
import { BranchLevelStrip } from '@/components/skill/BranchLevelStrip';
import { SkillNode } from '@/components/skill/SkillNode';
import { NodeSheet } from '@/components/skill/NodeSheet';
import { ChallengeCard } from '@/components/skill/ChallengeCard';

export default function TreeScreen() {
  const t = useTheme();
  const { t: tr, language } = useTranslation();
  const { data: profile } = useCurrentProfile();
  const userId = profile?.id;

  const { data: exercises = [] } = useExercises();
  const { data: progressions = [] } = useProgressions();
  const { data: skillProgress = [] } = useSkillProgress(userId);
  const { data: challenges = [] } = useChallenges();
  const { data: challengeProgress = [] } = useChallengeProgress(userId);
  const { data: streak } = useStreak(userId);
  const { avatarVariant } = useSettingsStore();
  const markChallenge = useMarkChallengeStatus(userId);

  const [sheetExerciseId, setSheetExerciseId] = useState<string | null>(null);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of exercises) m.set(e.id, (language === 'es' ? e.name_es : e.name_en) ?? e.name_en);
    return m;
  }, [exercises, language]);

  const sections = useMemo(
    () => buildBranchSections(progressions, skillProgress),
    [progressions, skillProgress],
  );
  const counts = useMemo(
    () => branchMasteredCounts(progressions, skillProgress),
    [progressions, skillProgress],
  );
  const stage = avatarStageFromLevel(globalMasteredCount(skillProgress));
  const progressByChallenge = useMemo(
    () => new Map(challengeProgress.map((p) => [p.challenge_id, p])),
    [challengeProgress],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          className="rounded-2xl border p-4"
          style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceContainerHighest }}
        >
          <View className="flex-row items-center gap-4">
            <AvatarHud variant={avatarVariant} stage={stage} />
            <View className="gap-0.5">
              <Text className="text-2xl font-extrabold text-white">{tr('tree.title')}</Text>
              <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>
                {tr('tree.streak')}: {streak?.current_streak ?? 0}
              </Text>
            </View>
          </View>
          <BranchLevelStrip counts={counts} />
        </View>

        {/* CTA */}
        <TouchableOpacity
          className="h-12 rounded-xl items-center justify-center mt-4"
          style={{ backgroundColor: t.primaryContainer }}
          activeOpacity={0.85}
          onPress={() => router.push('/index')}
        >
          <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
            {tr('tree.startToday')}
          </Text>
        </TouchableOpacity>

        {/* Serpentine branch sections */}
        {sections.map((section) => (
          <View key={section.path} className="mt-8">
            <Text
              className="text-lg font-bold uppercase tracking-widest mb-2 pl-2 border-l-2"
              style={{ color: t.onSurface, borderLeftColor: t.primaryContainer }}
            >
              {tr(`branch.${section.path}` as any)}
            </Text>
            <View
              className="rounded-2xl border px-3 py-2"
              style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceContainerHighest }}
            >
              {section.nodes.map((node, i) => (
                <SkillNode
                  key={node.exercise_id}
                  index={i}
                  status={node.status}
                  label={nameById.get(node.exercise_id) ?? '—'}
                  onPress={() => setSheetExerciseId(node.exercise_id)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Challenges */}
        <Text
          className="text-lg font-bold uppercase tracking-widest mb-3 mt-10 pl-2 border-l-2"
          style={{ color: t.onSurface, borderLeftColor: t.primaryContainer }}
        >
          {tr('tree.challenges')}
        </Text>
        <View className="gap-3">
          {challenges
            .slice()
            .sort((a, b) => a.challenge_tier - b.challenge_tier)
            .map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                progress={progressByChallenge.get(c.id)}
                language={language}
                onAttempt={() => markChallenge.mutate({ challengeId: c.id, status: 'attempted' })}
                onAchieve={() => markChallenge.mutate({ challengeId: c.id, status: 'achieved' })}
              />
            ))}
        </View>
      </ScrollView>

      <NodeSheet
        visible={sheetExerciseId !== null}
        onClose={() => setSheetExerciseId(null)}
        userId={userId}
        exerciseId={sheetExerciseId}
        title={sheetExerciseId ? (nameById.get(sheetExerciseId) ?? '') : ''}
      />
    </SafeAreaView>
  );
}
