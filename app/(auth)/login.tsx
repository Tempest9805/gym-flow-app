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

// Auth screens always use purple theme regardless of user setting
const t = PURPLE_THEME.tokens;

export default function LoginScreen() {
  const router = useRouter();
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
      const { error } = await authApi.signIn({ email, password });
      if (error) Alert.alert('Login Failed', error.message);
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: t.background }}
    >
      {/* Top bar */}
      <View 
        className="h-16 flex-row items-center justify-between px-5 border-b"
        style={{ backgroundColor: t.surface, borderBottomColor: t.surfaceVariant }}
      >
        <View className="w-12" />
        <Text
          className="flex-1 text-center text-lg font-black tracking-tighter uppercase"
          style={{
            color: t.primaryContainer,
            textShadowColor: t.glowPrimary,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }}
        >
          ELITE PERFORMANCE
        </Text>
        <View className="w-12" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-5 py-12 gap-8">
          {/* ── Hero Text ── */}
          <View className="gap-2 items-center">
            <Text 
              className="text-5xl font-extrabold leading-[52px] tracking-tighter text-center uppercase"
              style={{ color: t.onSurface }}
            >
              SYSTEM{'\n'}ACCESS
            </Text>
            <Text 
              className="text-lg leading-7 text-center"
              style={{ color: t.onSurfaceVariant }}
            >
              Identify yourself to continue.
            </Text>
          </View>

          {/* ── Form ── */}
          <View className="gap-6">
            {/* Email */}
            <View className="gap-2">
              <Text 
                className="text-[12px] font-bold tracking-[2px] uppercase pl-1"
                style={{ color: t.onSurfaceVariant }}
              >
                Email Designation
              </Text>
              <View
                className="h-16 flex-row items-center rounded-lg border px-4 gap-3"
                style={{
                  backgroundColor: t.surfaceContainer,
                  borderColor: t.surfaceVariant,
                }}
              >
                <Text className="text-lg" style={{ color: t.outlineVariant }}>@</Text>
                <TextInput
                  className="flex-1 text-lg leading-6"
                  style={{ color: t.onSurface }}
                  placeholder="ATHLETE@GYMFLOW.COM"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text 
                  className="text-[12px] font-bold tracking-[2px] uppercase pl-1"
                  style={{ color: t.onSurfaceVariant }}
                >
                  Security Code
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  activeOpacity={0.7}
                >
                  <Text 
                    className="text-[12px] font-bold tracking-widest uppercase"
                    style={{ color: t.primaryContainer }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                className="h-16 flex-row items-center rounded-lg border px-4 gap-3"
                style={{
                  backgroundColor: t.surfaceContainer,
                  borderColor: t.surfaceVariant,
                }}
              >
                <Text className="text-lg" style={{ color: t.outlineVariant }}>◉</Text>
                <TextInput
                  className="flex-1 text-lg leading-6"
                  style={{ color: t.onSurface }}
                  placeholder="••••••••••••"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              className="h-16 rounded-lg items-center justify-center mt-4 shadow-2xl elevation-md"
              style={{
                backgroundColor: t.primaryContainer,
                shadowColor: t.primaryContainer,
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 16,
              }}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text 
                  className="text-lg font-bold tracking-[3px] uppercase"
                  style={{ color: '#0A0A0A' }}
                >
                  LOG IN
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up link */}
            <TouchableOpacity
              className="h-12 rounded-lg border items-center justify-center"
              style={{ borderColor: t.surfaceVariant }}
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text className="text-base" style={{ color: t.onSurface }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}