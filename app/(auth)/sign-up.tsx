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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PURPLE_THEME } from '@/lib/store/themeStore';
import { authApi } from '@/lib/api';

// Auth screens always use the purple theme (user hasn't set preference yet)
const t = PURPLE_THEME.tokens;

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
    if (loading) return;

    setLoading(true);
    try {
      const { data, error } = await authApi.signUp({ email, password });
      if (error) {
        if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
          Alert.alert('Please Wait', 'A confirmation email was already sent. Check your inbox.');
        } else {
          Alert.alert('Sign Up Failed', error.message);
        }
        return;
      }
      if (data.user && !data.session) {
        Alert.alert(
          'Check Your Email',
          'We sent a confirmation link to activate your account.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else if (data.session) {
        router.replace('/(app)');
      }
    } catch (e) {
      const error = e as Error;
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
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
        <TouchableOpacity
          className="w-12 items-center justify-center"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text className="text-2xl font-light" style={{ color: t.primaryContainer }}>←</Text>
        </TouchableOpacity>
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 48,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-8">
            {/* ── Hero Text ── */}
            <View className="gap-2 items-center">
              <Text 
                className="text-5xl font-extrabold leading-[52px] tracking-tighter text-center uppercase"
                style={{ color: t.onSurface }}
              >
                NEW{'\n'}RECRUIT
              </Text>
              <Text 
                className="text-lg leading-7 text-center"
                style={{ color: t.onSurfaceVariant }}
              >
                Create your athlete profile.
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
                  style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }}
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
                <Text 
                  className="text-[12px] font-bold tracking-[2px] uppercase pl-1"
                  style={{ color: t.onSurfaceVariant }}
                >
                  Security Code
                </Text>
                <View
                  className="h-16 flex-row items-center rounded-lg border px-4 gap-3"
                  style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }}
                >
                  <Text className="text-lg" style={{ color: t.outlineVariant }}>◉</Text>
                  <TextInput
                    className="flex-1 text-lg leading-6"
                    style={{ color: t.onSurface }}
                    placeholder="MIN. 6 CHARACTERS"
                    placeholderTextColor={`${t.outlineVariant}88`}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Confirm Password */}
              <View className="gap-2">
                <Text 
                  className="text-[12px] font-bold tracking-[2px] uppercase pl-1"
                  style={{ color: t.onSurfaceVariant }}
                >
                  Confirm Code
                </Text>
                <View
                  className="h-16 flex-row items-center rounded-lg border px-4 gap-3"
                  style={{
                    backgroundColor: t.surfaceContainer,
                    borderColor:
                      confirmPassword && confirmPassword !== password
                        ? t.error
                        : t.surfaceVariant,
                  }}
                >
                  <Text className="text-lg" style={{ color: t.outlineVariant }}>✓</Text>
                  <TextInput
                    className="flex-1 text-lg leading-6"
                    style={{ color: t.onSurface }}
                    placeholder="REPEAT SECURITY CODE"
                    placeholderTextColor={`${t.outlineVariant}88`}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text 
                    className="text-lg font-bold tracking-[3px] uppercase"
                    style={{ color: '#0A0A0A' }}
                  >
                    CREATE ACCOUNT
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back to login */}
              <TouchableOpacity
                className="h-12 rounded-lg border items-center justify-center"
                style={{ borderColor: t.surfaceVariant }}
                activeOpacity={0.7}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text className="text-base" style={{ color: t.onSurface }}>
                  Already a member? Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}