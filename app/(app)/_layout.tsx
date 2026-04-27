import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Text, View } from 'react-native';
import { useCurrentProfile } from '@/lib/hooks';
import { LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { data: profile, isLoading, isError } = useCurrentProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !profile) return;
  }, [profile, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-text-secondary">Unable to load profile</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0072cd',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          href: null,
          title: 'Workout',
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercise Library',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="workout-session"
        options={{
          href: null,
          title: 'Session',
        }}
      />
    </Tabs>
  );
}
