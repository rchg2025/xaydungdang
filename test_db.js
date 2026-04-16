import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Đang kết nối tới database online...');
  const users = await prisma.user.findMany({ select: { username: true, hoTen: true, role: true } });
  console.log(`Kết nối thành công! Đang có ${users.length} tài khoản trong hệ thống:`);
  console.table(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
