/**
 * Reset Password Screen — Stitch "SYSTEM ACCESS" language:
 *   "UPDATE CODE" hero + tall icon-prefixed password inputs + UPDATE CTA
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await authApi.updatePassword(password);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Security code updated successfully.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
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
        className="h-16 justify-center items-center border-b" 
        style={{ backgroundColor: '#0A0A0A', borderBottomColor: '#2A2A2A' }}
      >
        <Text className="text-lg font-black tracking-[-0.5px]" style={{ color: t.primaryContainer }}>SYSTEM ACCESS</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 p-8 justify-center gap-12">
          <View className="gap-3 items-center">
            <Text className="text-5xl font-extrabold leading-[52px] tracking-tighter text-center" style={{ color: t.onSurface }}>
              UPDATE{'\n'}CODE
            </Text>
            <Text className="text-lg text-center leading-7" style={{ color: t.onSurfaceVariant }}>Establish a new athlete security protocol.</Text>
          </View>

          <View className="gap-6">
            <View className="gap-2">
              <Text className="text-[11px] font-bold tracking-[2px]" style={{ color: t.onSurfaceVariant }}>NEW SECURITY CODE</Text>
              <View 
                className="h-16 flex-row items-center rounded-lg border px-4 gap-3" 
                style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }}
              >
                <Text className="text-lg" style={{ color: t.outlineVariant }}>◉</Text>
                <TextInput
                  className="flex-1 text-lg"
                  style={{ color: t.onSurface }}
                  placeholder="MIN. 6 CHARACTERS"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-[11px] font-bold tracking-[2px]" style={{ color: t.onSurfaceVariant }}>CONFIRM CODE</Text>
              <View 
                className="h-16 flex-row items-center rounded-lg border px-4 gap-3" 
                style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant }}
              >
                <Text className="text-lg" style={{ color: t.outlineVariant }}>✓</Text>
                <TextInput
                  className="flex-1 text-lg"
                  style={{ color: t.onSurface }}
                  placeholder="REPEAT NEW CODE"
                  placeholderTextColor={`${t.outlineVariant}88`}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              className="h-16 rounded-lg items-center justify-center shadow-2xl elevation-md"
              style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-lg font-extrabold tracking-[2px] text-black">UPDATE PROTOCOL</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}