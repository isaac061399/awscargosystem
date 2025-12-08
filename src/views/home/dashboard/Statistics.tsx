'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import Link from 'next/link';

import { useTranslation } from 'react-i18next';

//MUI Imports
import { Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';

// Type Imports
import type { ThemeColor } from '@core/types';

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar';
import ClearCacheButton from '@/components/layout/shared/ClearCacheButton';

type DataType = {
  title: string;
  stats: string;
  color: ThemeColor;
  icon: string;
  link: string;
};

const Statistics = ({ statistics }: { statistics: any }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('home:text.statistics', { returnObjects: true, default: {} }), [t]);

  // Vars
  const data: DataType[] = [
    {
      title: textT?.pages,
      stats: statistics?.pages || '0',
      color: 'primary',
      icon: 'ri-pages-line',
      link: '/pages'
    },
    {
      title: textT?.categories,
      stats: statistics?.categories || '0',
      color: 'success',
      icon: 'ri-folders-line',
      link: '/categories'
    },
    {
      title: textT?.contents,
      stats: statistics?.contents || '0',
      color: 'warning',
      icon: 'ri-article-line',
      link: '/contents'
    },
    {
      title: textT?.menus,
      stats: statistics?.menus || '0',
      color: 'info',
      icon: 'ri-menu-line',
      link: '/menus'
    }
  ];

  return (
    <Card className="bs-full">
      <CardHeader
        title={textT?.title}
        subheader={<p className="mbs-3 text-secondary">{textT?.subtitle}</p>}
        action={<ClearCacheButton size="small" />}
      />
      <CardContent className="pbs-5!">
        <Grid container spacing={2}>
          {data.map((item, index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index}>
              <div className="flex items-center gap-3">
                <Link href={item.link} aria-label={item.title}>
                  <CustomAvatar variant="rounded" color={item.color} className="shadow-xs">
                    <i className={item.icon}></i>
                  </CustomAvatar>
                </Link>
                <div>
                  <Typography>{item.title}</Typography>
                  <Typography variant="h5">{item.stats}</Typography>
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Statistics;
