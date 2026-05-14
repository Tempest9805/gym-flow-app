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
  StyleSheet,
  Text,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

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
}: ZoomableImageProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const bestZoomSource = zoomSource ?? source;

  const openZoom = useCallback(() => {
    if (source || bestZoomSource) setModalVisible(true);
  }, [source, bestZoomSource]);

  const closeZoom = useCallback(() => setModalVisible(false), []);

  if (!source) {
    return <View style={style}>{placeholder ?? null}</View>;
  }

  return (
    <>
      {/* ── Thumbnail (list/card) ── */}
      <TouchableOpacity
        style={[styles.thumbnailWrapper, style]}
        onPress={openZoom}
        activeOpacity={0.9}
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel ?? 'Exercise demonstration — tap to zoom'}
        accessibilityHint="Opens fullscreen view with zoom"
      >
        <ExpoImage
          source={source}
          style={[styles.thumbnailImage, imageStyle]}
          contentFit={contentFit}
          transition={300}
        />

        {/* Zoom hint badge */}
        {showZoomHint && (
          <View style={styles.zoomHint} pointerEvents="none">
            <Text style={styles.zoomHintText}>⤢ ZOOM</Text>
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
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeZoom}
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen view"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Pinch-to-zoom via ScrollView */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
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
                style={styles.fullscreenImage}
                contentFit="contain"
                transition={200}
                accessibilityLabel={accessibilityLabel}
              />
            )}
          </ScrollView>

          {/* Pinch hint */}
          <View style={styles.pinchHint} pointerEvents="none">
            <Text style={styles.pinchHintText}>Pinch to zoom</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  zoomHintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // Modal
  modalSafe: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_H,
    minWidth: SCREEN_W,
  },
  fullscreenImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  pinchHint: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pinchHintText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    letterSpacing: 1,
  },
});
