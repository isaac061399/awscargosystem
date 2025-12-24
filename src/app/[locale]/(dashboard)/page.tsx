// Controller Imports
import { getDashboardData } from '@controllers/Dashboard.Controller';

// Component Imports
import Home from '@/views-cus/home/Home';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const DashboardAnalytics = withAuthPage([], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const data = await getDashboardData();

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Home statistics={data.statistics} admins={data.admins} />
    </TranslationsProvider>
  );
});

export default DashboardAnalytics;
