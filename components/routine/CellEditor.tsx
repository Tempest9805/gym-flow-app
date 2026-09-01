/**
 * Single-field editor.
 *
 * Tapping a cell opens this and nothing else — no form, no save/cancel
 * ceremony beyond one button. It closes on save, and the keyboard is already
 * up when it appears.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';

import { formatDuration, parseDuration } from '@/lib/domain/time';
import { useTheme } from '@/lib/hooks/useTheme';
import type { EditableField } from './RoutineTable';

export interface CellEditorProps {
  visible: boolean;
  field: EditableField | null;
  /** Current value, already formatted the way the table shows it. */
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
}

const LABELS: Record<EditableField, { title: string; hint: string }> = {
  name: { title: 'Ejercicio', hint: 'Nombre tal y como quieres verlo en la tabla' },
  sets: { title: 'Series', hint: 'Cuántas veces repites el ejercicio' },
  reps: { title: 'Repeticiones', hint: 'Un número (12), un rango (6-8), «fallo» o un tiempo (1 min)' },
  rest: { title: 'Descanso', hint: 'Minutos:segundos entre series, por ejemplo 2:00' },
};

/** Suggestions that cover almost every row on a real sheet. */
const QUICK: Partial<Record<EditableField, string[]>> = {
  sets: ['2', '3', '4', '5'],
  reps: ['6-8', '8-10', '10-12', '12', '15', 'fallo'],
  rest: ['1:00', '1:30', '2:00', '3:00'],
};

export function CellEditor({ visible, field, initialValue, onCancel, onSave }: CellEditorProps) {
  const t = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const error = useMemo(() => validate(field, value), [field, value]);

  if (!field) return null;
  const { title, hint } = LABELS[field];
  const quick = QUICK[field];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            className="rounded-t-3xl border-t px-5 pt-5 pb-10 gap-4"
            style={{ backgroundColor: t.surfaceContainerLow, borderTopColor: t.outlineVariant }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="gap-1">
              <Text className="text-[20px] font-extrabold" style={{ color: t.onSurface }}>
                {title}
              </Text>
              <Text className="text-[13px]" style={{ color: t.onSurfaceVariant }}>
                {hint}
              </Text>
            </View>

            <TextInput
              value={value}
              onChangeText={setValue}
              autoFocus
              selectTextOnFocus
              keyboardType={field === 'sets' ? 'number-pad' : 'default'}
              className="rounded-xl border px-4 text-[18px]"
              style={{
                color: t.onSurface,
                borderColor: error ? t.error : t.outlineVariant,
                backgroundColor: t.surfaceContainerHigh,
                minHeight: 56,
              }}
              accessibilityLabel={title}
              onSubmitEditing={() => !error && onSave(value.trim())}
              returnKeyType="done"
            />

            {error && (
              <Text className="text-[13px]" style={{ color: t.error }}>
                {error}
              </Text>
            )}

            {quick && (
              <View className="flex-row flex-wrap gap-2">
                {quick.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setValue(option)}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar ${option}`}
                    className="rounded-lg border px-4 justify-center"
                    style={{
                      minHeight: 44,
                      borderColor: value === option ? t.primaryContainer : t.outlineVariant,
                      backgroundColor: value === option ? `${t.primaryContainer}22` : t.surfaceContainerHigh,
                    }}
                  >
                    <Text className="text-[15px] font-semibold" style={{ color: t.onSurface }}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                className="flex-1 rounded-xl border items-center justify-center"
                style={{ borderColor: t.outlineVariant, minHeight: 52 }}
              >
                <Text className="font-bold" style={{ color: t.onSurfaceVariant }}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={() => !error && onSave(value.trim())}
                disabled={!!error}
                accessibilityRole="button"
                className="flex-1 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: error ? t.surfaceContainerHighest : t.primaryContainer,
                  minHeight: 52,
                }}
              >
                <Text className="font-bold" style={{ color: error ? t.outline : t.onPrimaryContainer }}>
                  Guardar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/** Null when the value is acceptable, otherwise the reason it is not. */
function validate(field: EditableField | null, value: string): string | null {
  const text = value.trim();

  switch (field) {
    case 'name':
      return text === '' ? 'El nombre no puede quedar vacío.' : null;
    case 'sets': {
      if (!/^\d+$/.test(text)) return 'Escribe un número entero de series.';
      return Number(text) < 1 ? 'Tiene que haber al menos 1 serie.' : null;
    }
    case 'reps':
      return text === '' ? 'Escribe las repeticiones.' : null;
    case 'rest': {
      const seconds = parseDuration(text);
      if (seconds === null) return `Usa minutos:segundos, por ejemplo ${formatDuration(120)}.`;
      return seconds > 60 * 60 ? 'Un descanso de más de una hora no parece intencionado.' : null;
    }
    default:
      return null;
  }
}
