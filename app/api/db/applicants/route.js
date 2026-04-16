// API: /api/db/applicants — GET all, POST new
import prisma from '../../../lib/prisma';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    const applicants = await prisma.applicant.findMany({
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { cccd, hoTen, ngaySinh, soDienThoai, email, chiBoDangBo } = body;

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

    const applicant = await prisma.applicant.create({
      data: {
        cccd, hoTen, ngaySinh, soDienThoai: soDienThoai || '', email: email || '', chiBoDangBo,
        ngayTao: new Date().toISOString().slice(0, 10),
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

    return Response.json(applicant, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
