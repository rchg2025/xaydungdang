// API: /api/db/applicants/[id]/process — PUT update step
import connectDB from '../../../../../lib/mongodb';
import Applicant from '../../../../../lib/models/Applicant';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { soThuTu, trangThai, ghiChu, nguoiCapNhat, lyDoTuChoi } = await request.json();

    const applicant = await Applicant.findById(id);
    if (!applicant) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const step = applicant.quyTrinh.find(s => s.soThuTu === soThuTu);
    if (!step) return Response.json({ error: `Không tìm thấy bước ${soThuTu}` }, { status: 404 });

    const now = new Date();
    step.trangThai = trangThai;
    step.ngayCapNhat = now.toISOString().slice(0, 10);
    step.gioCapNhat = now.toLocaleTimeString('vi-VN');
    if (ghiChu !== undefined) step.ghiChu = ghiChu;
    if (nguoiCapNhat) step.nguoiCapNhat = nguoiCapNhat;
    if (lyDoTuChoi !== undefined) step.lyDoTuChoi = lyDoTuChoi;

    await applicant.save();

    const result = applicant.toObject();
    if (result.quyTrinh) result.quyTrinh.sort((x, y) => x.soThuTu - y.soThuTu);
    return Response.json({ ...result, id: result._id.toString(), _id: undefined });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
