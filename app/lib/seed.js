// =============================================
// Database Seed Logic
// =============================================
import connectDB from './mongodb.js';
import User from './models/User.js';
import ChiBo from './models/ChiBo.js';
import ProcessTemplate from './models/ProcessTemplate.js';
import { DEFAULT_PROCESS_STEPS, CHI_BO_LIST } from './constants.js';

const DEFAULT_ADMIN = {
  username: 'qtv',
  hoTen: 'Quản trị viên',
  email: '',
  role: 'admin',
  password: 'Dang@2026',
  ngayTao: '2025-01-01',
  active: true,
};

export async function seedDatabase() {
  await connectDB();

  // Seed admin user if no users exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create(DEFAULT_ADMIN);
    console.log('[Seed] Created default admin user');
  }

  // Seed process templates if none exist
  const templateCount = await ProcessTemplate.countDocuments();
  if (templateCount === 0) {
    await ProcessTemplate.insertMany(DEFAULT_PROCESS_STEPS);
    console.log('[Seed] Created default process templates');
  }

  // Seed chi bo if none exist
  const chiBoCount = await ChiBo.countDocuments();
  if (chiBoCount === 0) {
    await ChiBo.insertMany(CHI_BO_LIST);
    console.log('[Seed] Created default chi bo list');
  }
}
