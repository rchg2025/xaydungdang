// =============================================
// Database Seed Logic — chỉ chạy 1 lần duy nhất
// =============================================
import connectDB from './mongodb.js';
import User from './models/User.js';
import ChiBo from './models/ChiBo.js';
import ProcessTemplate from './models/ProcessTemplate.js';
import mongoose from 'mongoose';

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

// Schema đơn giản để đánh dấu đã seed
const SeedFlagSchema = new mongoose.Schema({ key: String, seeded: Boolean }, { timestamps: true });
const SeedFlag = mongoose.models.SeedFlag || mongoose.model('SeedFlag', SeedFlagSchema);

export async function seedDatabase() {
  await connectDB();

  // Kiểm tra đã seed chưa — nếu rồi thì bỏ qua
  const flag = await SeedFlag.findOne({ key: 'initial_seed' });
  if (flag?.seeded) return;

  // Seed admin user if no users exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create(DEFAULT_ADMIN);
    console.log('[Seed] Created default admin user');
  }

  // Seed process templates if none exist
  const templateCount = await ProcessTemplate.countDocuments();
  if (templateCount === 0) {
    await ProcessTemplate.insertMany(DEFAULT_STEPS);
    console.log('[Seed] Created default process templates');
  }

  // KHÔNG seed chi bộ mẫu — admin sẽ tự tạo

  // Đánh dấu đã seed xong
  await SeedFlag.findOneAndUpdate(
    { key: 'initial_seed' },
    { key: 'initial_seed', seeded: true },
    { upsert: true }
  );
  console.log('[Seed] Database initialized');
}
