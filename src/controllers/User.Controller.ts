import { prismaRead } from '@libs/prisma';

export const getUser = async (id: number) => {
  try {
    const user = await prismaRead.appUser.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        enabled: true,
        email_notifications: true,
        push_notifications: true,
        accounts: {
          select: { id: true, provider: true, provider_id: true }
        }
      }
    });

    if (!user) {
      return;
    }

    return user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};
