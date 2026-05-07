/**
 * AppTopBar — Stitch-faithful top navigation bar.
 * Matches the header from all canonical purple / orange Stitch screens.
 * Now includes a Hamburger Menu Modal for Utility Features (Timer, Tabata).
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRouter } from 'expo-router';

interface AppTopBarProps {
  /** Tapping the hamburger menu icon (optional override) */
  onMenuPress?: () => void;
}

export function AppTopBar({ onMenuPress }: AppTopBarProps) {
  const t = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setMenuVisible(true);
    }
  };

  const closeMenu = () => setMenuVisible(false);

  const navigateTo = (path: any) => {
    closeMenu();
    router.push(path);
  };

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: '#0A0A0A',
            borderBottomColor: '#2A2A2A',
          },
        ]}
      >
        {/* Left: Menu icon */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
          accessibilityLabel="Open menu"
        >
          <Text style={[styles.icon, { color: t.primaryContainer }]}>☰</Text>
        </TouchableOpacity>

        {/* Center: App title */}
        <Text
          style={[
            styles.title,
            {
              color: t.primaryContainer,
              textShadowColor: t.glowPrimary,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            },
          ]}
          numberOfLines={1}
        >
          ELITE PERFORMANCE
        </Text>

        {/* Right: Language toggle placeholder */}
        <View style={styles.iconButton}>
          <Text style={[styles.langLabel, { color: t.primaryContainer }]}>EN</Text>
        </View>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>
          <SafeAreaView style={[styles.menuContainer, { backgroundColor: t.surface }]}>
            <View style={[styles.menuHeader, { borderBottomColor: t.surfaceContainerHighest }]}>
              <Text style={[styles.menuTitle, { color: t.onSurface }]}>UTILITIES</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
                <Text style={[styles.closeIcon, { color: t.onSurfaceVariant }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.menuItems}>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: t.surfaceContainerHighest }]}
                activeOpacity={0.7}
                onPress={() => navigateTo('/timer')}
              >
                <Text style={[styles.menuItemText, { color: t.onSurface }]}>⚡ Interval Timer</Text>
                <Text style={[styles.chevron, { color: t.outlineVariant }]}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: t.surfaceContainerHighest }]}
                activeOpacity={0.7}
                onPress={() => navigateTo('/tabata')}
              >
                <Text style={[styles.menuItemText, { color: t.onSurface }]}>◆ Tabata Protocol</Text>
                <Text style={[styles.chevron, { color: t.outlineVariant }]}>›</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuContainer: {
    width: '75%',
    maxWidth: 320,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 24,
  },
});
