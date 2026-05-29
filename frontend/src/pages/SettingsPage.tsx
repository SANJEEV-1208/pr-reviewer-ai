import { useRepos, useUpdateRepoConfig } from '../hooks/useRepos';
import { RepoConfigForm } from '../components/RepoConfigForm';
import { InstallButton } from '../components/InstallButton';

export function SettingsPage() {
  const { data: repos, isLoading, isError } = useRepos();
  const { mutate: updateConfig, isPending } = useUpdateRepoConfig();

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>Repo Settings</h2>
        <InstallButton />
      </div>

      {isLoading && <p style={styles.status}>Loading repos…</p>}
      {isError && <p style={styles.error}>Failed to load repos.</p>}

      {repos && repos.length === 0 && (
        <div style={styles.empty}>
          <p>No repos connected yet. Install the GitHub App to get started.</p>
        </div>
      )}

      {repos?.map((repo) => (
        <RepoConfigForm
          key={repo.id}
          repo={repo}
          onSave={(repoId, focusRules, enabled) =>
            updateConfig({ repoId, focusRules, enabled })
          }
          isSaving={isPending}
        />
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '0 auto', padding: 24 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 },
  status: { color: '#94a3b8' },
  error: { color: '#f87171' },
  empty: { background: '#16213e', borderRadius: 8, padding: 32, textAlign: 'center', color: '#94a3b8' },
};
