import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Auth, { useAuth } from './auth.jsx';
import { Courses, CourseDetail, MyLearning, Teach } from './pages.jsx';

export default function App() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <p className="wrap">Loading…</p>;

  return (
    <>
      <header className="bar">
        <NavLink to="/" className="brand">Course Manager</NavLink>
        <nav>
          <NavLink to="/">Courses</NavLink>
          {user?.role === 'student' && <NavLink to="/learning">My learning</NavLink>}
          {user?.role === 'instructor' && <NavLink to="/teach">My courses</NavLink>}
          {user ? (
            <button className="link" onClick={logout}>Log out ({user.name})</button>
          ) : (
            <NavLink to="/auth">Log in</NavLink>
          )}
        </nav>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/learning" element={user?.role === 'student' ? <MyLearning /> : <Navigate to="/auth" />} />
          <Route path="/teach" element={user?.role === 'instructor' ? <Teach /> : <Navigate to="/auth" />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}