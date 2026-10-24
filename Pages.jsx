import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { useAuth } from './auth.jsx';
import { Materials, ImportCourses } from './files.jsx';

// ---------- browse courses ----------
export function Courses() {
  const [courses, setCourses] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/courses?search=${encodeURIComponent(search)}`).then(setCourses).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <h1>Courses</h1>
      <input className="search" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
      {error && <p className="error">{error}</p>}
      {courses && courses.length === 0 && <p className="muted">No courses found.</p>}
      <div className="grid">
        {courses?.map((c) => (
          <Link key={c._id} to={`/courses/${c._id}`} className="card">
            <h3>{c.title}</h3>
            <p className="muted">{c.description || 'No description yet.'}</p>
            <small>{c.instructor?.name} · {c.lessonCount} lessons</small>
          </Link>
        ))}
      </div>
    </>
  );
}

// ---------- progress bar + student dashboard ----------
export const Bar = ({ value }) => (
  <div className="bar-track" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
    <div className="bar-fill" style={{ width: `${value}%` }} />
  </div>
);

export function MyLearning() {
  const [list, setList] = useState(null);
  useEffect(() => { api('/enrollments/me').then(setList); }, []);

  if (!list) return <p>Loading…</p>;
  return (
    <>
      <h1>My learning</h1>
      {list.length === 0 && <p className="muted">You haven't enrolled yet. <Link to="/">Browse courses</Link>.</p>}
      <div className="grid">
        {list.map((e) => (
          <Link key={e._id} to={`/courses/${e.course._id}`} className="card">
            <h3>{e.course.title}</h3>
            <Bar value={e.progress} />
            <small>{e.done} of {e.total} lessons · {e.progress}%</small>
          </Link>
        ))}
      </div>
    </>
  );
}

// ---------- course page: lessons, enroll, progress, files, students ----------
export function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [students, setStudents] = useState([]);
  const [lesson, setLesson] = useState({ title: '', content: '', duration: '' });
  const [error, setError] = useState('');

  const isStudent = user?.role === 'student';
  const isOwner = user?.role === 'instructor' && course && String(course.instructor?._id) === String(user.id);

  const load = useCallback(async () => {
    try {
      const c = await api(`/courses/${id}`);
      setCourse(c);
      if (isStudent) {
        const mine = await api('/enrollments/me');
        setEnrollment(mine.find((e) => e.course._id === id) || null);
      }
      if (user?.role === 'instructor' && String(c.instructor?._id) === String(user.id)) {
        setStudents(await api(`/courses/${id}/students`));
      }
    } catch (e) { setError(e.message); }
  }, [id, isStudent, user]);

  useEffect(() => { load(); }, [load]);

  const run = (fn) => async () => {
    setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message); }
  };

  const enroll = run(() => api('/enrollments', { method: 'POST', body: { courseId: id } }));
  const unenroll = run(() => api(`/enrollments/${id}`, { method: 'DELETE' }));
  const toggle = (lid) => run(() => api(`/enrollments/${id}/lessons/${lid}/toggle`, { method: 'POST' }));
  const addLesson = run(async () => {
    await api(`/courses/${id}/lessons`, { method: 'POST', body: { ...lesson, duration: Number(lesson.duration) || 0 } });
    setLesson({ title: '', content: '', duration: '' });
  });
  const delLesson = (lid) => run(() => api(`/courses/${id}/lessons/${lid}`, { method: 'DELETE' }));

  if (!course) return <p>{error || 'Loading…'}</p>;
  const done = new Set((enrollment?.completedLessons || []).map(String));

  return (
    <>
      <h1>{course.title}</h1>
      <p className="muted">by {course.instructor?.name}</p>
      <p>{course.description}</p>
      {error && <p className="error">{error}</p>}

      {!user && <p><Link to="/auth">Log in</Link> as a student to enroll.</p>}
      {isStudent && !enrollment && <button onClick={enroll}>Enroll in this course</button>}
      {isStudent && enrollment && (
        <div className="panel">
          <Bar value={enrollment.progress} />
          <small>{enrollment.done} of {enrollment.total} lessons complete · {enrollment.progress}%</small>{' '}
          <button className="link" onClick={unenroll}>Unenroll</button>
        </div>
      )}

      <h2>Lessons ({course.lessons.length})</h2>
      {course.lessons.length === 0 && <p className="muted">No lessons added yet.</p>}
      <ol className="lessons">
        {course.lessons.map((l) => (
          <li key={l._id} className={done.has(String(l._id)) ? 'done' : ''}>
            {isStudent && enrollment && (
              <input type="checkbox" checked={done.has(String(l._id))} onChange={toggle(l._id)} aria-label={`Complete ${l.title}`} />
            )}
            <div>
              <strong>{l.title}</strong> {l.duration > 0 && <small>({l.duration} min)</small>}
              {(enrollment || isOwner) && l.content && <p>{l.content}</p>}
            </div>
            {isOwner && <button className="link danger" onClick={delLesson(l._id)}>Delete</button>}
          </li>
        ))}
      </ol>

      {(isOwner || enrollment) && <Materials courseId={id} lessons={course.lessons} isOwner={!!isOwner} />}

      {isOwner && (
        <>
          <div className="panel">
            <h3>Add a lesson</h3>
            <label>Title<input value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} /></label>
            <label>Content<textarea rows="3" value={lesson.content} onChange={(e) => setLesson({ ...lesson, content: e.target.value })} /></label>
            <label>Duration (minutes)<input type="number" min="0" value={lesson.duration} onChange={(e) => setLesson({ ...lesson, duration: e.target.value })} /></label>
            <button onClick={addLesson} disabled={!lesson.title.trim()}>Add lesson</button>
          </div>

          <h2>Enrolled students ({students.length})</h2>
          {students.length === 0 && <p className="muted">No one has enrolled yet.</p>}
          <table>
            <tbody>
              {students.map((s) => (
                <tr key={s.enrollmentId}>
                  <td>{s.student?.name}<br /><small>{s.student?.email}</small></td>
                  <td style={{ width: '40%' }}><Bar value={s.progress} /></td>
                  <td>{s.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p><button className="link" onClick={() => nav(-1)}>Back</button></p>
    </>
  );
}

// ---------- instructor dashboard ----------
export function Teach() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  const load = () => api('/courses/mine/list').then(setCourses).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const create = async () => {
    setError('');
    try {
      await api('/courses', { method: 'POST', body: form });
      setForm({ title: '', description: '' });
      load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this course and all enrollments?')) return;
    await api(`/courses/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <h1>My courses</h1>
      <div className="panel">
        <h3>New course</h3>
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button onClick={create} disabled={!form.title.trim()}>Create course</button>
      </div>
      <ImportCourses onDone={load} />
      {courses.length === 0 && <p className="muted">You haven't created a course yet.</p>}
      <div className="grid">
        {courses.map((c) => (
          <div key={c._id} className="card">
            <h3>{c.title}</h3>
            <small>{c.lessonCount} lessons</small>
            <div className="row">
              <Link to={`/courses/${c._id}`}>Manage</Link>
              <button className="link danger" onClick={() => remove(c._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}