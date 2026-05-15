import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useTabataThemeStore, TABATA_THEMES, TabataThemeId } from '@/lib/store/tabataThemeStore';

export default function TabataSetupScreen() {
  const t = useTheme();
  const router = useRouter();
  const { tabataThemeId, colors, loadTabataTheme, setTabataTheme } = useTabataThemeStore();

  const [workTime, setWorkTime] = useState(20);
  const [restTime, setRestTime] = useState(10);
  const [rounds, setRounds] = useState(8);
  const [prepTime, setPrepTime] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadTabataTheme();
  }, []);

  const toggleTabataTheme = () => {
    const newTheme: TabataThemeId = tabataThemeId === 'purple' ? 'orange' : 'purple';
    setTabataTheme(newTheme);
  };

  const startTabata = () => {
    router.push({
      pathname: '/tabata-active',
      params: { 
        work: workTime, 
        rest: restTime, 
        rounds, 
        prep: prepTime,
        sound: soundEnabled ? '1' : '0',
        theme: tabataThemeId,
      }
    });
  };

  const ControlRow = ({ label, val, setVal, step = 5, min = 0 }: { label: string, val: number, setVal: (v: number) => void, step?: number, min?: number }) => (
    <View 
      className="flex-row items-center justify-between p-5 rounded-2xl border" 
      style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
    >
      <Text className="flex-1 text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>{label}</Text>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity 
          onPress={() => setVal(Math.max(min, val - step))} 
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <Text className="text-2xl leading-[28px]" style={{ color: colors.accent }}>-</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold w-10 text-center" style={{ color: t.onSurface }}>{val}</Text>
        <TouchableOpacity 
          onPress={() => setVal(val + step)} 
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <Text className="text-2xl leading-[28px]" style={{ color: colors.accent }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <View className="flex-1 relative">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View className="gap-2 mb-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-base font-semibold" style={{ color: t.outlineVariant }}>← Back</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-extrabold tracking-tighter" style={{ color: t.onSurface }}>TABATA PROTOCOL</Text>
          </View>

          <View 
            className="flex-row items-center justify-between p-5 rounded-2xl border" 
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>THEME</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-full border-2"
                style={{ 
                  backgroundColor: tabataThemeId === 'purple' ? colors.prepare : 'transparent', 
                  borderColor: colors.prepare 
                }}
                onPress={() => setTabataTheme('purple')}
              >
                <Text 
                  className="text-[12px] font-bold tracking-widest" 
                  style={{ color: tabataThemeId === 'purple' ? '#000' : colors.prepare }}
                >
                  PURPLE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded-full border-2"
                style={{ 
                  backgroundColor: tabataThemeId === 'orange' ? TABATA_THEMES.orange.prepare : 'transparent', 
                  borderColor: TABATA_THEMES.orange.prepare 
                }}
                onPress={() => setTabataTheme('orange')}
              >
                <Text 
                  className="text-[12px] font-bold tracking-widest" 
                  style={{ color: tabataThemeId === 'orange' ? '#000' : TABATA_THEMES.orange.prepare }}
                >
                  ORANGE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View 
            className="p-4 rounded-xl border mb-2" 
            style={{ backgroundColor: `${colors.accent}11`, borderColor: `${colors.accent}33` }}
          >
            <Text className="text-sm font-semibold leading-5" style={{ color: colors.accent }}>
              Classic Tabata is 8 rounds of 20 seconds work and 10 seconds rest. Total time: 4 minutes.
            </Text>
          </View>

          <ControlRow label="WORK INTERVAL (SEC)" val={workTime} setVal={setWorkTime} step={5} min={5} />
          <ControlRow label="REST INTERVAL (SEC)" val={restTime} setVal={setRestTime} step={5} min={0} />
          <ControlRow label="ROUNDS" val={rounds} setVal={setRounds} step={1} min={1} />
          <ControlRow label="PREP TIME (SEC)" val={prepTime} setVal={setPrepTime} step={5} min={0} />

          <View 
            className="flex-row items-center justify-between p-5 rounded-2xl border" 
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>SOUND CUES</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: t.surfaceContainerHigh, true: colors.accent }}
              thumbColor={soundEnabled ? '#fff' : '#ccc'}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View 
          className="absolute bottom-0 left-0 right-0 p-5 border-t" 
          style={{ backgroundColor: t.background, borderTopColor: t.surfaceContainerHighest }}
        >
          <TouchableOpacity
            className="h-16 rounded-xl items-center justify-center shadow-2xl"
            style={{ backgroundColor: colors.accent, shadowColor: colors.accent }}
            activeOpacity={0.8}
            onPress={startTabata}
          >
            <Text className="text-lg font-extrabold tracking-[2px] text-black">START TABATA  ◆</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}