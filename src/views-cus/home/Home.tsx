'use client';

// MUI Imports
import { Grid } from '@mui/material';

// Layout Imports
import DashboardLayout from '@components/layout/DashboardLayout';

// Components Imports
import Welcome from './dashboard/Welcome';
// import Statistics from './dashboard/Statistics';
// import AdminsTable from './dashboard/AdminsTable';

type HomeProps = {
  statistics: any;
  admins: any[];
};

const Home = ({} /*statistics, admins*/ : HomeProps) => {
  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Welcome />
        </Grid>
        {/* <Grid size={{ xs: 12, md: 8, lg: 8 }}>
          <Statistics statistics={statistics} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <AdminsTable admins={admins} />
        </Grid> */}
      </Grid>
    </DashboardLayout>
  );
};

export default Home;
