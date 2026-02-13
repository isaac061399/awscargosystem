'use client';

// MUI Imports
import { Grid } from '@mui/material';

// Layout Imports
import DashboardLayout from '@components/layout/DashboardLayout';

// Components Imports
import Welcome from './dashboard/Welcome';
import Statistics from './dashboard/Statistics';
import AdminsTable from './dashboard/AdminsTable';
import PendingOrderProductsTable from './dashboard/PendingOrderProductsTable';
import PendingInvoicesTable from './dashboard/PendingInvoicesTable';

type HomeProps = {
  statistics: any | null;
  admins: any[] | null;
  pendingOrderProducts: any[] | null;
  pendingInvoices: any[] | null;
};

const Home = ({ statistics, admins, pendingOrderProducts, pendingInvoices }: HomeProps) => {
  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Welcome />
        </Grid>
        {statistics !== null && (
          <Grid size={{ xs: 12, md: 8, lg: 8 }}>
            <Statistics statistics={statistics} />
          </Grid>
        )}
        {pendingOrderProducts !== null && (
          <Grid size={{ xs: 12 }}>
            <PendingOrderProductsTable pendingOrderProducts={pendingOrderProducts} />
          </Grid>
        )}
        {pendingInvoices !== null && (
          <Grid size={{ xs: 12 }}>
            <PendingInvoicesTable pendingInvoices={pendingInvoices} />
          </Grid>
        )}
        {admins !== null && (
          <Grid size={{ xs: 12 }}>
            <AdminsTable admins={admins} />
          </Grid>
        )}
      </Grid>
    </DashboardLayout>
  );
};

export default Home;
