/**
 * Pegar una rutina.
 *
 * Todo el mundo tiene ya su rutina escrita en algún sitio — WhatsApp, notas,
 * un PDF del coach — y volver a teclearla es la fricción que hace que nadie
 * llegue a usar la app. Aquí se pega y ya está.
 *
 * La pantalla enseña **lo que ha entendido mientras escribes**, no al final:
 * los días, cuántos ejercicios lleva cada uno y cuántos han encontrado su
 * ficha. Así se ve de un vistazo si la lectura salió bien, sin tener que
 * crear la rutina para descubrirlo.
 *
 * Sin IA y sin red: es el parser de `lib/domain/importRoutine.ts`, que tiene
 * sus tests. Lo que no sabe leer no se pierde — queda como fila con su texto.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { countLinked, parseRoutineText, routineFromParsed } from '@/lib/domain/importRoutine';
import { pluralize } from '@/lib/domain/plural';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutineStore } from '@/lib/store/routineStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const EJEMPLO = `Día A — Empuje
1. Flexiones — 4x15
2. Fondos en silla — 3x12
🔥 CUERDA 40/20 x12 rondas

Día B — Tirón
1. Remo invertido — 4x10`;

export default function ImportScreen() {
  const t = useTheme();
  const router = useRouter();

  const library = useRoutineStore((s) => s.exercises);
  const saveRoutine = useRoutineStore((s) => s.saveRoutine);
  const setActiveRoutine = useRoutineStore((s) => s.setActiveRoutine);
  const routineCount = useRoutineStore((s) => s.routines.length);

  const [texto, setTexto] = useState('');
  const [nombre, setNombre] = useState('');

  // Se relee en cada tecla a proposito: es lo que hace que la vista previa
  // vaya al dia. Son unos cientos de lineas de texto, no cuesta nada.
  const lectura = useMemo(() => {
    const parsed = parseRoutineText(texto);
    const rutina = routineFromParsed(parsed, nombre, library, new Date().toISOString());
    const filas = rutina.days.reduce((n, d) => n + d.rows.length, 0);
    return { parsed, rutina, filas, conFicha: countLinked(rutina) };
  }, [texto, nombre, library]);

  const hayAlgo = lectura.rutina.days.length > 0;

  const pegar = async () => {
    const delPortapapeles = await Clipboard.getStringAsync();
    if (delPortapapeles.trim() !== '') setTexto(delPortapapeles);
  };

  const crear = () => {
    if (!hayAlgo) return;
    const rutina = routineFromParsed(
      lectura.parsed,
      nombre.trim() === '' ? `Rutina ${routineCount + 1}` : nombre,
      library,
      new Date().toISOString(),
    );
    saveRoutine(rutina);
    setActiveRoutine(rutina.id);
    // La pantalla es una pestana y no se desmonta: sin vaciar, al volver a
    // «Pegar» sigue ahi el texto de la rutina que ya se creo, y darle a Crear
    // otra vez la duplica.
    setTexto('');
    setNombre('');
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="flex-row items-center px-2 pt-1 pb-2 gap-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="items-center justify-center"
          style={{ width: 44, minHeight: 44 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={t.onSurface} />
        </Pressable>
        <Text className="flex-1 text-xl font-extrabold" style={{ color: t.onSurface }}>
          Pegar rutina
        </Text>
        {/* Las dos acciones van en la cabecera y no abajo: con
            `edgeToEdgeEnabled` la ventana ya no se encoge al abrir el teclado,
            asi que cualquier boton anclado al pie queda debajo de las teclas.
            Aqui arriba no lo tapa nada. Manda la que toca en cada momento:
            pegar mientras esta vacio, crear en cuanto hay algo que leer. */}
        <Pressable
          onPress={pegar}
          accessibilityRole="button"
          accessibilityLabel="Pegar del portapapeles"
          className="flex-row items-center gap-1.5 rounded-lg border px-3"
          style={{
            backgroundColor: hayAlgo ? 'transparent' : t.primaryContainer,
            borderColor: hayAlgo ? t.outline : t.primaryContainer,
            minHeight: 44,
          }}
        >
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={18}
            color={hayAlgo ? t.onSurface : t.onPrimaryContainer}
          />
          <Text
            className="text-[13px] font-bold"
            style={{ color: hayAlgo ? t.onSurface : t.onPrimaryContainer }}
          >
            Pegar
          </Text>
        </Pressable>

        <Pressable
          onPress={crear}
          disabled={!hayAlgo}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hayAlgo }}
          accessibilityLabel="Crear la rutina con lo pegado"
          className="flex-row items-center gap-1.5 rounded-lg px-3 mr-2"
          style={{
            backgroundColor: hayAlgo ? t.primaryContainer : t.surfaceContainer,
            minHeight: 44,
          }}
        >
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={hayAlgo ? t.onPrimaryContainer : t.outline}
          />
          <Text
            className="text-[13px] font-bold"
            style={{ color: hayAlgo ? t.onPrimaryContainer : t.outline }}
          >
            Crear
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 px-4 pb-3 gap-3">
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder={`Nombre — por defecto «Rutina ${routineCount + 1}»`}
            placeholderTextColor={t.outline}
            accessibilityLabel="Nombre de la rutina"
            className="rounded-xl px-3 text-[15px]"
            style={{
              backgroundColor: t.surfaceContainerLow,
              borderWidth: 1,
              borderColor: t.outlineVariant,
              color: t.onSurface,
              minHeight: 48,
            }}
          />

          {/* Lo que ha entendido, en vivo. */}
          {hayAlgo && (
            <View className="gap-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              >
                {lectura.rutina.days.map((day) => (
                  <View
                    key={day.id}
                    className="flex-row items-center gap-1.5 rounded-lg px-3 py-2"
                    style={{ backgroundColor: t.surfaceContainerHigh }}
                  >
                    <MaterialCommunityIcons
                      name={day.icon as IconName}
                      size={16}
                      color={t.onSurfaceVariant}
                    />
                    <Text className="text-[13px] font-bold" style={{ color: t.onSurface }}>
                      {day.label}
                    </Text>
                    <Text className="text-[13px]" style={{ color: t.onSurfaceVariant }}>
                      {day.rows.length}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <Text className="text-[13px]" style={{ color: t.onSurfaceVariant }}>
                {pluralize(lectura.rutina.days.length, 'día', 'días')} ·{' '}
                {pluralize(lectura.filas, 'ejercicio', 'ejercicios')} · {lectura.conFicha} con ficha
              </Text>

              {lectura.parsed.unparsedLines > 0 && (
                <Text className="text-[13px]" style={{ color: t.onSurfaceVariant }}>
                  {pluralize(lectura.parsed.unparsedLines, 'línea', 'líneas')} sin series:{' '}
                  {lectura.parsed.unparsedLines === 1 ? 'queda' : 'quedan'} en 3x10, se edita
                  luego.
                </Text>
              )}
            </View>
          )}

          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder={EJEMPLO}
            placeholderTextColor={t.outline}
            accessibilityLabel="Texto de la rutina"
            multiline
            textAlignVertical="top"
            className="flex-1 rounded-xl p-3 text-[15px]"
            style={{
              backgroundColor: t.surfaceContainerLow,
              borderWidth: 1,
              borderColor: t.outlineVariant,
              color: t.onSurface,
              lineHeight: 22,
            }}
          />

      </View>
    </SafeAreaView>
  );
}
