// API: /api/db/applicants — GET all, POST new
import connectDB from '../../../lib/mongodb';
import Applicant from '../../../lib/models/Applicant';
import ProcessTemplate from '../../../lib/models/ProcessTemplate';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await connectDB();
    await seedDatabase();
    const applicants = await Applicant.find({}).sort({ createdAt: -1 }).lean();
    // Convert _id to id string
    const data = applicants.map(a => ({ ...a, id: a._id.toString(), _id: undefined }));
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { cccd, hoTen, ngaySinh, soDienThoai, email, chiBoDangBo } = body;

    if (!cccd || !hoTen || !ngaySinh || !chiBoDangBo) {
      return Response.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Check duplicate CCCD
    const existing = await Applicant.findOne({ cccd });
    if (existing) {
      return Response.json({ error: `CCCD ${cccd} đã tồn tại trong hệ thống!` }, { status: 400 });
    }

    // Get process templates for initial steps
    const templates = await ProcessTemplate.find({}).sort({ soThuTu: 1 }).lean();
    const quyTrinh = templates.map(t => ({
      soThuTu: t.soThuTu,
      tenQuyTrinh: t.tenQuyTrinh,
      trangThai: 'chua_bat_dau',
      ngayCapNhat: '',
      gioCapNhat: '',
      ghiChu: '',
      nguoiCapNhat: '',
      lyDoTuChoi: '',
    }));

    const applicant = await Applicant.create({
      cccd, hoTen, ngaySinh, soDienThoai: soDienThoai || '', email: email || '', chiBoDangBo,
      ngayTao: new Date().toISOString().slice(0, 10),
      quyTrinh,
    });

    return Response.json({ ...applicant.toObject(), id: applicant._id.toString() }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
