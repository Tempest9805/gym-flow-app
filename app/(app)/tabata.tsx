import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
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

  const ControlRow = ({ label, val, setVal, step = 5, min = 0 }: any) => (
    <View style={[styles.controlRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
      <Text style={[styles.controlLabel, { color: t.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.timeControls}>
        <TouchableOpacity onPress={() => setVal(Math.max(min, val - step))} style={styles.btn}>
          <Text style={[styles.btnText, { color: colors.accent }]}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.timeVal, { color: t.onSurface }]}>{val}</Text>
        <TouchableOpacity onPress={() => setVal(val + step)} style={styles.btn}>
          <Text style={[styles.btnText, { color: colors.accent }]}>+</Text>
        </TouchableOpacity>
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
            <Text style={[styles.title, { color: t.onSurface }]}>TABATA PROTOCOL</Text>
          </View>

          <View style={[styles.themeToggle, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
            <Text style={[styles.themeLabel, { color: t.onSurfaceVariant }]}>THEME</Text>
            <View style={styles.themeSwitches}>
              <TouchableOpacity
                style={[
                  styles.themePill,
                  { backgroundColor: tabataThemeId === 'purple' ? colors.prepare : 'transparent', borderColor: colors.prepare },
                ]}
                onPress={() => setTabataTheme('purple')}
              >
                <Text style={[styles.themePillText, { color: tabataThemeId === 'purple' ? '#000' : colors.prepare }]}>PURPLE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themePill,
                  { backgroundColor: tabataThemeId === 'orange' ? TABATA_THEMES.orange.prepare : 'transparent', borderColor: TABATA_THEMES.orange.prepare },
                ]}
                onPress={() => setTabataTheme('orange')}
              >
                <Text style={[styles.themePillText, { color: tabataThemeId === 'orange' ? '#000' : TABATA_THEMES.orange.prepare }]}>ORANGE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: `${colors.accent}11`, borderColor: `${colors.accent}33` }]}>
            <Text style={[styles.infoText, { color: colors.accent }]}>
              Classic Tabata is 8 rounds of 20 seconds work and 10 seconds rest. Total time: 4 minutes.
            </Text>
          </View>

          <ControlRow label="WORK INTERVAL (SEC)" val={workTime} setVal={setWorkTime} step={5} min={5} />
          <ControlRow label="REST INTERVAL (SEC)" val={restTime} setVal={setRestTime} step={5} min={0} />
          <ControlRow label="ROUNDS" val={rounds} setVal={setRounds} step={1} min={1} />
          <ControlRow label="PREP TIME (SEC)" val={prepTime} setVal={setPrepTime} step={5} min={0} />

          <View style={[styles.switchRow, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
            <Text style={[styles.controlLabel, { color: t.onSurfaceVariant }]}>SOUND CUES</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: t.surfaceContainerHigh, true: colors.accent }}
              thumbColor={soundEnabled ? '#fff' : '#ccc'}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: t.background, borderTopColor: t.surfaceContainerHighest }]}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
            activeOpacity={0.8}
            onPress={startTabata}
          >
            <Text style={[styles.ctaText, { color: '#000000' }]}>START TABATA  ◆</Text>
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
  header: { gap: 8, marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },

  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  themeSwitches: {
    flexDirection: 'row',
    gap: 12,
  },
  themePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    flex: 1,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 24, fontWeight: '400', lineHeight: 28 },
  timeVal: { fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'], width: 40, textAlign: 'center' },

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