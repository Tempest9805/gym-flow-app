import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUpdateProfile, useCurrentProfile } from '@/lib/hooks/useProfiles';
import { useTheme } from '@/lib/hooks/useTheme';

const GOALS = [
  {
    id: 'lose_weight',
    title: 'Bajar de peso',
    icon: 'fire',
    emoji: '🔥',
    desc: 'Ideal para quemar grasa y mejorar condición física.'
  },
  {
    id: 'build_resistance',
    title: 'Ganar resistencia',
    icon: 'weather-windy',
    emoji: '💨',
    desc: 'Mejora tu capacidad cardiovascular y aguante muscular.'
  },
  {
    id: 'build_muscle',
    title: 'Ganar músculo',
    icon: 'arm-flex',
    emoji: '💪',
    desc: 'Enfocado en hipertrofia progresiva y fuerza bruta.'
  },
  {
    id: 'definition',
    title: 'Definición',
    icon: 'content-cut',
    emoji: '✂️',
    desc: 'Tonifica y define tus músculos reduciendo porcentaje de grasa.'
  }
];

export default function GoalSelectionScreen() {
  const t = useTheme();
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleSelect = async (goalId: string) => {
    if (!name.trim()) {
      Alert.alert(
        profile?.full_name ? 'Confirma tu nombre' : 'Nombre requerido',
        'Por favor, dinos cómo te llamas para personalizar tu saludo.'
      );
      return;
    }

    setSelectedId(goalId);
    if (!profile) return;
    
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { goal: goalId, full_name: name.trim() }
      });
      router.replace('/(app)');
    } catch (error) {
      console.error('Failed to update goal', error);
      setSelectedId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        <View className="items-center mb-10 mt-8 gap-3">
          <Text className="text-[12px] font-bold tracking-[3px] text-zinc-500 uppercase">
            Personalización
          </Text>
          <Text className="text-[32px] font-black text-white text-center tracking-tighter leading-9">
            ¿Cuál es tu objetivo principal?
          </Text>
          <Text className="text-base text-zinc-400 text-center leading-6 px-4">
            Ajustaremos las recomendaciones de rutinas según tu meta.
          </Text>
        </View>

        {/* Nombre del atleta */}
        <View className="mb-8 bg-[#251C28] rounded-2xl border border-zinc-800 p-5 gap-3">
          <Text className="text-[12px] font-bold tracking-[3px] text-zinc-500 uppercase">
            ¿Cómo te llamas?
          </Text>
          <TextInput
            className="h-14 rounded-xl border px-4 text-base font-bold text-white bg-[#19101C]"
            style={{ borderColor: '#3b313e' }}
            placeholder="Introduce tu nombre o apodo"
            placeholderTextColor="#504254"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            editable={!updateProfile.isPending}
          />
        </View>

        <View className="gap-4">
          {GOALS.map((goal) => {
            const isSelected = selectedId === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.8}
                disabled={updateProfile.isPending}
                onPress={() => handleSelect(goal.id)}
                className="rounded-2xl p-5 border relative overflow-hidden flex-row items-center gap-4"
                style={{
                  backgroundColor: isSelected ? '#1E1428' : '#251C28',
                  borderColor: isSelected ? '#BC13FE' : '#3b313e',
                  boxShadow: isSelected ? '0 0 20px rgba(188,19,254,0.15)' : 'none',
                }}
              >
                {/* Icon Box */}
                <View 
                  className="w-14 h-14 rounded-xl items-center justify-center"
                  style={{ backgroundColor: isSelected ? '#BC13FE' : '#19101C' }}
                >
                  <Text className="text-2xl">{goal.emoji}</Text>
                </View>

                {/* Text Content */}
                <View className="flex-1">
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: isSelected ? '#fff' : '#eeddee',
                    marginBottom: 4,
                  }}>
                    {goal.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: isSelected ? '#BC13FE' : '#9d8ba0',
                    lineHeight: 18,
                  }}>
                    {goal.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
