/**
 * Elegir con qué rutina empezar.
 *
 * Las plantillas van **agrupadas por entorno** y cada una dice lo que hace
 * falta, porque esa es la decisión de verdad: si hay que salir de casa o no.
 * Todo lo demás —nivel, objetivo, número de días— es secundario y va en una
 * sola línea gris.
 *
 * No hay «siguiente». Tocar una tarjeta crea la rutina y te deja en la tabla.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { pluralize } from '@/lib/domain/plural';
import { groupByEnvironment, routineFromTemplate, type RoutineTemplate } from '@/lib/domain/templates';
import type { Exercise } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TemplatePickerProps {
  templates: readonly RoutineTemplate[];
  exercises: readonly Exercise[];
  onChoose: (template: RoutineTemplate) => void;
  onBack: () => void;
}

export function TemplatePicker({ templates, exercises, onChoose, onBack }: TemplatePickerProps) {
  const t = useTheme();

  // Se lee cada plantilla para poder decir cuántos días y ejercicios trae. Son
  // unas pocas y el parser es el mismo que corre en cada tecla del importador.
  const grupos = useMemo(
    () =>
      groupByEnvironment(templates).map((grupo) => ({
        ...grupo,
        templates: grupo.templates.map((plantilla) => {
          const rutina = routineFromTemplate(plantilla, exercises, new Date(0).toISOString());
          return {
            plantilla,
            dias: rutina.days.length,
            ejercicios: rutina.days.reduce((n, d) => n + d.rows.length, 0),
          };
        }),
      })),
    [templates, exercises],
  );

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-1 pb-2">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="items-center justify-center"
          style={{ width: 44, minHeight: 44 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={t.onSurface} />
        </Pressable>
        <Text className="text-[20px] font-extrabold" style={{ color: t.onSurface }}>
          ¿Dónde entrenas?
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {grupos.map((grupo) => (
          <View key={grupo.environment} className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <MaterialCommunityIcons
                name={grupo.icon as IconName}
                size={18}
                color={t.onSurfaceVariant}
              />
              <Text
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: t.onSurfaceVariant }}
              >
                {grupo.label}
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: t.outlineVariant }} />
            </View>

            <View className="gap-3">
              {grupo.templates.map(({ plantilla, dias, ejercicios }) => (
                <Pressable
                  key={plantilla.id}
                  onPress={() => onChoose(plantilla)}
                  accessibilityRole="button"
                  accessibilityLabel={`Empezar con ${plantilla.name}. Necesita: ${plantilla.equipment}`}
                  className="rounded-2xl p-4 gap-2"
                  style={{
                    backgroundColor: t.surfaceContainer,
                    borderWidth: 1,
                    borderColor: t.outlineVariant,
                    minHeight: 44,
                  }}
                >
                  <Text className="text-[17px] font-extrabold" style={{ color: t.onSurface }}>
                    {plantilla.name}
                  </Text>

                  <Text className="text-[14px]" style={{ color: t.onSurfaceVariant, lineHeight: 20 }}>
                    {plantilla.tagline}
                  </Text>

                  {/* Lo que decide: qué hace falta para poder hacerla. */}
                  <View className="flex-row items-start gap-2 pt-1">
                    <MaterialCommunityIcons name="wrench-outline" size={15} color={t.primary} />
                    <Text className="flex-1 text-[13px]" style={{ color: t.primary, lineHeight: 18 }}>
                      {plantilla.equipment}
                    </Text>
                  </View>

                  <Text className="text-[12px]" style={{ color: t.outline }}>
                    {pluralize(dias, 'día', 'días')} · {pluralize(ejercicios, 'ejercicio', 'ejercicios')} ·{' '}
                    {plantilla.level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
