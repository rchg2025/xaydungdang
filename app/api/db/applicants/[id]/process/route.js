// API: /api/db/applicants/[id]/process — PUT update step
import prisma from '../../../../../lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { soThuTu, trangThai, ghiChu, nguoiCapNhat, lyDoTuChoi } = await request.json();

    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });
    if (!applicant) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const step = await prisma.processStep.findUnique({
      where: { applicantId_soThuTu: { applicantId: id, soThuTu } }
    });
    if (!step) return Response.json({ error: `Không tìm thấy bước ${soThuTu}` }, { status: 404 });

    const now = new Date();
    
    await prisma.processStep.update({
      where: { id: step.id },
      data: {
        trangThai,
        ngayCapNhat: now.toISOString().slice(0, 10),
        gioCapNhat: now.toLocaleTimeString('vi-VN'),
        ghiChu: ghiChu !== undefined ? ghiChu : step.ghiChu,
        nguoiCapNhat: nguoiCapNhat || step.nguoiCapNhat,
        lyDoTuChoi: lyDoTuChoi !== undefined ? lyDoTuChoi : step.lyDoTuChoi,
      }
    });

    const updatedApplicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        quyTrinh: {
          orderBy: { soThuTu: 'asc' }
        }
      }
    });

    return Response.json(updatedApplicant);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
