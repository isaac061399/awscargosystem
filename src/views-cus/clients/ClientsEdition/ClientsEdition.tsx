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
import DashboardLayout from '@/components/layout/DashboardLayout';

const InfoTab = dynamic(() => import('./Info'));
const PackagesTab = dynamic(() => import('./Packages'));

const tabContentList = (
  poundFee: number,
  provinces: any[],
  offices: any[],
  client?: any
): { [key: string]: ReactElement } => ({
  info: <InfoTab poundFee={poundFee} provinces={provinces} offices={offices} client={client} />,
  packages: <PackagesTab client={client} />
});

const ClientsEdition = ({
  poundFee,
  provinces,
  offices,
  client
}: {
  poundFee: number;
  provinces: any[];
  offices: any[];
  client?: any;
}) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('clients-edition:text', { returnObjects: true, default: {} }), [t]);
  const tabsT: any = useMemo(() => t('clients-edition:tabs', { returnObjects: true, default: {} }), [t]);

  // States
  const [activeTab, setActiveTab] = useState('info');

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value);
  };

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              <IconButton className="p-1" color="default" LinkComponent={Link} href="/clients">
                <i className="ri-arrow-left-s-line text-4xl" />
              </IconButton>
              {client ? `${textT?.titleEdit} ${client.full_name}` : textT?.titleNew}
            </Typography>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper>
            <TabContext value={activeTab}>
              <Grid container>
                <Grid size={{ xs: 12 }}>
                  <TabList onChange={handleChange} variant="scrollable">
                    <Tab
                      label={tabsT?.info?.title}
                      icon={<i className="ri-list-settings-line" />}
                      iconPosition="start"
                      value="info"
                    />
                    {client && (
                      <Tab
                        label={tabsT?.packages?.title}
                        icon={<i className="ri-bank-card-line" />}
                        iconPosition="start"
                        value="packages"
                      />
                    )}
                  </TabList>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TabPanel value={activeTab} className="p-0">
                    {tabContentList(poundFee, provinces, offices, client)[activeTab]}
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

export default ClientsEdition;
