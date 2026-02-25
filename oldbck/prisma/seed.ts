import { PrismaClient } from '@prisma/client';
import { hash } from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  // Using Node.js built-in crypto for seed purposes
  // In production, bcrypt is used in the auth service
  const { createHash } = await import('crypto');
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Seed: Pre-created seller account
  const sellerEmail = 'seller@marketplace.com';
  const defaultPassword = 'seller123'; // Default password for seed only

  // Note: In production the auth service uses bcrypt.
  // For seed data we use a placeholder hash that should be changed on first login.
  // The BE agent will replace this with proper bcrypt hashing when implementing the auth service.
  const passwordHash = await hashPassword(defaultPassword);

  const seller = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: {},
    create: {
      email: sellerEmail,
      passwordHash,
      name: 'Marketplace Seller',
      businessName: 'Marketplace Store',
      phone: '0000000000',
      role: 'SELLER',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log(`Seller account seeded: ${seller.email} (id: ${seller.id})`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
