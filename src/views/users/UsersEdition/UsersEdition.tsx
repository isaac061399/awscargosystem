'use client';

// React Imports
import { type ReactElement, type SyntheticEvent, useMemo, useState } from 'react';

// Next Import
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Divider, Grid, IconButton, Paper, Tab, Typography } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

// Helpers Imports
import DashboardLayout from '@components/layout/DashboardLayout';

const ProfileTab = dynamic(() => import('@views/users/UsersEdition/Profile'));
const NotificationsTab = dynamic(() => import('@views/users/UsersEdition/Notifications'));

const tabContentList = (user: any): { [key: string]: ReactElement } => ({
  profile: <ProfileTab user={user} />,
  notifications: <NotificationsTab user={user} />
});

const UsersEdition = ({ user }: { user: any }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('users-edition:text', { returnObjects: true, default: {} }), [t]);
  const tabsT: any = useMemo(() => t('users-edition:tabs', { returnObjects: true, default: {} }), [t]);

  // States
  const [activeTab, setActiveTab] = useState('profile');

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value);
  };

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              <IconButton className="p-1" color="default" LinkComponent={Link} href="/users">
                <i className="ri-arrow-left-s-line text-4xl" />
              </IconButton>
              {`${textT?.title} ${user.name} (${user.email})`}
            </Typography>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper>
            <TabContext value={activeTab}>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <TabList onChange={handleChange} variant="scrollable">
                    <Tab
                      label={tabsT?.profile?.title}
                      icon={<i className="ri-user-3-line" />}
                      iconPosition="start"
                      value="profile"
                    />
                    <Tab
                      label={tabsT?.notifications?.title}
                      icon={<i className="ri-notification-2-line" />}
                      iconPosition="start"
                      value="notifications"
                    />
                  </TabList>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TabPanel value={activeTab} className="p-0">
                    {tabContentList(user)[activeTab]}
                  </TabPanel>
                </Grid>
              </Grid>
            </TabContext>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default UsersEdition;
