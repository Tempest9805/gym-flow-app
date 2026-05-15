import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRouter } from 'expo-router';

export default function TimerSetupScreen() {
  const t = useTheme();
  const router = useRouter();

  const [workMinutes, setWorkMinutes] = useState(1);
  const [workSeconds, setWorkSeconds] = useState(0);
  const [rounds, setRounds] = useState(1);
  const [restMinutes, setRestMinutes] = useState(0);
  const [restSeconds, setRestSeconds] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const startTimer = () => {
    const workTime = workMinutes * 60 + workSeconds;
    const restTime = restMinutes * 60 + restSeconds;
    if (workTime === 0) return;

    router.push({
      pathname: '/timer-active',
      params: { 
        work: workTime, 
        rest: restTime, 
        rounds, 
        sound: soundEnabled ? '1' : '0' 
      }
    });
  };

  const ControlRow = ({ label, min, sec, setMin, setSec }: { label: string, min: number, sec: number, setMin: (v: number) => void, setSec: (v: number) => void }) => (
    <View 
      className="p-5 rounded-2xl border gap-4" 
      style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
    >
      <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>{label}</Text>
      <View className="flex-row items-center justify-center gap-4">
        <View className="items-center gap-2">
          <TouchableOpacity 
            onPress={() => setMin(Math.max(0, min - 1))} 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Text className="text-2xl" style={{ color: t.primaryContainer }}>-</Text>
          </TouchableOpacity>
          <Text className="text-[40px] font-extrabold" style={{ color: t.onSurface }}>
            {String(min).padStart(2, '0')}
            <Text className="text-base font-semibold" style={{ color: '#888' }}>m</Text>
          </Text>
          <TouchableOpacity 
            onPress={() => setMin(min + 1)} 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Text className="text-2xl" style={{ color: t.primaryContainer }}>+</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-[32px] font-extrabold pb-4" style={{ color: t.outlineVariant }}>:</Text>
        <View className="items-center gap-2">
          <TouchableOpacity 
            onPress={() => setSec(sec - 5 < 0 ? 55 : sec - 5)} 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Text className="text-2xl" style={{ color: t.primaryContainer }}>-</Text>
          </TouchableOpacity>
          <Text className="text-[40px] font-extrabold" style={{ color: t.onSurface }}>
            {String(sec).padStart(2, '0')}
            <Text className="text-base font-semibold" style={{ color: '#888' }}>s</Text>
          </Text>
          <TouchableOpacity 
            onPress={() => setSec(sec + 5 > 59 ? 0 : sec + 5)} 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <Text className="text-2xl" style={{ color: t.primaryContainer }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <View className="flex-1 relative">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View className="gap-2 mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-base font-semibold" style={{ color: t.outlineVariant }}>← Back</Text>
            </TouchableOpacity>
            <Text className="text-[32px] font-extrabold tracking-tighter" style={{ color: t.onSurface }}>TIMER SETUP</Text>
          </View>

          <ControlRow label="DURATION" min={workMinutes} sec={workSeconds} setMin={setWorkMinutes} setSec={setWorkSeconds} />
          
          <View 
            className="p-5 rounded-2xl border gap-4" 
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>ROUNDS</Text>
            <View className="flex-row items-center justify-center gap-4">
              <TouchableOpacity 
                onPress={() => setRounds(Math.max(1, rounds - 1))} 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Text className="text-2xl" style={{ color: t.primaryContainer }}>-</Text>
              </TouchableOpacity>
              <Text className="text-[40px] font-extrabold min-w-[60px] text-center" style={{ color: t.onSurface }}>{rounds}</Text>
              <TouchableOpacity 
                onPress={() => setRounds(rounds + 1)} 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Text className="text-2xl" style={{ color: t.primaryContainer }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {rounds > 1 && (
            <ControlRow label="REST BETWEEN ROUNDS" min={restMinutes} sec={restSeconds} setMin={setRestMinutes} setSec={setRestSeconds} />
          )}

          <View 
            className="flex-row items-center justify-between p-5 rounded-2xl border" 
            style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>SOUND & VIBRATION</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: t.surfaceContainerHigh, true: t.primaryContainer }}
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
            style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
            activeOpacity={0.8}
            onPress={startTimer}
          >
            <Text className="text-lg font-extrabold tracking-[2px]" style={{ color: t.onPrimaryContainer }}>START TIMER  ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
