// Auth Imports
import { getServerSession } from 'next-auth';

// Controller Imports
import { getDashboardData } from '@controllers/Dashboard.Controller';
import { getAdminSessionData } from '@/controllers/Administrator.Controller';

// Component Imports
import Home from '@/views-cus/home/Home';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

import authOptions from '@libs/auth/authOptions';

const DashboardAnalytics = withAuthPage([], async ({ params }: { params: Promise<{ locale: string }> }) => {
  const session = await getServerSession(authOptions);
  const adminData = await getAdminSessionData(session?.user?.email);

  const data = await getDashboardData(adminData?.permissions || []);

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Home
        statistics={data.statistics}
        admins={data.admins}
        pendingOrderProducts={data.pendingOrderProducts}
        pendingInvoices={data.pendingInvoices}
      />
    </TranslationsProvider>
  );
});

export default DashboardAnalytics;
