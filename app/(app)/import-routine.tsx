import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenContainer, BaseButton, CardBase, LoadingScreen } from '@/components/ui';
import { useImportRoutine } from '@/lib/hooks';

export default function ImportRoutineScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { mutateAsync: importRoutine, isPending } = useImportRoutine();

  const handleImport = async (shareCode: string) => {
    if (!shareCode) return;
    try {
      await importRoutine(shareCode);
      Alert.alert('Success', 'Routine imported successfully!', [
        { text: 'OK', onPress: () => router.push('/routines') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to import routine');
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setScanning(true);
  };

  if (isPending) return <LoadingScreen />;

  if (scanning) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            setCode(data);
            handleImport(data);
          }}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View className="absolute bottom-10 left-10 right-10">
          <BaseButton title="Cancel Scan" variant="primary" onPress={() => setScanning(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-text-primary">Import Routine</Text>
        <BaseButton title="Cancel" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      <CardBase className="p-6 mb-6">
        <Text className="text-lg font-semibold text-text-primary mb-4">Enter Share Code</Text>
        <TextInput
          className="bg-background-app text-text-primary text-2xl font-bold text-center tracking-widest p-4 rounded-lg mb-4 border border-border-color"
          placeholder="XXXXXX"
          placeholderTextColor="#6c757d"
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
        />
        <BaseButton 
          title="Import" 
          onPress={() => handleImport(code)} 
          disabled={code.length < 6}
        />
      </CardBase>

      <View className="items-center mb-6">
        <Text className="text-text-secondary">OR</Text>
      </View>

      <CardBase className="p-6">
        <Text className="text-lg font-semibold text-text-primary mb-4 text-center">Scan QR Code</Text>
        <BaseButton title="Open Camera" variant="outline" onPress={startScanning} />
      </CardBase>
    </ScreenContainer>
  );
}
