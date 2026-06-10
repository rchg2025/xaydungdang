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

// Helper function to send email via local API
const sendEmailAlert = async (request, to, subject, text) => {
  try {
    const baseUrl = request.nextUrl.origin;
    await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, toName: '', subject, message: text })
    });
  } catch (e) {
    console.error('Failed to send email:', e);
  }
};

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

    // Check if trangThaiDuyet changed
    if (updateData.trangThaiDuyet && updateData.trangThaiDuyet !== existing.trangThaiDuyet) {
      if (applicant.nguoiTaoEmail) {
        const isApproved = updateData.trangThaiDuyet === 'da_duyet';
        const isRejected = updateData.trangThaiDuyet === 'tu_choi';
        
        if (isApproved || isRejected) {
          const statusText = isApproved ? 'ĐÃ ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI';
          const subject = `[Cập Nhật] Hồ sơ quần chúng: ${applicant.hoTen} ${statusText}`;
          let message = `Hồ sơ quần chúng bạn tạo đã được cập nhật trạng thái mới.

Thông tin hồ sơ:
- Họ tên: ${applicant.hoTen}
- CCCD: ${applicant.cccd}
- Chi bộ/Đảng bộ: ${applicant.chiBoDangBo}

Kết quả: ${statusText}`;

          if (isRejected && updateData.lyDoTuChoi) {
            message += `\nLý do từ chối: ${updateData.lyDoTuChoi}`;
          }

          message += `\n\nVui lòng đăng nhập vào hệ thống để kiểm tra: ${request.nextUrl.origin}/admin#applicants`;

          sendEmailAlert(request, applicant.nguoiTaoEmail, subject, message); // Async call
        }
      }
    }

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
