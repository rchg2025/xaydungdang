// API: /api/db/applicants/[id] — GET, PUT, DELETE
import prisma from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        quyTrinh: {
          orderBy: { soThuTu: 'asc' }
        }
      }
    });

    if (!applicant) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    return Response.json(applicant);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if applicant exists
    const existing = await prisma.applicant.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    // Update applicant
    // Do not update quyTrinh from this endpoint, only base fields
    const { quyTrinh, ...updateData } = body;
    
    const applicant = await prisma.applicant.update({
      where: { id },
      data: updateData,
      include: {
        quyTrinh: {
          orderBy: { soThuTu: 'asc' }
        }
      }
    });

    return Response.json(applicant);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.applicant.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
