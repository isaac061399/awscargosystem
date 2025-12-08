// React Imports
import type { ReactElement } from 'react';

// Next Imports
import dynamic from 'next/dynamic';

// Component Imports
import AccountSettings from '@/backup/views/account-settings';
import DashboardLayout from '@components/layout/DashboardLayout';

const AccountTab = dynamic(() => import('@/backup/views/account-settings/account'));
const NotificationsTab = dynamic(() => import('@/backup/views/account-settings/notifications'));
const ConnectionsTab = dynamic(() => import('@/backup/views/account-settings/connections'));

// Vars
const tabContentList = (): { [key: string]: ReactElement } => ({
  account: <AccountTab />,
  notifications: <NotificationsTab />,
  connections: <ConnectionsTab />
});

const AccountSettingsPage = () => {
  return (
    <DashboardLayout>
      <AccountSettings tabContentList={tabContentList()} />
    </DashboardLayout>
  );
};

export default AccountSettingsPage;
