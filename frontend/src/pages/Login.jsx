import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authPageStyle}>
      <div style={authBgStyle} />
      <div style={authCardStyle} className="fade-in">
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={logoIconStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>TaskFlow</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 4, padding: '12px 20px' }}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const authPageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20, position: 'relative', overflow: 'hidden'
};

const authBgStyle = {
  position: 'absolute', inset: 0,
  background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,106,245,0.15) 0%, transparent 60%)',
  pointerEvents: 'none'
};

const authCardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius)', padding: '40px', width: '100%', maxWidth: 420,
  position: 'relative', boxShadow: 'var(--shadow)'
};

const logoIconStyle = {
  width: 38, height: 38, borderRadius: 10, background: 'var(--accent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
