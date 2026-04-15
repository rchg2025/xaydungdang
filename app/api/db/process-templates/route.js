// API: /api/db/process-templates — GET, POST, PUT, DELETE
import connectDB from '../../../lib/mongodb';
import ProcessTemplate from '../../../lib/models/ProcessTemplate';
import Applicant from '../../../lib/models/Applicant';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await connectDB();
    await seedDatabase();
    const templates = await ProcessTemplate.find({}).sort({ soThuTu: 1 }).lean();
    return Response.json(templates.map(t => ({ ...t, id: t._id.toString(), _id: undefined })));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { tenQuyTrinh } = await request.json();
    if (!tenQuyTrinh?.trim()) {
      return Response.json({ error: 'Tên bước không được để trống!' }, { status: 400 });
    }

    // Get next soThuTu
    const last = await ProcessTemplate.findOne({}).sort({ soThuTu: -1 });
    const nextNum = last ? last.soThuTu + 1 : 1;

    const template = await ProcessTemplate.create({ soThuTu: nextNum, tenQuyTrinh: tenQuyTrinh.trim() });

    // Add step to all existing applicants
    await Applicant.updateMany({}, {
      $push: {
        quyTrinh: {
          soThuTu: nextNum,
          tenQuyTrinh: tenQuyTrinh.trim(),
          trangThai: 'chua_bat_dau',
          ngayCapNhat: '', gioCapNhat: '', ghiChu: '', nguoiCapNhat: '', lyDoTuChoi: '',
        }
      }
    });

    const all = await ProcessTemplate.find({}).sort({ soThuTu: 1 }).lean();
    return Response.json(all.map(t => ({ ...t, id: t._id.toString(), _id: undefined })), { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { soThuTu, tenQuyTrinh, action, direction } = await request.json();

    if (action === 'rename') {
      await ProcessTemplate.findOneAndUpdate({ soThuTu }, { tenQuyTrinh });
      // Update in all applicants
      await Applicant.updateMany(
        { 'quyTrinh.soThuTu': soThuTu },
        { $set: { 'quyTrinh.$.tenQuyTrinh': tenQuyTrinh } }
      );
    } else if (action === 'move') {
      const all = await ProcessTemplate.find({}).sort({ soThuTu: 1 });
      const idx = all.findIndex(t => t.soThuTu === soThuTu);
      if (idx < 0) return Response.json({ error: 'Không tìm thấy' }, { status: 404 });

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= all.length) {
        return Response.json({ error: 'Không thể di chuyển' }, { status: 400 });
      }

      const num1 = all[idx].soThuTu;
      const num2 = all[swapIdx].soThuTu;

      // Dùng số tạm để tránh lỗi Duplicate Key
      all[idx].soThuTu = -1;
      await all[idx].save();

      all[swapIdx].soThuTu = num1;
      await all[swapIdx].save();

      all[idx].soThuTu = num2;
      await all[idx].save();

      // Đảo vị trí trong hồ sơ quần chúng (Applicant) -> cũng thông qua bước trung gian
      await Applicant.updateMany(
        { 'quyTrinh.soThuTu': num1 },
        { $set: { 'quyTrinh.$.soThuTu': -1 } }
      );
      await Applicant.updateMany(
        { 'quyTrinh.soThuTu': num2 },
        { $set: { 'quyTrinh.$.soThuTu': num1 } }
      );
      await Applicant.updateMany(
        { 'quyTrinh.soThuTu': -1 },
        { $set: { 'quyTrinh.$.soThuTu': num2 } }
      );
      
      // Sắp xếp lại mảng quyTrinh bên trong Applicant sau khi đổi số thứ tự
      // (MongoDB aggregate update pipeline để sắp xếp cực kỳ phức tạp, ta có thể để FE/hàm getCurrentStep lo dựa trên soThuTu,
      // hoặc lấy hết ra .sort rồi lưu lại. Ở đây vì dữ liệu ít, quy mô nhỏ, ta có thể để yên, các hàm tìm bước tiếp theo dùng find() là an toàn)
    }

    const templates = await ProcessTemplate.find({}).sort({ soThuTu: 1 }).lean();
    return Response.json(templates.map(t => ({ ...t, id: t._id.toString(), _id: undefined })));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { soThuTu } = await request.json();
    await ProcessTemplate.findOneAndDelete({ soThuTu });

    // Remove step from all applicants
    await Applicant.updateMany({}, { $pull: { quyTrinh: { soThuTu } } });

    // Re-number remaining
    const remaining = await ProcessTemplate.find({}).sort({ soThuTu: 1 });
    for (let i = 0; i < remaining.length; i++) {
      const oldNum = remaining[i].soThuTu;
      const newNum = i + 1;
      if (oldNum !== newNum) {
        remaining[i].soThuTu = newNum;
        await remaining[i].save();
        await Applicant.updateMany(
          { 'quyTrinh.soThuTu': oldNum },
          { $set: { 'quyTrinh.$.soThuTu': newNum } }
        );
      }
    }

    const templates = await ProcessTemplate.find({}).sort({ soThuTu: 1 }).lean();
    return Response.json(templates.map(t => ({ ...t, id: t._id.toString(), _id: undefined })));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
