/**
 * La bienvenida del primer arranque. Una sola vez, dos pasos como mucho.
 *
 * Todo el mundo llega con su rutina ya escrita en algún sitio, así que la
 * pregunta útil es una: ¿la pegas o eliges una plantilla? No hay nombre, ni
 * objetivo, ni nivel, ni tutorial de cinco pasos. Cuanto más se pregunte aquí,
 * más gente cierra la app antes de entrenar una sola vez.
 *
 * Antes había una rutina de gimnasio ya sembrada y el segundo botón solo
 * cerraba el modal. Quien entrena en casa aterrizaba en la rutina de otro y lo
 * primero que hacía era borrarla; ahora se arranca vacío y se elige.
 *
 * Va en un `Modal` y no en una ruta a propósito: así tapa también la barra de
 * pestañas, y el arranque sigue siendo directo a la tabla — sin guardas ni
 * cadenas de redirección, que es lo que la app promete.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { TemplatePicker } from '@/components/TemplatePicker';
import type { RoutineTemplate } from '@/lib/domain/templates';
import type { Exercise } from '@/lib/domain/types';
import { useTheme } from '@/lib/hooks/useTheme';

interface WelcomeProps {
  visible: boolean;
  templates: readonly RoutineTemplate[];
  /** Para poder decir cuántos ejercicios trae cada plantilla. */
  exercises: readonly Exercise[];
  /** Pegar la rutina propia: cierra y lleva al importador. */
  onPaste: () => void;
  /** Empezar con una plantilla del catálogo. */
  onChoose: (template: RoutineTemplate) => void;
}

export function Welcome({ visible, templates, exercises, onPaste, onChoose }: WelcomeProps) {
  const t = useTheme();
  const [eligiendo, setEligiendo] = useState(false);

  // `Restaurar datos` vuelve a enseñar la bienvenida: que empiece por el
  // principio y no en el paso donde se quedó la vez anterior.
  useEffect(() => {
    if (visible) setEligiendo(false);
  }, [visible]);

  if (eligiendo) {
    return (
      <Modal visible={visible} animationType="fade" statusBarTranslucent>
        <SafeAreaView
          className="flex-1 px-5"
          style={{ backgroundColor: t.background }}
          edges={['top', 'bottom']}
        >
          <TemplatePicker
            templates={templates}
            exercises={exercises}
            onChoose={onChoose}
            onBack={() => setEligiendo(false)}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <SafeAreaView
        className="flex-1 justify-between px-6"
        style={{ backgroundColor: t.background }}
        edges={['top', 'bottom']}
      >
        <View className="flex-1 items-center justify-center gap-5">
          <MaterialCommunityIcons name="clipboard-check-outline" size={72} color={t.primary} />

          <Text
            className="text-[30px] font-extrabold text-center"
            style={{ color: t.onSurface, lineHeight: 36 }}
          >
            Tu hoja de entrenamiento
          </Text>

          <Text
            className="text-[16px] text-center"
            style={{ color: t.onSurfaceVariant, lineHeight: 24 }}
          >
            Abres y ves la tabla del día. Marcas lo que haces y el descanso
            cuenta atrás solo.
          </Text>

          <Text className="text-[13px] text-center" style={{ color: t.outline, lineHeight: 20 }}>
            Todo se guarda en este móvil. Sin cuenta y sin internet.
          </Text>
        </View>

        <View className="gap-3 pb-4">
          <Pressable
            onPress={onPaste}
            accessibilityRole="button"
            accessibilityLabel="Pegar mi rutina"
            className="flex-row items-center justify-center gap-2 rounded-xl"
            style={{ backgroundColor: t.primaryContainer, minHeight: 56 }}
          >
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={20}
              color={t.onPrimaryContainer}
            />
            <Text className="text-base font-bold" style={{ color: t.onPrimaryContainer }}>
              Pegar mi rutina
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setEligiendo(true)}
            accessibilityRole="button"
            accessibilityLabel="Elegir una plantilla"
            className="items-center justify-center rounded-xl border"
            style={{ borderColor: t.outline, minHeight: 52 }}
          >
            <Text className="text-base font-bold" style={{ color: t.onSurface }}>
              Elegir una plantilla
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
