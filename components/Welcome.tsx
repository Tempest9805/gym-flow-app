/**
 * La bienvenida del primer arranque. Una sola vez, una sola pantalla.
 *
 * Todo el mundo llega con su rutina ya escrita en algún sitio, así que la
 * pregunta útil es una: ¿la pegas o empiezas con la de ejemplo? No hay nombre,
 * ni objetivo, ni nivel, ni tutorial de cinco pasos. Cuanto más se pregunte
 * aquí, más gente cierra la app antes de entrenar una sola vez.
 *
 * Va en un `Modal` y no en una ruta a propósito: así tapa también la barra de
 * pestañas, y el arranque sigue siendo directo a la tabla — sin guardas ni
 * cadenas de redirección, que es lo que la app promete.
 */
import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/lib/hooks/useTheme';

interface WelcomeProps {
  visible: boolean;
  /** Pegar la rutina propia: cierra y lleva al importador. */
  onPaste: () => void;
  /** Quedarse con la rutina de ejemplo que ya viene sembrada. */
  onExample: () => void;
}

export function Welcome({ visible, onPaste, onExample }: WelcomeProps) {
  const t = useTheme();

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
            onPress={onExample}
            accessibilityRole="button"
            accessibilityLabel="Empezar con la rutina de ejemplo"
            className="items-center justify-center rounded-xl border"
            style={{ borderColor: t.outline, minHeight: 52 }}
          >
            <Text className="text-base font-bold" style={{ color: t.onSurface }}>
              Empezar con una de ejemplo
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
