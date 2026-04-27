import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ScreenContainer, BaseButton, CardBase } from '@/components/ui';
import { useCreateShare } from '@/lib/hooks';

export default function ShareRoutineScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { mutate: createShare, data: share, isPending } = useCreateShare();

  useEffect(() => {
    if (id && typeof id === 'string') {
      createShare({ routineId: id, type: 'qr' });
    }
  }, [id, createShare]);

  return (
    <ScreenContainer>
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-text-primary">Share Routine</Text>
        <BaseButton title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      <CardBase className="items-center p-8 mt-4">
        {isPending || !share ? (
          <ActivityIndicator size="large" color="#0072cd" />
        ) : (
          <>
            <View className="bg-white p-4 rounded-xl mb-6">
              <QRCode value={share.share_code} size={200} />
            </View>
            <Text className="text-text-secondary text-center mb-2">Or share this code:</Text>
            <Text className="text-4xl font-bold text-text-primary tracking-widest">{share.share_code}</Text>
          </>
        )}
      </CardBase>
    </ScreenContainer>
  );
}
