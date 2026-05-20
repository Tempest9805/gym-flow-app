/**
 * tabata-summary.tsx — Tabata Workout Summary Screen
 * Shown after completing a Tabata session.
 * Bouncing trophy animation + bento stats grid.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatTotalTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function TabataSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    totalSeconds: string;
    roundsCompleted: string;
    totalRounds: string;
    cyclesCompleted: string;
    totalCycles: string;
  }>();

  const totalSeconds = Number(params.totalSeconds) || 0;
  const roundsCompleted = Number(params.roundsCompleted) || 0;
  const totalRounds = Number(params.totalRounds) || 0;
  const cyclesCompleted = Number(params.cyclesCompleted) || 0;
  const totalCycles = Number(params.totalCycles) || 0;

  // Bounce animation for trophy
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [bounceAnim]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 48,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* Bouncing trophy */}
      <Animated.View
        className="mb-8"
        style={{
          transform: [{ translateY: bounceAnim }],
          marginTop: 20,
          paddingTop: 8,
        }}
      >
        <MaterialCommunityIcons name="trophy" size={80} color="#39FF14" />
      </Animated.View>

      {/* Title */}
      <Text
        className="text-5xl font-black text-center mb-10 uppercase"
        style={{ color: '#39FF14', letterSpacing: 4, lineHeight: 56 }}
      >
        {'WORKOUT\nCOMPLETE!'}
      </Text>

      {/* Bento stats grid */}
      <View className="w-full gap-4 mb-12">
        {/* Total time — full width */}
        <View
          className="rounded-xl p-6 items-center"
          style={{
            backgroundColor: '#1A1A1A',
            borderWidth: 1,
            borderColor: '#2A2A2A',
          }}
        >
          <Text
            className="text-[10px] font-bold uppercase mb-2"
            style={{ color: '#EAB308', letterSpacing: 4 }}
          >
            TOTAL TIME
          </Text>
          <Text className="text-4xl font-bold text-white">
            {formatTotalTime(totalSeconds)}
          </Text>
        </View>

        {/* Rounds + Cycles — 2 columns */}
        <View className="flex-row gap-4">
          <View
            className="flex-1 rounded-xl p-5 items-center"
            style={{
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#2A2A2A',
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase text-center mb-2"
              style={{ color: '#b537f2', letterSpacing: 4 }}
            >
              ROUNDS
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-3xl font-bold text-white">
                {roundsCompleted}
              </Text>
              <Text className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                /{totalRounds}
              </Text>
            </View>
          </View>

          <View
            className="flex-1 rounded-xl p-5 items-center"
            style={{
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#2A2A2A',
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase text-center mb-2"
              style={{ color: '#b537f2', letterSpacing: 4 }}
            >
              CYCLES
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-3xl font-bold text-white">
                {cyclesCompleted}
              </Text>
              <Text className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
                /{totalCycles}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="w-full gap-4 mt-auto mb-10">
        {/* Finish — primary */}
        <TouchableOpacity
          onPress={() => router.replace('/(app)' as any)}
          className="w-full h-16 rounded-lg items-center justify-center"
          style={{
            backgroundColor: '#bc13fe',
            shadowColor: '#bc13fe',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 8,
          }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-xl uppercase tracking-wider">
            FINISH
          </Text>
        </TouchableOpacity>

        {/* Repeat — secondary */}
        <TouchableOpacity
          onPress={() => router.replace('/tabata' as any)}
          className="w-full h-12 rounded-lg flex-row items-center justify-center gap-2"
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, color: 'white' }}>↺</Text>
          <Text className="text-white text-lg uppercase tracking-wider">
            REPEAT WORKOUT
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
