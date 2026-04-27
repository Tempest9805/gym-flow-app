/**
 * Forgot Password screen — Send password reset email.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BaseButton } from '@/components/ui';
import { authApi } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (loading) return; // Prevent multiple calls

    setLoading(true);
    try {
      const { error } = await authApi.resetPassword(email);

      if (error) {
        // Handle rate limit specifically
        if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
          Alert.alert(
            'Please Wait',
            'We already sent a reset link recently. Please check your email or try again in a few minutes.'
          );
        } else {
          Alert.alert('Error', error.message);
        }
        return;
      }

      setEmailSent(true);
    } catch (e: any) {
      // Handle rate limit from caught error too
      if (e?.message?.includes('rate limit') || e?.message?.includes('Too many requests')) {
        Alert.alert(
          'Please Wait',
          'We already sent a reset link recently. Please check your email or try again in a few minutes.'
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-8 items-center">
          <Text className="text-4xl mb-6">✉️</Text>
          <Text className="text-2xl font-bold text-text-primary text-center mb-4">
            Check Your Email
          </Text>
          <Text className="text-lg text-text-secondary text-center mb-8">
            We sent a password reset link to{'\n'}{email}
          </Text>
          <BaseButton
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          <View className="items-center mb-10">
            <Text className="text-4xl mb-4">🔐</Text>
            <Text className="text-2xl font-bold text-text-primary mb-2">
              Forgot Password?
            </Text>
            <Text className="text-lg text-text-secondary text-center">
              Enter your email and we'll send you a reset link
            </Text>
          </View>

          <View className="mb-6">
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              className="bg-surface-secondary border border-surface-tertiary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
          </View>

          <BaseButton
            title={loading ? 'Sending...' : 'Send Reset Link'}
            onPress={handleResetPassword}
            disabled={loading}
          />

          <View className="mt-6 items-center">
            <BaseButton
              title="Remember your password? Sign In"
              variant="ghost"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}