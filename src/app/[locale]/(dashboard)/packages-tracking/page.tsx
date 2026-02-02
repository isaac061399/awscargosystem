// Components Imports
import PackagesTracking from '@/views-cus/packages/PackagesTracking';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PackagesTrackingPage = withAuthPage(
  ['packages.track'],
  async ({ params }: { params: Promise<{ locale: string; tracking: string }> }) => {
    const { tracking } = await params;

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PackagesTracking trackingLoaded={tracking} />
      </TranslationsProvider>
    );
  }
);

export default PackagesTrackingPage;
