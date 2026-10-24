import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

// ---------- auth state ----------
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setReady(true));
  }, []);

  const authenticate = async (mode, form) => {
    const d = await api(`/auth/${mode}`, { method: 'POST', body: form });
    localStorage.setItem('token', d.token);
    setUser(d.user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, authenticate, logout }}>{children}</Ctx.Provider>;
}

// ---------- login / register page ----------
export default function Auth() {
  const { authenticate } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setError('');
    try { await authenticate(mode, form); } catch (e) { setError(e.message); }
  };

  return (
    <div className="panel narrow">
      <h1>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
      {mode === 'register' && (
        <>
          <label>Name<input value={form.name} onChange={set('name')} /></label>
          <label>I am a
            <select value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </label>
        </>
      )}
      <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
      <label>Password<input type="password" value={form.password} onChange={set('password')} /></label>
      {error && <p className="error">{error}</p>}
      <button onClick={submit}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </div>
  );
}