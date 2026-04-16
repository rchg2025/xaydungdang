// API: /api/db/email-templates — GET, POST/PUT
import prisma from '../../../lib/prisma';

// Default templates
const DEFAULTS = {
  hoan_thanh: {
    subject: 'Chúc mừng hoàn thành quy trình - {{hoTen}}',
    body: `Kính gửi {{hoTen}},\n\nChúc mừng bạn đã hoàn thành toàn bộ quy trình kết nạp Đảng tại {{chiBo}}.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  huy_ho_so: {
    subject: 'Thông báo Hủy hồ sơ - {{hoTen}}',
    body: `Kính gửi {{hoTen}},\n\nHồ sơ kết nạp Đảng của bạn tại {{chiBo}} đã bị hủy.\n\nVui lòng liên hệ Chi bộ/Đảng bộ cơ sở để biết thêm chi tiết.\n\nTrân trọng,\n{{nguoiGui}}`,
  },
  cap_nhat_buoc: {
    subject: '[Cập nhật Hồ sơ] {{hoTen}} - Bước {{buocHienTai}}: {{tenBuoc}}',
    body: `Kính gửi {{chiBo}},\n\nHệ thống Tiếp nhận và Xử lý hồ sơ Kết nạp Đảng xin thông báo:\n\nHồ sơ quần chúng vừa được cập nhật trạng thái:\n\n- Họ tên: {{hoTen}}\n- Số CCCD: {{cccd}}\n- Chi bộ/Đảng bộ: {{chiBo}}\n- Bước đang xử lý: Bước {{buocHienTai}}/{{tongBuoc}} — {{tenBuoc}}\n- Trạng thái: {{trangThai}}\n- Ngày cập nhật: {{ngay}}\n- Người cập nhật: {{nguoiGui}}\n\nVui lòng kiểm tra hệ thống để biết thêm chi tiết.\n\nTrân trọng,\nHệ thống Tiếp nhận và Xử lý hồ sơ Kết nạp Đảng`,
  },
};

export async function GET() {
  try {
    // Return all templates, merged with defaults
    const stored = await prisma.emailTemplate.findMany();
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
    const { type, subject, body, action } = await request.json();

    if (action === 'reset') {
      // Reset to default
      try {
        await prisma.emailTemplate.delete({ where: { type } });
      } catch (e) {
        // Ignored if not found
      }
      return Response.json(DEFAULTS[type] || DEFAULTS.thong_bao);
    }

    if (!subject?.trim() || !body?.trim()) {
      return Response.json({ error: 'Tiêu đề và nội dung không được để trống!' }, { status: 400 });
    }

    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    await prisma.emailTemplate.upsert({
      where: { type },
      update: { subject: trimmedSubject, body: trimmedBody },
      create: { type, subject: trimmedSubject, body: trimmedBody },
    });

    return Response.json({ subject: trimmedSubject, body: trimmedBody });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
