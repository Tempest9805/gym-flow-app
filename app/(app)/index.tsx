/**
 * Home Screen — Implements Stitch `home_canonical_purple` layout exactly:
 *   1. TopAppBar (fixed)
 *   2. Greeting ("HELLO, ATHLETE")
 *   3. "Now" card (next scheduled workout + START WORKOUT CTA)
 *   4. Minimal stats bento (2-col grid)
 *   5. Agenda preview (next 2 days)
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RoutineWithExercises } from '@/types';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCurrentProfile, useWeekSchedule } from '@/lib/hooks';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: schedule, isLoading: scheduleLoading } = useWeekSchedule(profile?.id);

  const today = new Date();
  const todayIndex = today.getDay();
  const todaysEntry = schedule?.find((s) => s.day_of_week === todayIndex);
  // Cast to RoutineWithExercises — the API may return exercises joined
  const todaysRoutine = todaysEntry?.routine as RoutineWithExercises | undefined;

  // Next 2 upcoming days with routines
  const upcomingDays = schedule
    ?.filter((s) => s.day_of_week !== todayIndex && s.routine)
    .slice(0, 2) ?? [];

  const athleteName = profile?.full_name?.split(' ')[0]?.toUpperCase() || 'ATHLETE';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Greeting ── */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingMain, { color: t.onBackground }]}>
            HELLO,{'\n'}
            <Text style={[styles.greetingName, { color: t.outlineVariant }]}>
              {profileLoading ? '...' : athleteName}
            </Text>
          </Text>
        </View>

        {/* ── 2. "Now" card ── */}
        <View
          style={[
            styles.nowCard,
            {
              backgroundColor: t.surface,
              borderColor: t.surfaceContainerHighest,
            },
          ]}
        >
          {/* Card header */}
          <View style={styles.nowCardHeader}>
            <View style={styles.nowCardHeaderLeft}>
              <Text style={[styles.nowCardLabel, { color: t.onSurfaceVariant }]}>
                UP NEXT • {today.getHours()}:{String(today.getMinutes()).padStart(2, '0')}
              </Text>
              <Text style={[styles.nowCardTitle, { color: t.onBackground }]}>
                {todaysRoutine ? todaysRoutine.name.toUpperCase() : 'REST\nDAY'}
              </Text>
            </View>
            {todaysRoutine && (
              <View
                style={[
                  styles.nowCardBadge,
                  {
                    backgroundColor: `${t.primaryContainer}22`,
                    borderColor: `${t.primaryContainer}44`,
                  },
                ]}
              >
                <Text style={[styles.nowCardBadgeText, { color: t.primaryContainer }]}>
                  STRENGTH
                </Text>
              </View>
            )}
          </View>

          {/* Card stats */}
          {todaysRoutine && (
            <View style={styles.nowCardStats}>
              <View style={styles.nowCardStat}>
                <Text style={[styles.nowCardStatLabel, { color: t.outline }]}>MOVEMENTS</Text>
                <Text style={[styles.nowCardStatValue, { color: t.onBackground }]}>
                  {todaysRoutine.exercises?.length ?? '—'}
                </Text>
              </View>
              <View style={[styles.nowCardDivider, { backgroundColor: t.surfaceContainerHighest }]} />
              <View style={styles.nowCardStat}>
                <Text style={[styles.nowCardStatLabel, { color: t.outline }]}>DURATION</Text>
                <Text style={[styles.nowCardStatValue, { color: t.onBackground }]}>
                  {Math.max(30, ((todaysRoutine as RoutineWithExercises).exercises?.length ?? 4) * 8)}m
                </Text>
              </View>
            </View>
          )}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[
              styles.nowCardCTA,
              {
                backgroundColor: t.primaryContainer,
                shadowColor: t.primaryContainer,
              },
            ]}
            activeOpacity={0.85}
            onPress={() =>
              todaysRoutine
                ? router.push({ pathname: '/workout', params: { id: todaysRoutine.id } })
                : router.push('/exercises')
            }
          >
            <Text style={[styles.nowCardCTAText, { color: t.onPrimaryContainer }]}>
              {todaysRoutine ? '▶  START WORKOUT' : 'BROWSE EXERCISES'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Minimal stats bento ── */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: t.surface, borderColor: t.surfaceContainerHighest },
            ]}
          >
            <Text style={[styles.statCardLabel, { color: t.onSurfaceVariant }]}>⚡ Weekly Load</Text>
            <Text style={[styles.statCardValue, { color: t.onBackground }]}>
              {(schedule?.filter((s) => s.routine).length ?? 0)}
              <Text style={[styles.statCardUnit, { color: t.outlineVariant }]}> days</Text>
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: t.surface, borderColor: t.surfaceContainerHighest },
            ]}
          >
            <Text style={[styles.statCardLabel, { color: t.onSurfaceVariant }]}>♡ Recovery</Text>
            <Text style={[styles.statCardValue, { color: t.secondary }]}>
              {todaysRoutine ? '72' : '94'}
              <Text style={[styles.statCardUnit, { color: t.outlineVariant }]}>%</Text>
            </Text>
          </View>
        </View>

        {/* ── 4. Agenda preview ── */}
        <View style={styles.agendaSection}>
          <Text style={[styles.agendaSectionTitle, { color: t.onBackground }]}>Agenda</Text>
          {scheduleLoading ? (
            <ActivityIndicator color={t.primaryContainer} style={{ marginTop: 12 }} />
          ) : upcomingDays.length === 0 ? (
            <View
              style={[
                styles.agendaEmptyCard,
                { backgroundColor: t.surface },
              ]}
            >
              <Text style={[styles.agendaEmptyText, { color: t.onSurfaceVariant }]}>
                No upcoming workouts. Create a routine to get started.
              </Text>
              <TouchableOpacity
                style={[styles.agendaEmptyButton, { borderColor: t.surfaceContainerHighest }]}
                onPress={() => router.push('/routines')}
              >
                <Text style={[styles.agendaEmptyButtonText, { color: t.primaryContainer }]}>
                  CREATE ROUTINE
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingDays.map((entry) => {
              const d = new Date();
              const diff = ((entry.day_of_week - today.getDay()) + 7) % 7;
              d.setDate(d.getDate() + diff);
              return (
                <TouchableOpacity
                  key={entry.day_of_week}
                  style={[
                    styles.agendaItem,
                    { backgroundColor: t.surface },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/agenda')}
                >
                  <View style={[styles.agendaDateBadge, { backgroundColor: t.surfaceContainer }]}>
                    <Text style={[styles.agendaDateDay, { color: t.onSurfaceVariant }]}>
                      {DAY_NAMES[entry.day_of_week].toUpperCase()}
                    </Text>
                    <Text style={[styles.agendaDateNum, { color: t.onBackground }]}>
                      {d.getDate()}
                    </Text>
                  </View>
                  <View style={styles.agendaItemInfo}>
                    <Text style={[styles.agendaItemName, { color: t.onBackground }]}>
                      {entry.routine?.name?.toUpperCase()}
                    </Text>
                    <Text style={[styles.agendaItemMeta, { color: t.onSurfaceVariant }]}>
                      {Math.max(30, ((entry.routine as RoutineWithExercises)?.exercises?.length ?? 4) * 8)}m • Strength
                    </Text>
                  </View>
                  <Text style={[styles.agendaChevron, { color: t.outlineVariant }]}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
    paddingBottom: 120,
    paddingHorizontal: 20,
    gap: 32,
  },
  // Greeting
  greetingSection: {},
  greetingMain: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  greetingName: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  // Now card
  nowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    gap: 24,
  },
  nowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nowCardHeaderLeft: { gap: 8 },
  nowCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  nowCardTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  nowCardBadge: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nowCardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  nowCardStat: { gap: 2 },
  nowCardStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nowCardStatValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  nowCardDivider: { width: 1 },
  nowCardCTA: {
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  nowCardCTAText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Stats bento
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  statCardUnit: {
    fontSize: 20,
    fontWeight: '400',
  },
  // Agenda
  agendaSection: { gap: 16 },
  agendaSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  agendaItem: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  agendaDateBadge: {
    width: 48,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaDateDay: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  agendaDateNum: {
    fontSize: 16,
    fontWeight: '700',
  },
  agendaItemInfo: { flex: 1 },
  agendaItemName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  agendaItemMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  agendaChevron: {
    fontSize: 22,
  },
  agendaEmptyCard: {
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  agendaEmptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  agendaEmptyButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  agendaEmptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});