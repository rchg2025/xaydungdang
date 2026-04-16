// =============================================
// Database Seed Logic — chỉ chạy 1 lần duy nhất
// =============================================
import prisma from './prisma.js';

const DEFAULT_ADMIN = {
  username: 'qtv',
  hoTen: 'Quản trị viên',
  email: '',
  role: 'admin',
  password: 'Dang@2026',
  ngayTao: '2025-01-01',
  active: true,
};

const DEFAULT_STEPS = [
  { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng' },
  { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu' },
  { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng' },
  { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu' },
  { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp' },
  { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét' },
  { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt' },
  { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp' },
  { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)' },
  { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức' },
];

let isSeeded = false;

export async function seedDatabase() {
  if (isSeeded) return;

  // Kiểm tra đã seed chưa — nếu rồi thì bỏ qua
  const flag = await prisma.seedFlag.findUnique({ where: { key: 'initial_seed' } });
  if (flag?.seeded) {
    isSeeded = true;
    return;
  }

  // Seed admin user if no users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.create({ data: DEFAULT_ADMIN });
    console.log('[Seed] Created default admin user');
  }

  // Seed process templates if none exist
  const templateCount = await prisma.processTemplate.count();
  if (templateCount === 0) {
    await prisma.processTemplate.createMany({ data: DEFAULT_STEPS });
    console.log('[Seed] Created default process templates');
  }

  // Đánh dấu đã seed xong
  await prisma.seedFlag.upsert({
    where: { key: 'initial_seed' },
    update: { seeded: true },
    create: { key: 'initial_seed', seeded: true },
  });
  isSeeded = true;
  console.log('[Seed] Database initialized');
}
