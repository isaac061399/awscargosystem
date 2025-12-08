'use client';

import Link from 'next/link';
import { Button, Typography } from '@mui/material';

const ApiDocHomePage = () => {
  return (
    <div>
      <Typography variant="h4" sx={{ mb: 2 }}>
        API Versions
      </Typography>
      <div>
        <Button LinkComponent={Link} variant="text" color="primary" href="/api-doc/v1">
          Version 1
        </Button>
      </div>
    </div>
  );
};

export default ApiDocHomePage;
