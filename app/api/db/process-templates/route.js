// API: /api/db/process-templates — GET, POST, PUT, DELETE
import prisma from '../../../lib/prisma';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    const templates = await prisma.processTemplate.findMany({
      orderBy: { soThuTu: 'asc' }
    });
    return Response.json(templates);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { tenQuyTrinh } = await request.json();
    if (!tenQuyTrinh?.trim()) {
      return Response.json({ error: 'Tên bước không được để trống!' }, { status: 400 });
    }

    // Get next soThuTu
    const last = await prisma.processTemplate.findFirst({
      orderBy: { soThuTu: 'desc' }
    });
    const nextNum = last ? last.soThuTu + 1 : 1;

    const template = await prisma.processTemplate.create({
      data: { soThuTu: nextNum, tenQuyTrinh: tenQuyTrinh.trim() }
    });

    // Add step to all existing applicants
    const applicants = await prisma.applicant.findMany({ select: { id: true } });
    if (applicants.length > 0) {
      const data = applicants.map(a => ({
        applicantId: a.id,
        soThuTu: nextNum,
        tenQuyTrinh: tenQuyTrinh.trim(),
        trangThai: 'chua_bat_dau',
        ngayCapNhat: '', gioCapNhat: '', ghiChu: '', nguoiCapNhat: '', lyDoTuChoi: '',
      }));
      await prisma.processStep.createMany({ data });
    }

    const all = await prisma.processTemplate.findMany({ orderBy: { soThuTu: 'asc' } });
    return Response.json(all, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { soThuTu, tenQuyTrinh, action, direction, orderedTemplates } = await request.json();

    if (action === 'rename') {
      await prisma.processTemplate.update({
        where: { soThuTu },
        data: { tenQuyTrinh }
      });
      // Update in all applicants
      await prisma.processStep.updateMany({
        where: { soThuTu },
        data: { tenQuyTrinh }
      });
    } else if (action === 'move') {
      const all = await prisma.processTemplate.findMany({ orderBy: { soThuTu: 'asc' } });
      const idx = all.findIndex(t => t.soThuTu === soThuTu);
      if (idx < 0) return Response.json({ error: 'Không tìm thấy' }, { status: 404 });

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= all.length) {
        return Response.json({ error: 'Không thể di chuyển' }, { status: 400 });
      }

      const num1 = all[idx].soThuTu;
      const num2 = all[swapIdx].soThuTu;

      // Swap in ProcessTemplate
      await prisma.processTemplate.update({ where: { soThuTu: num1 }, data: { soThuTu: -1 } });
      await prisma.processTemplate.update({ where: { soThuTu: num2 }, data: { soThuTu: num1 } });
      await prisma.processTemplate.update({ where: { soThuTu: -1 }, data: { soThuTu: num2 } });

      // Swap in ProcessStep
      await prisma.processStep.updateMany({ where: { soThuTu: num1 }, data: { soThuTu: -1 } });
      await prisma.processStep.updateMany({ where: { soThuTu: num2 }, data: { soThuTu: num1 } });
      await prisma.processStep.updateMany({ where: { soThuTu: -1 }, data: { soThuTu: num2 } });
    } else if (action === 'reorder') {
      if (!orderedTemplates || !Array.isArray(orderedTemplates)) {
        return Response.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
      }

      // 1. Move to negative temporary IDs to avoid UNIQUE constraint violation on `soThuTu`
      for (const item of orderedTemplates) {
        await prisma.processTemplate.update({
          where: { id: item.id },
          data: { soThuTu: -item.oldThuTu }
        });
        await prisma.processStep.updateMany({
          where: { soThuTu: item.oldThuTu },
          data: { soThuTu: -item.oldThuTu }
        });
      }

      // 2. Set to correct new order
      for (let i = 0; i < orderedTemplates.length; i++) {
        const item = orderedTemplates[i];
        const newSoThuTu = i + 1;
        await prisma.processTemplate.update({
          where: { id: item.id },
          data: { soThuTu: newSoThuTu }
        });
        await prisma.processStep.updateMany({
          where: { soThuTu: -item.oldThuTu },
          data: { soThuTu: newSoThuTu }
        });
      }
    }

    const templates = await prisma.processTemplate.findMany({ orderBy: { soThuTu: 'asc' } });
    return Response.json(templates);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { soThuTu } = await request.json();
    await prisma.processTemplate.delete({ where: { soThuTu } });

    // Remove step from all applicants
    await prisma.processStep.deleteMany({ where: { soThuTu } });

    // Re-number remaining
    const remaining = await prisma.processTemplate.findMany({ orderBy: { soThuTu: 'asc' } });
    for (let i = 0; i < remaining.length; i++) {
      const oldNum = remaining[i].soThuTu;
      const newNum = i + 1;
      if (oldNum !== newNum) {
        await prisma.processTemplate.update({
          where: { id: remaining[i].id },
          data: { soThuTu: newNum }
        });
        await prisma.processStep.updateMany({
          where: { soThuTu: oldNum },
          data: { soThuTu: newNum }
        });
      }
    }

    const templates = await prisma.processTemplate.findMany({ orderBy: { soThuTu: 'asc' } });
    return Response.json(templates);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
