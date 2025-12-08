// Next Imports
import { redirect } from 'next/navigation';

// i18n Imports
import { dir } from 'i18next';

// Type Imports
import type { ChildrenType } from '@core/types';

// Component Imports
import Providers from '@components/Providers';
import BlankLayout from '@layouts/BlankLayout';

const Layout = async ({ children, params }: ChildrenType & { params: Promise<{ locale: string }> }) => {
  if (process.env.DASHBOARD_MAINTENANCE === 'true') {
    redirect('/maintenance');
  }

  // Vars
  const { locale } = await params;
  const direction = dir(locale);

  return (
    <Providers direction={direction}>
      <BlankLayout>{children}</BlankLayout>
    </Providers>
  );
};

export default Layout;
