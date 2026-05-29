export function InstallButton() {
  const appUrl = import.meta.env.VITE_GITHUB_APP_URL || '#';

  return (
    <a href={appUrl} target="_blank" rel="noreferrer" style={styles.btn}>
      + Install GitHub App on a repo
    </a>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-block',
    background: '#238636',
    color: '#fff',
    borderRadius: 6,
    padding: '8px 16px',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
};
