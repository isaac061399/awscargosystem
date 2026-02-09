// Next Imports
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

// Controller Imports
import { getManifest } from '@/controllers/SpecialPackageManifest.Controller';

// Components Imports
import SpecialPackageManifestView from '@/views-cus/special-package-manifests/SpecialPackageManifestsView';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

import authOptions from '@libs/auth/authOptions';
import { getAdminSessionData } from '@/controllers/Administrator.Controller';
import { hasAllPermissions } from '@/helpers/permissions';

const SpecialPackageManifestsViewPage = withAuthPage(
  ['special-package-manifests.view'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const admin = await getAdminSessionData(session?.user?.email || '');
    const isAdmin = hasAllPermissions(['special-package-manifests.admin'], admin?.permissions || []);

    let ownerId;
    if (!isAdmin) {
      ownerId = admin?.id;
    }

    const manifest = await getManifest(Number(id), ownerId);

    if (!manifest) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <SpecialPackageManifestView manifest={manifest} />
      </TranslationsProvider>
    );
  }
);

export default SpecialPackageManifestsViewPage;
