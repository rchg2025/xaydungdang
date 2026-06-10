// API: /api/db/applicants — GET all, POST new
import prisma from '../../../lib/prisma';
import { seedDatabase } from '../../../lib/seed';

export async function GET(request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(request.url);
    const chiBoDangBo = searchParams.get('chiBoDangBo');
    
    const where = chiBoDangBo ? { chiBoDangBo } : {};

    const applicants = await prisma.applicant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        quyTrinh: {
          orderBy: { soThuTu: 'asc' }
        }
      }
    });

    return Response.json(applicants);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

  // Helper function to send email via local API
  const sendEmailAlert = async (to, subject, text) => {
    try {
      const baseUrl = request.nextUrl.origin;
      await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, toName: '', subject, message: text })
      });
    } catch (e) {
      console.error('Failed to send email:', e);
    }
  };

  try {
    const body = await request.json();
    const { cccd, hoTen, ngaySinh, soDienThoai, email, chiBoDangBo, nguoiTaoEmail, role } = body;

    if (!cccd || !hoTen || !ngaySinh || !chiBoDangBo) {
      return Response.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Check duplicate CCCD
    const existing = await prisma.applicant.findUnique({ where: { cccd } });
    if (existing) {
      return Response.json({ error: `CCCD ${cccd} đã tồn tại trong hệ thống!` }, { status: 400 });
    }

    // Get process templates for initial steps
    const templates = await prisma.processTemplate.findMany({
      orderBy: { soThuTu: 'asc' }
    });
    
    const quyTrinhData = templates.map(t => ({
      soThuTu: t.soThuTu,
      tenQuyTrinh: t.tenQuyTrinh,
      trangThai: 'chua_bat_dau',
      ngayCapNhat: '',
      gioCapNhat: '',
      ghiChu: '',
      nguoiCapNhat: '',
      lyDoTuChoi: '',
    }));

    const isThanhVien = role === 'thanh_vien';
    const initialTrangThaiDuyet = isThanhVien ? 'cho_duyet' : 'da_duyet';

    const applicant = await prisma.applicant.create({
      data: {
        cccd, hoTen, ngaySinh, soDienThoai: soDienThoai || '', email: email || '', chiBoDangBo,
        ngayTao: new Date().toISOString().slice(0, 10),
        trangThaiDuyet: initialTrangThaiDuyet,
        nguoiTaoEmail: nguoiTaoEmail || '',
        quyTrinh: {
          create: quyTrinhData
        }
      },
      include: {
        quyTrinh: {
          orderBy: { soThuTu: 'asc' }
        }
      }
    });

    if (isThanhVien) {
      // Find all admins and editors to notify
      const approvers = await prisma.user.findMany({
        where: {
          role: { in: ['admin', 'bien_tap_vien'] },
          active: true,
          email: { not: '' }
        }
      });
      
      if (approvers.length > 0) {
        const approverEmails = approvers.map(a => a.email).filter(Boolean);
        const uniqueEmails = [...new Set(approverEmails)];
        const subject = `[Chờ Duyệt] Hồ sơ quần chúng mới: ${hoTen}`;
        const message = `Có hồ sơ quần chúng mới được gửi từ Chi bộ/Đảng bộ: ${chiBoDangBo}

Thông tin hồ sơ:
- Họ tên: ${hoTen}
- CCCD: ${cccd}
- Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}

Vui lòng đăng nhập vào hệ thống để kiểm tra và duyệt hồ sơ này.
Đường dẫn: ${request.nextUrl.origin}/admin#applicants`;

        for (const mail of uniqueEmails) {
          sendEmailAlert(mail, subject, message); // async without awaiting to not block response
        }
      }
    }

    return Response.json(applicant, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
