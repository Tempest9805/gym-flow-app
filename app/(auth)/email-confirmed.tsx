/**
 * Email Confirmed Screen — Stitch "SYSTEM ACCESS" language:
 *   "ACCESS GRANTED" hero + Success icon + LOGIN CTA
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PURPLE_THEME } from '@/lib/store/themeStore';

const t = PURPLE_THEME.tokens;

export default function EmailConfirmedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }}>
      <View 
        className="h-16 justify-center items-center border-b" 
        style={{ backgroundColor: '#0A0A0A', borderBottomColor: '#2A2A2A' }}
      >
        <Text className="text-lg font-black tracking-[-0.5px]" style={{ color: t.primaryContainer }}>SYSTEM ACCESS</Text>
      </View>

      <View className="flex-1 p-8 justify-center gap-16">
        <View className="gap-6 items-center">
          <View 
            className="w-[120px] h-[120px] rounded-full border-2 items-center justify-center shadow-2xl elevation-md" 
            style={{ borderColor: t.primaryContainer, shadowColor: t.primaryContainer, shadowOpacity: 0.5, shadowRadius: 15 }}
          >
            <Text className="text-5xl font-light" style={{ color: t.primaryContainer }}>✓</Text>
          </View>
          <Text className="text-5xl font-extrabold leading-[52px] tracking-tighter text-center" style={{ color: t.onSurface }}>
            ACCESS{'\n'}GRANTED
          </Text>
          <Text className="text-lg text-center leading-7" style={{ color: t.onSurfaceVariant }}>
            Identity verification complete. You are now authorized to access the system.
          </Text>
        </View>

        <TouchableOpacity
          className="h-16 rounded-lg items-center justify-center shadow-2xl elevation-md"
          style={{ backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-lg font-extrabold tracking-[2px] text-black">ENTER SYSTEM</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}