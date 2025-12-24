'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import Link from 'next/link';

import { useTranslation } from 'react-i18next';

// MUI Imports
import { Button, Card, CardContent, Typography } from '@mui/material';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';

const Welcome = () => {
  const { data: admin } = useAdmin();

  const { t } = useTranslation();
  const textT: any = useMemo(() => t('home:text.welcome', { returnObjects: true, default: {} }), [t]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 relative items-start">
        <div>
          <Typography variant="h4">{textT?.title?.replace('{{ name }}', admin.first_name)}</Typography>
          <Typography>{admin.email}</Typography>
        </div>
        <div>
          <Typography variant="h5" color="primary">
            {admin.role}
          </Typography>
          <Typography>{admin.enabled_2fa ? textT?.auth2fa : textT?.auth2faNo}</Typography>
        </div>
        <Button size="small" variant="contained" component={Link} href="/profile">
          {textT?.btnProfile}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Welcome;
