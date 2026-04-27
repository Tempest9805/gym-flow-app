/**
 * Reset Password screen — Set new password after email link.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { BaseButton } from '@/components/ui';
import { authApi } from '@/lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { initialize } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await authApi.updatePassword(password);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Success',
        'Your password has been reset. Please sign in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          <View className="items-center mb-10">
            <Text className="text-4xl mb-4">🔑</Text>
            <Text className="text-2xl font-bold text-text-primary mb-2">
              Set New Password
            </Text>
            <Text className="text-lg text-text-secondary text-center">
              Enter your new password below
            </Text>
          </View>

          <View className="mb-6 gap-4">
            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="bg-surface-secondary border border-surface-tertiary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="bg-surface-secondary border border-surface-tertiary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
          </View>

          <BaseButton
            title={loading ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}