// Components Imports
import PackagesTracking from '@/views-cus/packages/PackagesTracking';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const PackagesTrackingPage = withAuthPage(
  ['packages.track'],
  async ({
    params,
    searchParams
  }: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ tracking?: string }>;
  }) => {
    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <PackagesTracking trackingLoaded={(await searchParams).tracking} />
      </TranslationsProvider>
    );
  }
);

export default PackagesTrackingPage;
