/**
 * The training sheet, as a table.
 *
 * Built by hand rather than with a table library: React Native's table
 * packages are unmaintained (react-native-table-component's last release was
 * 2022 and its README says so), and none of them do inline editing or
 * swipe-to-delete, which is most of what this screen is.
 *
 * Layout rule: numeric columns have fixed widths and the exercise name takes
 * the rest, wrapping to two lines. Nothing ever scrolls sideways — on a
 * tablet the columns simply get roomier.
 */
import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatDuration } from '@/lib/domain/time';
import type { RoutineRow } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';

/** Which cell an edit request came from. */
export type EditableField = 'name' | 'sets' | 'reps' | 'rest';

export interface RoutineTableProps {
  rows: RoutineRow[];
  /** Seconds left on the running rest timer, keyed by row id. */
  restRemaining?: Record<string, number>;
  onToggle: (rowId: string) => void;
  onOpenVideo: (row: RoutineRow) => void;
  onEdit?: (rowId: string, field: EditableField) => void;
  onOpenTimer?: (row: RoutineRow) => void;
  /** In edit mode the checkbox column becomes reorder + delete controls. */
  editing?: boolean;
  onRemove?: (rowId: string) => void;
  onMove?: (rowId: string, delta: number) => void;
  /** Tapping the Rest cell of a running countdown stops it. */
  onCancelRest?: (rowId: string) => void;
}

/** Column widths in points. `name` is whatever is left over. */
function useColumns() {
  const { width } = useWindowDimensions();
  const roomy = width >= 768;
  return {
    roomy,
    play: roomy ? 44 : 32,
    sets: roomy ? 72 : 42,
    reps: roomy ? 96 : 56,
    rest: roomy ? 96 : 58,
    check: roomy ? 56 : 40,
    fontSize: roomy ? 16 : 14,
  };
}

