import React from 'react';
import { View } from 'react-native';
import { ScreenContainer, BaseButton, LoadingScreen } from '@/components/ui';
import { UserHome } from '@/components/features';
import { useAuthStore } from '@/lib/store/authStore';
import { useCurrentProfile } from '@/lib/hooks';

export default function HomeScreen() {
  const { signOut } = useAuthStore();
  const { data: profile, isLoading } = useCurrentProfile();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Siempre renderizar aunque perfil sea null
  // El componente UserHome maneja el caso
  return (
    <ScreenContainer>
      <UserHome profile={profile || { id: '', email: '', created_at: '' } as any} />

      <View className="mt-auto pb-6">
        <BaseButton title="Sign Out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}