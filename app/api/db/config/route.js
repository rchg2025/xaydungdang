import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany();
    return Response.json(configs);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    // body is an object: { GDRIVE_CLIENT_EMAIL: '...', ... }
    
    for (const [key, value] of Object.entries(body)) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: value || '' },
        create: { key, value: value || '' }
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
