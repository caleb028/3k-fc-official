import { prisma } from '../src/lib/prisma';

async function check() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });
  console.log(`TOTAL_USERS: ${users.length}`);
  for (const u of users) {
    console.log(`USER: ${u.email} | isStaff: ${u.isStaff} | roles: ${u.userRoles.map(r => r.role.slug).join(', ')}`);
  }
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
