// API: /api/db/chibo — GET, POST
import connectDB from '../../../lib/mongodb';
import ChiBo from '../../../lib/models/ChiBo';
import Applicant from '../../../lib/models/Applicant';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await connectDB();
    await seedDatabase();
    const list = await ChiBo.find({}).sort({ createdAt: -1 }).lean();
    const data = list.map(c => ({ ...c, id: c._id.toString(), _id: undefined }));
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { ten } = body;

    if (!ten || !ten.trim()) {
      return Response.json({ error: 'Tên chi bộ/đảng bộ không được để trống!' }, { status: 400 });
    }

    const existing = await ChiBo.findOne({ ten: ten.trim() });
    if (existing) {
      return Response.json({ error: `"${ten}" đã tồn tại!` }, { status: 400 });
    }

    const chiBo = await ChiBo.create({
      ten: ten.trim(),
      biThu: body.biThu || '',
      chanhVanPhong: body.chanhVanPhong || '',
      soDienThoai: body.soDienThoai || '',
      email: body.email || '',
    });

    return Response.json({ ...chiBo.toObject(), id: chiBo._id.toString() }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { oldTen, data } = await request.json();

    if (!oldTen || !data?.ten) {
      return Response.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const chiBo = await ChiBo.findOne({ ten: oldTen });
    if (!chiBo) return Response.json({ error: 'Không tìm thấy đơn vị' }, { status: 404 });

    // If name changed, check for duplicates and update applicants
    if (data.ten !== oldTen) {
      const dup = await ChiBo.findOne({ ten: data.ten });
      if (dup) return Response.json({ error: `"${data.ten}" đã tồn tại!` }, { status: 400 });
      // Update all applicants referencing old name
      await Applicant.updateMany({ chiBoDangBo: oldTen }, { chiBoDangBo: data.ten });
    }

    Object.assign(chiBo, data);
    await chiBo.save();

    return Response.json({ ...chiBo.toObject(), id: chiBo._id.toString() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { ten } = await request.json();
    await ChiBo.findOneAndDelete({ ten });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
