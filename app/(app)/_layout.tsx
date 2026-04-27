import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useCurrentProfile } from '@/lib/hooks';
import { LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { data: profile, isLoading } = useCurrentProfile();

  // Mostrar loading solo mientras carga PERFIL, no afecta navegación
  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Sesión OK → Mostrar tabs siempre
  // Perfil es opcional y se carga en background
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#36adff',
        tabBarInactiveTintColor: '#a3a3a3',
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
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
        options={{ href: null, title: 'Workout' }}
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
          title: 'Exercises',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🔍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="workout-session"
        options={{ href: null, title: 'Session' }}
      />
    </Tabs>
  );
}