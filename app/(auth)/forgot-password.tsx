/**
 * Forgot Password Screen — Stitch "SYSTEM ACCESS" language:
 *   "RECOVER ACCESS" hero + tall icon-prefixed email input + RESET CTA
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PURPLE_THEME } from '@/lib/store/themeStore';
import { authApi } from '@/lib/api';

const t = PURPLE_THEME.tokens;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const { error } = await authApi.resetPassword(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Check Your Email',
          'We sent a password reset link to your email address.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }}>
      <View 
        className="h-16 flex-row items-center px-5 border-b" 
        style={{ backgroundColor: '#0A0A0A', borderBottomColor: '#2A2A2A' }}
      >
        <TouchableOpacity className="w-12 items-center" onPress={() => router.back()}>
          <Text className="text-2xl" style={{ color: t.primaryContainer }}>←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-black tracking-[-0.5px]" style={{ color: t.primaryContainer }}>SYSTEM ACCESS</Text>
        <View className="w-12" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 p-8 justify-center gap-12">
          <View className="gap-3 items-center">
            <Text className="text-5xl font-extrabold leading-[52px] tracking-tighter text-center" style={{ color: t.onSurface }}>
              RECOVER{'\n'}ACCESS
            </Text>
            <Text className="text-lg text-center leading-7" style={{ color: t.onSurfaceVariant }}>
              Enter your email to receive a recovery protocol.
            </Text>
          </View>

          <View className="gap-6">
            <View className="gap-2">
              <Text className="text-[11px] font-bold tracking-[2px]" style={{ color: t.onSurfaceVariant }}>ATHLETE IDENTIFIER</Text>
              <View 
                className="h-16 flex-row items-center rounded-lg border px-4 gap-3" 
                style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }}
              >
                <Text className="text-lg" style={{ color: t.outlineVariant }}>@</Text>
                <TextInput
                  className="flex-1 text-lg"
                  style={{ color: t.onSurface }}
                  placeholder="ATHLETE@GYMFLOW.COM"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <TouchableOpacity
              className="h-16 rounded-lg items-center justify-center shadow-2xl elevation-md"
              style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-lg font-extrabold tracking-[2px] text-black">SEND PROTOCOL</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}