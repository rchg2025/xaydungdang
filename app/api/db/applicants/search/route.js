// API: /api/db/applicants/search — GET search by cccd/chibo
import connectDB from '../../../../lib/mongodb';
import Applicant from '../../../../lib/models/Applicant';
import { seedDatabase } from '../../../../lib/seed';

export async function GET(request) {
  try {
    await connectDB();
    await seedDatabase();
    const { searchParams } = new URL(request.url);
    const cccd = searchParams.get('cccd') || '';
    const chiBo = searchParams.get('chiBo') || '';

    const query = {};
    if (cccd) query.cccd = { $regex: cccd, $options: 'i' };
    if (chiBo) query.chiBoDangBo = { $regex: chiBo, $options: 'i' };

    if (!cccd && !chiBo) {
      return Response.json([]);
    }

    const results = await Applicant.find(query).lean();
    const data = results.map(a => {
      if (a.quyTrinh) a.quyTrinh.sort((x, y) => x.soThuTu - y.soThuTu);
      return { ...a, id: a._id.toString(), _id: undefined };
    });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
