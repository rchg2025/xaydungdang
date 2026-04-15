// API: /api/db/applicants/stats — GET statistics
import connectDB from '../../../../lib/mongodb';
import Applicant from '../../../../lib/models/Applicant';
import { seedDatabase } from '../../../../lib/seed';

export async function GET() {
  try {
    await connectDB();
    await seedDatabase();
    const all = await Applicant.find({}).lean();

    const tongSo = all.length;
    let dangXuLy = 0, daHoanThanh = 0, choXuLy = 0, daHuy = 0;

    all.forEach(a => {
      const hasHuy = a.quyTrinh.some(s => s.trangThai === 'huy_ho_so');
      if (hasHuy) { daHuy++; return; }
      const allDone = a.quyTrinh.every(s => s.trangThai === 'da_nhan_phan_hoi');
      if (allDone) { daHoanThanh++; return; }
      const hasDang = a.quyTrinh.some(s => s.trangThai === 'dang_xu_ly' || s.trangThai === 'da_gui');
      if (hasDang) { dangXuLy++; return; }
      choXuLy++;
    });

    return Response.json({ tongSo, dangXuLy, daHoanThanh, choXuLy, daHuy });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
