import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentProfile, useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useTranslation } from '@/lib/hooks';
import { EQUIPMENT_OPTIONS, normalizeEquipmentSelection } from '@/lib/onboarding/equipment';

export default function EquipmentSelectionScreen() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();

  const [selected, setSelected] = useState<string[]>(
    (profile?.available_equipment ?? []).filter((k) => k !== 'none'),
  );
  const bodyweightOnly = selected.length === 0;

  const toggle = (key: string) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const handleContinue = async () => {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { available_equipment: normalizeEquipmentSelection(selected) },
      });
      router.replace('/(app)');
    } catch (error) {
      console.error('Failed to save equipment', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#19101C]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 mt-8 gap-3">
          <Text className="text-[12px] font-bold tracking-[3px] text-zinc-500 uppercase">
            Personalización
          </Text>
          <Text className="text-[32px] font-black text-white text-center tracking-tighter leading-9">
            {tr('onboarding.equipment.title')}
          </Text>
          <Text className="text-base text-zinc-400 text-center leading-6 px-4">
            {tr('onboarding.equipment.subtitle')}
          </Text>
        </View>

        {/* Bodyweight baseline */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelected([])}
          className="rounded-2xl p-5 border mb-4 flex-row items-center gap-4"
          style={{
            backgroundColor: bodyweightOnly ? '#1E1428' : '#251C28',
            borderColor: bodyweightOnly ? '#BC13FE' : '#3b313e',
          }}
        >
          <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: bodyweightOnly ? '#BC13FE' : '#19101C' }}>
            <Text className="text-2xl">🧍</Text>
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 18, fontWeight: '900', color: bodyweightOnly ? '#fff' : '#eeddee', marginBottom: 4 }}>
              {tr('onboarding.equipment.bodyweight')}
            </Text>
            <Text style={{ fontSize: 13, color: bodyweightOnly ? '#BC13FE' : '#9d8ba0', lineHeight: 18 }}>
              {tr('onboarding.equipment.bodyweightDesc')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Gear chips */}
        <View className="gap-3">
          {EQUIPMENT_OPTIONS.map((opt) => {
            const isActive = selected.includes(opt.key);
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => toggle(opt.key)}
                className="rounded-2xl p-4 border flex-row items-center gap-4"
                style={{
                  backgroundColor: isActive ? '#1E1428' : '#251C28',
                  borderColor: isActive ? '#BC13FE' : '#3b313e',
                }}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: isActive ? '#BC13FE' : '#19101C' }}>
                  <Text className="text-xl">{opt.icon}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: isActive ? '#fff' : '#eeddee', flex: 1 }}>
                  {tr(opt.labelKey)}
                </Text>
                <View
                  className="w-6 h-6 rounded-md border items-center justify-center"
                  style={{ borderColor: isActive ? '#BC13FE' : '#504254', backgroundColor: isActive ? '#BC13FE' : 'transparent' }}
                >
                  {isActive && <Text style={{ color: '#19101C', fontSize: 14, fontWeight: '900' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue */}
      <View className="px-6 pb-8 pt-2">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={updateProfile.isPending}
          onPress={handleContinue}
          className="h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: '#BC13FE', opacity: updateProfile.isPending ? 0.6 : 1 }}
        >
          <Text className="text-[13px] font-black tracking-[2px] uppercase text-white">
            {tr('onboarding.equipment.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
