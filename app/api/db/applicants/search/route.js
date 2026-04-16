// API: /api/db/applicants/search — GET search by cccd/chibo
import prisma from '../../../../lib/prisma';
import { seedDatabase } from '../../../../lib/seed';

export async function GET(request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(request.url);
    const cccd = searchParams.get('cccd') || '';
    const chiBo = searchParams.get('chiBo') || '';

    if (!cccd && !chiBo) {
      return Response.json([]);
    }

    const where = {};
    if (cccd) where.cccd = { contains: cccd, mode: 'insensitive' };
    if (chiBo) where.chiBoDangBo = { contains: chiBo, mode: 'insensitive' };

    const results = await prisma.applicant.findMany({
      where,
      include: {
        quyTrinh: {
          orderBy: { soThuTu: 'asc' }
        }
      }
    });

    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
