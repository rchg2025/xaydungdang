// =============================================
// API Client — All database operations via API routes
// Replaces localStorage-based store.js, userStore.js, emailTemplateStore.js
// =============================================

const API = '/api/db';

// ---- Generic fetch helper ----
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
  return data;
}

// =============================================
// APPLICANTS
// =============================================
export async function fetchApplicants() {
  return apiFetch(`${API}/applicants`);
}

export async function fetchApplicant(id) {
  return apiFetch(`${API}/applicants/${id}`);
}

export async function createApplicant(data) {
  return apiFetch(`${API}/applicants`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateApplicantAPI(id, data) {
  return apiFetch(`${API}/applicants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteApplicantAPI(id) {
  return apiFetch(`${API}/applicants/${id}`, { method: 'DELETE' });
}

export async function updateProcessStepAPI(id, soThuTu, trangThai, ghiChu = '', nguoiCapNhat = '', lyDoTuChoi = '') {
  return apiFetch(`${API}/applicants/${id}/process`, {
    method: 'PUT',
    body: JSON.stringify({ soThuTu, trangThai, ghiChu, nguoiCapNhat, lyDoTuChoi }),
  });
}

export async function searchApplicantsAPI(cccd = '', chiBo = '') {
  const params = new URLSearchParams();
  if (cccd) params.set('cccd', cccd);
  if (chiBo) params.set('chiBo', chiBo);
  return apiFetch(`${API}/applicants/search?${params}`);
}

export async function fetchStats() {
  return apiFetch(`${API}/applicants/stats`);
}

// =============================================
// USERS
// =============================================
export async function fetchUsers() {
  return apiFetch(`${API}/users`);
}

export async function createUser(data) {
  return apiFetch(`${API}/users`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUserAPI(id, data) {
  return apiFetch(`${API}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUserAPI(id) {
  return apiFetch(`${API}/users/${id}`, { method: 'DELETE' });
}

export async function loginAPI(username, password) {
  return apiFetch(`${API}/users/login`, { method: 'POST', body: JSON.stringify({ username, password }) });
}

// =============================================
// CHI BỘ
// =============================================
export async function fetchChiBoList() {
  return apiFetch(`${API}/chibo`);
}

export async function createChiBo(data) {
  return apiFetch(`${API}/chibo`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateChiBoAPI(oldTen, data) {
  return apiFetch(`${API}/chibo`, { method: 'PUT', body: JSON.stringify({ oldTen, data }) });
}

export async function deleteChiBoAPI(ten) {
  return apiFetch(`${API}/chibo`, { method: 'DELETE', body: JSON.stringify({ ten }) });
}

// =============================================
// PROCESS TEMPLATES
// =============================================
export async function fetchProcessTemplates() {
  return apiFetch(`${API}/process-templates`);
}

export async function createProcessTemplate(tenQuyTrinh) {
  return apiFetch(`${API}/process-templates`, { method: 'POST', body: JSON.stringify({ tenQuyTrinh }) });
}

export async function renameProcessTemplate(soThuTu, tenQuyTrinh) {
  return apiFetch(`${API}/process-templates`, {
    method: 'PUT', body: JSON.stringify({ soThuTu, tenQuyTrinh, action: 'rename' }),
  });
}

export async function moveProcessTemplate(soThuTu, direction) {
  return apiFetch(`${API}/process-templates`, {
    method: 'PUT', body: JSON.stringify({ soThuTu, direction, action: 'move' }),
  });
}

export async function deleteProcessTemplate(soThuTu) {
  return apiFetch(`${API}/process-templates`, { method: 'DELETE', body: JSON.stringify({ soThuTu }) });
}

// =============================================
// EMAIL TEMPLATES
// =============================================
export async function fetchEmailTemplates() {
  return apiFetch(`${API}/email-templates`);
}

export async function saveEmailTemplate(type, subject, body) {
  return apiFetch(`${API}/email-templates`, { method: 'POST', body: JSON.stringify({ type, subject, body }) });
}

export async function resetEmailTemplate(type) {
  return apiFetch(`${API}/email-templates`, { method: 'POST', body: JSON.stringify({ type, action: 'reset' }) });
}

// =============================================
// SESSION (localStorage only — per browser)
// =============================================
const SESSION_KEY = 'xaydungdang_session';

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

// =============================================
// HELPERS
// =============================================
export function getCurrentStep(applicant) {
  if (!applicant?.quyTrinh) return 0;
  const hasHuy = applicant.quyTrinh.some(s => s.trangThai === 'huy_ho_so');
  if (hasHuy) return -1;
  const nextStep = applicant.quyTrinh.find(s => s.trangThai !== 'da_nhan_phan_hoi');
  if (!nextStep) return applicant.quyTrinh.length;
  return nextStep.soThuTu;
}

// SuperAdmin constant
export const SUPERADMIN_USERNAME = 'qtv';

export const ROLES = {
  ADMIN: 'admin',
  BIEN_TAP_VIEN: 'bien_tap_vien',
};

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  bien_tap_vien: 'Biên tập viên',
};
