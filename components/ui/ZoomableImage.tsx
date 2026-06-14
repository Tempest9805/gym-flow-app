/**
 * ZoomableImage
 *
 * Tappable image that opens a fullscreen modal with pinch-to-zoom capability.
 *
 * Props:
 *   source        — the image source for the card/list thumbnail
 *   zoomSource    — highest-quality source for fullscreen (falls back to source)
 *   style         — style for the thumbnail container
 *   contentFit    — expo-image contentFit (default: 'cover')
 *   accessibilityLabel
 *
 * Zoom behavior:
 *   - Tap the image → fullscreen modal opens
 *   - Swipe down or tap the × button → modal closes
 *   - The fullscreen view loads the zoomSource (highest quality available)
 *   - A subtle "TAP TO ZOOM" hint is shown on the card image
 *
 * Implementation note:
 *   True pinch-to-zoom requires react-native-gesture-handler (already installed).
 *   For the MVP we use ScrollView with maximumZoomScale which provides
 *   native pinch zoom without extra dependencies or reanimated complexity.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils/cn';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ZoomableImageProps {
  source: { uri: string } | number | null;
  zoomSource?: { uri: string } | number | null;
  style?: object;
  imageStyle?: object;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  accessibilityLabel?: string;
  /** Show the "tap to zoom" hint overlay */
  showZoomHint?: boolean;
  /** Rendered when source is null */
  placeholder?: React.ReactNode;
  className?: string;
}

export function ZoomableImage({
  source,
  zoomSource,
  style,
  imageStyle,
  contentFit = 'cover',
  accessibilityLabel,
  showZoomHint = true,
  placeholder,
  className,
}: ZoomableImageProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const bestZoomSource = zoomSource ?? source;

  const openZoom = useCallback(() => {
    if (source || bestZoomSource) setModalVisible(true);
  }, [source, bestZoomSource]);

  const closeZoom = useCallback(() => setModalVisible(false), []);

  if (!source) {
    return <View className={cn("overflow-hidden relative", className)} style={style}>{placeholder ?? null}</View>;
  }

  return (
    <>
      {/* ── Thumbnail (list/card) ── */}
      <TouchableOpacity
        className={cn("overflow-hidden relative", className)}
        style={style}
        onPress={openZoom}
        activeOpacity={0.9}
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel ?? 'Exercise demonstration — tap to zoom'}
        accessibilityHint="Opens fullscreen view with zoom"
      >
        <ExpoImage
          source={source}
          className="w-full h-full"
          style={imageStyle}
          contentFit={contentFit}
          transition={300}
        />

        {/* Zoom hint badge */}
        {showZoomHint && (
          <View className="absolute bottom-3 right-3 bg-black/55 px-3 py-1 rounded-full border border-white/15" pointerEvents="none">
            <Text className="text-white/85 text-[10px] font-bold tracking-[1.5px]">⤢ ZOOM</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Fullscreen Zoom Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={closeZoom}
        statusBarTranslucent
      >
        <StatusBar hidden />
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
          {/* Close button */}
          <TouchableOpacity
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 items-center justify-center"
            style={Platform.OS === 'android' ? { marginTop: 24 } : {}}
            onPress={closeZoom}
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen view"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text className="text-white text-lg font-bold">✕</Text>
          </TouchableOpacity>

          {/* Pinch-to-zoom via ScrollView */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: SCREEN_H,
              minWidth: SCREEN_W,
            }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent
            bouncesZoom
          >
            {bestZoomSource && (
              <ExpoImage
                source={bestZoomSource}
                style={{ width: SCREEN_W, height: SCREEN_H }}
                contentFit="contain"
                transition={200}
                accessibilityLabel={accessibilityLabel}
              />
            )}
          </ScrollView>

          {/* Pinch hint */}
          <View className="absolute bottom-8 left-0 right-0 items-center" pointerEvents="none">
            <Text className="text-white/35 text-xs tracking-widest">Pinch to zoom</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
