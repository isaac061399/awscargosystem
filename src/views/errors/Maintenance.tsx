'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Button, Typography } from '@mui/material';

const Maintenance = () => {
  const { t } = useTranslation('maintenance');
  const textT: any = useMemo(() => t('text', { returnObjects: true, default: {} }), [t]);

  return (
    <div className="flex items-center justify-center min-bs-dvh relative p-6 overflow-x-hidden">
      <div className="flex items-center flex-col text-center gap-10">
        <div className="flex flex-col gap-2 is-[90vw] sm:is-[unset]">
          <Typography variant="h2">{textT?.title}</Typography>
          <Typography variant="h4">{textT?.subtitle}</Typography>
          <Typography>{textT?.description}</Typography>
        </div>
        <Image
          alt="error-illustration"
          src="/images/illustrations/characters/6.png"
          className="object-cover bs-[400px] md:bs-[450px] lg:bs-[500px]"
          width={400}
          height={500}
        />
        <Button href="/" component={Link} variant="contained">
          {textT?.backBtn}
        </Button>
      </div>
    </div>
  );
};

export default Maintenance;
