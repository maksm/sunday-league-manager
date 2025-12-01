import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: npx tsx scripts/check-password.ts <username> <password>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log(`User '${username}' not found`);
    process.exit(1);
  }

  console.log('User:', { username: user.username, role: user.role });

  const isValid = await compare(password, user.passwordHash);
  console.log(`Password check: ${isValid ? '✓ VALID' : '✗ INVALID'}`);

  process.exit(isValid ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
