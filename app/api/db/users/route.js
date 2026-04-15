// API: /api/db/users — GET, POST
import connectDB from '../../../lib/mongodb';
import User from '../../../lib/models/User';
import { seedDatabase } from '../../../lib/seed';

export async function GET() {
  try {
    await connectDB();
    await seedDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const data = users.map(u => ({ ...u, id: u._id.toString(), _id: undefined }));
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, hoTen, password, role, email } = body;

    if (!username || !hoTen || !password) {
      return Response.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return Response.json({ error: `Tên đăng nhập "${username}" đã tồn tại!` }, { status: 400 });
    }

    const user = await User.create({
      username, hoTen, password, email: email || '',
      role: role || 'bien_tap_vien',
      ngayTao: new Date().toISOString().slice(0, 10),
      active: true,
    });

    return Response.json({ ...user.toObject(), id: user._id.toString() }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
