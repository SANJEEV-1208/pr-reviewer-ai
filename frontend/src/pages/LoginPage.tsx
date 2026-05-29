import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InstallButton } from '../components/InstallButton';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');

  // Handle redirect back from /auth/callback?token=...
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/github`;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>PR Reviewer AI</h1>
        <p style={styles.subtitle}>
          Automated code reviews powered by Groq + llama-3.3-70b.
          Get instant feedback on bugs, security issues, and improvements — directly on your GitHub PRs.
        </p>

        {error && (
          <div style={styles.error}>
            Login failed ({error}). Please try again.
          </div>
        )}

        <button onClick={handleLogin} style={styles.loginBtn}>
          Connect GitHub Account
        </button>

        <div style={styles.divider} />

        <p style={styles.installHint}>
          Also install the GitHub App on your repos so it can listen to PR events:
        </p>
        <InstallButton />
      </div>
    </div>
  );
}

// Handle the /auth/callback?token=... redirect from the backend
export function AuthCallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=no_token', { replace: true });
    }
  }, [login, navigate, params]);

  return <div style={{ color: '#fff', padding: 24 }}>Logging in…</div>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1a1a2e', borderRadius: 12, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center' },
  title: { color: '#e94560', fontSize: 28, fontWeight: 700, marginBottom: 12 },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 28 },
  error: { background: '#450a0a', color: '#fca5a5', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
  loginBtn: { background: '#238636', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: 20 },
  divider: { borderTop: '1px solid #2d3748', marginBottom: 20 },
  installHint: { color: '#64748b', fontSize: 13, marginBottom: 12 },
};
