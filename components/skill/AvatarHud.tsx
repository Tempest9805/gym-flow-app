import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/hooks/useTheme';
import { avatarFrame } from '@/lib/utils/avatarFrames';
import type { AvatarVariant } from '@/lib/utils/avatarVariant';

export function AvatarHud({ variant, stage }: { variant: AvatarVariant; stage: number }) {
  const t = useTheme();
  return (
    <View className="items-center gap-1">
      <View
        className="w-16 h-16 rounded-full overflow-hidden border-2"
        style={{ borderColor: t.primaryContainer, backgroundColor: t.surfaceContainer }}
      >
        <Image source={avatarFrame(variant, stage)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>
      <Text className="text-[10px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
        Nv {stage}
      </Text>
    </View>
  );
}
