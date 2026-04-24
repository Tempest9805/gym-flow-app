/**
 * Login screen — Integrated with Supabase.
 * Kiosk-style: large inputs, single primary action.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BaseButton } from '@/components/ui';
import { authApi } from '@/lib/api';
import { APP_NAME } from '@/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await authApi.signIn({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
      }
      // Success will be handled by the auth state listener in authStore
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred during login');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-primary-600 mb-2">
              {APP_NAME}
            </Text>
            <Text className="text-lg text-text-secondary">
              Your workout, simplified
            </Text>
          </View>

          {/* Inputs */}
          <View className="mb-8 gap-4">
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              className="bg-surface-secondary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="bg-surface-secondary rounded-button px-5 py-4 text-lg min-h-[52px] text-text-primary"
              placeholderTextColor="#6c757d"
              editable={!loading}
            />
          </View>

          {/* Primary Action */}
          <BaseButton 
            title={loading ? "Logging In..." : "Log In"} 
            onPress={handleLogin} 
            disabled={loading}
          />
          
          {loading && (
            <View className="absolute inset-0 items-center justify-center bg-white/50">
              <ActivityIndicator size="large" color="#000" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
