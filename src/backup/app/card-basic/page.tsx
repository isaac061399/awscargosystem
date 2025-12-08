// MUI Imports
import { Divider, Grid, Typography } from '@mui/material';

// Components Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import CardInfluencingInfluencerWithImg from '@/backup/views/card-basic/CardInfluencingInfluencerWithImg';
import CardUser from '@/backup/views/card-basic/CardUser';
import CardWithCollapse from '@/backup/views/card-basic/CardWithCollapse';
import CardMobile from '@/backup/views/card-basic/CardMobile';
import CardHorizontalRatings from '@/backup/views/card-basic/CardHorizontalRatings';
import CardWatch from '@/backup/views/card-basic/CardWatch';
import CardLifetimeMembership from '@/backup/views/card-basic/CardLifetimeMembership';
import CardInfluencingInfluencer from '@/backup/views/card-basic/CardInfluencingInfluencer';
import CardVerticalRatings from '@/backup/views/card-basic/CardVerticalRatings';
import CardSupport from '@/backup/views/card-basic/CardSupport';
import CardWithTabs from '@/backup/views/card-basic/CardWithTabs';
import CardWithTabsCenter from '@/backup/views/card-basic/CardWithTabsCenter';
import CardTwitter from '@/backup/views/card-basic/CardTwitter';
import CardFacebook from '@/backup/views/card-basic/CardFacebook';
import CardLinkedIn from '@/backup/views/card-basic/CardLinkedIn';

const CardBasic = () => {
  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h3">Basic Cards</Typography>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardInfluencingInfluencerWithImg />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardUser />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardWithCollapse />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CardMobile />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CardHorizontalRatings />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardWatch />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <CardLifetimeMembership />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardInfluencingInfluencer />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardVerticalRatings />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardSupport />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h3">Navigation Cards</Typography>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardWithTabs />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CardWithTabsCenter />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h3">Solid Cards</Typography>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardTwitter />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardFacebook />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CardLinkedIn />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default CardBasic;
