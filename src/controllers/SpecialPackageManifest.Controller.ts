import { prismaRead } from '@libs/prisma';
import { SpecialPackageStatus } from '@/prisma/generated/enums';

export const getManifest = async (id: number, ownerId?: number) => {
  try {
    const where: any = { id };

    if (ownerId) {
      where['owner_id'] = ownerId;
    }

    const manifest = await prismaRead.cusSpecialPackageManifest.findFirst({
      where,
      include: {
        owner: { select: { id: true, full_name: true, email: true } },
        special_packages: { orderBy: [{ id: 'asc' }] }
      }
    });

    if (!manifest) {
      return;
    }

    return manifest;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getPackagesForNewManifest = async (ownerId: number) => {
  try {
    const specialPackages = await prismaRead.cusSpecialPackage.findMany({
      where: {
        owner_id: ownerId,
        status: SpecialPackageStatus.RECEIVED,
        special_package_manifest_id: null
      },
      orderBy: [{ id: 'asc' }]
    });

    if (!specialPackages) {
      return [];
    }

    return specialPackages;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return [];
  }
};
