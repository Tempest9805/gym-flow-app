/**
 * Exercise Library Screen — Stitch `exercise_library_canonical_purple` layout:
 *   1. TopAppBar
 *   2. "Library" header + search bar
 *   3. Category pills (horizontal scroll)
 *   4. Visual exercise grid (image card + muscle group chip + add button)
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useExercises, useExerciseFilters } from '@/lib/hooks';
import { Image as ExpoImage } from 'expo-image';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const t = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: exercises, isLoading: isExercisesLoading } = useExercises();
  const { data: filters, isLoading: isFiltersLoading } = useExerciseFilters();

  const categories = useMemo(() => {
    if (!filters?.categories) return ['ALL'];
    return ['ALL', ...filters.categories.map((c: any) => String(c || '').toUpperCase())];
  }, [filters]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((e) => {
      const name = (e.name_en || '').toLowerCase();
      const muscleGroup = (e.muscle_group || '').toLowerCase();
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        name.includes(searchTerm) ||
        muscleGroup.includes(searchTerm);
        
      const matchesCategory =
        selectedCategory && selectedCategory !== 'ALL'
          ? (e.category || '').toUpperCase() === selectedCategory
          : true;
          
      return matchesSearch && matchesCategory;
    });
  }, [exercises, search, selectedCategory]);

  const isLoading = isExercisesLoading || isFiltersLoading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <FlatList
        style={[styles.list, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Section title */}
            <Text style={[styles.pageTitle, { color: t.onBackground }]}>Library</Text>

            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.surfaceVariant }]}>
              <Text style={[styles.searchIcon, { color: t.onSurfaceVariant }]}>⌕</Text>
              <TextInput
                style={[styles.searchInput, { color: t.onSurface }]}
                placeholder="Search exercises..."
                placeholderTextColor={t.onSurfaceVariant}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Category pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillsRow}
              contentContainerStyle={styles.pillsContent}
            >
              {categories.map((cat) => {
                const isActive = cat === (selectedCategory ?? 'ALL');
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat === 'ALL' ? null : cat)}
                    style={[
                      styles.pill,
                      isActive
                        ? {
                            backgroundColor: t.primaryContainer,
                            borderColor: t.primaryContainer,
                            shadowColor: t.primaryContainer,
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 0 },
                          }
                        : { backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isActive ? t.onPrimaryContainer : t.onSurface },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isLoading && (
              <ActivityIndicator color={t.primaryContainer} style={{ marginTop: 24 }} />
            )}
          </View>
        }
        renderItem={({ item }) => <ExerciseListItem item={item} t={t} router={router} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: t.onSurfaceVariant }]}>
                No exercises found
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ── Item Component ────────────────────────────────────────────────────────

function ExerciseListItem({ item, t, router }: { item: any; t: any; router: any }) {
  const imageUrl = item.thumbnail_url || item.demonstration_url;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/exercise/${item.id}`)}
      style={[styles.exerciseCard, { backgroundColor: t.surface, borderColor: t.surfaceVariant }]}
    >
      {/* Image placeholder area */}
      <View style={[styles.cardImageArea, { backgroundColor: t.surfaceContainerHighest }]}>
        {imageUrl ? (
          <ExpoImage
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
            placeholder="L35O?*0000_300~qIVD%00-;~q%M"
          />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: t.surfaceContainerHigh }]}>
            <Text style={[styles.cardImagePlaceholderIcon, { color: t.outlineVariant }]}>
              ◆
            </Text>
          </View>
        )}
        {/* Gradient overlay */}
        <View style={styles.cardImageGradient} />
        {/* Category chip */}
        <View
          style={[
            styles.cardChip,
            {
              backgroundColor: `${t.primaryContainer}22`,
              borderColor: `${t.primaryContainer}44`,
            },
          ]}
        >
          <Text style={[styles.cardChipText, { color: t.primaryContainer }]}>
            {item.type?.toUpperCase() ?? 'STRENGTH'}
          </Text>
        </View>
      </View>

      {/* Card footer */}
      <View style={[styles.cardFooter, { backgroundColor: t.background }]}>
        <View style={styles.cardFooterInfo}>
          <Text style={[styles.cardMeta, { color: t.onSurfaceVariant }]}>
            {(item.category || 'EXERCISE').toUpperCase()} • {(item.equipment || 'BODYWEIGHT').toUpperCase()}
          </Text>
          <Text style={[styles.cardName, { color: t.onSurface }]}>
            {item.name_en || 'Untitled Exercise'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.cardAddButton,
            {
              backgroundColor: t.primaryContainer,
              shadowColor: t.primaryContainer,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push(`/exercise/${item.id}`)}
          accessibilityLabel={`View ${item.name_en}`}
        >
          <Text style={[styles.cardAddIcon, { color: t.onPrimaryContainer }]}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: { flex: 1 },
  content: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
  pageTitle: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
  },
  pillsRow: { flexGrow: 0 },
  pillsContent: {
    gap: 12,
    paddingRight: 20,
  },
  pill: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Exercise cards
  exerciseCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImageArea: {
    height: 224,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderIcon: {
    fontSize: 48,
  },
  cardImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    // Native gradient approximation via opacity
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardChip: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  cardChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    marginTop: -32,
    paddingTop: 32,
  },
  cardFooterInfo: { flex: 1, gap: 2 },
  cardMeta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardName: {
    fontSize: 24,
    fontWeight: '600',
  },
  cardAddButton: {
    width: 48,
    height: 48,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 6,
    flexShrink: 0,
  },
  cardAddIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    lineHeight: 26,
  },
});
