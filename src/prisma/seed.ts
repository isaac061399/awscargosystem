import { parseArgs } from 'node:util';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

const options = {
  email: { type: 'string' as const }
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter });

const permissions = [
  { id: 'administrators.create', name: 'Create' },
  { id: 'administrators.delete', name: 'Delete' },
  { id: 'administrators.edit', name: 'Edit' },
  { id: 'administrators.list', name: 'List' },
  // { id: 'categories.create', name: 'Create' },
  // { id: 'categories.delete', name: 'Delete' },
  // { id: 'categories.edit', name: 'Edit' },
  // { id: 'categories.list', name: 'List' },
  // { id: 'contents.create', name: 'Create' },
  // { id: 'contents.delete', name: 'Delete' },
  // { id: 'contents.edit', name: 'Edit' },
  // { id: 'contents.list', name: 'List' },
  // { id: 'global-settings.edit', name: 'Edit' },
  // { id: 'global-settings.view', name: 'View' },
  // { id: 'media.create', name: 'Create' },
  // { id: 'media.delete', name: 'Delete' },
  // { id: 'media.list', name: 'List' },
  // { id: 'menus.create', name: 'Create' },
  // { id: 'menus.delete', name: 'Delete' },
  // { id: 'menus.edit', name: 'Edit' },
  // { id: 'menus.list', name: 'List' },
  // { id: 'pages.create', name: 'Create' },
  // { id: 'pages.delete', name: 'Delete' },
  // { id: 'pages.edit', name: 'Edit' },
  // { id: 'pages.list', name: 'List' },
  // { id: 'push-messages.delete', name: 'Delete' },
  // { id: 'push-messages.list', name: 'List' },
  // { id: 'push-messages.send', name: 'Send' },
  { id: 'roles.create', name: 'Create' },
  { id: 'roles.delete', name: 'Delete' },
  { id: 'roles.edit', name: 'Edit' },
  { id: 'roles.list', name: 'List' },
  // { id: 'users.edit', name: 'Edit' },
  // { id: 'users.list', name: 'List' },
  { id: 'configuration.edit', name: 'Edit' },
  { id: 'configuration.view', name: 'View' },
  { id: 'offices.create', name: 'Create' },
  { id: 'offices.delete', name: 'Delete' },
  { id: 'offices.edit', name: 'Edit' },
  { id: 'offices.list', name: 'List' }
];

const adminRole = { name: 'Super Admin', description: 'Administrator role with all permissions' };

const adminUser = { firstName: 'Admin', lastName: 'User', email: '' };

async function main() {
  const {
    values: { email }
  } = parseArgs({ options });

  console.log(`\nInitializing database seed...`);

  if (!email) {
    console.error(
      '\nerror: An email is required to create the admin user. Please use "--email <email@example.com>" after the command.'
    );

    process.exit(1);
  }

  adminUser.email = email.toLowerCase().trim();

  console.log(`\nCreating permissions.`);

  // Permissions
  await prisma.permission.createMany({ data: permissions });

  console.log(`\nCreating admin role.`);

  // Role
  const role = await prisma.role.create({
    data: {
      ...adminRole,
      permissions: {
        create: permissions.map((permission) => ({ permission_id: permission.id }))
      }
    }
  });

  console.log(`\nCreating admin user.`);

  // Admin
  const admin = await prisma.administrator.create({
    data: {
      first_name: adminUser.firstName,
      last_name: adminUser.lastName,
      full_name: `${adminUser.firstName} ${adminUser.lastName}`,
      role: {
        connect: { id: role.id }
      },
      user: {
        create: {
          email: adminUser.email,
          name: `${adminUser.firstName} ${adminUser.lastName}`,
          enabled: true
        }
      }
    }
  });

  console.log(
    `\nAn admin user has been successfully created with the email: ${admin.email}. To login, please use the 'Forgot Password' option to set a new password.`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
