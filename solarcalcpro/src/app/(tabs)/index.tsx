import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  FAB,
  IconButton,
  Menu,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ProjectRecord } from '@/db/repos/projects';
import { projectLimit } from '@/core/capabilities';
import { useProjectStore } from '@/store/projects';
import { useSettingsStore } from '@/store/settings';
import { useUpgrade } from '@/components/upgrade';

function ProjectAvatar() {
  const theme = useTheme();
  return (
    <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
      <IconButton icon="solar-panel-large" iconColor={theme.colors.onPrimaryContainer} />
    </View>
  );
}

export default function ProjectsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const loading = useProjectStore((s) => s.loading);
  const refresh = useProjectStore((s) => s.refresh);
  const duplicate = useProjectStore((s) => s.duplicate);
  const remove = useProjectStore((s) => s.remove);
  const rename = useProjectStore((s) => s.rename);
  const tier = useSettingsStore((s) => s.tier);
  const { showUpgrade } = useUpgrade();

  const [renaming, setRenaming] = useState<ProjectRecord | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleting, setDeleting] = useState<ProjectRecord | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const limit = projectLimit(tier);
  const atLimit = projects.length >= limit;

  const createProject = () => {
    if (atLimit) {
      showUpgrade('unlimitedProjects');
      return;
    }
    router.push('/project/new');
  };

  const duplicateProject = (id: string) => {
    setMenuFor(null);
    if (atLimit) {
      showUpgrade('unlimitedProjects');
      return;
    }
    duplicate(id).catch((e) => console.error(e));
  };

  useFocusEffect(
    useCallback(() => {
      refresh().catch((e) => console.error('Failed to load projects', e));
    }, [refresh]),
  );

  const openRename = (project: ProjectRecord) => {
    setMenuFor(null);
    setRenameName(project.name);
    setRenaming(project);
  };

  const confirmRename = async () => {
    if (!renaming) return;
    if (renameName.trim()) await rename(renaming.id, { name: renameName.trim() });
    setRenaming(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await remove(deleting.id);
    setDeleting(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title="Projects" />
      </Appbar.Header>

      {atLimit && projects.length > 0 ? (
        <View style={[styles.limitBanner, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
            Free plan: {projects.length} of {limit} projects used. Upgrade to Pro for unlimited
            projects.
          </Text>
          <Button compact mode="text" onPress={() => showUpgrade('unlimitedProjects')}>
            Upgrade
          </Button>
        </View>
      ) : null}

      {projects.length === 0 && !loading ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <IconButton
              icon="white-balance-sunny"
              size={40}
              iconColor={theme.colors.onPrimaryContainer}
            />
          </View>
          <Text variant="titleLarge" style={styles.emptyTitle}>
            Power your first site
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Create a project to size a solar system from your appliances or a daily kWh figure.
          </Text>
          <Button
            mode="contained"
            icon="solar-power"
            onPress={createProject}
            style={styles.emptyButton}
          >
            New project
          </Button>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          renderItem={({ item }) => (
            <Card
              mode="outlined"
              style={styles.card}
              onPress={() => router.push(`/project/${item.id}`)}
            >
              <Card.Title
                title={item.name}
                titleNumberOfLines={2}
                subtitle={
                  item.clientName
                    ? `${item.clientName} · updated ${new Date(item.updatedAt).toLocaleDateString()}`
                    : `Updated ${new Date(item.updatedAt).toLocaleDateString()}`
                }
                subtitleNumberOfLines={2}
                left={ProjectAvatar}
                right={() => (
                  <Menu
                    visible={menuFor === item.id}
                    onDismiss={() => setMenuFor(null)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => setMenuFor(item.id)}
                        accessibilityLabel="Project actions"
                      />
                    }
                  >
                    <Menu.Item
                      leadingIcon="content-duplicate"
                      title="Duplicate"
                      onPress={() => duplicateProject(item.id)}
                    />
                    <Menu.Item
                      leadingIcon="pencil-outline"
                      title="Rename"
                      onPress={() => openRename(item)}
                    />
                    <Menu.Item
                      leadingIcon="delete-outline"
                      title="Delete"
                      onPress={() => {
                        setMenuFor(null);
                        setDeleting(item);
                      }}
                    />
                  </Menu>
                )}
              />
            </Card>
          )}
        />
      )}

      <FAB
        icon="solar-panel-large"
        label="New project"
        variant="primary"
        style={styles.fab}
        onPress={createProject}
      />

      <Portal>
        <Dialog visible={renaming !== null} onDismiss={() => setRenaming(null)}>
          <Dialog.Title>Rename project</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Project name"
              value={renameName}
              onChangeText={setRenameName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenaming(null)}>Cancel</Button>
            <Button onPress={confirmRename} disabled={!renameName.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleting !== null} onDismiss={() => setDeleting(null)}>
          <Dialog.Title>Delete project?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              &ldquo;{deleting?.name}&rdquo; and all its scenarios will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleting(null)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={confirmDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 96,
    gap: 8,
  },
  card: {
    marginBottom: 8,
  },
  avatar: {
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  emptyIcon: {
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 8,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptyButton: {
    marginTop: 8,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
