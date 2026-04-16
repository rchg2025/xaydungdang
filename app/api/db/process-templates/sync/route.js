import prisma from '../../../../lib/prisma';

export async function POST() {
  try {
    const templates = await prisma.processTemplate.findMany({
      orderBy: { soThuTu: 'asc' }
    });

    // Strategy to perfectly align all applicants' process steps with the master template schema
    // 1. We must match by `tenQuyTrinh` to preserve the status history!
    // 2. We move ALL existing steps to temporary negative indices based on their ID to avoid Unique Constraint collisions
    // 3. We update them to their correct new index

    // Get all process steps
    const allSteps = await prisma.processStep.findMany();

    // Map template names to their correct `soThuTu`
    const templateMap = {};
    for (const t of templates) {
      templateMap[t.tenQuyTrinh] = t.soThuTu;
    }

    // Assign temporary negative order for all steps to clear the positive `soThuTu` space
    // We will use random negative numbers or decrement greatly.
    // However, Prisma doesn't let us easily bulk update with a dynamic unique decrement in one query if we violate constraints mid-query.
    // We can just iterate through applicants.
    
    // Actually, doing it per applicant is safest to avoid any unique constraint issues:
    const applicants = await prisma.applicant.findMany({
      include: { quyTrinh: true }
    });

    for (const applicant of applicants) {
      // Move all steps of this applicant to temporary negative values
      for (let i = 0; i < applicant.quyTrinh.length; i++) {
        const step = applicant.quyTrinh[i];
        await prisma.processStep.update({
          where: { id: step.id },
          data: { soThuTu: -(i + 1) * 1000 } // temporary negative
        });
      }

      // Now map them back to the correct template `soThuTu`
      // For any step that matches a template name, we assign it the template's `soThuTu`
      // What if an applicant has a step name NOT in the template? We will delete it or assign it to the end?
      // Since it's a strict sync, we delete orphaned steps and add missing steps.
      
      const existingStepNames = applicant.quyTrinh.map(s => s.tenQuyTrinh);
      
      for (const t of templates) {
        if (existingStepNames.includes(t.tenQuyTrinh)) {
          // Find the temporary step
          const originalStep = applicant.quyTrinh.find(s => s.tenQuyTrinh === t.tenQuyTrinh);
          if (originalStep) {
            await prisma.processStep.update({
              where: { id: originalStep.id },
              data: { soThuTu: t.soThuTu }
            });
          }
        } else {
          // Missing step in this applicant, we add it!
          await prisma.processStep.create({
            data: {
              applicantId: applicant.id,
              soThuTu: t.soThuTu,
              tenQuyTrinh: t.tenQuyTrinh,
              trangThai: 'chua_bat_dau',
              ngayCapNhat: '',
              gioCapNhat: '',
              ghiChu: '',
              nguoiCapNhat: '',
              lyDoTuChoi: '',
            }
          });
        }
      }

      // Delete orphaned steps (steps the applicant had that no longer exist in the template)
      const validNames = templates.map(t => t.tenQuyTrinh);
      for (const step of applicant.quyTrinh) {
        if (!validNames.includes(step.tenQuyTrinh)) {
          await prisma.processStep.delete({
            where: { id: step.id }
          });
        }
      }
    }

    return Response.json({ success: true, message: 'Đã đồng bộ hóa tất cả hồ sơ thành công!' });
  } catch (err) {
    console.error('Sync Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
