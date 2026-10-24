const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// fetch that explains network failures instead of showing "Failed to fetch"
async function request(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error(`Cannot reach the server at ${BASE}. Is the backend running (npm run dev in backend/)?`);
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await request(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const authHeader = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Multipart upload (no Content-Type header: the browser sets the boundary)
export async function uploadFile(path, formData) {
  const res = await request(BASE + path, { method: 'POST', headers: authHeader(), body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

// Authenticated download: fetch as a blob, then trigger a save
export async function downloadFile(path, filename) {
  const res = await request(BASE + path, { headers: authHeader() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Download failed');
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}