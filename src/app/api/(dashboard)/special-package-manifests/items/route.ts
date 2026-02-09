import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { hasAllPermissions } from '@/helpers/permissions';
import { getPackagesForNewManifest } from '@/controllers/SpecialPackageManifest.Controller';

export const GET = withAuthApi(['special-package-manifests.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:special-package-manifests', { returnObjects: true, default: {} });

  const admin = req.session;
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const ownerId = params.owner_id && !isNaN(parseInt(params.owner_id)) ? parseInt(params.owner_id) : null;

  try {
    const isAdmin = hasAllPermissions(['special-package-manifests.admin'], admin.permissions);

    const realOwnerId = !isAdmin ? admin.id : ownerId ? ownerId : 0;
    const specialPackages = await getPackagesForNewManifest(realOwnerId);

    return NextResponse.json({ valid: true, data: specialPackages }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
