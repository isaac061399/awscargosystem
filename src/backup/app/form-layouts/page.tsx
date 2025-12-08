// MUI Imports
import { Grid } from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import FormLayoutsBasic from '@/backup/views/form-layouts/FormLayoutsBasic';
import FormLayoutsIcon from '@/backup/views/form-layouts/FormLayoutsIcons';
import FormLayoutsAlignment from '@/backup/views/form-layouts/FormLayoutsAlignment';

const FormLayouts = () => {
  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormLayoutsBasic />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormLayoutsIcon />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormLayoutsAlignment />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default FormLayouts;
