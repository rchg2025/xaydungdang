// API: /api/db/email-templates — GET, POST/PUT
import connectDB from '../../../lib/mongodb';
import EmailTemplate from '../../../lib/models/EmailTemplate';

// Default templates
const DEFAULTS = {
  ket_nap: {
    subject: 'Thông báo tiến trình Kết nạp Đảng - {{hoTen}}',
    body: `Kính gửi {{hoTen}},\n\nHệ thống Quản lý Quy trình Kết nạp Đảng xin thông báo:\n\nHồ sơ của bạn tại {{chiBo}} đang được xử lý.\n- Bước hiện tại: {{buocHienTai}}/{{tongBuoc}}\n\nVui lòng liên hệ Chi bộ/Đảng bộ cơ sở để biết thêm chi tiết.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  du_bi: {
    subject: 'Thông báo Đảng viên Dự bị - {{hoTen}}',
    body: `Kính gửi {{hoTen}},\n\nChúc mừng bạn đã được công nhận là Đảng viên Dự bị tại {{chiBo}}.\n\nBạn cần tiếp tục phấn đấu, rèn luyện trong thời gian dự bị 12 tháng.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  hoan_thanh: {
    subject: 'Chúc mừng hoàn thành quy trình - {{hoTen}}',
    body: `Kính gửi {{hoTen}},\n\nChúc mừng bạn đã hoàn thành toàn bộ quy trình kết nạp Đảng tại {{chiBo}}.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  huy_ho_so: {
    subject: 'Thông báo Hủy hồ sơ - {{hoTen}}',
    body: `Kính gửi {{hoTen}},\n\nHồ sơ kết nạp Đảng của bạn tại {{chiBo}} đã bị hủy.\n\nVui lòng liên hệ Chi bộ/Đảng bộ cơ sở để biết thêm chi tiết.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  thong_bao: {
    subject: 'Thông báo từ Hệ thống Kết nạp Đảng',
    body: `Kính gửi {{hoTen}},\n\nĐây là thông báo từ Hệ thống Quản lý Quy trình Kết nạp Đảng.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  cap_nhat_buoc: {
    subject: '[Cập nhật Hồ sơ] {{hoTen}} - Bước {{buocHienTai}}: {{tenBuoc}}',
    body: `Kính gửi Ban Lãnh đạo {{chiBo}},\n\nHệ thống Quản lý Quy trình Kết nạp Đảng xin thông báo:\n\nHồ sơ quần chúng vừa được cập nhật trạng thái:\n\n- Họ tên: {{hoTen}}\n- Số CCCD: {{cccd}}\n- Chi bộ/Đảng bộ: {{chiBo}}\n- Bước đang xử lý: Bước {{buocHienTai}}/{{tongBuoc}} — {{tenBuoc}}\n- Trạng thái: {{trangThai}}\n- Ngày cập nhật: {{ngay}}\n- Người cập nhật: {{nguoiGui}}\n\nVui lòng kiểm tra hệ thống để biết thêm chi tiết.\n\nTrân trọng,\nHệ thống Quản lý Kết nạp Đảng`,
  },
};

export async function GET() {
  try {
    await connectDB();
    // Return all templates, merged with defaults
    const stored = await EmailTemplate.find({}).lean();
    const result = {};
    Object.entries(DEFAULTS).forEach(([type, def]) => {
      const found = stored.find(t => t.type === type);
      result[type] = found ? { subject: found.subject, body: found.body } : def;
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { type, subject, body, action } = await request.json();

    if (action === 'reset') {
      // Reset to default
      await EmailTemplate.findOneAndDelete({ type });
      return Response.json(DEFAULTS[type] || DEFAULTS.thong_bao);
    }

    if (!subject?.trim() || !body?.trim()) {
      return Response.json({ error: 'Tiêu đề và nội dung không được để trống!' }, { status: 400 });
    }

    await EmailTemplate.findOneAndUpdate(
      { type },
      { type, subject: subject.trim(), body: body.trim() },
      { upsert: true, new: true }
    );

    return Response.json({ subject: subject.trim(), body: body.trim() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
