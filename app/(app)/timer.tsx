import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
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

  const ControlRow = ({ label, min, sec, setMin, setSec }: any) => (
    <View style={[styles.controlRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
      <Text style={[styles.controlLabel, { color: t.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.timeControls}>
        <View style={styles.timeCol}>
          <TouchableOpacity onPress={() => setMin(Math.max(0, min - 1))} style={styles.btn}><Text style={[styles.btnText, { color: t.primaryContainer }]}>-</Text></TouchableOpacity>
          <Text style={[styles.timeVal, { color: t.onSurface }]}>{String(min).padStart(2, '0')}<Text style={styles.unit}>m</Text></Text>
          <TouchableOpacity onPress={() => setMin(min + 1)} style={styles.btn}><Text style={[styles.btnText, { color: t.primaryContainer }]}>+</Text></TouchableOpacity>
        </View>
        <Text style={[styles.colon, { color: t.outlineVariant }]}>:</Text>
        <View style={styles.timeCol}>
          <TouchableOpacity onPress={() => setSec(sec - 5 < 0 ? 55 : sec - 5)} style={styles.btn}><Text style={[styles.btnText, { color: t.primaryContainer }]}>-</Text></TouchableOpacity>
          <Text style={[styles.timeVal, { color: t.onSurface }]}>{String(sec).padStart(2, '0')}<Text style={styles.unit}>s</Text></Text>
          <TouchableOpacity onPress={() => setSec(sec + 5 > 59 ? 0 : sec + 5)} style={styles.btn}><Text style={[styles.btnText, { color: t.primaryContainer }]}>+</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.backText, { color: t.outlineVariant }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: t.onSurface }]}>TIMER SETUP</Text>
          </View>

          <ControlRow label="DURATION" min={workMinutes} sec={workSeconds} setMin={setWorkMinutes} setSec={setWorkSeconds} />
          
          <View style={[styles.controlRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
            <Text style={[styles.controlLabel, { color: t.onSurfaceVariant }]}>ROUNDS</Text>
            <View style={styles.timeControls}>
              <TouchableOpacity onPress={() => setRounds(Math.max(1, rounds - 1))} style={styles.btn}><Text style={[styles.btnText, { color: t.primaryContainer }]}>-</Text></TouchableOpacity>
              <Text style={[styles.timeVal, { color: t.onSurface, minWidth: 60, textAlign: 'center' }]}>{rounds}</Text>
              <TouchableOpacity onPress={() => setRounds(rounds + 1)} style={styles.btn}><Text style={[styles.btnText, { color: t.primaryContainer }]}>+</Text></TouchableOpacity>
            </View>
          </View>

          {rounds > 1 && (
            <ControlRow label="REST BETWEEN ROUNDS" min={restMinutes} sec={restSeconds} setMin={setRestMinutes} setSec={setRestSeconds} />
          )}

          <View style={[styles.switchRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
            <Text style={[styles.controlLabel, { color: t.onSurfaceVariant }]}>SOUND & VIBRATION</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: t.surfaceContainerHigh, true: t.primaryContainer }}
              thumbColor={soundEnabled ? '#fff' : '#ccc'}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: t.background, borderTopColor: t.surfaceContainerHighest }]}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }]}
            activeOpacity={0.8}
            onPress={startTimer}
          >
            <Text style={[styles.ctaText, { color: t.onPrimaryContainer }]}>START TIMER  ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, position: 'relative' },
  scroll: { padding: 20, gap: 16 },
  header: { gap: 8, marginBottom: 16 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  
  controlRow: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeCol: {
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 24, fontWeight: '400' },
  timeVal: { fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 16, fontWeight: '600', color: '#888' },
  colon: { fontSize: 32, fontWeight: '800', paddingBottom: 16 },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  cta: {
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
