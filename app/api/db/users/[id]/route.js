// API: /api/db/users/[id] — PUT, DELETE
import connectDB from '../../../../lib/mongodb';
import User from '../../../../lib/models/User';

const SUPERADMIN_USERNAME = 'qtv';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const user = await User.findById(id);
    if (!user) return Response.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });

    // Protect superadmin
    if (user.username === SUPERADMIN_USERNAME) {
      if (body.username && body.username !== SUPERADMIN_USERNAME) {
        return Response.json({ error: 'Không thể đổi username của tài khoản SuperAdmin!' }, { status: 403 });
      }
      if (body.role && body.role !== 'admin') {
        return Response.json({ error: 'Không thể đổi vai trò của tài khoản SuperAdmin!' }, { status: 403 });
      }
      if (body.active === false) {
        return Response.json({ error: 'Không thể vô hiệu hóa tài khoản SuperAdmin!' }, { status: 403 });
      }
    }

    // Prevent username change for all users
    if (body.username) delete body.username;

    Object.assign(user, body);
    await user.save();

    const result = user.toObject();
    return Response.json({ ...result, id: result._id.toString(), _id: undefined });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) return Response.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });

    if (user.username === SUPERADMIN_USERNAME) {
      return Response.json({ error: 'Không thể xóa tài khoản SuperAdmin!' }, { status: 403 });
    }

    await User.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