function HeaderCell({ label, width, color }: { label: string; width?: number; color: string }) {
  return (
    <Text
      className="text-[10px] font-bold uppercase tracking-wider text-center"
      style={{ color, width }}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

export function RoutineTable({
  rows,
  restRemaining,
  onToggle,
  onOpenVideo,
  onEdit,
  onOpenTimer,
  editing = false,
  onRemove,
  onMove,
  onCancelRest,
}: RoutineTableProps) {
  const t = useTheme();
  const col = useColumns();

  return (
    <View className="rounded-2xl overflow-hidden border" style={{ borderColor: t.outlineVariant }}>
      {/* Header */}
      <View
        className="flex-row items-center px-2 py-2.5 gap-1"
        style={{ backgroundColor: t.primaryContainer }}
      >
        <HeaderCell label="▶" width={col.play} color={t.onPrimaryContainer} />
        <View className="flex-1">
          <HeaderCell label="Ejercicio" color={t.onPrimaryContainer} />
        </View>
        <HeaderCell label="Series" width={col.sets} color={t.onPrimaryContainer} />
        <HeaderCell label="Reps" width={col.reps} color={t.onPrimaryContainer} />
        <HeaderCell label="Rest" width={col.rest} color={t.onPrimaryContainer} />
        <HeaderCell
          label={editing ? '⇅' : '✓'}
          width={editing ? col.check + 56 : col.check}
          color={t.onPrimaryContainer}
        />
      </View>

      {rows.map((row, index) => {
        const remaining = restRemaining?.[row.id];
        const isResting = remaining !== undefined;
        const isTabata = row.mode === 'tabata';

        return (
          <View
            key={row.id}
            className="flex-row items-center px-2 py-2 gap-1 border-t"
            style={{
              borderTopColor: t.outlineVariant,
              backgroundColor: isResting
                ? `${t.primaryContainer}1A`
                : index % 2 === 0
                  ? t.surfaceContainerLow
                  : t.surfaceContainer,
            }}
          >
            {/* Video / timer */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isTabata ? `Abrir tabata de ${row.name}` : `Ver video de ${row.name}`
              }
              onPress={() => (isTabata && onOpenTimer ? onOpenTimer(row) : onOpenVideo(row))}
              hitSlop={8}
              style={{ width: col.play, minHeight: 44 }}
              className="items-center justify-center"
            >
              <MaterialCommunityIcons
                name={isTabata ? 'timer-outline' : 'play-circle-outline'}
                size={col.roomy ? 28 : 24}
                color={isTabata ? t.secondary : t.primary}
              />
            </Pressable>

            {/* Name */}
            <Pressable
              className="flex-1 justify-center"
              style={{ minHeight: 44 }}
              accessibilityRole={onEdit ? 'button' : 'text'}
              accessibilityLabel={row.name}
              onPress={onEdit ? () => onEdit(row.id, 'name') : undefined}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontSize: col.fontSize,
                  color: row.done ? t.outline : t.onSurface,
                  textDecorationLine: row.done ? 'line-through' : 'none',
                }}
                className="font-medium"
              >
                {row.name}
              </Text>
            </Pressable>

            {/* Sets */}
            <Cell
              width={col.sets}
              value={String(row.sets)}
              dimmed={row.done}
              fontSize={col.fontSize}
              onPress={onEdit ? () => onEdit(row.id, 'sets') : undefined}
            />

            {/* Reps */}
            <Cell
              width={col.reps}
              value={row.reps}
              dimmed={row.done}
              fontSize={col.fontSize}
              onPress={onEdit ? () => onEdit(row.id, 'reps') : undefined}
            />

            {/* Rest — grows and counts down while this row is resting */}
            <Pressable
              style={{ width: col.rest, minHeight: 44 }}
              className="items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={
                isResting
                  ? `Descanso en marcha, quedan ${remaining} segundos. Tocar para detenerlo`
                  : `Descanso de ${row.name}`
              }
              onPress={
                isResting
                  ? () => onCancelRest?.(row.id)
                  : onEdit
                    ? () => onEdit(row.id, 'rest')
                    : undefined
              }
            >
              <Text
                className={isResting ? 'font-extrabold' : 'font-medium'}
                style={{
                  fontSize: isResting ? col.fontSize + 6 : col.fontSize,
                  color: isResting ? t.primaryContainer : row.done ? t.outline : t.onSurfaceVariant,
                }}
              >
                {formatDuration(isResting ? remaining : row.restSeconds)}
              </Text>
            </Pressable>

            {/* Done, or the edit controls */}
            {editing ? (
              <View className="flex-row items-center" style={{ width: col.check + 56 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Subir ${row.name}`}
                  disabled={index === 0}
                  onPress={() => onMove?.(row.id, -1)}
                  hitSlop={4}
                  style={{ width: 28, minHeight: 44 }}
                  className="items-center justify-center"
                >
                  <MaterialCommunityIcons
                    name="chevron-up"
                    size={22}
                    color={index === 0 ? t.surfaceContainerHighest : t.onSurfaceVariant}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bajar ${row.name}`}
                  disabled={index === rows.length - 1}
                  onPress={() => onMove?.(row.id, 1)}
                  hitSlop={4}
                  style={{ width: 28, minHeight: 44 }}
                  className="items-center justify-center"
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={22}
                    color={index === rows.length - 1 ? t.surfaceContainerHighest : t.onSurfaceVariant}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${row.name}`}
                  onPress={() => onRemove?.(row.id)}
                  hitSlop={4}
                  style={{ width: col.check, minHeight: 44 }}
                  className="items-center justify-center"
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color={t.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: row.done }}
                accessibilityLabel={`Marcar ${row.name} como completado`}
                onPress={() => onToggle(row.id)}
                hitSlop={8}
                style={{ width: col.check, minHeight: 44 }}
                className="items-center justify-center"
              >
                <MaterialCommunityIcons
                  name={row.done ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={col.roomy ? 30 : 26}
                  color={row.done ? t.primaryContainer : t.outline}
                />
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Cell({
  width,
  value,
  dimmed,
  fontSize,
  onPress,
}: {
  width: number;
  value: string;
  dimmed: boolean;
  fontSize: number;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={{ width, minHeight: 44 }}
      className="items-center justify-center"
      accessibilityRole={onPress ? 'button' : 'text'}
      onPress={onPress}
    >
      <Text
        numberOfLines={1}
        className="font-medium"
        style={{ fontSize, color: dimmed ? t.outline : t.onSurface }}
      >
        {value}
      </Text>
    </Pressable>
  );
}
