/**
 * Copy or share the routine as text.
 *
 * People paste their sheet into a chat with an LLM to ask for changes, so the
 * output has to stand on its own: a markdown table plus a legend explaining
 * every column, with no app-specific shorthand. See lib/domain/export.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { dayToMarkdown, routineToMarkdown } from '@/lib/domain/export';
import type { Routine, RoutineDay } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';

export interface ShareSheetProps {
  visible: boolean;
  routine: Routine;
  day: RoutineDay;
  onClose: () => void;
}

type Scope = 'day' | 'routine';

export function ShareSheet({ visible, routine, day, onClose }: ShareSheetProps) {
  const t = useTheme();
  const [scope, setScope] = useState<Scope>('day');
  const [copied, setCopied] = useState(false);

  const text = scope === 'day' ? dayToMarkdown(routine, day) : routineToMarkdown(routine);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('No se pudo copiar', 'Inténtalo de nuevo.');
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: text });
    } catch {
      // The user dismissed the share sheet; nothing to report.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }}>
        <View className="flex-row items-center px-2 pt-2 pb-1 gap-1">
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="items-center justify-center"
            style={{ width: 44, minHeight: 44 }}
          >
            <MaterialCommunityIcons name="close" size={26} color={t.onSurface} />
          </Pressable>
          <Text className="text-[18px] font-extrabold flex-1" style={{ color: t.onSurface }}>
            Copiar o compartir
          </Text>
        </View>

        {/* Scope */}
        <View className="flex-row gap-2 px-4 pb-3">
          {(['day', 'routine'] as Scope[]).map((option) => {
            const isActive = scope === option;
            const label = option === 'day' ? day.label : 'Rutina completa';

            return (
              <Pressable
                key={option}
                onPress={() => setScope(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Exportar ${label}`}
                className="flex-1 rounded-xl border items-center justify-center"
                style={{
                  minHeight: 48,
                  borderColor: isActive ? t.primaryContainer : t.outlineVariant,
                  backgroundColor: isActive ? `${t.primaryContainer}22` : 'transparent',
                }}
              >
                <Text
                  className="text-[14px] font-bold"
                  style={{ color: isActive ? t.primaryContainer : t.onSurfaceVariant }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preview — what will actually be pasted */}
        <ScrollView
          className="flex-1 mx-4 rounded-xl border"
          style={{ borderColor: t.outlineVariant, backgroundColor: t.surfaceContainerLowest }}
          contentContainerStyle={{ padding: 12 }}
          horizontal={false}
        >
          <Text
            className="text-[11px]"
            style={{ color: t.onSurfaceVariant, fontFamily: 'monospace', lineHeight: 16 }}
          >
            {text}
          </Text>
        </ScrollView>

        <View className="flex-row gap-3 px-4 py-4">
          <Pressable
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel="Compartir"
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border"
            style={{ borderColor: t.outlineVariant, minHeight: 56 }}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={t.onSurfaceVariant} />
            <Text className="text-[15px] font-bold" style={{ color: t.onSurfaceVariant }}>
              Compartir
            </Text>
          </Pressable>

          <Pressable
            onPress={copy}
            accessibilityRole="button"
            accessibilityLabel="Copiar al portapapeles"
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl"
            style={{ backgroundColor: copied ? t.secondaryContainer : t.primaryContainer, minHeight: 56 }}
          >
            <MaterialCommunityIcons
              name={copied ? 'check' : 'content-copy'}
              size={20}
              color={t.onPrimaryContainer}
            />
            <Text className="text-[15px] font-bold" style={{ color: t.onPrimaryContainer }}>
              {copied ? 'Copiado' : 'Copiar'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
