// Next Imports
import { redirect } from 'next/navigation';

// i18n Imports
import { dir } from 'i18next';

// Auth Imports
import { getServerSession } from 'next-auth';

// Controllers Imports
import { getAdminSessionData } from '@controllers/Administrator.Controller';

// Type Imports
import type { ChildrenType } from '@core/types';

// Component Imports
import Providers from '@components/Providers';
import SessionProvider from '@components/SessionProvider';
import AdminProvider from '@components/AdminProvider';

import authOptions from '@libs/auth/authOptions';

const Layout = async ({ children, params }: ChildrenType & { params: Promise<{ locale: string }> }) => {
  if (process.env.DASHBOARD_MAINTENANCE === 'true') {
    redirect('/maintenance');
  }

  // Vars
  const { locale } = await params;
  const direction = dir(locale);
  const session = await getServerSession(authOptions);
  const adminData = await getAdminSessionData(session?.user?.email);

  return (
    <Providers direction={direction}>
      <SessionProvider session={session}>
        <AdminProvider admin={adminData}>{children}</AdminProvider>
      </SessionProvider>
    </Providers>
  );
};

export default Layout;
