// API: /api/db/applicants/[id] — GET, PUT, DELETE
import connectDB from '../../../../lib/mongodb';
import Applicant from '../../../../lib/models/Applicant';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const applicant = await Applicant.findById(id).lean();
    if (!applicant) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (applicant.quyTrinh) applicant.quyTrinh.sort((x, y) => x.soThuTu - y.soThuTu);
    return Response.json({ ...applicant, id: applicant._id.toString(), _id: undefined });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const applicant = await Applicant.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!applicant) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (applicant.quyTrinh) applicant.quyTrinh.sort((x, y) => x.soThuTu - y.soThuTu);
    return Response.json({ ...applicant, id: applicant._id.toString(), _id: undefined });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    await Applicant.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
