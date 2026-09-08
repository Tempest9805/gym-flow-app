/**
 * Pick an exercise to add to the day.
 *
 * Search the local library, or type a name that is not in it — a coach's
 * sheet always has something the library never heard of, and being unable to
 * write it down would be worse than a missing description.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Exercise } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';

export interface ExercisePickerProps {
  visible: boolean;
  exercises: Exercise[];
  onCancel: () => void;
  /** `exercise` is null when the user typed a name the library does not have. */
  onPick: (exercise: Exercise | null, name: string) => void;
}

function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function ExercisePicker({ visible, exercises, onCancel, onPick }: ExercisePickerProps) {
  const t = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = fold(query.trim());
    if (needle === '') return exercises.slice(0, 60);
    return exercises
      .filter(
        (e) =>
          fold(e.nameEs).includes(needle) ||
          fold(e.nameEn ?? '').includes(needle) ||
          fold(e.muscleGroup).includes(needle),
      )
      .slice(0, 60);
  }, [exercises, query]);

  const typed = query.trim();
  const hasExactMatch = results.some((e) => fold(e.nameEs) === fold(typed));

  const close = () => {
    setQuery('');
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }}>
        <View className="flex-row items-center px-2 pt-2 pb-1 gap-1">
          <Pressable
            onPress={close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="items-center justify-center"
            style={{ width: 44, minHeight: 44 }}
          >
            <MaterialCommunityIcons name="close" size={26} color={t.onSurface} />
          </Pressable>
          <Text className="text-[18px] font-extrabold flex-1" style={{ color: t.onSurface }}>
            Añadir ejercicio
          </Text>
        </View>

        <View className="px-4 pb-3">
          <View
            className="flex-row items-center rounded-xl border px-3 gap-2"
            style={{ borderColor: t.outlineVariant, backgroundColor: t.surfaceContainerLow, minHeight: 52 }}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={t.onSurfaceVariant} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="Buscar o escribir un nombre"
              placeholderTextColor={t.outline}
              className="flex-1 text-base"
              style={{ color: t.onSurface }}
              accessibilityLabel="Buscar ejercicio"
            />
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
          ListHeaderComponent={
            typed !== '' && !hasExactMatch ? (
              <Pressable
                onPress={() => {
                  onPick(null, typed);
                  setQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Añadir ${typed} como ejercicio nuevo`}
                className="flex-row items-center gap-3 rounded-xl border px-4 mb-2"
                style={{
                  borderColor: t.primary,
                  backgroundColor: `${t.primaryContainer}18`,
                  minHeight: 60,
                }}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={24} color={t.primary} />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold" style={{ color: t.onSurface }} numberOfLines={1}>
                    Añadir «{typed}»
                  </Text>
                  <Text className="text-[12px]" style={{ color: t.onSurfaceVariant }}>
                    No está en la biblioteca, se añade solo a esta rutina
                  </Text>
                </View>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            typed === '' ? null : (
              <Text className="text-center mt-6" style={{ color: t.onSurfaceVariant }}>
                Nada en la biblioteca coincide.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onPick(item, item.nameEs);
                setQuery('');
              }}
              accessibilityRole="button"
              accessibilityLabel={`Añadir ${item.nameEs}`}
              className="flex-row items-center gap-3 rounded-xl border px-4"
              style={{ borderColor: t.outlineVariant, backgroundColor: t.surfaceContainerLow, minHeight: 60 }}
            >
              <View className="flex-1">
                <Text className="text-[15px] font-semibold" style={{ color: t.onSurface }} numberOfLines={1}>
                  {item.nameEs}
                </Text>
                <Text className="text-[12px]" style={{ color: t.onSurfaceVariant }} numberOfLines={1}>
                  {item.muscleGroup}
                </Text>
              </View>
              <MaterialCommunityIcons name="plus" size={22} color={t.primary} />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
