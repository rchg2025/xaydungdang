// API: /api/db/chibo — GET, POST, PUT, DELETE
import prisma from '../../../lib/prisma';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    const list = await prisma.chiBo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return Response.json(list);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ten } = body;

    if (!ten || !ten.trim()) {
      return Response.json({ error: 'Tên chi bộ/đảng bộ không được để trống!' }, { status: 400 });
    }

    const trimmedTen = ten.trim();
    const existing = await prisma.chiBo.findUnique({ where: { ten: trimmedTen } });
    if (existing) {
      return Response.json({ error: `"${trimmedTen}" đã tồn tại!` }, { status: 400 });
    }

    const chiBo = await prisma.chiBo.create({
      data: {
        ten: trimmedTen,
        biThu: body.biThu || '',
        chanhVanPhong: body.chanhVanPhong || '',
        soDienThoai: body.soDienThoai || '',
        email: body.email || '',
      }
    });

    return Response.json(chiBo, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { oldTen, data } = await request.json();

    if (!oldTen || !data?.ten) {
      return Response.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const chiBo = await prisma.chiBo.findUnique({ where: { ten: oldTen } });
    if (!chiBo) return Response.json({ error: 'Không tìm thấy đơn vị' }, { status: 404 });

    // If name changed, check for duplicates and update applicants
    if (data.ten !== oldTen) {
      const dup = await prisma.chiBo.findUnique({ where: { ten: data.ten } });
      if (dup) return Response.json({ error: `"${data.ten}" đã tồn tại!` }, { status: 400 });
      // Update all applicants referencing old name
      await prisma.applicant.updateMany({
        where: { chiBoDangBo: oldTen },
        data: { chiBoDangBo: data.ten },
      });
    }

    const updatedChiBo = await prisma.chiBo.update({
      where: { ten: oldTen },
      data,
    });

    return Response.json(updatedChiBo);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { ten } = await request.json();
    await prisma.chiBo.delete({ where: { ten } });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
