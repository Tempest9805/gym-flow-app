/**
 * Auth group layout — screens for unauthenticated users.
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: '#0d0d0d' },
    }} />
  );
}
