import { cookies } from 'next/headers';

import { prismaRead } from '@libs/prisma';
import { officeCookie } from '@/libs/constants';

export const getAdminSessionData = async (email?: string | null) => {
  if (!email) return;

  try {
    const admin = await prismaRead.administrator.findUnique({
      where: { email, user: { enabled: true } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        email: true,
        enabled_2fa: true,
        role: { select: { name: true, permissions: { select: { permission_id: true } } } },
        user: { select: { email: true, enabled: true } }
      }
    });

    if (!admin) return;

    const officeId = (await cookies()).get(officeCookie.name)?.value || officeCookie.defaultValue;

    return {
      id: admin.id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      name: admin.full_name,
      email: admin.email,
      role: admin.role.name,
      enabled: admin.user.enabled,
      enabled_2fa: admin.enabled_2fa,
      permissions: admin.role.permissions.map((p) => p.permission_id),
      office_id: parseInt(officeId.toString())
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getAdmin = async (id: number) => {
  try {
    const admin = await prismaRead.administrator.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        email: true,
        role: {
          select: { id: true, name: true }
        },
        user: {
          select: { email: true, enabled: true }
        }
      }
    });

    if (!admin) {
      return;
    }

    return admin;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getAdminPermissions = async (id: number) => {
  try {
    const admin = await prismaRead.administrator.findUnique({
      where: { id },
      select: {
        id: true,
        role: {
          select: { id: true, name: true, permissions: { select: { permission_id: true } } }
        },
        user: {
          select: { email: true, enabled: true }
        }
      }
    });

    if (!admin) {
      return [];
    }

    return admin.role.permissions;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return [];
  }
};
