// Components Imports
import SpecialPackageManifests from '@/views-cus/special-package-manifests/SpecialPackageManifests';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const SpecialPackageManifestsPage = withAuthPage(
  ['special-packages.list'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <SpecialPackageManifests />
      </TranslationsProvider>
    );
  }
);

export default SpecialPackageManifestsPage;
