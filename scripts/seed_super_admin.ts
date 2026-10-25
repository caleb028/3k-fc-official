import { bootstrapSuperAdmin } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';

async function run() {
  const existing = await prisma.userRole.findFirst({
    where: { role: { slug: 'SUPER_ADMIN' } }
  });

  if (existing) {
    console.log('Super Administrator already provisioned in database.');
    process.exit(0);
  }

  const token = process.env.ADMIN_BOOTSTRAP_TOKEN || '3KFC-EMBU-BOOTSTRAP-2026';
  process.env.ADMIN_BOOTSTRAP_TOKEN = token;

  const admin = await bootstrapSuperAdmin({
    bootstrapToken: token,
    email: 'admin@3kfc.co.ke',
    password: 'AdminPassword2026!',
    firstName: 'Caleb',
    lastName: 'Ngiciri'
  });

  console.log('SUCCESS: Super Administrator account provisioned:');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: AdminPassword2026!`);
  console.log(`  Role:     SUPER_ADMIN`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Error provisioning Super Admin:', e);
  process.exit(1);
});
