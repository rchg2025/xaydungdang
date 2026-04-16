// API: /api/db/users — GET, POST
import prisma from '../../../lib/prisma';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return Response.json(users);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, hoTen, password, role, email } = body;

    if (!username || !hoTen || !password) {
      return Response.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return Response.json({ error: `Tên đăng nhập "${username}" đã tồn tại!` }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username, hoTen, password, email: email || '',
        role: role || 'bien_tap_vien',
        ngayTao: new Date().toISOString().slice(0, 10),
        active: true,
      }
    });

    return Response.json(user, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
