import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/hooks/useTheme';
import { useTranslation } from '@/lib/hooks';
import { useLogSet } from '@/lib/hooks/useWorkoutLogs';

export function NodeSheet({
  visible,
  onClose,
  userId,
  exerciseId,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  exerciseId: string | null;
  title: string;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const logSet = useLogSet(userId);
  const [reps, setReps] = useState('');
  const [seconds, setSeconds] = useState('');

  const save = () => {
    if (!exerciseId) return;
    const r = reps.trim() ? parseInt(reps, 10) : null;
    const s = seconds.trim() ? parseInt(seconds, 10) : null;
    if (r === null && s === null) return;
    logSet.mutate(
      { exercise_id: exerciseId, reps: Number.isNaN(r as number) ? null : r, seconds: Number.isNaN(s as number) ? null : s },
      {
        onSuccess: () => {
          setReps('');
          setSeconds('');
          onClose();
        },
      },
    );
  };

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
          <Text className="text-[22px] font-bold mb-1 text-white">{title}</Text>
          <Text className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {tr('tree.logSet')}
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-xs uppercase tracking-wide" style={{ color: t.onSurfaceVariant }}>{tr('tree.reps')}</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={t.onSurfaceVariant}
                className="rounded-xl px-4 py-3 text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xs uppercase tracking-wide" style={{ color: t.onSurfaceVariant }}>{tr('tree.seconds')}</Text>
              <TextInput
                value={seconds}
                onChangeText={setSeconds}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={t.onSurfaceVariant}
                className="rounded-xl px-4 py-3 text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            </View>
          </View>

          <TouchableOpacity
            className="h-12 rounded-lg items-center justify-center mt-2"
            style={{ backgroundColor: t.primaryContainer, opacity: logSet.isPending ? 0.6 : 1 }}
            disabled={logSet.isPending}
            onPress={save}
          >
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: t.surfaceContainerLowest }}>
              {tr('tree.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
