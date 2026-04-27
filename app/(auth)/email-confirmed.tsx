/**
 * Email Confirmed callback screen.
 * Shows after user clicks email confirmation link.
 */
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { BaseButton } from '@/components/ui';

export default function EmailConfirmedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-8 items-center">
        <Text className="text-6xl mb-6">✅</Text>
        <Text className="text-2xl font-bold text-text-primary text-center mb-4">
          Email Confirmed!
        </Text>
        <Text className="text-lg text-text-secondary text-center mb-8">
          Your account has been activated successfully.
        </Text>
        
        <BaseButton
          title="Go to Login"
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    </SafeAreaView>
  );
}