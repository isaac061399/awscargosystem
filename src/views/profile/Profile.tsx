'use client';

// React Imports
import { type ReactElement, type SyntheticEvent, useMemo, useState } from 'react';

// Next Import
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Grid, Paper, Tab } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

// Helpers Imports
import DashboardLayout from '@components/layout/DashboardLayout';

const AccountTab = dynamic(() => import('@views/profile/Account'));
const SecurityTab = dynamic(() => import('@views/profile/Security'));

const tabContentList = (): { [key: string]: ReactElement } => ({
  account: <AccountTab />,
  security: <SecurityTab />
});

const Profile = () => {
  const { t } = useTranslation();
  const tabsT: any = useMemo(() => t('profile:tabs', { returnObjects: true, default: {} }), [t]);

  // States
  const [activeTab, setActiveTab] = useState('account');

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value);
  };

  return (
    <DashboardLayout>
      <Paper>
        <TabContext value={activeTab}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <TabList onChange={handleChange} variant="scrollable">
                <Tab
                  label={tabsT?.account?.title}
                  icon={<i className="ri-user-3-line" />}
                  iconPosition="start"
                  value="account"
                />
                <Tab
                  label={tabsT?.security?.title}
                  icon={<i className="ri-lock-unlock-line" />}
                  iconPosition="start"
                  value="security"
                />
              </TabList>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TabPanel value={activeTab} className="p-0">
                {tabContentList()[activeTab]}
              </TabPanel>
            </Grid>
          </Grid>
        </TabContext>
      </Paper>
    </DashboardLayout>
  );
};

export default Profile;
