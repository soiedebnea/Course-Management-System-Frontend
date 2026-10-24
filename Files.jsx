import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, uploadFile, downloadFile } from './api.js';

// ---------- course files: list, upload, download, delete ----------
const MAX_MB = 25; // keep in sync with MAX_FILE_MB on the server
const fmt = (b = 0) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export function Materials({ courseId, lessons, isOwner }) {
  const [files, setFiles] = useState([]);
  const [lessonId, setLessonId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);

  const load = useCallback(
    () => api(`/files/course/${courseId}`).then(setFiles).catch((e) => setError(e.message)),
    [courseId]
  );
  useEffect(() => { load(); }, [load]);

  const lessonName = (id) => lessons.find((l) => l._id === id)?.title || 'General';

  const upload = async () => {
    const file = input.current?.files?.[0];
    if (!file) return setError('Choose a file first');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`File is larger than ${MAX_MB} MB`);
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (lessonId) fd.append('lessonId', lessonId);
      await uploadFile(`/files/course/${courseId}`, fd);
      input.current.value = '';
      await load();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const download = (f) => downloadFile(`/files/${f._id}/download`, f.originalName).catch((e) => setError(e.message));
  const remove = async (f) => {
    if (!confirm(`Delete "${f.originalName}"?`)) return;
    try { await api(`/files/${f._id}`, { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <h2>Course files ({files.length})</h2>
      {error && <p className="error">{error}</p>}
      {files.length === 0 && <p className="muted">{isOwner ? 'Upload slides, notes or videos for your students.' : 'No files have been shared yet.'}</p>}
      <ul className="files">
        {files.map((f) => (
          <li key={f._id}>
            <div>
              <strong>{f.originalName}</strong>
              <br /><small>{lessonName(f.lesson)} · {fmt(f.size)}</small>
            </div>
            <button className="link" onClick={() => download(f)}>Download</button>
            {isOwner && <button className="link danger" onClick={() => remove(f)}>Delete</button>}
          </li>
        ))}
      </ul>

      {isOwner && (
        <div className="panel">
          <h3>Upload a file</h3>
          <label>File (max {MAX_MB} MB)<input ref={input} type="file" /></label>
          <label>Attach to lesson
            <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="">Whole course</option>
              {lessons.map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}
            </select>
          </label>
          <button onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload file'}</button>
        </div>
      )}
    </>
  );
}

// ---------- JSON import ----------
// Bulk-import courses from a JSON file (format: backend/sample-courses.json)
export function ImportCourses({ onDone }) {
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setMsg('');
    try {
      const r = await api('/files/import', { method: 'POST', body: JSON.parse(await file.text()) });
      setMsg(`Imported ${r.imported} course${r.imported === 1 ? '' : 's'}`);
      onDone?.();
    } catch (err) { setError(err instanceof SyntaxError ? 'That file is not valid JSON' : err.message); }
  };

  return (
    <div className="panel">
      <h3>Import courses from JSON</h3>
      <p className="muted">Use the format in <code>sample-courses.json</code> from the backend.</p>
      <input type="file" accept=".json,application/json" onChange={pick} />
      {msg && <p>{msg}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}