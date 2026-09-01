/**
 * Ajustes — theme, language, timers, and a way back to the seeded data.
 * No account, no profile: there is nobody to log in as.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/hooks/useTheme';
import { useThemeStore } from '@/lib/store/themeStore';
import { useLanguageStore } from '@/lib/store/languageStore';
import { useRoutineStore } from '@/lib/store/routineStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function Row({
  icon,
  title,
  value,
  onPress,
  destructive,
}: {
  icon: IconName;
  title: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const t = useTheme();
  const tint = destructive ? t.error : t.onSurface;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="flex-row items-center gap-3 px-4 border-b"
      style={{ borderBottomColor: t.outlineVariant, minHeight: 60 }}
    >
      <MaterialCommunityIcons name={icon} size={22} color={destructive ? t.error : t.primary} />
      <View className="flex-1">
        <Text className="text-[16px] font-medium" style={{ color: tint }}>
          {title}
        </Text>
        {value !== undefined && (
          <Text className="text-[13px]" style={{ color: t.onSurfaceVariant }}>
            {value}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={t.outline} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const t = useTheme();
  const router = useRouter();

  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const resetEverything = useRoutineStore((s) => s.resetEverything);
  const routineCount = useRoutineStore((s) => s.routines.length);
  const exerciseCount = useRoutineStore((s) => s.exercises.length);

  const confirmReset = () => {
    Alert.alert(
      'Restaurar datos',
      'Se borrarán tus rutinas y ediciones, y se volverá a la rutina y biblioteca originales. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: () => void resetEverything() },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>
          Ajustes
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="border-t" style={{ borderTopColor: t.outlineVariant }}>
          <Row
            icon="palette-outline"
            title="Tema"
            value={theme.label}
            onPress={() => setTheme(theme.id === 'purple' ? 'orange' : 'purple')}
          />
          <Row
            icon="translate"
            title="Idioma"
            value={language === 'es' ? 'Español' : 'English'}
            onPress={() => setLanguage(language === 'es' ? 'en' : 'es')}
          />
          <Row icon="timer-outline" title="Tabata" onPress={() => router.push('/tabata')} />
          <Row icon="av-timer" title="Temporizador de intervalos" onPress={() => router.push('/timer')} />
          <Row
            icon="restore"
            title="Restaurar datos originales"
            value={`${routineCount} rutinas · ${exerciseCount} ejercicios`}
            onPress={confirmReset}
            destructive
          />
        </View>

        <Text className="px-4 pt-6 text-[12px] leading-5" style={{ color: t.outline }}>
          Todos los datos se guardan solo en este dispositivo. No hay cuenta, ni servidor, ni
          sincronización.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
