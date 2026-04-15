// =============================================
// User Store - Multi-user management (localStorage)
// =============================================

const USERS_KEY = 'xaydungdang_users';
const SESSION_KEY = 'xaydungdang_session';

// ---- Roles ----
export const ROLES = {
  ADMIN: 'admin',
  BIEN_TAP_VIEN: 'bien_tap_vien',
};

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  bien_tap_vien: 'Biên tập viên',
};

// ---- Default admin ----
const DEFAULT_ADMIN = {
  id: 'admin_default',
  username: 'qtv',
  hoTen: 'Quản trị viên',
  email: '',
  role: ROLES.ADMIN,
  password: 'Dang@2026',
  ngayTao: '2025-01-01',
  active: true,
};

// ---- Helpers ----
function generateId() {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getUsers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// =============================================
// INIT
// =============================================
export function initializeUsers() {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers([DEFAULT_ADMIN]);
  }
}

// =============================================
// AUTH
// =============================================
export function login(username, password) {
  if (typeof window === 'undefined') return null;
  initializeUsers();
  const users = getUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password && u.active
  );
  if (!user) return null;

  // Save session (exclude password)
  const session = { ...user };
  delete session.password;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAdmin(user) {
  return user && user.role === ROLES.ADMIN;
}

export function isBienTapVien(user) {
  return user && user.role === ROLES.BIEN_TAP_VIEN;
}

// =============================================
// CRUD
// =============================================
export function getAllUsers() {
  initializeUsers();
  return getUsers().map((u) => {
    const { password, ...safe } = u;
    return safe;
  });
}

export function getUserByUsername(username) {
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export function addUser({ username, hoTen, email, role, password }) {
  if (!username || !username.trim()) throw new Error('Tên đăng nhập không được để trống!');
  if (!hoTen || !hoTen.trim()) throw new Error('Họ tên không được để trống!');
  if (!password || password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự!');
  if (!role || ![ROLES.ADMIN, ROLES.BIEN_TAP_VIEN].includes(role)) {
    throw new Error('Vai trò không hợp lệ!');
  }

  const users = getUsers();
  if (users.some((u) => u.username === username.trim())) {
    throw new Error('Tên đăng nhập đã tồn tại!');
  }

  const newUser = {
    id: generateId(),
    username: username.trim(),
    hoTen: hoTen.trim(),
    email: (email || '').trim(),
    role,
    password,
    ngayTao: new Date().toISOString().split('T')[0],
    active: true,
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...safe } = newUser;
  return safe;
}

export function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Không tìm thấy người dùng!');

  // Prevent duplicate username
  if (updates.username && updates.username !== users[idx].username) {
    if (users.some((u) => u.username === updates.username.trim() && u.id !== id)) {
      throw new Error('Tên đăng nhập đã tồn tại!');
    }
  }

  const allowedFields = ['hoTen', 'email', 'role', 'active', 'username'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      users[idx][field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
    }
  });

  saveUsers(users);
  return getAllUsers();
}

export function deleteUser(id) {
  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error('Không tìm thấy người dùng!');

  // Prevent deleting the last admin
  const adminCount = users.filter((u) => u.role === ROLES.ADMIN && u.active).length;
  if (user.role === ROLES.ADMIN && adminCount <= 1) {
    throw new Error('Không thể xóa quản trị viên cuối cùng!');
  }

  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);
  return getAllUsers();
}

export function changePassword(id, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
  }

  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error('Không tìm thấy người dùng!');

  if (user.password !== oldPassword) {
    throw new Error('Mật khẩu hiện tại không đúng!');
  }

  user.password = newPassword;
  saveUsers(users);
}

export function resetPassword(id, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
  }

  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error('Không tìm thấy người dùng!');

  user.password = newPassword;
  saveUsers(users);
}

// ---- Get admin email for "forgot password" screen ----
export function getAdminEmail() {
  if (typeof window === 'undefined') return '';
  initializeUsers();
  const users = getUsers();
  const admin = users.find((u) => u.role === ROLES.ADMIN && u.active);
  return admin ? admin.email : '';
}

// ---- Find user by email (for forgot password) ----
export function findUserByEmail(email) {
  if (typeof window === 'undefined') return null;
  initializeUsers();
  const users = getUsers();
  const user = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// ---- Reset password by email (called after OTP verified) ----
export function resetPasswordByEmail(email, newPassword) {
  if (typeof window === 'undefined') return false;
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
  }

  const users = getUsers();
  const userIdx = users.findIndex((u) => u.email && u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (userIdx === -1) throw new Error('Không tìm thấy tài khoản với email này!');

  users[userIdx].password = newPassword;
  saveUsers(users);
  return true;
}
