// Components Imports
import SpecialPackageManifestsNew from '@/views-cus/special-package-manifests/SpecialPackageManifestsNew';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const SpecialPackageManifestsNewPage = withAuthPage(
  ['special-package-manifests.create'],
  async ({ params }: { params: Promise<{ locale: string }> }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <SpecialPackageManifestsNew />
      </TranslationsProvider>
    );
  }
);

export default SpecialPackageManifestsNewPage;
