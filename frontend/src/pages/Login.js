import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">◆ PROJECTFLOW</div>
        <h1 className="auth-tagline">Ship projects <span>faster.</span></h1>
        <p className="auth-sub">A modern project management tool for focused teams.</p>
        <div className="auth-features">
          {['Kanban boards with drag & drop','Real-time task tracking','Team collaboration built in','Priority & deadline management'].map(f => (
            <div key={f} className="auth-feature">
              <div className="auth-feature-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-desc">Welcome back — pick up where you left off.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <div className="auth-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
