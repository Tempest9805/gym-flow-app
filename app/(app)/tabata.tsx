/**
 * tabata.tsx — Tabata Setup Screen
 * Redesigned per Stitch "Tabata Setup Simplified" export.
 * 3 sections: TIMING / STRUCTURE / OPTIONS
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTabataStore, type TabataConfig } from '@/lib/store/tabataStore';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatSetupTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return `:${seconds.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface SectionPillProps {
  label: string;
}

function SectionPill({ label }: SectionPillProps) {
  return (
    <View className="flex-row items-center gap-2 mb-4">
      <View
        className="flex-row items-center px-3 py-1 rounded-full"
        style={{ backgroundColor: '#2d1040' }}
      >
        <Text
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: '#b537f2' }}
        >
          {label}
        </Text>
      </View>
      <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
    </View>
  );
}

interface TimeRowProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  isHighlight?: boolean;
}

function TimeRow({ label, value, onDecrement, onIncrement, isHighlight }: TimeRowProps) {
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl"
      style={{
        backgroundColor: '#1c1c1e',
        borderWidth: 1,
        borderColor: isHighlight ? 'rgba(188,19,254,0.3)' : 'rgba(255,255,255,0.05)',
      }}
    >
      <Text className="text-lg" style={{ color: isHighlight ? '#bc13fe' : 'rgba(255,255,255,0.6)' }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-6">
        <TouchableOpacity
          onPress={onDecrement}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl font-bold text-white leading-none">−</Text>
        </TouchableOpacity>
        <Text
          className="text-3xl font-bold text-white w-16 text-center"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatSetupTime(value)}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl font-bold text-white leading-none">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CountRowProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

function CountRow({ label, value, onDecrement, onIncrement }: CountRowProps) {
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl"
      style={{
        backgroundColor: '#1c1c1e',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <Text className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-6">
        <TouchableOpacity
          onPress={onDecrement}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl font-bold text-white leading-none">−</Text>
        </TouchableOpacity>
        <Text
          className="text-3xl font-bold text-white w-16 text-center"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {value}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-2xl font-bold text-white leading-none">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function TabataSetupScreen() {
  const router = useRouter();
  const { config: savedConfig, setConfig, loadConfig } = useTabataStore();

  const [config, setLocalConfig] = useState<TabataConfig>(savedConfig);

  useEffect(() => {
    loadConfig().then(() => {
      setLocalConfig(useTabataStore.getState().config);
    });
  }, []);

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0A0A0A' }} edges={['top']}>
      <AppTopBar />
      <View className="flex-1 relative">
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View className="mb-8 mt-2">
            <Text
              className="font-black uppercase"
              style={{ fontSize: 48, color: 'white', lineHeight: 52 }}
            >
              TABATA
            </Text>
            <Text
              className="font-black uppercase"
              style={{ fontSize: 48, color: '#bc13fe', lineHeight: 52 }}
            >
              SETUP
            </Text>
          </View>

          {/* ── TIMING ── */}
          <SectionPill label="TIMING" />
          <View className="gap-3 mb-6">
            <TimeRow
              label="Preparation"
              value={config.prepSeconds}
              onDecrement={() => update('prepSeconds', clampTime(config.prepSeconds, -5, 0, 300))}
              onIncrement={() => update('prepSeconds', clampTime(config.prepSeconds, 5, 0, 300))}
            />
            <TimeRow
              label="Train"
              value={config.workSeconds}
              isHighlight
              onDecrement={() => update('workSeconds', clampTime(config.workSeconds, -5, 5, 300))}
              onIncrement={() => update('workSeconds', clampTime(config.workSeconds, 5, 5, 300))}
            />
            <TimeRow
              label="Rest"
              value={config.restSeconds}
              onDecrement={() => update('restSeconds', clampTime(config.restSeconds, -5, 0, 300))}
              onIncrement={() => update('restSeconds', clampTime(config.restSeconds, 5, 0, 300))}
            />
            <TimeRow
              label="Cooldown"
              value={config.cooldownSeconds}
              onDecrement={() => update('cooldownSeconds', clampTime(config.cooldownSeconds, -5, 0, 300))}
              onIncrement={() => update('cooldownSeconds', clampTime(config.cooldownSeconds, 5, 0, 300))}
            />
          </View>

          {/* ── STRUCTURE ── */}
          <SectionPill label="STRUCTURE" />
          <View className="gap-3 mb-6">
            <CountRow
              label="Rounds"
              value={config.rounds}
              onDecrement={() => update('rounds', Math.max(1, config.rounds - 1))}
              onIncrement={() => update('rounds', Math.min(20, config.rounds + 1))}
            />
            <CountRow
              label="Cycles"
              value={config.cycles}
              onDecrement={() => update('cycles', Math.max(1, config.cycles - 1))}
              onIncrement={() => update('cycles', Math.min(20, config.cycles + 1))}
            />
            <TimeRow
              label="Cycle Rest"
              value={config.cycleRestSeconds}
              onDecrement={() => update('cycleRestSeconds', clampTime(config.cycleRestSeconds, -5, 0, 300))}
              onIncrement={() => update('cycleRestSeconds', clampTime(config.cycleRestSeconds, 5, 0, 300))}
            />
          </View>

          {/* ── OPTIONS ── */}
          <SectionPill label="OPTIONS" />
          <View
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{
              backgroundColor: '#1c1c1e',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <Text className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Sound Effects
            </Text>
            <Switch
              value={config.soundEnabled}
              onValueChange={(val) => update('soundEnabled', val)}
              trackColor={{ false: '#3A3A3C', true: '#bc13fe' }}
              thumbColor="#ffffff"
            />
          </View>
        </ScrollView>

        {/* Sticky bottom button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <TouchableOpacity
            onPress={handleStart}
            className="w-full py-4 rounded-lg items-center"
            style={{
              backgroundColor: '#bc13fe',
              shadowColor: '#bc13fe',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 8,
            }}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-lg uppercase tracking-wider">
              SAVE CHANGES
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}