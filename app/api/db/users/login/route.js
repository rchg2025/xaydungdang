// API: /api/db/users/login — POST
import prisma from '../../../../lib/prisma';
import { seedDatabase } from '../../../../lib/seed';

export async function POST(request) {
  try {
    await seedDatabase();
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return Response.json({ error: 'Sai tên đăng nhập hoặc mật khẩu!' }, { status: 401 });
    }

    if (!user.active) {
      return Response.json({ error: 'Tài khoản đã bị vô hiệu hóa!' }, { status: 403 });
    }

    if (user.password !== password) {
      return Response.json({ error: 'Sai tên đăng nhập hoặc mật khẩu!' }, { status: 401 });
    }

    // Return user without password
    const { password: _, ...safeUser } = user;
    return Response.json(safeUser);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
