import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';

export interface LockedExerciseRow {
  id: string;
  name: string;
  threshold: string;
}

export function RoutineGateSheet({
  visible,
  lockedExercises,
  isSaving,
  onSaveLocked,
  onViewTree,
  onClose,
}: {
  visible: boolean;
  lockedExercises: LockedExerciseRow[];
  isSaving: boolean;
  onSaveLocked: () => void;
  onViewTree: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          className="rounded-t-[20px] border-t p-6 pb-12 gap-3"
          style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceVariant }}
          onStartShouldSetResponder={() => true}
        >
          <Text className="text-[22px] font-bold text-white">{tr('gate.title')}</Text>
          <Text className="text-sm mb-1" style={{ color: t.onSurfaceVariant }}>
            {tr('gate.subtitle')}
          </Text>

          <ScrollView style={{ maxHeight: 220 }}>
            {lockedExercises.map((ex) => (
              <View
                key={ex.id}
                className="flex-row items-center justify-between py-2 border-b"
                style={{ borderColor: t.surfaceVariant }}
              >
                <Text className="text-base text-white flex-shrink pr-3">🔒 {ex.name}</Text>
                {ex.threshold ? (
                  <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>{ex.threshold}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            className="h-12 rounded-lg items-center justify-center mt-2"
            style={{ backgroundColor: t.primaryContainer, opacity: isSaving ? 0.6 : 1 }}
            disabled={isSaving}
            onPress={onSaveLocked}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
              {tr('gate.saveLocked')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-12 rounded-lg items-center justify-center border"
            style={{ borderColor: t.primaryContainer, opacity: isSaving ? 0.6 : 1 }}
            disabled={isSaving}
            onPress={onViewTree}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
              {tr('gate.viewTree')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="h-10 items-center justify-center" onPress={onClose}>
            <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>{tr('gate.keepEditing')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
