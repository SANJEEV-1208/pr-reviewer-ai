import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        PR Reviewer AI
      </Link>
      <div style={styles.links}>
        {isAuthenticated ? (
          <>
            <Link to="/" style={styles.link}>Dashboard</Link>
            <Link to="/settings" style={styles.link}>Settings</Link>
            <span style={styles.user}>{user?.githubLogin}</span>
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt="avatar" style={styles.avatar} />
            )}
            <button onClick={handleLogout} style={styles.btn}>Logout</button>
          </>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#1a1a2e', color: '#fff' },
  brand: { color: '#e94560', fontWeight: 700, fontSize: 18, textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: 16 },
  link: { color: '#ccc', textDecoration: 'none', fontSize: 14 },
  user: { color: '#aaa', fontSize: 13 },
  avatar: { width: 28, height: 28, borderRadius: '50%' },
  btn: { background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 },
};
