import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Text } from 'react-native';
import { useCurrentProfile } from '@/lib/hooks';
import { LoadingScreen } from '@/components/ui';

export default function AppLayout() {
  const { data: profile, isLoading } = useCurrentProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !profile) return;

    const role = profile.role;
    const currentTab = segments[segments.length - 1];

    // Protection logic
    if (role === 'user') {
      if (currentTab === 'routines' || currentTab === 'dashboard') {
        router.replace('/(app)');
      }
    } else if (role === 'trainer') {
      if (currentTab === 'dashboard') {
        router.replace('/(app)');
      }
    }
  }, [profile, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const role = profile?.role || 'user';
  const isTrainerOrCoach = role === 'trainer' || role === 'coach';

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
          title: 'Workout',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>💪</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          href: isTrainerOrCoach ? undefined : null, // Hide for standard users
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          href: role === 'coach' ? undefined : null, // Only coach sees gym dashboard
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          href: null,
          title: 'Exercise Library',
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
