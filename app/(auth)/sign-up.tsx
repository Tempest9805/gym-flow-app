/**
 * Sign up screen — Create a new account.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BaseButton } from '@/components/ui';
import { authApi } from '@/lib/api';
import { APP_NAME } from '@/constants';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
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
      const { data, error } = await authApi.signUp({ email, password });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
        return;
      }

      if (data.user && !data.session) {
        Alert.alert(
          'Check Your Email',
          'We sent a confirmation link to your email. Please verify to activate your account.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else if (data.session) {
        router.replace('/(app)');
      }
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
            <Text className="text-3xl font-bold text-text-primary mb-2">
              {APP_NAME}
            </Text>
            <Text className="text-lg text-text-secondary">
              Create your account
            </Text>
          </View>

          <View className="mb-6 gap-4">
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
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="bg-surface-secondary border border-surface-tertiary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="bg-surface-secondary border border-surface-tertiary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
          </View>

          <BaseButton
            title={loading ? 'Creating Account...' : 'Create Account'}
            onPress={handleSignUp}
            disabled={loading}
          />

          <View className="mt-6 items-center">
            <BaseButton
              title="Already have an account? Sign In"
              variant="ghost"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}