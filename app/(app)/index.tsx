import React from 'react';
import { View } from 'react-native';
import { ScreenContainer, BaseButton, LoadingScreen } from '@/components/ui';
import { UserHome } from '@/components/features';
import { useAuthStore } from '@/lib/store/authStore';
import { useCurrentProfile } from '@/lib/hooks';

export default function HomeScreen() {
  const { signOut } = useAuthStore();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();

  if (isProfileLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer>
      <UserHome profile={profile!} />

      <View className="mt-auto pb-6">
        <BaseButton title="Sign Out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}
