import React from 'react';
import { View } from 'react-native';
import { ScreenContainer, BaseButton, LoadingScreen } from '@/components/ui';
import { UserHome, TrainerHome, CoachHome } from '@/components/features';
import { useAuthStore } from '@/lib/store/authStore';
import { useCurrentProfile, useUserAssignments } from '@/lib/hooks';

export default function HomeScreen() {
  const { signOut } = useAuthStore();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();

  // Assignments are only relevant for the user role
  const isUserRole = profile?.role === 'user' || !profile?.role;
  const { data: assignments, isLoading: isAssignmentsLoading } = useUserAssignments(
    isUserRole ? profile?.id : undefined
  );

  if (isProfileLoading || (isUserRole && isAssignmentsLoading)) {
    return <LoadingScreen />;
  }

  const role = profile?.role || 'user';

  const renderContent = () => {
    switch (role) {
      case 'coach':
        return <CoachHome profile={profile!} />;
      case 'trainer':
        return <TrainerHome profile={profile!} />;
      default:
        return <UserHome profile={profile!} assignments={assignments || []} />;
    }
  };

  return (
    <ScreenContainer>
      {renderContent()}

      <View className="mt-auto pb-6">
        <BaseButton title="Sign Out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}
